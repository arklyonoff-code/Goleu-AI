import React, { useEffect, useRef } from "react";
import { Row, Col, Card, Tag, Button, Typography, Divider, Layout, Menu, Avatar, Badge } from "antd";
import { useLocation } from "react-router-dom";
import figmaLogo from "./assets/design.png";
import notionLogo from "./assets/marketing.png";
import trelloLogo from "./assets/ops.png";
import gSuiteLogo from "./assets/developer.png";
import { MaterialIcon } from "./components/MaterialIcon";
import { SlackMark, GithubMark } from "./icons/BrandIcons";
import { trackEvent, Events } from "./lib/analytics";
const { Title, Text } = Typography;
const { Header, Content } = Layout;

const TOOL_META = {
  figma:   { name: "Figma", logo: figmaLogo, color: "#a259ff" },
  notion:  { name: "Notion", logo: notionLogo, color: "#000" },
  slack:   { name: "Slack", icon: <SlackMark size={20} style={{ color: "#4a154b" }} />, color: "#4a154b" },
  trello:  { name: "Trello", logo: trelloLogo, color: "#0079bf" },
  github:  { name: "GitHub", icon: <GithubMark size={20} style={{ color: "#24292e" }} />, color: "#24292e" },
  gsuite:  { name: "G Suite", logo: gSuiteLogo, color: "#4285f4" },
};

const PRODUCTIVITY_COMBO = [
  { name: "Notion", desc: "문서 및 프로젝트 관리", price: 8 },
  { name: "Slack", desc: "팀 커뮤니케이션", price: 6.67 },
  { name: "Asana", desc: "프로젝트 관리", price: 10.99 },
];
const PRODUCTIVITY_TOTAL = PRODUCTIVITY_COMBO.reduce((sum, t) => sum + t.price, 0);

const COST_COMBO = [
  { name: "Notion", desc: "문서 및 프로젝트 관리", price: 8 },
  { name: "Discord", desc: "커뮤니케이션", price: 0 },
  { name: "Trello", desc: "프로젝트 관리", price: 5 },
];
const COST_TOTAL = COST_COMBO.reduce((sum, t) => sum + t.price, 0);

const CATEGORY_TOOLS = [
  { title: "문서 관리", tools: "Notion, Coda, Confluence", color: "#4f8cff", icon: <MaterialIcon name="description" size={32} color="#fff" fill={1} style={{ opacity: 0.95 }} /> },
  { title: "커뮤니케이션", tools: "Slack, Discord, Microsoft Teams", color: "#b84fff", icon: <MaterialIcon name="forum" size={32} color="#fff" fill={1} style={{ opacity: 0.95 }} /> },
  { title: "프로젝트 관리", tools: "Asana, Trello, Monday.com", color: "#4fc3a1", icon: <MaterialIcon name="calendar_month" size={32} color="#fff" fill={1} style={{ opacity: 0.95 }} /> },
  { title: "디자인", tools: "Figma, Adobe XD, Sketch", color: "#ffb84f", icon: <MaterialIcon name="palette" size={32} color="#fff" fill={1} style={{ opacity: 0.95 }} /> },
];

function ToolfitResult(props) {
  const location = useLocation();
  // location.state가 있으면 우선 사용, 없으면 props fallback
  const selectedTools = (location.state && location.state.selectedTools) || props.selectedTools || [];
  const teamName = (location.state && location.state.teamName) || props.teamName;
  const roles = (location.state && location.state.roles) || props.roles;
  const email = (location.state && location.state.email) || props.email;

  // recommendation_viewed: 추천 화면 최초 노출 1회 (CTR 분모 = 이 이벤트 수)
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    trackEvent(Events.RECOMMENDATION_VIEWED, {
      productivity_total: PRODUCTIVITY_TOTAL,
      cost_total: COST_TOTAL,
      productivity_tools: PRODUCTIVITY_COMBO.map((t) => t.name).join(","),
      cost_tools: COST_COMBO.map((t) => t.name).join(","),
      existing_tools: Array.isArray(selectedTools) ? selectedTools.join(",") : "",
      has_team_name: !!teamName,
    });
  }, [selectedTools, teamName]);

  const onRecommendationClick = (combo, tool) => {
    trackEvent(Events.RECOMMENDATION_CLICKED, {
      combo,
      tool_name: tool.name,
      tool_price: tool.price,
    });
  };

  const onSimulationClick = (combo) => {
    trackEvent(Events.SIMULATION_CLICKED, { combo });
  };

  const onProUpgradeClick = () => {
    trackEvent(Events.PRO_UPGRADE_CLICKED, { source: "header" });
  };

  const onCategoryClick = (cat) => {
    trackEvent(Events.CATEGORY_CARD_CLICKED, {
      category: cat.title,
      tools: cat.tools,
    });
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      {/* 상단 메뉴바 */}
      <Header style={{ background: "#fff", boxShadow: "0 2px 8px #0001", padding: 0, height: 64, display: "flex", alignItems: "center", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", height: "100%", width: "100%", maxWidth: 1200, margin: "0 auto" }}>
          {/* 좌측 로고 */}
          <div style={{ fontWeight: 900, fontSize: 26, color: "#4c51bf", fontFamily: "Pacifico, Pretendard, sans-serif", letterSpacing: 1, marginRight: 32, display: "flex", alignItems: "center" }}>
            <img src={figmaLogo} alt="ToolFit Logo" style={{ width: 32, height: 32, marginRight: 8, borderRadius: 8, background: "#fff" }} />
            ToolFit
          </div>
          {/* 중앙 메뉴 */}
          <Menu mode="horizontal" defaultSelectedKeys={["recommend"]} style={{ flex: 1, borderBottom: "none", background: "transparent", fontWeight: 600, fontSize: 16 }}>
            <Menu.Item key="myteam">My Team</Menu.Item>
            <Menu.Item key="explore">Explore</Menu.Item>
            <Menu.Item key="recommend">Recommend</Menu.Item>
          </Menu>
          {/* 우측 바 */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Button type="primary" onClick={onProUpgradeClick} style={{ borderRadius: 20, fontWeight: 600, marginRight: 8 }}>Pro 업그레이드</Button>
            <Badge count={2} size="small">
              <span style={{ display: "inline-flex", cursor: "pointer", color: "#4c51bf" }}>
                <MaterialIcon name="notifications" size={22} />
              </span>
            </Badge>
            <Avatar
              style={{ background: "#4c51bf", marginLeft: 8, cursor: "pointer" }}
              icon={<MaterialIcon name="person" size={22} color="#fff" fill={1} />}
              onClick={() => window.location.href = "/dashboard"}
            />
          </div>
        </div>
      </Header>
      <Content style={{ marginTop: 0 }}>
        <div style={{ background: "#f7f8fa", minHeight: "100vh", paddingBottom: 48 }}>
          {/* 상단 인사 배너 */}
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 0 0 0" }}>
            <Card style={{ background: "#5b5be5", color: "#fff", borderRadius: 20, marginBottom: 32 }} bodyStyle={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 32 }}>
              <div>
                <Title level={4} style={{ color: "#fff", margin: 0 }}>{teamName ? `${teamName}님, 안녕하세요!` : "팀을 위한 추천"}</Title>
                <div style={{ fontSize: 16, margin: "8px 0 0 0", color: "#fff" }}>월 $350 절감하고 생산성 25% 향상해보세요!</div>
                <Button style={{ marginTop: 16, background: "#fff", color: "#5b5be5", fontWeight: 600 }}>
                  맞춤 추천 보기
                </Button>
              </div>
              <img src="https://cdn.pixabay.com/photo/2017/01/10/19/05/icon-1970472_1280.png" alt="illustration" style={{ width: 120, borderRadius: 16 }} />
            </Card>
          </div>
          {/* 사용 중인 툴 */}
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <Card style={{ marginBottom: 32 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>현재 사용 중인 툴</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {Array.isArray(selectedTools) && selectedTools.length > 0 ? selectedTools.map(toolKey => {
                  const meta = TOOL_META[toolKey] || { name: toolKey };
                  return (
                    <Tag key={toolKey} color={meta.color || "#5b5be5"} style={{ fontSize: 16, padding: "6px 18px", borderRadius: 20, display: "flex", alignItems: "center", gap: 8 }}>
                      {meta.logo && <img src={meta.logo} alt={meta.name} style={{ width: 20, height: 20, borderRadius: 4, marginRight: 6 }} />}
                      {meta.icon && (
                        <span style={{ marginRight: 6, display: "inline-flex", alignItems: "center" }}>{meta.icon}</span>
                      )}
                      {meta.name || toolKey}
                    </Tag>
                  );
                }) : <span style={{ color: "#888" }}>선택된 툴이 없습니다.</span>}
              </div>
            </Card>
          </div>
          {/* 추천 툴 조합 */}
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Card title={<span>생산성 최적화 조합 <Tag color="#4f8cff">절약: $250/월</Tag></span>} style={{ marginBottom: 24 }}>
                  {PRODUCTIVITY_COMBO.map(tool => (
                    <div
                      key={tool.name}
                      onClick={() => onRecommendationClick("productivity", tool)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, cursor: "pointer" }}
                    >
                      <div>
                        <b>{tool.name}</b> <span style={{ color: "#888" }}>{tool.desc}</span>
                      </div>
                      <div style={{ fontWeight: 600 }}>${tool.price}/월</div>
                    </div>
                  ))}
                  <Divider />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>총 예상 비용</span>
                    <span style={{ fontWeight: 700, color: "#4f8cff" }}>${PRODUCTIVITY_TOTAL}/월</span>
                  </div>
                  <Button type="primary" onClick={() => onSimulationClick("productivity")} style={{ marginTop: 16, width: "100%" }}>시뮬레이션 보기</Button>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title={<span>비용 효율화 조합 <Tag color="#4fc3a1">절약: $350/월</Tag></span>} style={{ marginBottom: 24 }}>
                  {COST_COMBO.map(tool => (
                    <div
                      key={tool.name}
                      onClick={() => onRecommendationClick("cost", tool)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, cursor: "pointer" }}
                    >
                      <div>
                        <b>{tool.name}</b> <span style={{ color: "#888" }}>{tool.desc}</span>
                      </div>
                      <div style={{ fontWeight: 600 }}>${tool.price === 0 ? "무료" : tool.price + "/월"}</div>
                    </div>
                  ))}
                  <Divider />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>총 예상 비용</span>
                    <span style={{ fontWeight: 700, color: "#4fc3a1" }}>${COST_TOTAL}/월</span>
                  </div>
                  <Button type="primary" onClick={() => onSimulationClick("cost")} style={{ marginTop: 16, width: "100%" }}>시뮬레이션 보기</Button>
                </Card>
              </Col>
            </Row>
          </div>
          {/* 카테고리별 추천 툴 */}
          <div style={{ maxWidth: 900, margin: "40px auto 0 auto" }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>카테고리별 추천 툴</div>
            <Row gutter={24}>
              {CATEGORY_TOOLS.map(cat => (
                <Col xs={24} md={6} key={cat.title}>
                  <Card
                    onClick={() => onCategoryClick(cat)}
                    style={{ background: `linear-gradient(135deg, ${cat.color} 60%, #fff 100%)`, borderRadius: 16, color: "#fff", minHeight: 120, cursor: "pointer" }}
                    bodyStyle={{ padding: 24 }}
                  >
                    <div style={{ marginBottom: 8, display: "flex" }}>{cat.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{cat.title}</div>
                    <div style={{ color: "#fff", opacity: 0.9, marginTop: 8 }}>{cat.tools}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default ToolfitResult; 