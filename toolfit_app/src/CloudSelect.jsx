import React from "react";
import { Button, Input, Row, Col, Typography, Divider, Card, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import ToolfitBackground from "./ToolfitBackground";
import ProgressBar from "./components/ProgressBar";
import { MaterialIcon } from "./components/MaterialIcon";
import { trackEvent, Events } from "./lib/analytics";

const { Title, Text } = Typography;

const CLOUD_SERVICES = [
  { 
    key: "aws", 
    name: "Amazon Web Services", 
    icon: <MaterialIcon name="cloud" size={24} color="#FF9900" fill={1} />,
    price: "Pay as you go",
    desc: "가장 광범위한 서비스",
    popular: true
  },
  { 
    key: "vercel", 
    name: "Vercel", 
    icon: <MaterialIcon name="link" size={24} color="#000" fill={1} />,
    price: "Free ~ $20/mo",
    desc: "프론트엔드 배포 특화",
    popular: false
  },
  { 
    key: "azure", 
    name: "Microsoft Azure", 
    icon: <MaterialIcon name="cloud" size={24} color="#0078D4" fill={1} />,
    price: "Pay as you go",
    desc: "마이크로소프트 생태계",
    popular: false
  },
  { 
    key: "gcp", 
    name: "Google Cloud Platform", 
    icon: <MaterialIcon name="database" size={24} color="#4285F4" fill={1} />,
    price: "Pay as you go",
    desc: "AI/ML 서비스 강력",
    popular: false
  },
  { 
    key: "netlify", 
    name: "Netlify", 
    icon: <MaterialIcon name="hub" size={24} color="#00C7B7" fill={1} />,
    price: "Free ~ $19/mo",
    desc: "정적 사이트 배포",
    popular: false
  },
  { 
    key: "railway", 
    name: "Railway", 
    icon: <MaterialIcon name="verified_user" size={24} color="#0B0D0E" fill={1} />,
    price: "Free ~ $5/mo",
    desc: "간편한 풀스택 배포",
    popular: false
  },
];

const HOSTING_TYPES = [
  { key: "static", name: "정적 사이트", desc: "HTML/CSS/JS만 필요" },
  { key: "fullstack", name: "풀스택 애플리케이션", desc: "프론트+백엔드" },
  { key: "api", name: "API 서버", desc: "백엔드 API만" },
  { key: "database", name: "데이터베이스", desc: "데이터 저장소" },
];

function CloudSelect({
  selectedClouds, setSelectedClouds,
  hostingType, setHostingType,
  monthlyBudget, setMonthlyBudget,
  teamName, roles, selectedTools
}) {
  const navigate = useNavigate();
  
  const toggleCloud = (key) => {
    setSelectedClouds((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleHostingType = (key) => {
    setHostingType((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleNext = () => {
    trackEvent(Events.QUIZ_STEP_COMPLETED, {
      step: 3,
      step_name: "cloud",
      selected_clouds: selectedClouds.join(","),
      hosting_types: hostingType.join(","),
      monthly_budget: monthlyBudget || null,
    });
    navigate("/llm", {
      state: {
        selectedTools,
        selectedClouds,
        hostingType,
        monthlyBudget,
        teamName,
        roles,
      },
    });
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <ToolfitBackground />
      <div style={{
        position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto",
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
          클라우드 서비스 선택
        </Text>
        
        <Text style={{
          display: "block", color: "#666", textAlign: "center", 
          marginBottom: 16, fontFamily: "Pretendard, sans-serif"
        }}>
          프로젝트에 적합한 클라우드 플랫폼을 선택해주세요.
        </Text>

        <ProgressBar step={3} total={4} />

        {/* 호스팅 유형 선택 */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16, fontFamily: "Pretendard, sans-serif" }}>
            호스팅 유형
          </Text>
          <div style={{ margin: "8px 0 16px 0", color: "#666", fontFamily: "Pretendard, sans-serif" }}>
            필요한 호스팅 유형을 선택해주세요 (복수 선택 가능)
          </div>
          <Row gutter={[8, 8]}>
            {HOSTING_TYPES.map((type) => (
              <Col span={12} key={type.key}>
                <Button
                  type={hostingType.includes(type.key) ? "primary" : "default"}
                  block
                  style={{
                    height: "auto",
                    padding: "12px",
                    textAlign: "left",
                    background: hostingType.includes(type.key) ? "#f0f5ff" : "#fff",
                    borderColor: hostingType.includes(type.key) ? "#4c51bf" : undefined,
                  }}
                  onClick={() => toggleHostingType(type.key)}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{type.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{type.desc}</div>
                  </div>
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        {/* 월 예산 입력 */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16, fontFamily: "Pretendard, sans-serif" }}>
            월 예산 (USD)
          </Text>
          <Input
            placeholder="예: 50"
            value={monthlyBudget}
            onChange={e => setMonthlyBudget(e.target.value)}
            style={{ marginTop: 8, fontFamily: "Pretendard, sans-serif" }}
            prefix="$"
            suffix="/month"
          />
        </div>

        {/* 클라우드 서비스 선택 */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16, fontFamily: "Pretendard, sans-serif" }}>
            클라우드 플랫폼
          </Text>
          <div style={{ margin: "8px 0 16px 0", color: "#666", fontFamily: "Pretendard, sans-serif" }}>
            관심 있는 클라우드 서비스를 선택해주세요.
          </div>
          
          <Row gutter={[12, 12]}>
            {CLOUD_SERVICES.map((service) => (
              <Col span={12} key={service.key}>
                <Card
                  hoverable
                  style={{
                    borderColor: selectedClouds.includes(service.key) ? "#4c51bf" : "#d9d9d9",
                    background: selectedClouds.includes(service.key) ? "#f0f5ff" : "#fff",
                    cursor: "pointer"
                  }}
                  bodyStyle={{ padding: 12 }}
                  onClick={() => toggleCloud(service.key)}
                >
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                    {service.icon}
                    <div style={{ marginLeft: 8, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {service.name}
                        {service.popular && <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>인기</Tag>}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>{service.desc}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#4c51bf", fontWeight: 600 }}>
                    {service.price}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <Row justify="space-between" style={{ marginTop: 24 }} gutter={16}>
          <Col>
            <Button onClick={() => navigate("/tools")} style={{ fontFamily: "Pretendard, sans-serif" }}>이전</Button>
          </Col>
          <Col>
            <Button type="primary" onClick={handleNext} style={{ fontFamily: "Pretendard, sans-serif" }}>다음</Button>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default CloudSelect;