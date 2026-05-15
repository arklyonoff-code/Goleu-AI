// GitHub Pages 같은 정적 호스팅은 SPA fallback(any path → index.html)을 기본 지원하지 않으므로
// 새로고침 시 404 가 나는 BrowserRouter 대신 HashRouter 를 사용. URL 은 /#/tools 형태가 됨.
// 커스텀 도메인 + SPA fallback 구성이 가능한 호스팅으로 옮길 때만 BrowserRouter 로 되돌리면 됨.
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import ToolfitMain from "./ToolfitMain";
import ToolSelect from "./ToolSelect";
import ToolfitResult from "./ToolfitResult";
import CloudSelect from "./CloudSelect";
import LLMSelect from "./LLMSelect";
import CookieConsent from "./components/CookieConsent";
import { trackPageView } from "./lib/analytics";

/** 라우트 변경 시 GA4 page_view 전송 */
function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}

function App() {
  const [teamName, setTeamName] = useState("");
  const [roles, setRoles] = useState({ design: 0, dev: 0, marketing: 0, ops: 0 });
  const [selectedTools, setSelectedTools] = useState([]);
  const [email, setEmail] = useState("");
  const [selectedClouds, setSelectedClouds] = useState([]);
  const [selectedLLMs, setSelectedLLMs] = useState([]);
  const [hostingType, setHostingType] = useState([]);
  const [useCases, setUseCases] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [monthlyAIBudget, setMonthlyAIBudget] = useState("");
  const [expectedUsage, setExpectedUsage] = useState("");

  return (
    <Router>
      <RouteTracker />
      <Routes>
        <Route path="/" element={
          <ToolfitMain
            teamName={teamName}
            setTeamName={setTeamName}
            roles={roles}
            setRoles={setRoles}
          />
        } />
        <Route path="/tools" element={
          <ToolSelect
            selectedTools={selectedTools}
            setSelectedTools={setSelectedTools}
            email={email}
            setEmail={setEmail}
            teamName={teamName}
            roles={roles}
          />
        } />
        <Route path="/cloud" element={
          <CloudSelect
            selectedClouds={selectedClouds}
            setSelectedClouds={setSelectedClouds}
            hostingType={hostingType}
            setHostingType={setHostingType}
            monthlyBudget={monthlyBudget}
            setMonthlyBudget={setMonthlyBudget}
            teamName={teamName}
            roles={roles}
            selectedTools={selectedTools}
          />
        } />
        <Route path="/llm" element={
          <LLMSelect
            selectedLLMs={selectedLLMs}
            setSelectedLLMs={setSelectedLLMs}
            useCases={useCases}
            setUseCases={setUseCases}
            monthlyAIBudget={monthlyAIBudget}
            setMonthlyAIBudget={setMonthlyAIBudget}
            expectedUsage={expectedUsage}
            setExpectedUsage={setExpectedUsage}
            teamName={teamName}
            roles={roles}
            selectedTools={selectedTools}
            selectedClouds={selectedClouds}
          />
        } />
        <Route path="/recommend" element={
          <ToolfitResult
            teamName={teamName}
            roles={roles}
            selectedTools={selectedTools}
            email={email}
            selectedClouds={selectedClouds}
            hostingType={hostingType}
            monthlyBudget={monthlyBudget}
            selectedLLMs={selectedLLMs}
            useCases={useCases}
            monthlyAIBudget={monthlyAIBudget}
            expectedUsage={expectedUsage}
          />
        } />
      </Routes>
      <CookieConsent />
    </Router>
  );
}

export default App;
