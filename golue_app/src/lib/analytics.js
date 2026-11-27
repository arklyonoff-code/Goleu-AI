// src/lib/analytics.js
// Goleu — Google Analytics 4 wrapper
// - PIPA 동의 게이트
// - 세션/사용자 익명 ID 발급 (UUID v4, localStorage)
// - gtag.js 스크립트는 동의 후 동적 로드 (consent before tracking)
// - 표준 이벤트 이름은 Events 상수 사용 (오타·드리프트 방지)

const STORAGE_KEY_USER_ID = "goleu_user_id";
const STORAGE_KEY_SESSION_ID = "goleu_session_id";
const STORAGE_KEY_SESSION_EXPIRES = "goleu_session_expires";
const STORAGE_KEY_CONSENT = "goleu_consent";
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30분 비활성 시 새 세션

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// --- UUID v4 ---
function uuidv4() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // RFC4122 폴백
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

// --- 동의 관리 ---
export function hasConsent() {
  return safeGet(STORAGE_KEY_CONSENT) === "granted";
}

export function consentDecided() {
  const v = safeGet(STORAGE_KEY_CONSENT);
  return v === "granted" || v === "denied";
}

export function setConsent(granted) {
  safeSet(STORAGE_KEY_CONSENT, granted ? "granted" : "denied");
  if (granted) initAnalytics();
}

// --- 익명 ID ---
export function getUserId() {
  let id = safeGet(STORAGE_KEY_USER_ID);
  if (!id) {
    id = uuidv4();
    safeSet(STORAGE_KEY_USER_ID, id);
  }
  return id;
}

export function getSessionId() {
  const now = Date.now();
  const expires = parseInt(safeGet(STORAGE_KEY_SESSION_EXPIRES) || "0", 10);
  let sid = safeGet(STORAGE_KEY_SESSION_ID);
  if (!sid || now > expires) {
    sid = uuidv4();
    safeSet(STORAGE_KEY_SESSION_ID, sid);
  }
  // sliding expiration
  safeSet(STORAGE_KEY_SESSION_EXPIRES, String(now + SESSION_DURATION_MS));
  return sid;
}

// --- GA4 초기화 ---
let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (!GA_MEASUREMENT_ID) {
    if (import.meta.env.DEV) {
      console.warn(
        "[analytics] VITE_GA_MEASUREMENT_ID 가 설정되어 있지 않아 analytics 가 비활성화됩니다. .env.local 을 확인하세요."
      );
    }
    return;
  }
  if (!hasConsent()) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());

  const userId = getUserId();
  gtag("config", GA_MEASUREMENT_ID, {
    user_id: userId || undefined,
    send_page_view: false, // 라우터에서 직접 보냄
    anonymize_ip: true,
  });

  // gtag.js 동적 로드 (1회만)
  if (!document.querySelector(`script[data-ga4="${GA_MEASUREMENT_ID}"]`)) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    s.setAttribute("data-ga4", GA_MEASUREMENT_ID);
    document.head.appendChild(s);
  }

  initialized = true;
}

// --- 익명 집계 카운터 (쿠키·식별자 없음, 동의와 무관) ---
// GA4 는 동의한 사람만 집계해 퍼널이 거의 비어 있다. 핵심 이벤트만 "날짜 × 이벤트 × 유입 채널" 횟수로 Worker 에 보낸다.
// 개인을 구분하는 값(ID, IP, 쿠키)은 보내지 않는다. 같은 세션의 같은 이벤트는 한 번만 센다(KV 무료 쓰기 한도 보호).
const COUNTER_EVENTS = new Set([
  "visit", "llm_cost_preset", "llm_cost_advanced_open", "llm_cost_copy_link", "llm_cost_shared_open",
  "funnel_to_goleu", "ai_stack_recommended", "affiliate_click", "waitlist_submit",
]);
const COUNTER_URL = (import.meta.env.VITE_WORKER_URL || "").trim().replace(/\/$/, "");

function sessionGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
function sessionSet(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } }

// 첫 진입 시 유입 채널을 정해 세션 동안 유지 (utm_source 우선, 없으면 referrer 도메인)
function trafficSource() {
  const saved = sessionGet("goleu_src");
  if (saved) return saved;
  let src = "direct";
  try {
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    const ref = document.referrer ? new URL(document.referrer).hostname : "";
    const raw = (utm || ref || "").toLowerCase();
    if (!raw || raw.endsWith(window.location.hostname)) src = utm ? utm.toLowerCase() : "direct";
    else if (raw.includes("reddit")) src = "reddit";
    else if (raw.includes("threads")) src = "threads";
    else if (raw.includes("linkedin") || raw === "lnkd.in") src = "linkedin";
    else if (raw.includes("google")) src = "google";
    else if (raw.includes("chatgpt") || raw.includes("openai") || raw.includes("perplexity") || raw.includes("claude")) src = "ai_search";
    else src = "other";
  } catch { /* ignore */ }
  sessionSet("goleu_src", src);
  return src;
}

export function countEvent(name) {
  if (typeof window === "undefined" || !COUNTER_URL || !COUNTER_EVENTS.has(name)) return;
  if (import.meta.env.DEV) return;
  const key = `goleu_ev_${name}`;
  if (sessionGet(key)) return;
  sessionSet(key, "1");
  const body = JSON.stringify({ n: name, s: trafficSource() });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon(`${COUNTER_URL}/e`, new Blob([body], { type: "text/plain" }));
    else fetch(`${COUNTER_URL}/e`, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } });
  } catch { /* 집계 실패는 무시 */ }
}

// --- 이벤트 발송 ---
export function trackEvent(name, params = {}) {
  countEvent(name);
  if (!hasConsent()) return;
  if (!initialized) initAnalytics();
  if (typeof window.gtag !== "function") return;

  const sessionId = getSessionId();
  const userId = getUserId();

  window.gtag("event", name, {
    ...params,
    session_id: sessionId,
    user_pseudo_id: userId,
  });

  if (import.meta.env.DEV) {
    // 개발 환경 디버그용
    // eslint-disable-next-line no-console
    console.log("[analytics] event:", name, params);
  }
}

export function trackPageView(path, title) {
  trackEvent("page_view", {
    page_path: path,
    page_title: title || (typeof document !== "undefined" ? document.title : ""),
    page_location:
      typeof window !== "undefined" ? window.location.origin + path : path,
  });
}

// --- 표준 이벤트 이름 ---
export const Events = Object.freeze({
  QUIZ_STARTED: "quiz_started",
  QUIZ_STEP_COMPLETED: "quiz_step_completed",
  QUIZ_COMPLETED: "quiz_completed",
  RECOMMENDATION_VIEWED: "recommendation_viewed",
  RECOMMENDATION_CLICKED: "recommendation_clicked",
  SIMULATION_CLICKED: "simulation_clicked",
  PRO_UPGRADE_CLICKED: "pro_upgrade_clicked",
  CATEGORY_CARD_CLICKED: "category_card_clicked",
  TOOL_SELECTED: "tool_selected",
  TOOL_DESELECTED: "tool_deselected",
  FAQ_OPENED: "faq_opened",
});
