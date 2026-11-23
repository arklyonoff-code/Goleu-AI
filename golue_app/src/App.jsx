import { Outlet, useLocation } from "react-router-dom";
import { StrictMode, useEffect, useState } from "react";
import { ConfigProvider } from "antd";
import CookieConsent from "./components/CookieConsent";
import { trackPageView } from "./lib/analytics";
import { LanguageProvider } from "./lib/LanguageContext";

/** 라우트 변경 시 GA4 page_view 전송 */
function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}

/** 루트 레이아웃: 공통 상태·Provider·RouteTracker·CookieConsent */
function App() {
  const [teamName, setTeamName] = useState("");
  const [roles, setRoles] = useState({
    product: 0,
    engineering: 0,
    design: 0,
    data: 0,
    marketing: 0,
    sales: 0,
    cs: 0,
    operations: 0,
  });
  const [selectedTools, setSelectedTools] = useState([]);
  const [selectedClouds, setSelectedClouds] = useState([]);
  const [selectedLLMs, setSelectedLLMs] = useState([]);
  const [hostingType, setHostingType] = useState([]);
  const [useCases, setUseCases] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [monthlyAIBudget, setMonthlyAIBudget] = useState("");
  const [expectedUsage, setExpectedUsage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("goleu_theme");
      document.documentElement.dataset.theme = saved || "light";
    } catch {
      document.documentElement.dataset.theme = "light";
    }
  }, []);

  // ── Ant Design 전체 디자인 토큰 ─────────────────────────────────────────
  const theme = {
    token: {
      colorPrimary:       "#6366f1",   // indigo-500
      colorPrimaryHover:  "#4f46e5",   // indigo-600
      colorPrimaryActive: "#4338ca",   // indigo-700
      borderRadius:       8,           // 모든 컴포넌트 기본 radius
      borderRadiusLG:     12,
      borderRadiusSM:     6,
      fontFamily:         "'Pretendard', -apple-system, sans-serif",
      fontWeightStrong:   600,
      colorBgContainer:   "#ffffff",
      colorBgLayout:      "#f7f8fa",
      colorBorder:        "#e5e7eb",
      colorText:          "#1f2937",
      colorTextSecondary: "#6b7280",
      colorLink:          "#6366f1",
      colorLinkHover:     "#4f46e5",
      motionDurationMid:  "0.15s",
    },
    components: {
      Button: {
        fontWeight:          600,
        primaryShadow:       "0 1px 4px rgba(99,102,241,0.20)",
        defaultBorderColor:  "#e5e7eb",
        defaultColor:        "#374151",
        paddingInline:       16,
        controlHeight:       36,
        controlHeightLG:     44,
        controlHeightSM:     28,
      },
      Input: {
        borderRadius: 8,
        colorBorder:  "#e5e7eb",
      },
      Select: {
        borderRadius: 8,
      },
      Card: {
        borderRadius: 12,
      },
      Tag: {
        borderRadius: 20,
        fontWeight:   600,
      },
    },
  };

  // 퀴즈 흐름 상태 → 각 페이지에 useOutletContext 로 전달 (routes.jsx)
  const quiz = {
    teamName, setTeamName,
    roles, setRoles,
    selectedTools, setSelectedTools,
    selectedClouds, setSelectedClouds,
    selectedLLMs, setSelectedLLMs,
    hostingType, setHostingType,
    useCases, setUseCases,
    monthlyBudget, setMonthlyBudget,
    monthlyAIBudget, setMonthlyAIBudget,
    expectedUsage, setExpectedUsage,
  };

  return (
    <StrictMode>
    <LanguageProvider>
    <ConfigProvider theme={theme}>
      <RouteTracker />
      <Outlet context={quiz} />
      <CookieConsent />
    </ConfigProvider>
    </LanguageProvider>
    </StrictMode>
  );
}

export default App;
