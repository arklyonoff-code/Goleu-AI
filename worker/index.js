/**
 * Goleu AI — Cloudflare Worker
 * 규칙 기반 추천·상세 엔진 (외부 AI API 호출 없음)
 *
 * KV 바인딩:
 *   GOLEU_KV  — Cloudflare KV namespace (캐싱·결과 저장)
 *
 * 가격 데이터 최신화: 2026-05-23
 */

import { recommendAiStack } from "./ai-stack.js";

const CACHE_TTL_SEC = 60 * 60 * 24; // 24시간
const DAILY_RATE_LIMIT = 9999;
const SAVE_TTL_SEC = 60 * 60 * 24 * 30; // 30일

// ─── CORS ───────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  "https://goleu.ai",
  "https://www.goleu.ai",
  "https://goleuai.pages.dev",
  "http://localhost:5173",
  "http://localhost:4173",
  "https://cac4ae84.goleuai.pages.dev"
]);

function corsHeaders(origin) {
  const isPagesDev = /^https:\/\/([a-z0-9-]+\.)?goleuai\.pages\.dev$/.test(origin || "");
  const isVercel   = /^https:\/\/goleu(-[a-z0-9]+)?\.vercel\.app$/.test(origin || "");
  const allow = (ALLOWED_ORIGINS.has(origin) || isPagesDev || isVercel)
    ? origin
    : "https://goleu.vercel.app";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(data, status = 200, origin, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json", ...extra },
  });
}

// ─── 툴 카탈로그 ────────────────────────────────────────────────────────────
const TOOL = {
  lovable: {
    key: "lovable",
    name: "Lovable",
    desc: "AI 노코드 앱 빌더",
    price: 0,
    priceLabel: "Free ~ $25/월",
    reason: "개발 경험이 없어도 프롬프트만으로 앱을 빠르게 만들 수 있습니다.",
  },
  nextjs: {
    key: "nextjs",
    name: "Next.js",
    desc: "React 풀스택 프레임워크",
    price: 0,
    priceLabel: "무료 (오픈소스)",
    reason: "개발자가 있는 팀에 최적화된 확장 가능한 프레임워크입니다.",
  },
  supabase: {
    key: "supabase",
    name: "Supabase",
    desc: "PostgreSQL 백엔드·인증",
    price: 0,
    priceLabel: "Free ~ $25/월",
    reason: "DB·인증·스토리지를 한 번에 제공해 백엔드 구축 시간을 줄입니다.",
  },
  cloudflare: {
    key: "cloudflare",
    name: "Cloudflare",
    desc: "엣지 호스팅·Workers",
    price: 0,
    priceLabel: "Free 티어",
    reason: "무료 플랜으로 글로벌 CDN·호스팅을 즉시 시작할 수 있습니다.",
  },
  vercel: {
    key: "vercel",
    name: "Vercel",
    desc: "프론트엔드 배포",
    price: 0,
    priceLabel: "Free ~ $20/월",
    reason: "Next.js와 궁합이 좋고 프리뷰 배포가 빠릅니다.",
  },
  openai: {
    key: "openai",
    name: "OpenAI API",
    desc: "LLM·AI 기능 연동",
    price: 20,
    priceLabel: "사용량 기반",
    reason: "챗봇·콘텐츠 생성 등 AI 기능을 API로 바로 붙일 수 있습니다.",
  },
  aws: {
    key: "aws",
    name: "AWS",
    desc: "엔터프라이즈 클라우드",
    price: 0,
    priceLabel: "사용량 기반",
    reason: "대규모 팀·규제 환경에 맞는 확장성과 보안을 제공합니다.",
  },
  auth0: {
    key: "auth0",
    name: "Auth0",
    desc: "엔터프라이즈 인증",
    price: 23,
    priceLabel: "$23/월~",
    reason: "SSO·MFA·감사 로그 등 기업 인증 요건을 충족합니다.",
  },
  notion: {
    key: "notion",
    name: "Notion",
    desc: "문서·위키",
    price: 0,
    priceLabel: "Free ~ $10/인",
    reason: "팀 문서와 지식 공유의 중심 허브로 쓰기 좋습니다.",
  },
  slack: {
    key: "slack",
    name: "Slack",
    desc: "팀 커뮤니케이션",
    price: 0,
    priceLabel: "Free ~ $7.25/인",
    reason: "이미 도입된 팀이 많아 온보딩이 빠릅니다.",
  },
  linear: {
    key: "linear",
    name: "Linear",
    desc: "이슈·프로젝트 관리",
    price: 0,
    priceLabel: "Free ~ $10/인",
    reason: "개발팀 이슈 트래킹에 최적화되어 있습니다.",
  },
  figma: {
    key: "figma",
    name: "Figma",
    desc: "UI 디자인 협업",
    price: 0,
    priceLabel: "Free ~ $15/에디터",
    reason: "디자이너가 있는 팀의 협업 워크플로에 필수입니다.",
  },
};

const SELECTED_TOOL_KEYS = {
  notion: "notion",
  slack: "slack",
  figma: "figma",
  github: "nextjs",
  trello: "linear",
};

// ─── 툴 상세 DB (무료 MVP — Claude 대체) ─────────────────────────────────────
const TOOL_DATABASE = {
  notion: {
    rating: 5,
    recommendLabel: "AI Builder 추천",
    tagline: "올인원 지식 허브",
    why: [
      "AI Agent 구축에 적합한 문서·DB 구조",
      "Slack·Zapier 등 자동화 연결이 쉬움",
      "팀 협업·위키·프로젝트를 한곳에서 관리",
    ],
    pros: ["API 제공", "MCP 연동 가능", "템플릿 풍부", "AI 요약·작성 기능 내장"],
    cons: ["DB 구조를 처음 익혀야 함", "대규모 팀에서는 권한 관리가 복잡"],
    notFor: ["단순 채팅만 필요한 팀", "엔터프라이즈급 감사 로그가 필수인 경우"],
    price: { monthly: "$10 / user", example: "4명 기준 월 $40" },
    perUserPrice: 10,
    tiers: [
      { name: "Free", price: 0, highlight: false },
      { name: "Plus", price: 10, highlight: true },
      { name: "Business", price: 18, highlight: false },
    ],
    aiScore: 5,
    mcpScore: 5,
    workflow: ["Slack", "Notion", "Claude", "Cursor", "GitHub"],
    alternatives: ["ClickUp", "Linear", "Confluence"],
  },
  slack: {
    rating: 4.5,
    recommendLabel: "팀 커뮤니케이션",
    tagline: "실시간 협업 허브",
    why: [
      "팀 소통의 중심 허브로 다른 툴과 연동 용이",
      "채널·스레드 구조로 정보 과부하 감소",
      "봇·워크플로 자동화 생태계 풍부",
    ],
    pros: ["수많은 앱 연동", "검색·알림 강력", "Huddle 화상 회의", "무료 플랜 제공"],
    cons: ["메시지 90일 제한(무료)", "알림 과다 가능"],
    notFor: ["비동기 문서 중심 팀", "이미 Microsoft Teams에 전사 표준화된 경우"],
    price: { monthly: "$7.25 / user", example: "4명 기준 월 $29" },
    perUserPrice: 7.25,
    tiers: [
      { name: "Free", price: 0, highlight: false },
      { name: "Pro", price: 7.25, highlight: true },
      { name: "Business+", price: 12.5, highlight: false },
    ],
    aiScore: 4,
    workflow: ["Slack", "Notion", "Linear", "GitHub", "Zapier"],
    alternatives: ["Microsoft Teams", "Discord", "Mattermost"],
  },
  figma: {
    rating: 4.5,
    recommendLabel: "디자인 협업",
    tagline: "UI 협업 표준",
    why: [
      "실시간 디자인 협업·프로토타이핑",
      "개발자 Handoff로 구현 속도 향상",
      "디자인 시스템 구축에 최적",
    ],
    pros: ["브라우저 기반", "Dev Mode", "컴포넌트 라이브러리", "FigJam 화이트보드"],
    cons: ["오프라인 편집 제한", "대용량 파일 성능 이슈"],
    notFor: ["디자이너가 없는 순수 백엔드 팀", "일러스트·인쇄물 중심 작업"],
    price: { monthly: "$15 / editor", example: "2명 기준 월 $30" },
    perUserPrice: 15,
    tiers: [
      { name: "Free", price: 0, highlight: false },
      { name: "Professional", price: 15, highlight: true },
      { name: "Organization", price: 45, highlight: false },
    ],
    aiScore: 3,
    workflow: ["Figma", "Notion", "Slack", "Cursor", "GitHub"],
    alternatives: ["Sketch", "Adobe XD", "Penpot"],
  },
  cursor: {
    rating: 5,
    recommendLabel: "AI 코딩",
    tagline: "AI 네이티브 IDE",
    why: [
      "VS Code 기반으로 온보딩 부담 적음",
      "코드베이스 전체 컨텍스트 AI 분석",
      "개발 생산성 극대화",
    ],
    pros: ["멀티 모델 지원", "코드 자동완성·리팩터링", "터미널·Git 통합", "Rules 커스터마이징"],
    cons: ["유료 구독 필요(Pro)", "기업 보안 정책 검토 필요"],
    notFor: ["비개발 직군만 있는 팀", "오프라인·에어갭 환경"],
    price: { monthly: "$20 / user", example: "3명 기준 월 $60" },
    perUserPrice: 20,
    tiers: [
      { name: "Hobby", price: 0, highlight: false },
      { name: "Pro", price: 20, highlight: true },
      { name: "Business", price: 40, highlight: false },
    ],
    aiScore: 5,
    mcpScore: 4,
    workflow: ["Linear", "Cursor", "GitHub", "Slack", "Notion"],
    alternatives: ["GitHub Copilot", "Windsurf", "JetBrains AI"],
  },
  github: {
    rating: 4.5,
    recommendLabel: "코드 관리",
    tagline: "개발 협업 표준",
    why: [
      "코드 버전 관리·PR 리뷰 워크플로",
      "Actions로 CI/CD 자동화",
      "Copilot·Issues·Projects 통합",
    ],
    pros: ["오픈소스 생태계", "GitHub Actions", "Dependabot", "Codespaces"],
    cons: ["대규모 팀 비용 상승", "복잡한 권한 설정"],
    notFor: ["코드 저장소가 필요 없는 팀", "GitLab/GitBucket 전사 표준 조직"],
    price: { monthly: "$4 / user", example: "4명 기준 월 $16" },
    perUserPrice: 4,
    tiers: [
      { name: "Free", price: 0, highlight: false },
      { name: "Team", price: 4, highlight: true },
      { name: "Enterprise", price: 21, highlight: false },
    ],
    aiScore: 4,
    workflow: ["Linear", "Cursor", "GitHub", "Slack", "Notion"],
    alternatives: ["GitLab", "Bitbucket", "Azure DevOps"],
  },
  linear: {
    rating: 4.5,
    recommendLabel: "이슈 트래킹",
    tagline: "개발팀 PM",
    why: [
      "개발팀에 최적화된 이슈·스프린트 관리",
      "GitHub·Slack 양방향 연동",
      "빠른 UI·키보드 중심 워크플로",
    ],
    pros: ["속도·UX 우수", "로드맵·사이클 뷰", "API·Webhook", "템플릿 자동화"],
    cons: ["비개발 직군 기능 제한적", "Jira 대비 엔터프라이즈 기능 적음"],
    notFor: ["마케팅·운영 중심 칸반만 필요한 팀", "복잡한 워터폴 PM 필수"],
    price: { monthly: "$10 / user", example: "4명 기준 월 $40" },
    perUserPrice: 10,
    tiers: [
      { name: "Free", price: 0, highlight: false },
      { name: "Standard", price: 10, highlight: true },
      { name: "Plus", price: 16, highlight: false },
    ],
    aiScore: 4,
    workflow: ["Slack", "Linear", "Cursor", "GitHub", "Notion"],
    alternatives: ["Jira", "ClickUp", "Asana"],
  },
  clickup: {
    rating: 4,
    recommendLabel: "올인원 PM",
    tagline: "다기능 PM",
    why: [
      "태스크·문서·목표·시간 추적 통합",
      "다양한 뷰(리스트·보드·간트)",
      "합리적인 가격 대비 기능",
    ],
    pros: ["커스터마이징 자유도", "자동화·템플릿", "무료 플랜 관대", "AI 기능 내장"],
    cons: ["기능 과다로 학습 곡선", "대규모 팀 성능 저하 가능"],
    notFor: ["미니멀 도구 선호 팀", "개발 이슈 트래킹만 필요한 경우"],
    price: { monthly: "$7 / user", example: "4명 기준 월 $28" },
    perUserPrice: 7,
    tiers: [
      { name: "Free", price: 0, highlight: false },
      { name: "Unlimited", price: 7, highlight: true },
      { name: "Business", price: 12, highlight: false },
    ],
    aiScore: 3,
    workflow: ["Slack", "ClickUp", "Notion", "Zapier", "GitHub"],
    alternatives: ["Notion", "Asana", "Monday.com"],
  },
  jira: {
    rating: 4,
    recommendLabel: "엔터프라이즈 PM",
    tagline: "대규모 PM",
    why: [
      "대규모·엔터프라이즈 이슈 관리 표준",
      "Agile·Scrum·Kanban 완벽 지원",
      "Atlassian 생태계(Confluence) 연동",
    ],
    pros: ["강력한 워크플로 커스터마이징", "보고·대시보드", "Confluence 연동", "엔터프라이즈 SLA"],
    cons: ["설정·관리 복잡", "소규모 팀에는 과함"],
    notFor: ["5명 이하 스타트업", "심플한 칸반만 필요한 팀"],
    price: { monthly: "$8 / user", example: "4명 기준 월 $32" },
    perUserPrice: 8,
    tiers: [
      { name: "Free", price: 0, highlight: false },
      { name: "Standard", price: 8, highlight: true },
      { name: "Premium", price: 16, highlight: false },
    ],
    aiScore: 3,
    workflow: ["Jira", "Confluence", "GitHub", "Slack", "Zapier"],
    alternatives: ["Linear", "ClickUp", "Azure Boards"],
  },
  zapier: {
    rating: 4,
    recommendLabel: "노코드 자동화",
    tagline: "앱 연결 자동화",
    why: [
      "5000+ 앱 연동으로 코드 없이 자동화",
      "비개발자도 워크플로 구축 가능",
      "빠른 프로토타이핑·MVP 자동화",
    ],
    pros: ["방대한 앱 생태계", "드래그앤드롭 빌더", "멀티스텝 Zaps", "AI Actions"],
    cons: ["태스크 수 기반 과금", "복잡한 로직은 n8n 대비 제한"],
    notFor: ["셀프호스팅·데이터 주권 필수", "고급 분기·코드 로직 중심"],
    price: { monthly: "$29 / month", example: "팀 플랜 월 $29~" },
    flatMonthly: 29,
    tiers: [
      { name: "Free", price: 0, highlight: false },
      { name: "Professional", price: 29, highlight: true },
      { name: "Team", price: 103, highlight: false },
    ],
    aiScore: 4,
    workflow: ["Slack", "Notion", "Zapier", "Gmail", "Google Sheets"],
    alternatives: ["n8n", "Make", "Power Automate"],
  },
  n8n: {
    rating: 4.5,
    recommendLabel: "셀프호스트 자동화",
    tagline: "오픈소스 자동화",
    why: [
      "셀프호스팅·데이터 주권 확보",
      "복잡한 분기·코드 노드 지원",
      "Zapier 대비 비용 효율(대규모)",
    ],
    pros: ["오픈소스", "400+ 통합", "JavaScript/Python 코드 노드", "AI Agent 워크플로"],
    cons: ["셀프호스팅 운영 부담", "초기 설정 학습 필요"],
    notFor: ["완전 노코드만 원하는 팀", "인프라 관리 리소스 없는 경우"],
    price: { monthly: "$20 / month", example: "Cloud Starter 월 $20" },
    flatMonthly: 20,
    tiers: [
      { name: "Self-hosted", price: 0, highlight: false },
      { name: "Cloud Starter", price: 20, highlight: true },
      { name: "Cloud Pro", price: 50, highlight: false },
    ],
    aiScore: 5,
    mcpScore: 4,
    workflow: ["Slack", "n8n", "Notion", "OpenAI", "GitHub"],
    alternatives: ["Zapier", "Make", "Temporal"],
  },
  claude: {
    rating: 5,
    recommendLabel: "AI 어시스턴트",
    tagline: "고품질 AI",
    why: [
      "긴 컨텍스트·코드·문서 분석 우수",
      "Artifacts·Projects로 팀 협업",
      "MCP·API로 Agent 구축 용이",
    ],
    pros: ["200K 컨텍스트", "Claude API", "MCP 지원", "안전성·추론 품질"],
    cons: ["Plus/Team 유료", "한국어 UI 제한적"],
    notFor: ["오프라인 AI 필수", "Microsoft Copilot 전사 표준"],
    price: { monthly: "$20 / user", example: "3명 기준 월 $60" },
    perUserPrice: 20,
    tiers: [
      { name: "Free", price: 0, highlight: false },
      { name: "Pro", price: 20, highlight: true },
      { name: "Team", price: 30, highlight: false },
    ],
    aiScore: 5,
    mcpScore: 5,
    workflow: ["Slack", "Notion", "Claude", "Cursor", "GitHub"],
    alternatives: ["ChatGPT", "Gemini", "Copilot"],
  },
  chatgpt: {
    rating: 4.5,
    recommendLabel: "범용 AI",
    tagline: "GPT 생태계",
    why: [
      "범용 AI 작업·콘텐츠 생성",
      "GPTs·Custom Actions로 확장",
      "방대한 플러그인·연동",
    ],
    pros: ["GPT-4o 멀티모달", "Custom GPTs", "Code Interpreter", "API(OpenAI)"],
    cons: ["팀 협업 기능 제한(Plus)", "Enterprise 비용 높음"],
    notFor: ["Anthropic MCP 중심 워크플로", "데이터 거버넌스 엄격한 금융권"],
    price: { monthly: "$20 / user", example: "3명 기준 월 $60" },
    perUserPrice: 20,
    tiers: [
      { name: "Free", price: 0, highlight: false },
      { name: "Plus", price: 20, highlight: true },
      { name: "Team", price: 25, highlight: false },
    ],
    aiScore: 5,
    workflow: ["Slack", "Notion", "ChatGPT", "Zapier", "GitHub"],
    alternatives: ["Claude", "Gemini", "Copilot"],
  },
  gemini: {
    rating: 4,
    recommendLabel: "Google AI",
    tagline: "Google 생태계 AI",
    why: [
      "Google Workspace·Drive와 자연스러운 연동",
      "멀티모달(이미지·코드) 지원",
      "합리적인 Team 가격",
    ],
    pros: ["Workspace 통합", "Gemini API", "긴 컨텍스트", "Google Cloud 연동"],
    cons: ["한국어 품질 편차", "Claude 대비 추론 깊이"],
    notFor: ["Microsoft 365 전사 표준", "Anthropic MCP 중심"],
    price: { monthly: "$20 / user", example: "3명 기준 월 $60" },
    perUserPrice: 20,
    tiers: [
      { name: "Free", price: 0, highlight: false },
      { name: "Advanced", price: 20, highlight: true },
      { name: "Business", price: 20, highlight: false },
    ],
    aiScore: 4,
    workflow: ["Google Workspace", "Gemini", "Slack", "Notion", "GitHub"],
    alternatives: ["ChatGPT", "Claude", "Copilot"],
  },
};

const TOOL_NAME_ALIASES = {
  notion: "notion",
  slack: "slack",
  figma: "figma",
  cursor: "cursor",
  github: "github",
  linear: "linear",
  clickup: "clickup",
  jira: "jira",
  zapier: "zapier",
  n8n: "n8n",
  claude: "claude",
  chatgpt: "chatgpt",
  "chat gpt": "chatgpt",
  openai: "chatgpt",
  "openai api": "chatgpt",
  gemini: "gemini",
  "google gemini": "gemini",
};

function normalizeToolKey(name) {
  const n = (name || "").toLowerCase().trim();
  return TOOL_NAME_ALIASES[n] || n.replace(/[^a-z0-9]/g, "");
}

function getTotalMembers(teamInfo) {
  return Math.max(1, Object.values(teamInfo?.roles || {}).reduce(
    (s, n) => s + (parseInt(n) || 0), 0
  ));
}

function expandAiScore(db) {
  if (db.aiScoreDetail) return db.aiScoreDetail;
  const base = typeof db.aiScore === "number" ? db.aiScore : 3;
  return {
    agentCompatibility: base,
    automation: Math.min(5, base),
    api: Math.min(5, Math.max(1, base - 1 + (db.hasApi ? 1 : 0))),
    mcp: db.mcpScore ?? Math.max(1, base - 1),
    integration: Math.min(5, base),
  };
}

function buildGenericDetail(toolName, totalMembers) {
  return {
    toolName,
    tagline: "준비 중",
    overallScore: 3,
    whyRecommended: ["현재 준비 중인 상세 정보입니다."],
    pros: ["자세한 분석 정보가 곧 업데이트됩니다."],
    cons: ["상세 데이터 수집 중입니다."],
    workflow: [toolName],
    pricing: {
      tiers: [{ name: "Standard", price: 0, highlight: true }],
      teamMonthly: 0,
      teamAnnual: 0,
      note: `${totalMembers}명 팀 — 가격 정보 준비 중`,
    },
    aiScore: {
      agentCompatibility: 3,
      automation: 3,
      api: 3,
      mcp: 2,
      integration: 3,
    },
    similar: [],
    notFor: ["상세 비교 데이터가 아직 준비되지 않았습니다."],
  };
}

function buildDetailFromDatabase(tool, teamInfo) {
  const key = normalizeToolKey(tool.name);
  const db = TOOL_DATABASE[key];
  const totalMembers = getTotalMembers(teamInfo);

  if (!db) return buildGenericDetail(tool.name, totalMembers);

  const perUser = db.perUserPrice ?? 0;
  const teamMonthly = db.flatMonthly ?? (perUser * totalMembers);
  const teamAnnual = teamMonthly * 12;

  return {
    toolName: tool.name,
    tagline: db.tagline || db.recommendLabel || "",
    overallScore: db.rating ?? 4,
    whyRecommended: db.why || [],
    pros: db.pros || [],
    cons: db.cons || [],
    workflow: db.workflow || [],
    pricing: {
      tiers: db.tiers || [
        { name: "Free", price: 0, highlight: false },
        { name: "Pro", price: perUser || 10, highlight: true },
      ],
      teamMonthly,
      teamAnnual,
      note: db.price?.example || `${totalMembers}명 기준 ${db.price?.monthly || ""}`,
    },
    aiScore: expandAiScore(db),
    similar: db.alternatives || [],
    notFor: db.notFor || [],
  };
}

// ─── 입력 분석 ──────────────────────────────────────────────────────────────
function analyzeProfile(data) {
  const roles = data.roles || {};
  const productCount = parseInt(roles.product) || 0;
  const engineeringCount = parseInt(roles.engineering) || 0;
  const designCount = parseInt(roles.design) || 0;
  const dataCount = parseInt(roles.data) || 0;
  const marketingCount = parseInt(roles.marketing) || 0;
  const salesCount = parseInt(roles.sales) || 0;
  const csCount = parseInt(roles.cs) || 0;
  const operationsCount = parseInt(roles.operations) || 0;
  const totalMembers = Object.values(roles).reduce((s, n) => s + (parseInt(n) || 0), 0);
  const selectedTools = data.selectedTools || [];
  const selectedClouds = data.selectedClouds || [];
  const selectedLLMs = data.selectedLLMs || [];
  const useCases = data.useCases || [];
  const budget = parseInt(data.monthlyBudget) || 0;
  const aiBudget = parseInt(data.monthlyAIBudget) || 0;

  const devCount = engineeringCount;
  const opsCount = operationsCount;
  const hasDevExperience = engineeringCount > 0 || selectedTools.includes("github");
  const needsAI =
    selectedLLMs.length > 0 ||
    useCases.length > 0 ||
    aiBudget > 0 ||
    selectedLLMs.includes("openai");
  const isLowBudget = budget < 100 && aiBudget < 50;
  const isEnterprise =
    totalMembers >= 10 ||
    selectedClouds.includes("aws") ||
    data.expectedUsage === "enterprise" ||
    operationsCount >= 3;

  return {
    teamName: data.teamName || "",
    roles,
    productCount,
    engineeringCount,
    devCount,
    designCount,
    dataCount,
    marketingCount,
    salesCount,
    csCount,
    operationsCount,
    opsCount,
    totalMembers,
    selectedTools,
    selectedClouds,
    budget,
    aiBudget,
    hasDevExperience,
    needsAI,
    isLowBudget,
    isEnterprise,
  };
}

function cloneTool(tool, reasonOverride) {
  return {
    name: tool.name,
    desc: tool.desc,
    price: tool.price,
    priceLabel: tool.priceLabel,
    reason: reasonOverride || tool.reason,
  };
}

function isAlreadyUsing(tool, selectedTools) {
  if (selectedTools.includes(tool.key)) return true;
  return selectedTools.some((k) => SELECTED_TOOL_KEYS[k] === tool.key);
}

function pickTool(tool, selectedTools, reasonOverride) {
  if (isAlreadyUsing(tool, selectedTools)) return null;
  return cloneTool(tool, reasonOverride);
}

function buildToolList(keys, profile, reasons = {}) {
  return keys
    .map((key) => {
      const tool = TOOL[key];
      if (!tool) return null;
      return pickTool(tool, profile.selectedTools, reasons[key]);
    })
    .filter(Boolean)
    .slice(0, 3);
}

// ─── 규칙 기반 스택 빌더 ────────────────────────────────────────────────────
function buildProductivityStack(profile, lang) {
  const en = lang === "en";
  const { isEnterprise, hasDevExperience, needsAI, isLowBudget } = profile;

  if (isEnterprise) {
    const keys = ["aws", "auth0"];
    keys.push(needsAI ? "openai" : hasDevExperience ? "nextjs" : "supabase");
    return buildToolList(keys, profile, en ? {
      aws: "Cloud infrastructure suited for 10+ person enterprise teams.",
      auth0: "Auth0 for enterprise SSO and security compliance.",
      nextjs: "Custom framework for teams with engineering capacity.",
      openai: "OpenAI API included for your AI use cases.",
      supabase: "Supabase for fast backend and database setup.",
    } : {
      aws: "10명 이상 팀·기업 환경에 맞는 클라우드 인프라입니다.",
      auth0: "기업용 SSO·보안 인증이 필요해 Auth0를 추천합니다.",
      nextjs: "개발팀이 있어 커스텀 확장이 가능한 프레임워크를 골랐습니다.",
      openai: "AI 활용 목적이 있어 OpenAI API를 스택에 포함했습니다.",
      supabase: "백엔드·DB를 빠르게 구축할 수 있는 Supabase를 추천합니다.",
    });
  }

  if (hasDevExperience) {
    const third = needsAI ? "openai" : isLowBudget ? "cloudflare" : "vercel";
    return buildToolList(["nextjs", "supabase", third], profile, en ? {
      nextjs: "Next.js full-stack for teams with dev experience.",
      supabase: "Unified auth, DB, and API with Supabase.",
      cloudflare: "Cloudflare free tier hosting for tight budgets.",
      vercel: "Vercel optimized for Next.js deployments.",
      openai: "OpenAI API added for AI features.",
    } : {
      nextjs: "개발 경험이 있어 Next.js 기반 풀스택을 추천합니다.",
      supabase: "인증·DB·API를 Supabase로 통합해 개발 속도를 높입니다.",
      cloudflare: "예산이 적어 Cloudflare 무료 플랜으로 호스팅합니다.",
      vercel: "Next.js 배포에 최적화된 Vercel을 호스팅으로 추천합니다.",
      openai: "AI 기능이 필요해 OpenAI API를 스택에 추가했습니다.",
    });
  }

  const third = needsAI ? "openai" : "cloudflare";
  return buildToolList(["lovable", "supabase", third], profile, en ? {
    lovable: "Lovable no-code builder for teams without dev experience.",
    supabase: "Connect data and auth via Supabase without a backend.",
    cloudflare: "Deploy instantly with Cloudflare's free plan.",
    openai: "OpenAI API added for AI features.",
  } : {
    lovable: "개발 경험이 없어 Lovable 노코드 빌더를 추천합니다.",
    supabase: "백엔드 없이도 Supabase로 데이터·인증을 바로 연결합니다.",
    cloudflare: "무료 플랜으로 즉시 배포할 수 있는 Cloudflare를 추천합니다.",
    openai: "AI 기능이 필요해 OpenAI API를 스택에 추가했습니다.",
  });
}

function buildCostStack(profile, lang) {
  const en = lang === "en";
  const { hasDevExperience, needsAI } = profile;
  const framework = hasDevExperience ? "nextjs" : "lovable";

  if (profile.isEnterprise) {
    return buildToolList(["cloudflare", "supabase", framework], profile, en ? {
      cloudflare: "Start free on Cloudflare vs. higher AWS initial costs.",
      supabase: "Faster and cheaper than Auth0 + RDS to get started.",
      nextjs: "Open-source framework with no license fees.",
      lovable: "No-code reduces development labor costs.",
    } : {
      cloudflare: "AWS 대비 초기 비용 없이 시작할 수 있는 Cloudflare 무료 플랜입니다.",
      supabase: "Auth0·RDS 대비 빠르고 저렴하게 시작할 수 있습니다.",
      nextjs: "오픈소스 프레임워크로 라이선스 비용이 없습니다.",
      lovable: "노코드로 개발 인건비를 절감할 수 있습니다.",
    });
  }

  const keys = ["cloudflare", "supabase", framework];
  if (needsAI) keys[2] = "openai";

  return buildToolList(keys, profile, en ? {
    cloudflare: "Cloudflare + Supabase free tiers for budget-conscious teams.",
    supabase: "Free tier covers DB and authentication.",
    nextjs: "Open-source — no framework licensing costs.",
    lovable: "Build without developers to save labor costs.",
    openai: "Pay only for AI usage with consumption-based pricing.",
  } : {
    cloudflare: "예산이 적어 Cloudflare + Supabase 무료 플랜을 우선 추천합니다.",
    supabase: "무료 티어로 DB·인증을 모두 커버할 수 있습니다.",
    nextjs: "오픈소스라 프레임워크 비용이 들지 않습니다.",
    lovable: "개발자 없이도 앱을 만들어 인건비를 절감합니다.",
    openai: "AI는 사용량 기반 과금으로 필요한 만큼만 씁니다.",
  });
}

function sumPrices(tools, members) {
  return tools.reduce((sum, t) => {
    if (t.price === 0) return sum;
    return sum + t.price * Math.max(members, 1);
  }, 0);
}

function buildCategories(profile, lang) {
  const en = lang === "en";
  const cats = [];

  const docTools = ["notion"].filter((k) => !profile.selectedTools.includes(k));
  cats.push({
    title: en ? "Documentation" : "문서 관리",
    tools: docTools.map((k) => TOOL[k].name).join(", ") || "Notion, Coda",
    color: "#4f8cff",
  });

  const commTools = ["slack"].filter((k) => !profile.selectedTools.includes(k));
  cats.push({
    title: en ? "Communication" : "커뮤니케이션",
    tools: commTools.map((k) => TOOL[k].name).join(", ") || "Slack, Discord",
    color: "#b84fff",
  });

  const pmTools = ["linear"].filter((k) => !profile.selectedTools.includes("trello"));
  cats.push({
    title: en ? "Project Management" : "프로젝트 관리",
    tools: pmTools.map((k) => TOOL[k].name).join(", ") || "Linear, Trello",
    color: "#4fc3a1",
  });

  const devTools = [];
  if (profile.devCount > 0) devTools.push("GitHub", "Vercel");
  if (profile.designCount > 0 && !profile.selectedTools.includes("figma")) devTools.push("Figma");
  cats.push({
    title: en ? "Dev & Design" : "개발·디자인",
    tools: devTools.join(", ") || "GitHub, Figma, Vercel",
    color: "#f59e0b",
  });

  return cats;
}

function buildTip(profile, lang) {
  const en = lang === "en";
  const parts = [];

  if (profile.isEnterprise) {
    parts.push(en
      ? "Secure and scale with AWS and Auth0 for enterprise-grade teams."
      : "기업 규모에 맞게 AWS와 Auth0로 보안·확장성을 확보하세요.");
  } else if (profile.hasDevExperience) {
    parts.push(en
      ? "Ship an MVP in 2 weeks with the Next.js + Supabase combo."
      : "Next.js + Supabase 조합으로 2주 안에 MVP를 출시할 수 있습니다.");
  } else {
    parts.push(en
      ? "Prototype with Lovable, then connect data via Supabase."
      : "Lovable로 프로토타입을 만든 뒤 Supabase에 데이터를 연결해 보세요.");
  }

  if (profile.needsAI) {
    parts.push(en
      ? "Set a monthly budget cap — OpenAI API bills by usage."
      : "OpenAI API는 사용량 기반 과금이므로 월 예산 한도를 설정해 두세요.");
  }

  if (profile.isLowBudget) {
    parts.push(en
      ? "Cloudflare and Supabase free tiers can run a small team."
      : "Cloudflare와 Supabase 무료 플랜만으로도 소규모 팀 운영이 가능합니다.");
  }

  if (profile.selectedTools.length > 0) {
    parts.push(en
      ? `Avoided overlap with your ${profile.selectedTools.length} existing tools.`
      : `이미 사용 중인 ${profile.selectedTools.length}개 툴과 겹치지 않게 골랐습니다.`);
  }

  return parts.join(" ");
}

function buildRecommendation(data) {
  const lang = data.lang === "ko" ? "ko" : "en";
  const profile = analyzeProfile(data);
  const prodTools = buildProductivityStack(profile, lang);
  const costTools = buildCostStack(profile, lang);

  const prodTotal = sumPrices(prodTools, profile.totalMembers);
  const costTotal = sumPrices(costTools, profile.totalMembers);
  const en = lang === "en";
  const savings = prodTotal > costTotal
    ? (en ? `Save ~$${prodTotal - costTotal}/mo` : `월 $${prodTotal - costTotal} 절감 가능`)
    : (en ? "Start with free tiers" : "무료 티어로 시작 가능");

  const greeting = profile.teamName
    ? (en
      ? `Your custom stack is ready, ${profile.teamName}!`
      : `${profile.teamName}님, 맞춤 스택 추천이 준비됐습니다!`)
    : (en ? "Your custom stack is ready!" : "맞춤 스택 추천이 준비됐습니다!");

  const roleParts = [
    profile.productCount > 0 && `Product/PM ${profile.productCount}${en ? "" : "명"}`,
    profile.engineeringCount > 0 && `Engineering ${profile.engineeringCount}${en ? "" : "명"}`,
    profile.designCount > 0 && `Design ${profile.designCount}${en ? "" : "명"}`,
    profile.dataCount > 0 && `Data & Analytics ${profile.dataCount}${en ? "" : "명"}`,
    profile.marketingCount > 0 && `Marketing & Growth ${profile.marketingCount}${en ? "" : "명"}`,
    profile.salesCount > 0 && `Sales ${profile.salesCount}${en ? "" : "명"}`,
    profile.csCount > 0 && `CS / Support ${profile.csCount}${en ? "" : "명"}`,
    profile.operationsCount > 0 && `Operations ${profile.operationsCount}${en ? "" : "명"}`,
  ].filter(Boolean);

  const stackType = profile.isEnterprise
    ? (en ? "enterprise" : "기업용")
    : profile.hasDevExperience
      ? (en ? "developer" : "개발자")
      : (en ? "no-code" : "노코드");

  const insight = en
    ? `Built a ${stackType} stack for your ${profile.totalMembers}-person team (${roleParts.join(", ")}).`
    : `${profile.totalMembers}명 팀(${roleParts.join(", ")})에 맞춰 ${stackType} 스택을 구성했습니다.`;

  return {
    greeting,
    insight,
    combos: [
      {
        type: "productivity",
        label: en ? "Productivity stack" : "생산성 최적화 조합",
        tag: en ? "Recommended" : "추천",
        tagColor: "#4f8cff",
        savings,
        tools: prodTools,
        totalPrice: prodTotal,
        totalLabel: en ? "est. $/mo" : "$/월 추정",
      },
      {
        type: "cost",
        label: en ? "Cost-efficient stack" : "비용 효율화 조합",
        tag: en ? "Savings" : "절약",
        tagColor: "#10b981",
        savings: profile.isLowBudget
          ? (en ? "Maximize free tiers" : "무료 티어 최대 활용")
          : savings,
        tools: costTools,
        totalPrice: costTotal,
        totalLabel: en ? "est. $/mo" : "$/월 추정",
      },
    ],
    categories: buildCategories(profile, lang),
    tip: buildTip(profile, lang),
    meta: {
      engine: "rule-based",
      rules: {
        hasDevExperience: profile.hasDevExperience,
        needsAI: profile.needsAI,
        isLowBudget: profile.isLowBudget,
        isEnterprise: profile.isEnterprise,
      },
    },
  };
}

// ─── KV 키 ──────────────────────────────────────────────────────────────────
function makeCacheKey(data) {
  const key = {
    roles: data.roles || {},
    tools: [...(data.selectedTools || [])].sort(),
    clouds: [...(data.selectedClouds || [])].sort(),
    llms: [...(data.selectedLLMs || [])].sort(),
    useCases: [...(data.useCases || [])].sort(),
    budget: data.monthlyBudget || "",
    aiBudget: data.monthlyAIBudget || "",
    hosting: [...(data.hostingType || [])].sort(),
    usage: data.expectedUsage || "",
    lang: data.lang === "ko" ? "ko" : "en",
  };
  return "rec:" + btoa(JSON.stringify(key)).replace(/[+/=]/g, "");
}

async function handleRecommend(request, env, ctx, origin) {
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ error: "요청 본문이 올바른 JSON이 아닙니다." }, 400, origin);
  }

  const totalMembers = Object.values(data.roles || {}).reduce(
    (s, n) => s + (parseInt(n) || 0),
    0
  );
  if (totalMembers < 1) {
    return jsonResponse(
      { error: "팀 구성 정보가 부족합니다. 직군별 인원을 1명 이상 입력해주세요." },
      400,
      origin
    );
  }

  if (!env.GOLEU_KV) {
    return jsonResponse({ error: "GOLEU_KV 바인딩이 설정되지 않았습니다." }, 500, origin);
  }

  const cacheKey = makeCacheKey(data);
  const cached = await env.GOLEU_KV.get(cacheKey);
  if (cached) {
    return jsonResponse(JSON.parse(cached), 200, origin, { "X-Cache": "HIT" });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const day = Math.floor(Date.now() / 86400000);
  const rlKey = `rl:${ip}:${day}`;
  const rlCount = parseInt(await env.GOLEU_KV.get(rlKey) || "0", 10);
  if (rlCount >= DAILY_RATE_LIMIT) {
    return jsonResponse(
      { error: "오늘 추천 한도(3회)를 초과했습니다. 내일 다시 시도해주세요." },
      429,
      origin
    );
  }

  const recommendation = buildRecommendation(data);

  ctx.waitUntil(
    Promise.all([
      env.GOLEU_KV.put(cacheKey, JSON.stringify(recommendation), {
        expirationTtl: CACHE_TTL_SEC,
      }),
      env.GOLEU_KV.put(rlKey, String(rlCount + 1), { expirationTtl: 86400 }),
    ])
  );

  return jsonResponse(recommendation, 200, origin, { "X-Cache": "MISS" });
}

async function handleSave(request, env, origin) {
  if (!env.GOLEU_KV) {
    return jsonResponse(
      { error: "저장 기능을 사용하려면 KV Namespace를 먼저 설정해야 합니다." },
      503,
      origin
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "잘못된 요청입니다." }, 400, origin);
  }
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const record = {
    id,
    createdAt: new Date().toISOString(),
    inputs: {
      teamName: body.teamName || "",
      roles: body.roles || {},
      selectedTools: body.selectedTools || [],
      selectedClouds: body.selectedClouds || [],
      hostingType: body.hostingType || [],
      monthlyBudget: body.monthlyBudget || "",
      selectedLLMs: body.selectedLLMs || [],
      useCases: body.useCases || [],
      monthlyAIBudget: body.monthlyAIBudget || "",
      expectedUsage: body.expectedUsage || "",
    },
    recommendation: body.recommendation || {},
  };
  await env.GOLEU_KV.put(`result:${id}`, JSON.stringify(record), { expirationTtl: SAVE_TTL_SEC });
  return jsonResponse({ id, url: `/result/${id}` }, 200, origin);
}

async function handleGetResult(env, origin, path) {
  if (!env.GOLEU_KV) {
    return jsonResponse({ error: "저장 기능 미설정" }, 503, origin);
  }
  const id = path.replace("/result/", "").trim();
  if (!id || id.length > 32) {
    return jsonResponse({ error: "잘못된 ID입니다." }, 400, origin);
  }
  const raw = await env.GOLEU_KV.get(`result:${id}`);
  if (!raw) {
    return jsonResponse({ error: "결과를 찾을 수 없거나 만료되었습니다." }, 404, origin);
  }
  return jsonResponse(JSON.parse(raw), 200, origin);
}

async function handleDetail(request, env, ctx, origin) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "잘못된 요청 형식입니다." }, 400, origin);
  }
  if (!body.tool?.name) {
    return jsonResponse({ error: "tool.name이 필요합니다." }, 400, origin);
  }

  const toolKey = normalizeToolKey(body.tool.name);
  const totalMembers = getTotalMembers(body.teamInfo || {});
  const detailCacheKey = `detail:${toolKey}:${totalMembers}`;

  if (env.GOLEU_KV) {
    const cached = await env.GOLEU_KV.get(detailCacheKey);
    if (cached) {
      return jsonResponse(JSON.parse(cached), 200, origin, { "X-Cache": "HIT" });
    }
  }

  const detail = buildDetailFromDatabase(body.tool, body.teamInfo || {});

  if (env.GOLEU_KV) {
    ctx.waitUntil(
      env.GOLEU_KV.put(detailCacheKey, JSON.stringify(detail), { expirationTtl: CACHE_TTL_SEC })
    );
  }
  return jsonResponse(detail, 200, origin, { "X-Cache": "MISS" });
}

// ─── 출시 알림 대기자 (/waitlist) ───────────────────────────────────────────
// 유료 기능 수요 테스트용. 이메일 1개당 KV 키 1개(waitlist:<email>), 같은 이메일은 덮어쓴다.
// 조회: wrangler kv key list --binding GOLEU_KV --prefix waitlist: --remote
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const WAITLIST_INTERESTS = new Set(["price_alert", "team_report"]);
async function handleWaitlist(request, env, origin) {
  if (!env.GOLEU_KV) return jsonResponse({ error: "unavailable" }, 503, origin);
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: "bad_json" }, 400, origin); }
  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return jsonResponse({ error: "invalid_email" }, 400, origin);
  if (body.consent !== true) return jsonResponse({ error: "consent_required" }, 400, origin);
  const interests = (Array.isArray(body.interests) ? body.interests : []).filter((i) => WAITLIST_INTERESTS.has(i));
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rlKey = `rl:waitlist:${ip}:${new Date().toISOString().slice(0, 10)}`;
  const count = parseInt((await env.GOLEU_KV.get(rlKey)) || "0", 10);
  if (count >= 10) return jsonResponse({ error: "rate_limited" }, 429, origin);
  await Promise.all([
    env.GOLEU_KV.put(`waitlist:${email}`, JSON.stringify({
      createdAt: new Date().toISOString(),
      interests,
      lang: body.lang === "en" ? "en" : "ko",
      from: String(body.from || "").slice(0, 40),
    })),
    env.GOLEU_KV.put(rlKey, String(count + 1), { expirationTtl: 86400 }),
  ]);
  return jsonResponse({ ok: true }, 200, origin);
}

// ─── 메인 핸들러 ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "");

    if (path === "/recommend" && request.method === "POST") {
      return await handleRecommend(request, env, ctx, origin);
    }

    if (path === "/save" && request.method === "POST") {
      return await handleSave(request, env, origin);
    }

    if (path.startsWith("/result/") && request.method === "GET") {
      return await handleGetResult(env, origin, path);
    }

    if (path === "/detail" && request.method === "POST") {
      return await handleDetail(request, env, ctx, origin);
    }

    // AI 빌더 스택 추천 (규칙 기반, 외부 API 없음)
    if (path === "/ai-stack" && request.method === "POST") {
      let body = {};
      try { body = await request.json(); } catch { return jsonResponse({ error: "bad_json" }, 400, origin); }
      return jsonResponse(recommendAiStack(body), 200, origin);
    }

    if (path === "/waitlist" && request.method === "POST") {
      return await handleWaitlist(request, env, origin);
    }

    return jsonResponse({ error: "Not found" }, 404, origin);
  },
};
