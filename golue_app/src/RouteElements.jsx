// 라우트별 요소: 루트 레이아웃(App.jsx)의 <Outlet context>에서 퀴즈 상태를 받아
// 기존 페이지 컴포넌트에 같은 props 로 전달하고, 라우트별 <head>(Seo)를 지정한다.
import { useOutletContext } from "react-router-dom";
import GoleuMain from "./GoleuMain";
import ToolSelect from "./ToolSelect";
import GoleuResult from "./GoleuResult";
import SavedResult from "./SavedResult";
import CloudSelect from "./CloudSelect";
import LLMSelect from "./LLMSelect";
import MyPage from "./MyPage";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import Seo from "./components/Seo";

/** 흐름 페이지: noindex + 기본 제목 */
function FlowSeo({ title }) {
  return <Seo title={`${title} — Goleu AI`} noindex />;
}

export function QuizRoute() {
  const q = useOutletContext();
  return (
    <>
      <FlowSeo title="Team setup" />
      <GoleuMain
        teamName={q.teamName}
        setTeamName={q.setTeamName}
        roles={q.roles}
        setRoles={q.setRoles}
      />
    </>
  );
}

export function ToolsRoute() {
  const q = useOutletContext();
  return (
    <>
      <FlowSeo title="Current tools" />
      <ToolSelect
        selectedTools={q.selectedTools}
        setSelectedTools={q.setSelectedTools}
        roles={q.roles}
      />
    </>
  );
}

export function CloudRoute() {
  const q = useOutletContext();
  return (
    <>
      <FlowSeo title="Cloud & infrastructure" />
      <CloudSelect
        selectedClouds={q.selectedClouds}
        setSelectedClouds={q.setSelectedClouds}
        hostingType={q.hostingType}
        setHostingType={q.setHostingType}
        monthlyBudget={q.monthlyBudget}
        setMonthlyBudget={q.setMonthlyBudget}
        teamName={q.teamName}
        roles={q.roles}
        selectedTools={q.selectedTools}
      />
    </>
  );
}

export function LLMRoute() {
  const q = useOutletContext();
  return (
    <>
      <FlowSeo title="AI services" />
      <LLMSelect
        selectedLLMs={q.selectedLLMs}
        setSelectedLLMs={q.setSelectedLLMs}
        useCases={q.useCases}
        setUseCases={q.setUseCases}
        monthlyAIBudget={q.monthlyAIBudget}
        setMonthlyAIBudget={q.setMonthlyAIBudget}
        expectedUsage={q.expectedUsage}
        setExpectedUsage={q.setExpectedUsage}
        teamName={q.teamName}
        roles={q.roles}
        selectedTools={q.selectedTools}
        selectedClouds={q.selectedClouds}
      />
    </>
  );
}

export function RecommendRoute() {
  const q = useOutletContext();
  return (
    <>
      <FlowSeo title="Your SaaS stack" />
      <GoleuResult
        teamName={q.teamName}
        roles={q.roles}
        selectedTools={q.selectedTools}
        selectedClouds={q.selectedClouds}
        hostingType={q.hostingType}
        monthlyBudget={q.monthlyBudget}
        selectedLLMs={q.selectedLLMs}
        useCases={q.useCases}
        monthlyAIBudget={q.monthlyAIBudget}
        expectedUsage={q.expectedUsage}
      />
    </>
  );
}

export function SavedResultRoute() {
  return (
    <>
      <FlowSeo title="Saved result" />
      <SavedResult />
    </>
  );
}

export function MyPageRoute() {
  return (
    <>
      <FlowSeo title="My Page" />
      <MyPage />
    </>
  );
}

export function PrivacyRoute() {
  return (
    <>
      <Seo
        title="Privacy Policy — Goleu AI"
        description="How Goleu AI handles data: anonymized usage analytics after consent, quiz inputs kept in your browser, and saved results stored for 30 days."
        path="/privacy"
        lang="ko"
      />
      <PrivacyPolicy />
    </>
  );
}

export function TermsRoute() {
  return (
    <>
      <Seo
        title="Terms of Service — Goleu AI"
        description="The terms that apply when you use Goleu AI, the free SaaS stack recommendation tool for teams."
        path="/terms"
        lang="ko"
      />
      <TermsOfService />
    </>
  );
}
