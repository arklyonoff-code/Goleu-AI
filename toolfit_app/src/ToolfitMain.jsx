import React, { useEffect, useRef } from "react";
import { MaterialIcon } from "./components/MaterialIcon";
import { Button, Col, Input, Row, Typography } from "antd";
import ToolfitBackground from "./ToolfitBackground";
import ProgressBar from "./components/ProgressBar";
import { useNavigate } from "react-router-dom";
import { trackEvent, Events } from "./lib/analytics";

const { Title, Text } = Typography;

const rolesArray = [
  {
    key: "dev",
    label: "개발자",
    bgColor: "#ededed",
    icon: <MaterialIcon name="code" size={22} color="#2d3748" fill={1} />,
  },
  {
    key: "design",
    label: "디자이너",
    bgColor: "#e9d8fd",
    icon: <MaterialIcon name="palette" size={22} color="#553c9a" fill={1} />,
  },
  {
    key: "marketing",
    label: "마케팅",
    bgColor: "#fefcbf",
    icon: <MaterialIcon name="campaign" size={22} color="#975a16" fill={1} />,
  },
  {
    key: "ops",
    label: "운영/관리",
    bgColor: "#e6fffa",
    icon: <MaterialIcon name="settings" size={22} color="#234e52" fill={1} />,
  },
];

const ToolfitMain = ({ teamName, setTeamName, roles, setRoles }) => {
  const navigate = useNavigate();
  const quizStartedRef = useRef(false);

  // 첫 마운트 시 quiz_started 1회 발송 (StrictMode 중복 방지)
  useEffect(() => {
    if (quizStartedRef.current) return;
    quizStartedRef.current = true;
    trackEvent(Events.QUIZ_STARTED, { entry_step: 1 });
  }, []);

  const changeCount = (role, delta) => {
    setRoles((prev) => {
      const newCount = Math.max(0, (prev[role] || 0) + delta);
      return { ...prev, [role]: newCount };
    });
  };

  const handleNext = () => {
    const totalHeadcount = Object.values(roles).reduce(
      (sum, n) => sum + (Number(n) || 0),
      0
    );
    trackEvent(Events.QUIZ_STEP_COMPLETED, {
      step: 1,
      step_name: "team",
      team_name_provided: !!teamName,
      total_headcount: totalHeadcount,
      role_dev: roles.dev || 0,
      role_design: roles.design || 0,
      role_marketing: roles.marketing || 0,
      role_ops: roles.ops || 0,
    });
    navigate("/tools");
  };

  return (
    <>
      <ToolfitBackground />
      <div style={{
        position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto",
        background: "#fff", borderRadius: 24, boxShadow: "0 4px 24px #0001",
        padding: 32, marginTop: 48
      }}>
        <Row justify="center">
          <Col span={24} style={{ textAlign: "center" }}>
            <Title
              level={2}
              style={{
                color: "#4c51bf",
                fontFamily: "'Pacifico-Regular', Helvetica",
              }}
            >
              <Title level={2} style={{ fontFamily: "Pretendard, sans-serif", fontWeight: 700, color: "#4c51bf", textAlign: "center" }}>Toolfit AI</Title>
            </Title>
            <Text style={{
              display: "block",
              fontSize: 20,
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 4,
              fontFamily: "Pretendard, sans-serif",
            }}>
              우리 팀에 딱 맞는 툴 스택, 더 이상 헤매지 마세요!
            </Text>
            <Text style={{
               display: "block",
               color: "#666",
               textAlign: "center",
               marginBottom: 2,
               fontFamily: "Pretendard, sans-serif",
            }}>
              몇 가지 질문에 답하고 최적의 디지털 툴 조합을 찾아보세요
            </Text>
          </Col>
          <Col span={24}>
            <ProgressBar step={1} total={4} />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Text strong style={{ fontSize: 16, fontFamily: "Pretendard, sans-serif" }}>
              1단계: 팀 구성 입력
            </Text>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
          <Text style={{ margin: "8px 0 16px 0", color: "#666", fontFamily: "Pretendard, sans-serif", display: "block" }}>
              팀 이름
          </Text>

            <Input
              placeholder="예: 디자인랩"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
            />
          </Col>
        </Row>
        <Row style={{ marginTop: "1rem" }}>
          <Col span={24}>
            <Text style={{ color: "#4a5568" }}>직군별 인원</Text>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: "1rem" }}>
          {rolesArray.map(({ key, label, bgColor, icon }) => (
            <Col span={24} key={key}>
              <Row
                align="middle"
                justify="space-between"
                style={{
                  padding: "0.5rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "1rem",
                }}
              >
                <Col>
                  <Row align="middle">
                    <Col>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: bgColor,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {icon}
                      </div>
                    </Col>
                    <Col style={{ marginLeft: "1rem" }}>
                      <Text style={{ fontWeight: "500", color: "#000" }}>
                        {label}
                      </Text>
                    </Col>
                  </Row>
                </Col>
                <Col>
                  <Row align="middle">
                    <Button icon={<MaterialIcon name="remove" size={14} />} shape="circle" onClick={() => changeCount(key, -1)} />
                    <Input
                      value={roles[key] || 0}
                      style={{
                        width: "40px",
                        textAlign: "center",
                        margin: "0 0.5rem",
                      }}
                      readOnly
                    />
                    <Button icon={<MaterialIcon name="add" size={14} />} shape="circle" onClick={() => changeCount(key, 1)} />
                  </Row>
                </Col>
              </Row>
            </Col>
          ))}
        </Row>
        <Row justify="end" style={{ marginTop: "1rem" }}>
          <Button type="primary" style={{ borderRadius: "0.5rem" }} onClick={handleNext}>다음 단계</Button>
        </Row>
      </div>
    </>
  );
};

export default ToolfitMain;
