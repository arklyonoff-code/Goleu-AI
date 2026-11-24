/**
 * 정본(single source of truth). worker/ai-stack.js 는 이 파일을 다시 내보내기만 한다.
 * Vercel은 golue_app 폴더만 올리므로 가격 데이터는 반드시 이 폴더 안에 있어야 한다.
 *
 * Goleu AI — AI 빌더 스택 추천 엔진 (규칙 기반, 외부 AI API 호출 없음)
 *
 * 입력:  { description, mau, priority, lang }
 *   description  만들고 싶은 것 한 줄 (ko/en)
 *   mau          월 활성 사용자 수 (100 | 1000 | 10000 | 100000)
 *   priority     "cost" | "balanced" | "quality"
 *   language     "python" | "typescript" (기본 python: Railway 배포, typescript: Cloudflare Workers 배포)
 * 출력:  { useCase, llm, fallbackLlm, framework, vectorDb, hosting, cost, assumptions, asOf, sources }
 *
 * 가격은 PRICES 한 곳에만 둔다. 갱신할 때는 asOf 와 sources 를 함께 바꾼다.
 */

// 제휴(추천) 코드. Railway 대시보드 → Referrals 에서 받은 코드를 넣는다. 비어 있으면 일반 링크(제휴 아님)
// 제휴 여부는 추천 순서에 영향을 주지 않는다 (결과 화면에 제휴 링크 안내 문구 표시)
export const REFERRAL = { railway: "c-3B0U" };
const railwayLink = REFERRAL.railway ? `https://railway.com?referralCode=${encodeURIComponent(REFERRAL.railway)}` : null;

export const PRICES = {
  asOf: "2026-11-23",
  sources: {
    openai: "https://developers.openai.com/api/docs/pricing",
    anthropic: "https://platform.claude.com/docs/en/about-claude/pricing",
    supabase: "https://supabase.com/pricing",
    pinecone: "https://www.pinecone.io/pricing/",
    qdrant: "https://qdrant.tech/pricing/",
    cloudflare: "https://developers.cloudflare.com/workers/platform/pricing/",
    google: "https://ai.google.dev/gemini-api/docs/pricing",
    railway: "https://docs.railway.com/pricing",
    deepseek: "https://api-docs.deepseek.com/quick_start/pricing",
    moonshot: "https://platform.kimi.ai/docs/pricing/chat",
    zai: "https://docs.z.ai/guides/overview/pricing",
    alibaba: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
    together: "https://www.together.ai/pricing",
  },
  // USD / 1M tokens. tier 는 같은 회사 안의 가격 순서 기준(품질 평가가 아님).
  // cacheRead = 캐시 적중 입력 단가, cacheWrite = 캐시 쓰기 단가(2026-11-23 확인).
  // cacheWrite 가 없는 모델(OpenAI 자동 캐싱, Gemini 암시적 캐싱)은 쓰기 할증 없이 입력 단가로 계산. Gemini 캐시 저장료는 미반영.
  // region: "us" = 미국 업체 또는 미국 리전에서 처리, "cn" = 중국 업체 공식 API(처리 위치 미확인). host: 같은 모델의 제공처 구분.
  // recommend: false 인 모델은 계산기(/llm-cost)에만 나오고 스택 추천(/build) 후보에서는 빠진다.
  // gpt-6-luna 의 cacheRead 는 공식 페이지 Flex 표($0.005, Standard의 절반)에서 역산한 값.
  llms: [
    { id: "claude-haiku-5.5", name: "Claude Haiku 5.5", vendor: "Anthropic", tier: "economy", input: 0.10, output: 0.50, cacheRead: 0.01, cacheWrite: 0.125, tiers: [{ over: 100000, input: 0.50, output: 2.50, cacheRead: 0.05, cacheWrite: 0.625 }], note: { ko: "프롬프트 10만 토큰 초과 시 $0.50 / $2.50", en: "$0.50 / $2.50 for prompts over 100K tokens" }, src: "anthropic", affiliate: null },
    { id: "gpt-6-luna", name: "GPT-6 Luna", vendor: "OpenAI", tier: "economy", input: 0.10, output: 0.50, cacheRead: 0.01, src: "openai", affiliate: null },
    { id: "gpt-6.1-terra", name: "GPT-6.1 Terra", vendor: "OpenAI", tier: "balanced", input: 1.00, output: 5.00, cacheRead: 0.05, src: "openai", affiliate: null },
    { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", vendor: "Google", tier: "balanced", input: 0.75, output: 3.75, cacheRead: 0.075, until: "2026-12-31", after: { input: 1.50, output: 7.50, cacheRead: 0.15 }, note: { ko: "2026-12-31까지 할인가, 2027-01-01부터 $1.50 / $7.50", en: "promo price through 2026-12-31, then $1.50 / $7.50" }, src: "google", affiliate: null },
    { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", vendor: "Anthropic", tier: "balanced", input: 2.00, output: 10.00, cacheRead: 0.10, cacheWrite: 2.50, src: "anthropic", affiliate: null },
    { id: "claude-opus-5.5", name: "Claude Opus 5.5", vendor: "Anthropic", tier: "premium", input: 4.00, output: 20.00, cacheRead: 0.20, cacheWrite: 5.00, src: "anthropic", affiliate: null },
    { id: "gpt-6.2-astra", name: "GPT-6.2 Astra", vendor: "OpenAI", tier: "premium", input: 8.00, output: 40.00, cacheRead: 0.40, src: "openai", affiliate: null },
    // 오픈 웨이트 모델: 같은 모델을 공식 API(중국 업체)와 미국 호스팅(Together AI)으로 나눠 싣는다. 2026-11-23 확인.
    // DeepSeek 공식은 비혼잡 시간 요금. 혼잡 시간(평일 01–04, 06–10 UTC)은 2배($1.32 / $3.96, 캐시 $0.044)
    { id: "deepseek-v4-pro@deepseek", name: "DeepSeek V4 Pro", vendor: "DeepSeek", host: { ko: "공식 API · 비혼잡 시간 기준, 혼잡 시간 2배", en: "official API · off-peak, 2x at peak hours" }, region: "cn", tier: "balanced", offPeak: true, input: 0.66, output: 1.98, cacheRead: 0.022, src: "deepseek", recommend: false, affiliate: null },
    { id: "deepseek-v4-pro@together", name: "DeepSeek V4 Pro", vendor: "Together AI", host: { ko: "미국 호스팅", en: "US-hosted" }, region: "us", tier: "balanced", input: 1.32, output: 3.96, cacheRead: 0.13, src: "together", recommend: false, affiliate: null },
    { id: "kimi-k3.1-pro@moonshot", name: "Kimi K3.1 Pro", vendor: "Moonshot AI", host: { ko: "공식 API", en: "official API" }, region: "cn", tier: "balanced", input: 2.00, output: 10.00, cacheRead: 0.20, cacheWrite: 2.00, src: "moonshot", recommend: false, affiliate: null },
    { id: "kimi-k3.1-pro@together", name: "Kimi K3.1 Pro", vendor: "Together AI", host: { ko: "미국 호스팅", en: "US-hosted" }, region: "us", tier: "balanced", input: 2.00, output: 10.00, cacheRead: 0.20, src: "together", recommend: false, affiliate: null },
    { id: "glm-5.3@zai", name: "GLM-5.3", vendor: "Z.ai", host: { ko: "공식 API", en: "official API" }, region: "cn", tier: "balanced", input: 1.40, output: 4.40, cacheRead: 0.26, src: "zai", recommend: false, affiliate: null },
    { id: "glm-5.3@together", name: "GLM-5.3", vendor: "Together AI", host: { ko: "미국 호스팅", en: "US-hosted" }, region: "us", tier: "balanced", input: 1.40, output: 4.40, cacheRead: 0.26, src: "together", recommend: false, affiliate: null },
    // Qwen4 Max 는 오픈 웨이트가 아니라 외부 호스팅이 없다. Alibaba 공식 미국(버지니아) 리전이 국제 리전과 같은 가격
    { id: "qwen4-max@alibaba-us", name: "Qwen4 Max", vendor: "Alibaba Cloud", usRegionOfficial: true, host: { ko: "공식 API · 미국(버지니아) 리전, 국제 리전과 같은 가격", en: "official API · US (Virginia) region, same price as international" }, region: "us", tier: "balanced", input: 1.50, output: 4.50, cacheRead: 0.075, cacheWrite: 1.875, src: "alibaba", recommend: false, affiliate: null },
  ],
  vectorDbs: {
    supabaseFree: { name: "Supabase pgvector (Free)", monthly: 0, note: { ko: "DB 500MB, 7일 미사용 시 일시정지", en: "500MB DB, pauses after 7 idle days" }, src: "supabase", affiliate: null },
    supabasePro: { name: "Supabase pgvector (Pro)", monthly: 25, note: { ko: "DB 8GB 포함, 초과 사용량 별도", en: "8GB DB included, overage billed" }, src: "supabase", affiliate: null },
    qdrantFree: { name: "Qdrant Cloud (Free)", monthly: 0, note: { ko: "1GB RAM 단일 노드, 768차원 약 100만 벡터", en: "1GB RAM single node, ~1M 768-dim vectors" }, src: "qdrant", affiliate: null },
    pineconeStandard: { name: "Pinecone (Standard)", monthly: 50, note: { ko: "월 최소 $50, 초과분은 사용량 과금", en: "$50/month minimum, then usage-based" }, src: "pinecone", affiliate: null },
  },
  hosting: {
    free: { name: "Cloudflare Workers (Free)", monthly: 0, includedRequests: 3_000_000, note: { ko: "하루 10만 요청 한도", en: "100K requests/day limit" }, src: "cloudflare" },
    paid: { name: "Cloudflare Workers (Paid)", monthly: 5, includedRequests: 10_000_000, overPerMillion: 0.30, note: { ko: "월 1,000만 요청 포함", en: "10M requests/month included" }, src: "cloudflare" },
    // Railway Hobby: 월 $5(사용량 $5 포함), 서비스 사용량 vCPU $20/월, 메모리 $10/GB·월
    railway: { name: "Railway (Hobby)", minimum: 5, perVcpu: 20, perGbRam: 10, src: "railway", affiliate: railwayLink },
  },
};

// 용도별 요청 1건당 토큰과 사용자 1명의 월 요청 수 (가정. 결과 화면에 그대로 보여준다)
// cache: 계산기(/llm-cost)의 캐싱 기본값(가정). 반복 앞부분이 큰 RAG·에이전트에만 둔다
export const USE_CASES = {
  chat:     { label: { ko: "챗봇·상담", en: "Chatbot / support" },        inTok: 1500,  outTok: 400,  reqPerUser: 20, framework: { python: "FastAPI + official SDK", typescript: "Vercel AI SDK" } },
  rag:      { label: { ko: "문서 검색(RAG)", en: "Document Q&A (RAG)" },   inTok: 4000,  outTok: 500,  reqPerUser: 20, cache: { prefix: 0.3, expiry: 0.5 }, framework: { python: "LlamaIndex", typescript: "LlamaIndex.TS" } },
  agent:    { label: { ko: "업무 자동화 에이전트", en: "Task agent" },     inTok: 12000, outTok: 1500, reqPerUser: 10, cache: { prefix: 0.8, expiry: 0.1 },
              // turns: 작업 단위 계산 도우미 기본값(가정). 평균 입력 = 시작 컨텍스트 + 턴당 증가 × (턴 수 − 1) / 2 ≈ 12k
              turns: { tasksPerDay: 100, perTask: 10, base: 8000, growth: 900 }, framework: { python: "LangGraph", typescript: "LangGraph.js" } },
  // 계산기 전용(calcOnly): 오래 돌아가는 코딩 에이전트. 매 턴 커진 컨텍스트를 다시 보내고 출력은 대부분 짧은 도구 호출.
  // 기본값은 Reddit 사용자 1명의 Claude Code 세션 1건 실측(요청 233건, 입력 중앙값 ~148k, 출력 ~500, 입력의 91% 캐시 읽기·9% 캐시 쓰기).
  // /build 로 넘길 때는 agent 로 취급(buildAs)
  coding:   { label: { ko: "코딩 에이전트(긴 세션)", en: "Coding agent (long session)" }, inTok: 148000, outTok: 500, reqPerUser: 10, cache: { prefix: 1, expiry: 0.09 }, calcOnly: true, buildAs: "agent",
              // 세션당 233턴, 평균 입력 ≈ 20k + 1,100 × 116 ≈ 148k 가 되도록 맞춘 가정값
              turns: { tasksPerDay: 4, perTask: 233, base: 20000, growth: 1100 },
              source: { ko: "기본값 출처: Reddit 사용자의 Claude Code 긴 세션 1건 실측 (요청 233건, 입력 중앙값 약 148k · 출력 약 500 토큰, 입력의 91% 캐시 읽기 · 9% 캐시 쓰기). 모든 코딩 에이전트의 평균이 아닙니다.", en: "Defaults from one measured Claude Code session shared by a Reddit user (233 requests, median ~148k input / ~500 output tokens, 91% cache reads / 9% cache writes). Not an average for every coding agent." } },
  extract:  { label: { ko: "데이터 추출·분류", en: "Extraction / classification" }, inTok: 3000, outTok: 600, reqPerUser: 30, framework: { python: "Official SDK + Pydantic structured output", typescript: "Vercel AI SDK (generateObject)" } },
  generate: { label: { ko: "콘텐츠 생성", en: "Content generation" },      inTok: 800,   outTok: 1200, reqPerUser: 15, framework: { python: "FastAPI + official SDK", typescript: "Vercel AI SDK" } },
};

const KEYWORDS = {
  rag: ["문서", "pdf", "검색", "사내", "지식", "매뉴얼", "논문", "규정", "위키", "docs", "document", "knowledge", "search", "retriev", "rag", "faq", "notion"],
  agent: ["자동화", "에이전트", "업무", "예약", "보내", "처리해", "브라우저", "툴", "워크플로", "agent", "automat", "workflow", "tool", "schedul", "browser", "book"],
  extract: ["추출", "분류", "영수증", "이력서", "파싱", "정리해", "태깅", "extract", "classif", "parse", "invoice", "receipt", "resume", "tag"],
  generate: ["생성", "작성", "블로그", "카피", "마케팅", "글쓰기", "콘텐츠", "번역", "write", "generat", "copy", "blog", "marketing", "content", "translat", "caption"],
  chat: ["챗봇", "상담", "고객", "cs", "대화", "chat", "bot", "support", "assistant", "customer"],
};

export function classify(description = "") {
  const text = String(description).toLowerCase();
  let best = "chat", bestScore = 0;
  for (const [key, words] of Object.entries(KEYWORDS)) {
    const score = words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);
    if (score > bestScore) { best = key; bestScore = score; }
  }
  return best;
}

const round = (n) => Math.round(n * 100) / 100;

// 요청 1건의 입력 토큰 수로 요금 구간을 고른다. 구간을 넘으면 그 요청 전체가 높은 단가로 계산된다(Anthropic 장문 요금 방식)
export function priceForPrompt(model, inTok = 0) {
  const tier = (model.tiers || []).filter((t) => inTok > t.over).sort((a, b) => b.over - a.over)[0];
  return tier ? { ...model, ...tier, longContext: true } : model;
}

// 할인가 기간이 끝난 모델은 이후 가격으로 계산한다
export function effectivePrice(model, today = new Date().toISOString().slice(0, 10)) {
  if (model.until && model.after && today > model.until) return { ...model, input: model.after.input, output: model.after.output, cacheRead: model.after.cacheRead ?? model.cacheRead, note: null };
  return model;
}

// 요청당 입력 1M 토큰의 실효 단가.
// prefix(0~1): 입력 중 매 요청 반복되는 앞부분(시스템 프롬프트·이전 대화) 비율 → 캐시 대상
// expiry(0~1): 그 앞부분이 캐시 만료로 다시 쓰이는 비율(요청 간격 > 캐시 유지 시간, 첫 요청 포함)
export function inputRate(model, prefix = 0, expiry = 0) {
  if (model.cacheRead == null || !prefix) return model.input;
  const write = model.cacheWrite ?? model.input;
  return (1 - prefix) * model.input + prefix * ((1 - expiry) * model.cacheRead + expiry * write);
}

function llmCost(model, requests, uc) {
  const m = priceForPrompt(model, uc.inTok);
  return round((requests * uc.inTok / 1e6) * m.input + (requests * uc.outTok / 1e6) * m.output);
}

function pickLlm(useCase, priority, today) {
  let tier = priority === "cost" ? "economy" : priority === "quality" ? "premium" : "balanced";
  if (useCase === "agent" && tier === "economy") tier = "balanced"; // 여러 단계 도구 호출은 저가 모델에서 실패가 잦다
  const candidates = PRICES.llms.filter((m) => m.tier === tier && m.recommend !== false).map((m) => effectivePrice(m, today));
  // 같은 등급 안에서는 더 싼 쪽을 기본으로, 다른 하나를 대안으로
  const sorted = [...candidates].sort((a, b) => (a.input + a.output) - (b.input + b.output));
  return { primary: sorted[0], alternative: sorted[1] || null, tier };
}

function pickVectorDb(useCase, mau) {
  if (useCase !== "rag") return null;
  if (mau <= 1000) return PRICES.vectorDbs.supabaseFree;
  if (mau <= 10000) return PRICES.vectorDbs.supabasePro;
  return PRICES.vectorDbs.pineconeStandard;
}

// Python 서버는 상시 실행되는 Railway로. 규모별 평균 사용량은 추정치(결과에 그대로 표시)
const RAILWAY_USAGE = { 100: { vcpu: 0.1, ram: 0.5 }, 1000: { vcpu: 0.1, ram: 0.5 }, 10000: { vcpu: 0.3, ram: 1 }, 100000: { vcpu: 1, ram: 2 } };
function pickRailway(mau) {
  const r = PRICES.hosting.railway, u = RAILWAY_USAGE[mau];
  const usage = u.vcpu * r.perVcpu + u.ram * r.perGbRam;
  return { ...r, cost: round(Math.max(r.minimum, usage)), note: { ko: `추정 평균 ${u.vcpu} vCPU · ${u.ram}GB RAM 기준, 월 $5(사용량 $5 포함)`, en: `estimated avg ${u.vcpu} vCPU · ${u.ram}GB RAM, $5/month incl. $5 usage` } };
}

function pickHosting(requests, useCase) {
  const h = PRICES.hosting;
  // 무료 플랜은 호출당 CPU 10ms 제한이 있어 여러 단계를 도는 에이전트에는 유료 플랜을 기본으로
  if (requests <= h.free.includedRequests && useCase !== "agent") return { ...h.free, cost: 0 };
  const over = Math.max(0, requests - h.paid.includedRequests);
  return { ...h.paid, cost: round(h.paid.monthly + (over / 1e6) * h.paid.overPerMillion) };
}

export function recommendAiStack(input = {}) {
  const lang = input.lang === "en" ? "en" : "ko";
  const mau = [100, 1000, 10000, 100000].includes(Number(input.mau)) ? Number(input.mau) : 1000;
  const priority = ["cost", "balanced", "quality"].includes(input.priority) ? input.priority : "balanced";
  const description = String(input.description || "").slice(0, 300);
  const language = input.language === "typescript" ? "typescript" : "python";
  const today = /^\d{4}-\d{2}-\d{2}$/.test(input.today || "") ? input.today : new Date().toISOString().slice(0, 10);

  const useCase = classify(description);
  const uc = USE_CASES[useCase];
  const requests = mau * uc.reqPerUser;

  const { primary, alternative, tier } = pickLlm(useCase, priority, today);
  const vectorDb = pickVectorDb(useCase, mau);
  const hosting = language === "python" ? pickRailway(mau) : pickHosting(requests, useCase);

  const llmMonthly = llmCost(primary, requests, uc);
  const altMonthly = alternative ? llmCost(alternative, requests, uc) : null;
  const vectorMonthly = vectorDb ? vectorDb.monthly : 0;
  const total = round(llmMonthly + vectorMonthly + hosting.cost);

  return {
    useCase: { id: useCase, label: uc.label[lang] },
    llm: { ...primary, tier, monthly: llmMonthly },
    alternativeLlm: alternative ? { ...alternative, monthly: altMonthly } : null,
    framework: uc.framework[language],
    language,
    vectorDb: vectorDb ? { ...vectorDb, sourceUrl: PRICES.sources[vectorDb.src] } : null,
    hosting: { ...hosting, sourceUrl: PRICES.sources[hosting.src] },
    cost: { llm: llmMonthly, vectorDb: vectorMonthly, hosting: hosting.cost, total, currency: "USD" },
    assumptions: { mau, requestsPerUser: uc.reqPerUser, requests, inputTokens: uc.inTok, outputTokens: uc.outTok, priority, language, today },
    asOf: PRICES.asOf,
    sources: PRICES.sources,
    hasAffiliate: [primary, alternative, vectorDb, hosting].some((x) => x && x.affiliate),
  };
}
