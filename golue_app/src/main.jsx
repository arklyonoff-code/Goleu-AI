// src/main.jsx — vite-react-ssg 엔트리 (빌드 시 "/", "/privacy", "/terms" 프리렌더)
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes.jsx";
import "./index.css";
import "./styles/buttons.css";
import "./styles/responsive.css";
import { hasConsent, initAnalytics } from "./lib/analytics";

export const createRoot = ViteReactSSG({ routes }, ({ isClient }) => {
  // 브라우저에서만: 이전 방문에 동의(granted)했다면 즉시 GA4 초기화
  if (isClient && hasConsent()) {
    initAnalytics();
  }
});
