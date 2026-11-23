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

// --- 이벤트 발송 ---
export function trackEvent(name, params = {}) {
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
});
