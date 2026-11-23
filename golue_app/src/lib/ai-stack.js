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
  },
  // USD / 1M tokens. tier 는 같은 회사 안의 가격 순서 기준(품질 평가가 아님).
  // cacheRead = 캐시 적중 입력 단가, cacheWrite = 캐시 쓰기 단가(2026-11-23 확인).
  // cacheWrite 가 없는 모델(OpenAI 자동 캐싱, Gemini 암시적 캐싱)은 쓰기 할증 없이 입력 단가로 계산. Gemini 캐시 저장료는 미반영.
  // gpt-6-luna 의 cacheRead 는 공식 페이지 Flex 표($0.005, Standard의 절반)에서 역산한 값.
  llms: [
    { id: "claude-haiku-5.5", name: "Claude Haiku 5.5", vendor: "Anthropic", tier: "economy", input: 0.10, output: 0.50, cacheRead: 0.01, cacheWrite: 0.125, note: { ko: "프롬프트 10만 토큰 이하 기준", en: "for prompts up to 100K tokens" }, src: "anthropic", affiliate: null },
    { id: "gpt-6-luna", name: "GPT-6 Luna", vendor: "OpenAI", tier: "economy", input: 0.10, output: 0.50, cacheRead: 0.01, src: "openai", affiliate: null },
    { id: "gpt-6.1-terra", name: "GPT-6.1 Terra", vendor: "OpenAI", tier: "balanced", input: 1.00, output: 5.00, cacheRead: 0.05, src: "openai", affiliate: null },
    { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", vendor: "Google", tier: "balanced", input: 0.75, output: 3.75, cacheRead: 0.075, until: "2026-12-31", after: { input: 1.50, output: 7.50, cacheRead: 0.15 }, note: { ko: "2026-12-31까지 할인가, 2027-01-01부터 $1.50 / $7.50", en: "promo price through 2026-12-31, then $1.50 / $7.50" }, src: "google", affiliate: null },
    { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", vendor: "Anthropic", tier: "balanced", input: 2.00, output: 10.00, cacheRead: 0.10, cacheWrite: 2.50, src: "anthropic", affiliate: null },
    { id: "claude-opus-5.5", name: "Claude Opus 5.5", vendor: "Anthropic", tier: "premium", input: 4.00, output: 20.00, cacheRead: 0.20, cacheWrite: 5.00, src: "anthropic", affiliate: null },
    { id: "gpt-6.2-astra", name: "GPT-6.2 Astra", vendor: "OpenAI", tier: "premium", input: 8.00, output: 40.00, cacheRead: 0.40, src: "openai", affiliate: null },
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
    railway: { name: "Railway (Hobby)", minimum: 5, perVcpu: 20, perGbRam: 10, src: "railway", affiliate: null },
  },
};

// 용도별 요청 1건당 토큰과 사용자 1명의 월 요청 수 (가정. 결과 화면에 그대로 보여준다)
// cache: 계산기(/llm-cost)의 캐싱 기본값(가정). 반복 앞부분이 큰 RAG·에이전트에만 둔다
export const USE_CASES = {
  chat:     { label: { ko: "챗봇·상담", en: "Chatbot / support" },        inTok: 1500,  outTok: 400,  reqPerUser: 20, framework: { python: "FastAPI + official SDK", typescript: "Vercel AI SDK" } },
  rag:      { label: { ko: "문서 검색(RAG)", en: "Document Q&A (RAG)" },   inTok: 4000,  outTok: 500,  reqPerUser: 20, cache: { prefix: 0.3, expiry: 0.5 }, framework: { python: "LlamaIndex", typescript: "LlamaIndex.TS" } },
  agent:    { label: { ko: "업무 자동화 에이전트", en: "Task agent" },     inTok: 12000, outTok: 1500, reqPerUser: 10, cache: { prefix: 0.8, expiry: 0.1 }, framework: { python: "LangGraph", typescript: "LangGraph.js" } },
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
  return round((requests * uc.inTok / 1e6) * model.input + (requests * uc.outTok / 1e6) * model.output);
}

function pickLlm(useCase, priority, today) {
  let tier = priority === "cost" ? "economy" : priority === "quality" ? "premium" : "balanced";
  if (useCase === "agent" && tier === "economy") tier = "balanced"; // 여러 단계 도구 호출은 저가 모델에서 실패가 잦다
  const candidates = PRICES.llms.filter((m) => m.tier === tier).map((m) => effectivePrice(m, today));
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
