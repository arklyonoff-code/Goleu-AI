import React from "react";
import { Button, Input, Row, Col, Typography, Divider } from "antd";
import { useNavigate } from "react-router-dom";
import ToolfitBackground from "./ToolfitBackground";
import ProgressBar from "./components/ProgressBar";
import { SlackMark, GithubMark } from "./icons/BrandIcons";
import figmaLogo from "./assets/design.png";
import notionLogo from "./assets/marketing.png";
import trelloLogo from "./assets/ops.png";
import gSuiteLogo from "./assets/developer.png";
import { trackEvent, Events } from "./lib/analytics";

const { Title, Text } = Typography;

const TOOL_LIST = [
  { key: "figma", name: "Figma", logo: figmaLogo },
  { key: "notion", name: "Notion", logo: notionLogo },
  { key: "slack", name: "Slack", icon: <SlackMark size={24} style={{ color: "#4a154b" }} /> },
  { key: "trello", name: "Trello", logo: trelloLogo },
  { key: "github", name: "GitHub", icon: <GithubMark size={24} style={{ color: "#24292e" }} /> },
  { key: "gsuite", name: "G Suite", logo: gSuiteLogo },
];

function ToolSelect({
  selectedTools, setSelectedTools,
  email, setEmail,
  teamName, roles
}) {
  const navigate = useNavigate();
  const toggleTool = (key) => {
    setSelectedTools((prev) => {
      const isSelected = prev.includes(key);
      trackEvent(
        isSelected ? Events.TOOL_DESELECTED : Events.TOOL_SELECTED,
        { tool: key }
      );
      return isSelected ? prev.filter((k) => k !== key) : [...prev, key];
    });
  };

  const handleNext = () => {
    trackEvent(Events.QUIZ_STEP_COMPLETED, {
      step: 2,
      step_name: "tools",
      selected_count: selectedTools.length,
      selected_tools: selectedTools.join(","),
      email_provided: !!email,
    });
    if (email) {
      trackEvent(Events.EMAIL_ENTERED, { step: 2 });
    }
    navigate("/cloud");
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <ToolfitBackground />
      <div style={{
        position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto",
        background: "#fff", borderRadius: 24, boxShadow: "0 4px 24px #0001",
        padding: 32, marginTop: 48
      }}>
        <Title level={2} style={{ fontFamily: "Pretendard, sans-serif", fontWeight: 700, color: "#4c51bf", textAlign: "center" }}>Toolfit AI</Title>
        <Text style={{
          display: "block", fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 4, fontFamily: "Pretendard, sans-serif"
        }}>우리 팀에 딱 맞는 툴 스택, 더 이상 헤매지 마세요!</Text>
        <Text style={{
          display: "block", color: "#666", textAlign: "center", marginBottom: 16, fontFamily: "Pretendard, sans-serif"
        }}>몇 가지 질문에 답하고 최적의 디지털 툴 조합을 찾아보세요.</Text>
        <ProgressBar step={2} total={4} />
        <Text strong style={{ fontSize: 16, fontFamily: "Pretendard, sans-serif" }}>2단계: 현재 사용 중인 툴</Text>
        <div style={{ margin: "8px 0 16px 0", color: "#666", fontFamily: "Pretendard, sans-serif" }}>
          현재 사용 중인 툴을 선택해주세요. 여러 개 선택 가능합니다.
        </div>
        <Row gutter={[16, 16]}>
          {TOOL_LIST.map((tool) => (
            <Col span={12} key={tool.key}>
              <Button
                type={selectedTools.includes(tool.key) ? "primary" : "default"}
                block
                style={{
                  height: 56,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  fontWeight: 600,
                  fontFamily: "Pretendard, sans-serif",
                  background: selectedTools.includes(tool.key) ? "#f0f5ff" : "#fff",
                  borderColor: selectedTools.includes(tool.key) ? "#4c51bf" : undefined,
                  marginBottom: 8
                }}
                icon={tool.logo ? <img src={tool.logo} alt={tool.name} style={{ width: 28, height: 28, marginRight: 8, borderRadius: 6 }} /> : tool.icon}
                onClick={() => toggleTool(tool.key)}
              >
                {tool.name}
              </Button>
            </Col>
          ))}
        </Row>
        <div style={{ margin: "24px 0 8px 0" }}>
          <Text style={{ fontFamily: "Pretendard, sans-serif" }}>이메일</Text>
          <Input
            placeholder="example@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ marginTop: 4, fontFamily: "Pretendard, sans-serif" }}
          />
          <div style={{ color: "#888", fontSize: 12, marginTop: 4, fontFamily: "Pretendard, sans-serif" }}>
            이메일로 로그인하고 비밀번호는 나중에 설정할 수 있습니다.
          </div>
        </div>
        <Row justify="space-between" style={{ marginTop: 24 }} gutter={16}>
          <Col>
            <Button onClick={() => navigate("/")} style={{ fontFamily: "Pretendard, sans-serif" }}>이전</Button>
          </Col>
          <Col>
            <Button type="primary" onClick={handleNext} style={{ fontFamily: "Pretendard, sans-serif" }}>시작하기</Button>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default ToolSelect; 