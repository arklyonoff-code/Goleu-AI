/**
 * Goleu — 로컬 세션 저장소
 * 마지막 추천 결과와 팀 정보를 localStorage에 저장/불러옵니다.
 * (로그인 없이 브라우저 세션 내 마이페이지 지원)
 */

const KEY = "goleu_last_session";

/**
 * 퀴즈 입력값 + Claude 추천 결과를 저장
 */
export function saveSession({ inputs, recommendation }) {
  try {
    const data = {
      savedAt: new Date().toISOString(),
      inputs,          // teamName, roles, selectedTools, selectedClouds, ...
      recommendation,  // greeting, insight, combos, categories, tip
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // localStorage 비활성화 환경 무시
  }
}

/**
 * 저장된 세션 불러오기. 없으면 null 반환.
 */
export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 세션 삭제
 */
export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/**
 * 저장된 세션이 있는지 여부
 */
export function hasSession() {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}
