# toss-confirm — Noleji View 결제 승인 백엔드 (레퍼런스)

정적 NAS는 서버 로직을 못 돌리므로, 토스 결제 **승인(confirm)** 은 이 Supabase Edge Function에서 처리합니다.
(다른 서버를 쓰셔도 confirm 로직은 동일 — 이 파일을 그대로 옮기면 됩니다.)

## 배포 (사장님 1회)
```bash
supabase login
supabase functions deploy toss-confirm --no-verify-jwt
supabase secrets set TOSS_SECRET_KEY=<토스 시크릿키>     # 라이브/테스트
# 선택: supabase secrets set ALLOW_ORIGIN=https://noleji.synology.me
```
배포 후 함수 URL(예: `https://<project>.functions.supabase.co/toss-confirm`)을
체크아웃 success 페이지가 호출하도록 연결합니다(아래).

## 흐름
1. 브라우저 체크아웃(토스 v2 위젯) → 결제 → `successUrl?paymentKey&orderId&amount&plan` 로 리다이렉트.
2. success 페이지가 그 값을 이 함수에 POST.
3. 함수가 **서버 기준 금액**(monthly=5000, lifetime=30000)과 대조 후 토스 confirm 호출(시크릿키).
4. `status==="DONE"` 이면 구독 활성 결과 반환 → success 페이지가 "구독 활성화" 표시.

## 남은 연결 지점
- success 페이지에 confirm 호출 fetch 추가(함수 URL은 빌드/공개 config로 주입).
- 구독 저장(`subscriptions` 테이블 upsert)과 idempotency(같은 orderId 재승인 방지)는 TODO 주석 위치에 구현.
- clientKey(공개)는 `checkout/index.html`의 `NV_TOSS_CONFIG.clientKey`에, secretKey(비공개)는 **이 함수 env에만**.

## 보안
- secretKey는 절대 정적 사이트/리포에 커밋 금지(이 함수 env 전용).
- 금액은 브라우저 값 신뢰 금지 — 서버 EXPECTED_AMOUNT로 검증(구현됨).
