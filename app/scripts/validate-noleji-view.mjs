import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const readRoot = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const editor = read('src/pages/EditorPage.tsx');
const settings = read('src/components/SettingsModal.tsx');
const viewerSettings = read('src/shared/viewerSettings.ts');
const llmTypes = read('src/types/llm.ts');
const llmClient = read('src/services/llmClient.ts');
const pricing = read('src/data/pricingPlans.ts');
const billing = read('src/services/billing.ts');
const env = read('src/config/env.ts');
const envExample = read('.env.example');
const viewer = read('src/pages/ViewerPage.tsx');
const appRouter = read('src/App.tsx');
const accountStore = read('src/services/accountStore.ts');
const shareStore = read('src/services/shareStore.ts');
const workspaceStore = read('src/services/workspaceStore.ts');
const sharedPage = read('src/pages/SharedPage.tsx');
const featureGate = read('src/utils/featureGate.ts');
const fileAssociation = readRoot('desktop/src/utils/fileAssociation.ts');
const desktopPackage = readRoot('desktop/package.json');

assert(editor.includes('Noleji View'), 'EditorPage should expose the Noleji View service name.');
assert(settings.includes('Noleji View'), 'SettingsModal should expose the Noleji View service name.');
assert(editor.includes('>v<') || editor.includes('>v</div>') || editor.includes('>v</span>'), 'EditorPage should use a v logo mark.');
assert(settings.includes('>v<') || settings.includes('>v</div>') || settings.includes('>v</span>'), 'SettingsModal should use a v logo mark.');

assert(editor.includes("'1000px'"), 'Editor preview width options should include 1000px.');
assert(settings.includes("'1000px'"), 'Viewer settings width options should include 1000px.');
assert(viewerSettings.includes("'1000px'"), 'ViewerSettings type/default comments should include 1000px.');

assert(editor.includes('workspaceSearchQuery'), 'EditorPage should include workspace search state.');
assert(editor.includes('documentFindQuery'), 'EditorPage should include current-document find state.');
assert(editor.includes('Search Results') || editor.includes('검색 결과'), 'EditorPage should render search results.');

assert(!llmTypes.includes("'byok'"), 'LLM access mode should not include BYOK.');
assert(!llmTypes.includes("'openai'") && !llmTypes.includes("'anthropic'") && !llmTypes.includes("'google'"), 'Cloud BYOK providers should be removed from LLMProvider.');
assert(!settings.includes('Bring Your Own Key'), 'SettingsModal should not mention Bring Your Own Key.');
assert(!settings.includes('API Key'), 'SettingsModal should not expose API Key input UI.');
assert(!pricing.includes('개인 API Key'), 'Pricing should not advertise personal API key connection.');
assert(!llmClient.includes('callAnthropic') && !llmClient.includes('callGoogle'), 'llmClient should not include browser-side BYOK provider clients.');

assert(fileAssociation.includes('Noleji View'), 'File association prompt should use Noleji View.');
assert(fileAssociation.includes('showFileAssociationPrompt'), 'File association prompt should remain wired.');
assert(desktopPackage.includes('Noleji View'), 'Desktop package productName should be Noleji View.');

assert(!billing.includes('PLACEHOLDER_MONTHLY') && !billing.includes('PLACEHOLDER_LIFETIME'), 'Billing code should not contain placeholder payment links.');
assert(!billing.includes('stripeCheckout'), 'Billing entrypoint should not depend on legacy Stripe checkout during Paddle migration.');
assert(billing.includes('paddle'), 'Billing entrypoint should expose a Paddle-ready provider path.');
assert(envExample.includes('VITE_PADDLE_MONTHLY_PRICE_ID'), 'env example should document Paddle monthly price configuration.');
assert(envExample.includes('VITE_PADDLE_LIFETIME_PRICE_ID'), 'env example should document Paddle lifetime price configuration.');
assert(env.includes('VITE_PADDLE_MONTHLY_PRICE_ID'), 'env config should read Paddle monthly price configuration.');
assert(viewer.includes('https://github.com/noleji-ai/noleji-view/releases') || !viewer.includes('https://github.com/noleji-ai/docwise/releases'), 'Viewer install prompt should not point users to legacy docwise releases.');
assert(appRouter.includes('lazy(') && appRouter.includes('<Suspense'), 'Router should lazy-load pages to reduce the main production chunk.');
assert(accountStore.includes('noleji-view-user') && accountStore.includes('LEGACY_USER_KEY'), 'Account storage should use Noleji View keys with legacy migration fallback.');
assert(featureGate.includes('noleji-view-user-plan') && featureGate.includes('LEGACY_USER_PLAN_KEY'), 'Feature gate should use Noleji View plan key with legacy fallback.');
assert(shareStore.includes('noleji-view-shared-records-v1') && shareStore.includes('LEGACY_SHARED_KEY'), 'Share storage should use Noleji View shared key with legacy fallback.');
assert(workspaceStore.includes('noleji-view-workspace-v1') && workspaceStore.includes('LEGACY_WORKSPACE_KEY'), 'Workspace storage should use Noleji View key with legacy fallback.');
assert(!sharedPage.includes('docwise-fork-') && !sharedPage.includes('docwise-shared-'), 'Shared page should not create new legacy docwise localStorage keys.');

if (failures.length > 0) {
  console.error('Noleji View validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Noleji View validation passed.');
