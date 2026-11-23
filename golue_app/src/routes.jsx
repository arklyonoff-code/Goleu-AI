// 라우트 정의 (vite-react-ssg 데이터 라우트)
// - 프리렌더 대상: PRERENDER_PATHS (vite.config.js 의 목록과 동일하게 유지)
// - 나머지 흐름 페이지는 클라이언트 전용 셸(app.html)에서 렌더 → vercel.json 참고
import App from "./App";
import Landing from "./Landing";
import {
  QuizRoute,
  ToolsRoute,
  CloudRoute,
  LLMRoute,
  RecommendRoute,
  SavedResultRoute,
  MyPageRoute,
  PrivacyRoute,
  TermsRoute,
  BuildRoute,
  LlmCostRoute,
} from "./RouteElements";

export const PRERENDER_PATHS = ["/", "/build", "/llm-cost", "/privacy", "/terms"];

export const routes = [
  {
    path: "/",
    element: <App />,
    entry: "src/App.jsx",
    children: [
      { index: true, element: <Landing /> },
      { path: "quiz", element: <QuizRoute /> },
      { path: "tools", element: <ToolsRoute /> },
      { path: "cloud", element: <CloudRoute /> },
      { path: "llm", element: <LLMRoute /> },
      { path: "recommend", element: <RecommendRoute /> },
      { path: "result/:id", element: <SavedResultRoute /> },
      { path: "mypage", element: <MyPageRoute /> },
      { path: "build", element: <BuildRoute /> },
      { path: "llm-cost", element: <LlmCostRoute /> },
      { path: "privacy", element: <PrivacyRoute /> },
      { path: "terms", element: <TermsRoute /> },
    ],
  },
];
