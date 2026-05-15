import React from "react";
import { Button, Input, Row, Col, Typography, Divider, Card, Tag, Select, Slider } from "antd";
import { useNavigate } from "react-router-dom";
import ToolfitBackground from "./ToolfitBackground";
import ProgressBar from "./components/ProgressBar";
import { MaterialIcon } from "./components/MaterialIcon";
import { trackEvent, Events } from "./lib/analytics";

const { Title, Text } = Typography;
const { Option } = Select;

const LLM_SERVICES = [
  {
    key: "openai",
    name: "OpenAI",
    models: ["GPT-4", "GPT-3.5-turbo", "DALL-E"],
    icon: <MaterialIcon name="auto_awesome" size={24} color="#00A67E" fill={1} />,
    price: "$0.03/1K tokens",
    desc: "가장 강력한 범용 AI",
    popular: true,
    strengths: ["창작", "코딩", "추론"]
  },
  {
    key: "anthropic",
    name: "Anthropic Claude",
    models: ["Claude-3", "Claude-2"],
    icon: <MaterialIcon name="lightbulb" size={24} color="#D97706" fill={1} />,
    price: "$0.025/1K tokens",
    desc: "안전하고 유용한 AI",
    popular: true,
    strengths: ["분석", "글쓰기", "안전성"]
  },
  {
    key: "google",
    name: "Google Gemini",
    models: ["Gemini Pro", "Gemini Ultra"],
    icon: <MaterialIcon name="bar_chart" size={24} color="#4285F4" fill={1} />,
    price: "$0.02/1K tokens",
    desc: "구글의 멀티모달 AI",
    popular: false,
    strengths: ["검색", "분석", "멀티모달"]
  },
  {
    key: "cohere",
    name: "Cohere",
    models: ["Command", "Generate"],
    icon: <MaterialIcon name="edit" size={24} color="#9333EA" fill={1} />,
    price: "$0.015/1K tokens",
    desc: "기업용 NLP 특화",
    popular: false,
    strengths: ["기업", "검색", "요약"]
  },
  {
    key: "opensource",
    name: "오픈소스 모델",
    models: ["Llama 2", "Mistral", "CodeLlama"],
    icon: <MaterialIcon name="code" size={24} color="#059669" fill={1} />,
    price: "호스팅 비용만",
    desc: "자유로운 커스터마이징",
    popular: false,
    strengths: ["커스터마이징", "비용절감", "프라이버시"]
  },
];

const USE_CASES = [
  { key: "content", name: "콘텐츠 생성", icon: <MaterialIcon name="edit" size={20} fill={1} />, desc: "블로그, 마케팅 글 작성" },
  { key: "coding", name: "코딩 지원", icon: <MaterialIcon name="code" size={20} fill={1} />, desc: "코드 생성, 디버깅, 리뷰" },
  { key: "analysis", name: "데이터 분석", icon: <MaterialIcon name="bar_chart" size={20} fill={1} />, desc: "문서 분석, 인사이트 추출" },
  { key: "translation", name: "번역", icon: <MaterialIcon name="translate" size={20} fill={1} />, desc: "다국어 번역, 현지화" },
  { key: "customer", name: "고객 지원", icon: <MaterialIcon name="forum" size={20} fill={1} />, desc: "챗봇, FAQ 자동 응답" },
  { key: "research", name: "리서치", icon: <MaterialIcon name="lightbulb" size={20} fill={1} />, desc: "정보 수집, 요약" },
];

function LLMSelect({
  selectedLLMs, setSelectedLLMs,
  useCases, setUseCases,
  monthlyAIBudget, setMonthlyAIBudget,
  expectedUsage, setExpectedUsage,
  teamName, roles, selectedTools, selectedClouds
}) {
  const navigate = useNavigate();
  
  const toggleLLM = (key) => {
    setSelectedLLMs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleUseCase = (key) => {
    setUseCases((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleNext = () => {
    navigate("/result", { 
      state: { 
        selectedTools, 
        selectedClouds, 
        selectedLLMs,
        useCases,
        monthlyAIBudget,
        expectedUsage,
        teamName, 
        roles 
      } 
    });
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <ToolfitBackground />
      <div style={{
        position: "relative", zIndex: 1, maxWidth: 650, margin: "0 auto",
        background: "#fff", borderRadius: 24, boxShadow: "0 4px 24px #0001",
        padding: 32, marginTop: 48
      }}>
        <Title level={2} style={{ 
          fontFamily: "Pretendard, sans-serif", 
          fontWeight: 700, 
          color: "#4c51bf", 
          textAlign: "center" 
        }}>
          Toolfit <span style={{ fontWeight: "bold" }}>AI</span>
        </Title>
        
        <Text style={{
          display: "block", fontSize: 20, fontWeight: 700, 
          textAlign: "center", marginBottom: 4, 
          fontFamily: "Pretendard, sans-serif"
        }}>
          AI/LLM 서비스 선택
        </Text>
        
        <Text style={{
          display: "block", color: "#666", textAlign: "center", 
          marginBottom: 16, fontFamily: "Pretendard, sans-serif"
        }}>
          팀에 필요한 AI 서비스를 선택해주세요.
        </Text>

        <ProgressBar step={4} total={4} />

        {/* 사용 목적 선택 */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16, fontFamily: "Pretendard, sans-serif" }}>
            AI 활용 목적
          </Text>
          <div style={{ margin: "8px 0 16px 0", color: "#666", fontFamily: "Pretendard, sans-serif" }}>
            AI를 어떤 용도로 사용할 예정인지 선택해주세요 (복수 선택 가능)
          </div>
          <Row gutter={[8, 8]}>
            {USE_CASES.map((useCase) => (
              <Col span={8} key={useCase.key}>
                <Button
                  type={useCases.includes(useCase.key) ? "primary" : "default"}
                  block
                  style={{
                    height: "auto",
                    padding: "12px 8px",
                    textAlign: "center",
                    background: useCases.includes(useCase.key) ? "#f0f5ff" : "#fff",
                    borderColor: useCases.includes(useCase.key) ? "#4c51bf" : undefined,
                  }}
                  onClick={() => toggleUseCase(useCase.key)}
                >
                  <div>
                    <div style={{ marginBottom: 4 }}>{useCase.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{useCase.name}</div>
                    <div style={{ fontSize: 10, color: "#666" }}>{useCase.desc}</div>
                  </div>
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        {/* 예상 사용량 */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16, fontFamily: "Pretendard, sans-serif" }}>
            예상 월 사용량
          </Text>
          <div style={{ margin: "8px 0 16px 0", color: "#666", fontFamily: "Pretendard, sans-serif" }}>
            한 달에 얼마나 사용할 예정인가요?
          </div>
          <Select
            style={{ width: "100%" }}
            placeholder="사용량 선택"
            value={expectedUsage}
            onChange={setExpectedUsage}
          >
            <Option value="light">가볍게 (월 10만 토큰 이하)</Option>
            <Option value="medium">보통 (월 10만~100만 토큰)</Option>
            <Option value="heavy">많이 (월 100만 토큰 이상)</Option>
            <Option value="enterprise">기업용 (대량 사용)</Option>
          </Select>
        </div>

        {/* AI 서비스 예산 */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16, fontFamily: "Pretendard, sans-serif" }}>
            AI 서비스 월 예산 (USD)
          </Text>
          <Input
            placeholder="예: 100"
            value={monthlyAIBudget}
            onChange={e => setMonthlyAIBudget(e.target.value)}
            style={{ marginTop: 8, fontFamily: "Pretendard, sans-serif" }}
            prefix="$"
            suffix="/month"
          />
        </div>

        {/* LLM 서비스 선택 */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16, fontFamily: "Pretendard, sans-serif" }}>
            AI/LLM 플랫폼
          </Text>
          <div style={{ margin: "8px 0 16px 0", color: "#666", fontFamily: "Pretendard, sans-serif" }}>
            관심 있는 AI 서비스를 선택해주세요.
          </div>
          
          <Row gutter={[12, 12]}>
            {LLM_SERVICES.map((service) => (
              <Col span={24} key={service.key}>
                <Card
                  hoverable
                  style={{
                    borderColor: selectedLLMs.includes(service.key) ? "#4c51bf" : "#d9d9d9",
                    background: selectedLLMs.includes(service.key) ? "#f0f5ff" : "#fff",
                    cursor: "pointer"
                  }}
                  bodyStyle={{ padding: 16 }}
                  onClick={() => toggleLLM(service.key)}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                      {service.icon}
                      <div style={{ marginLeft: 12, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 16 }}>{service.name}</span>
                          {service.popular && <Tag color="orange" style={{ marginLeft: 8, fontSize: 10 }}>인기</Tag>}
                        </div>
                        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{service.desc}</div>
                        <div style={{ fontSize: 12, color: "#4c51bf", fontWeight: 600 }}>
                          {service.price}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", marginLeft: 16 }}>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>강점:</div>
                      <div style={{ fontSize: 11, color: "#4c51bf" }}>
                        {service.strengths.join(", ")}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <Row justify="space-between" style={{ marginTop: 24 }} gutter={16}>
          <Col>
            <Button onClick={() => navigate("/cloud")} style={{ fontFamily: "Pretendard, sans-serif" }}>이전</Button>
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={() => {
                trackEvent(Events.QUIZ_STEP_COMPLETED, {
                  step: 4,
                  step_name: "llm",
                  selected_llms: selectedLLMs.join(","),
                  use_cases: useCases.join(","),
                  monthly_ai_budget: monthlyAIBudget || null,
                  expected_usage: expectedUsage || null,
                });
                trackEvent(Events.QUIZ_COMPLETED, {
                  total_tools_selected: (selectedTools || []).length,
                  total_clouds_selected: (selectedClouds || []).length,
                  total_llms_selected: selectedLLMs.length,
                });
                navigate("/recommend");
              }}
              style={{ fontFamily: "Pretendard, sans-serif" }}
            >
              다음
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default LLMSelect;