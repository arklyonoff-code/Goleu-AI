/**
 * Toolfit AI — Cloudflare Worker
 * Claude API를 호출해 팀 맞춤 툴 스택 추천을 생성합니다.
 *
 * 환경변수 (Cloudflare Dashboard > Worker > Settings > Variables):
 *   ANTHROPIC_API_KEY  — Anthropic API 키 (Secret)
 *
 * KV 바인딩 (선택, 캐싱용):
 *   TOOLFIT_KV  — Cloudflare KV namespace
 *
 * 가격 데이터 최신화: 2026-05-23
 */

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-haiku-4-5-20251001"; // 빠르고 저렴 (추천 품질 충분)
const CACHE_TTL_SEC = 60 * 60 * 24; // 24시간 KV 캐시

// ─── CORS ───────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json", ...extra },
  });
}

// ─── 프롬프트 빌더 ──────────────────────────────────────────────────────────
function buildPrompt(data) {
  const {
    teamName,
    roles = {},
    selectedTools = [],
    selectedClouds = [],
    selectedLLMs = [],
    hostingType = [],
    monthlyBudget = "",
    monthlyAIBudget = "",
    useCases = [],
    expectedUsage = "",
  } = data;

  const totalMembers = Object.values(roles).reduce(
    (s, n) => s + (parseInt(n) || 0),
    0
  );

  const roleDesc = [
    roles.dev > 0 && `개발자 ${roles.dev}명`,
    roles.design > 0 && `디자이너 ${roles.design}명`,
    roles.marketing > 0 && `마케팅 ${roles.marketing}명`,
    roles.ops > 0 && `운영/관리 ${roles.ops}명`,
  ]
    .filter(Boolean)
    .join(", ");

  return `당신은 스타트업·팀을 위한 SaaS 툴 스택 전문 컨설턴트입니다.
아래 팀 정보를 분석해 최적의 디지털 툴 스택 추천을 JSON으로 생성하세요.

## 2026년 주요 SaaS 가격 참고 (연간 결제 기준, 인당/월, USD)
### 협업·문서
- Notion Free: $0 | Plus: $10 | Business: $18 (AI 포함)
- Coda Free: $0 | Pro: $10 | Team: $30
- Confluence Free: $0 | Standard: $5.75 | Premium: $11

### 커뮤니케이션
- Slack Free: $0 | Pro: $7.25 | Business+: $15
- Discord Free: $0 | Nitro: $9.99/월 (개인, 팀은 무료)
- Microsoft Teams Free: $0 | Essentials: $4 | Business Basic: $6

### 프로젝트·이슈 관리
- Linear Free: $0 | Standard: $10 | Plus: $16
- Asana Personal: $0 | Starter: $10.99 | Advanced: $24.99
- Trello Free: $0 | Standard: $5 | Premium: $10
- Monday.com Basic: $9 | Standard: $12 | Pro: $19
- Jira Free: $0 | Standard: $8.15 | Premium: $16

### 개발·배포
- GitHub Free: $0 | Team: $4 | Enterprise: $21
- Vercel Hobby: $0 | Pro: $20/개발자
- GitLab Free: $0 | Premium: $29 | Ultimate: $99

### 디자인
- Figma Starter: $0 | Professional: $15/에디터 | Organization: $45/에디터
- Zeplin Free: $0 | Team: $8 | Organization: $16

### 영상·비동기 소통
- Loom Starter: $0 | Business: $15 | Business+AI: $20
- Claap Free: $0 | Pro: $10 | Business: $25

### CRM·마케팅
- HubSpot CRM Free: $0 | Starter: $15 | Professional: $800/월(팀)
- Mailchimp Free: $0 | Essentials: $13 | Standard: $20

### AI 서비스 (팀/API 기준)
- OpenAI ChatGPT Team: $25/인당 | API: 사용량 기반
- Anthropic Claude Team: $30/인당 | API: 사용량 기반
- Google Gemini for Workspace: $20/인당 추가

## 팀 정보
- 팀 이름: ${teamName || "미입력"}
- 총 인원: ${totalMembers}명 (${roleDesc || "구성 미입력"})
- 현재 사용 툴: ${selectedTools.length ? selectedTools.join(", ") : "없음"}
- 사용 클라우드: ${selectedClouds.length ? selectedClouds.join(", ") : "미선택"}
- 호스팅 타입: ${hostingType.length ? hostingType.join(", ") : "미선택"}
- 월 예산: ${monthlyBudget || "미입력"}
- 선택 AI 서비스: ${selectedLLMs.length ? selectedLLMs.join(", ") : "미선택"}
- AI 활용 목적: ${useCases.length ? useCases.join(", ") : "미입력"}
- AI 예산: ${monthlyAIBudget || "미입력"}
- 예상 AI 사용량: ${expectedUsage || "미입력"}

## 규칙
- 현재 사용 중인 툴과 겹치지 않는 새 툴을 우선 추천
- 팀 예산에 맞는 현실적인 가격 (무료 ~ 합리적 유료)
- 직군 구성에 맞는 툴: 개발자 많으면 GitHub·Linear·Vercel, 디자이너 많으면 Figma·Zeplin, 마케팅이면 HubSpot·Notion 등
- combo당 툴은 정확히 3개
- 모든 텍스트는 한국어

## 응답 형식 (순수 JSON, 마크다운 코드블록 없이)
{
  "greeting": "팀명을 활용한 친근한 환영 메시지 (1문장)",
  "insight": "팀 구성 분석 인사이트 (1문장, 숫자 포함)",
  "combos": [
    {
      "type": "productivity",
      "label": "생산성 최적화 조합",
      "tag": "추천",
      "tagColor": "#4f8cff",
      "savings": "예상 절감액 (예: 월 $200 절감)",
      "tools": [
        {
          "name": "툴 이름",
          "desc": "한 줄 역할 설명",
          "price": 숫자,
          "priceLabel": "예: $8/인당",
          "reason": "이 팀에 특히 유용한 이유 (1문장)"
        }
      ],
      "totalPrice": 팀 전체 월 예상 비용(숫자),
      "totalLabel": "$/월 추정"
    },
    {
      "type": "cost",
      "label": "비용 효율화 조합",
      "tag": "절약",
      "tagColor": "#10b981",
      "savings": "예상 절감액",
      "tools": [...],
      "totalPrice": 숫자,
      "totalLabel": "$/월 추정"
    }
  ],
  "categories": [
    { "title": "문서 관리", "tools": "Notion, Coda, Confluence", "color": "#4f8cff" },
    { "title": "커뮤니케이션", "tools": "Slack, Discord, Teams", "color": "#b84fff" },
    { "title": "프로젝트 관리", "tools": "Linear, Asana, Trello", "color": "#4fc3a1" },
    { "title": "개발·디자인", "tools": "GitHub, Figma, Vercel", "color": "#f59e0b" }
  ],
  "tip": "이 팀만을 위한 구체적인 팁 (2~3문장)"
}`;
}

// ─── 캐시 키 생성 ────────────────────────────────────────────────────────────
function makeCacheKey(data) {
  // 팀명은 제외 (같은 구성이면 동일 추천)
  const key = {
    roles: data.roles || {},
    tools: [...(data.selectedTools || [])].sort(),
    clouds: [...(data.selectedClouds || [])].sort(),
    llms: [...(data.selectedLLMs || [])].sort(),
    budget: data.monthlyBudget || "",
    hosting: [...(data.hostingType || [])].sort(),
  };
  return "rec:" + btoa(JSON.stringify(key)).replace(/[+/=]/g, "");
}

// ─── 메인 핸들러 ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "POST 요청만 허용됩니다." }, 405);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return jsonResponse({ error: "요청 본문이 올바른 JSON이 아닙니다." }, 400);
    }

    // ── KV 캐시 확인 ─────────────────────────────────────────────────────────
    const cacheKey = makeCacheKey(data);
    if (env.TOOLFIT_KV) {
      const cached = await env.TOOLFIT_KV.get(cacheKey);
      if (cached) {
        return jsonResponse(JSON.parse(cached), 200, { "X-Cache": "HIT" });
      }
    }

    // ── Claude API 호출 ──────────────────────────────────────────────────────
    if (!env.ANTHROPIC_API_KEY) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." }, 500);
    }

    let claudeRes;
    try {
      claudeRes = await fetch(CLAUDE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 2048,
          messages: [{ role: "user", content: buildPrompt(data) }],
        }),
      });
    } catch (err) {
      return jsonResponse({ error: "Claude API 네트워크 오류: " + err.message }, 502);
    }

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return jsonResponse(
        { error: `Claude API 오류 (${claudeRes.status}): ${errText}` },
        502
      );
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text || "";

    // ── JSON 파싱 (코드블록 감싸진 경우 대응) ──────────────────────────────
    let recommendation;
    try {
      // ```json ... ``` 형식 제거 후 파싱
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      recommendation = JSON.parse(cleaned);
    } catch {
      // 중괄호 기준으로 JSON 영역 추출 시도
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          recommendation = JSON.parse(match[0]);
        } catch {
          return jsonResponse({ error: "Claude 응답 파싱 실패", raw: rawText }, 500);
        }
      } else {
        return jsonResponse({ error: "Claude 응답에서 JSON을 찾을 수 없음", raw: rawText }, 500);
      }
    }

    // ── KV 캐싱 (비동기, 응답 블로킹 없음) ──────────────────────────────────
    if (env.TOOLFIT_KV) {
      ctx.waitUntil(
        env.TOOLFIT_KV.put(cacheKey, JSON.stringify(recommendation), {
          expirationTtl: CACHE_TTL_SEC,
        })
      );
    }

    return jsonResponse(recommendation, 200, { "X-Cache": "MISS" });
  },
};
