// Noleji View — Toss Payments confirm (Supabase Edge Function, reference implementation)
//
// Deploy:  supabase functions deploy toss-confirm --no-verify-jwt
// Secrets: supabase secrets set TOSS_SECRET_KEY=live_or_test_sk_xxx
//          (optional, for persistence) SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
//
// This implements the contract documented in apps/noleji-view/checkout/README.md:
//   1) validate plan  2) server-side expected amount  3) compare amount
//   4) verify orderId + idempotency  5) call Toss confirm with the SECRET key
//   6) persist order/subscription  7) return a user-safe result
//
// The browser checkout page (Toss v2 widgets) redirects to successUrl with
// { paymentKey, orderId, amount, plan }. The success page should POST those here.

const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

// Source of truth for prices — never trust the amount sent by the browser.
const EXPECTED_AMOUNT: Record<string, number> = {
  monthly: 5000,
  lifetime: 30000,
};

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOW_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

// Toss orderId: our client builds "nv_<plan>_<ts>_<rand>". Keep it conservative.
function isValidOrderId(orderId: string): boolean {
  return typeof orderId === "string" && /^[A-Za-z0-9_-]{6,64}$/.test(orderId);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const secretKey = Deno.env.get("TOSS_SECRET_KEY");
  if (!secretKey) return json({ ok: false, error: "server_not_configured" }, 503);

  let payload: { paymentKey?: string; orderId?: string; amount?: number; plan?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const { paymentKey, orderId, amount, plan } = payload;

  // 1) plan + 2/3) amount guard (server-authoritative)
  if (!plan || !(plan in EXPECTED_AMOUNT)) return json({ ok: false, error: "invalid_plan" }, 400);
  if (typeof amount !== "number" || amount !== EXPECTED_AMOUNT[plan]) {
    return json({ ok: false, error: "amount_mismatch" }, 400);
  }
  // 4) orderId format + paymentKey presence (idempotency: check your store here)
  if (!paymentKey || !orderId || !isValidOrderId(orderId)) {
    return json({ ok: false, error: "invalid_request" }, 400);
  }
  // TODO(idempotency): if an order with this orderId is already DONE in your DB,
  // return the stored result instead of confirming again.

  // 5) confirm with Toss using the SECRET key (Basic <base64(secretKey + ":")>)
  const auth = "Basic " + btoa(secretKey + ":");
  let toss: Response;
  try {
    toss = await fetch(TOSS_CONFIRM_URL, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
  } catch {
    return json({ ok: false, error: "toss_unreachable" }, 502);
  }

  const data = await toss.json().catch(() => ({}));
  if (!toss.ok || data?.status !== "DONE") {
    // Surface a safe, non-technical message; log details server-side only.
    console.error("toss confirm failed", { orderId, status: data?.status, code: data?.code });
    return json({ ok: false, error: "payment_not_confirmed", code: data?.code ?? null }, 402);
  }

  // 6) persist (optional here — implement against your subscriptions table)
  // await persistSubscription({ orderId, paymentKey, plan, amount, raw: data });

  // 7) user-safe result for the success page
  return json({
    ok: true,
    plan,
    amount,
    status: "active",
    method: data?.method ?? null,
    approvedAt: data?.approvedAt ?? null,
  });
});
