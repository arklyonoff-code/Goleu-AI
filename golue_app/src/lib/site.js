// 정식 도메인 (golue_app/.env 의 VITE_SITE_URL)
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://goleu.vercel.app").replace(/\/$/, "");
