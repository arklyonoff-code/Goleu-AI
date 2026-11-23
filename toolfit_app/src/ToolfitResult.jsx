import React, { useEffect, useRef, useState } from "react";
import {
  Row, Col, Card, Tag, Button, Typography, Divider,
  Layout, Menu, Avatar, Badge, Skeleton, Alert,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import figmaLogo from "./assets/design.png";
import notionLogo from "./assets/marketing.png";
import trelloLogo from "./assets/ops.png";
import gSuiteLogo from "./assets/developer.png";
import { MaterialIcon } from "./components/MaterialIcon";
import { SlackMark, GithubMark } from "./icons/BrandIcons";
import { trackEvent, Events } from "./lib/analytics";

const { Title, Text } = Typography;
const { Header, Content } = Layout;

// Worker URL — Cloudflare 배포 후 실제 Worker URL로 변경하세요.
// toolfit_app/.env.local 에 아래 줄 추가:
//   VITE_WORKER_URL=https://toolfit-api.YOUR-ACCOUNT.workers.dev
const WORKER_URL =
  import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

// ─── 현재 사용 중인 툴 메타데이터 ─────────────────────────────────────────
const TOOL_META = {
  figma:  { name: "Figma",   logo: figmaLogo,  color: "#a259ff" },
  notion: { name: "Notion",  logo: notionLogo, color: "#000" },
  slack:  { name: "Slack",   icon: <SlackMark size={20} style={{ color: "#4a154b" }} />, color: "#4a154b" },
  trello: { name: "Trello",  logo: trelloLogo, color: "#0079bf" },
  github: { name: "GitHub",  icon: <GithubMark size={20} style={{ color: "#24292e" }} />, color: "#24292e" },
  gsuite: { name: "G Suite", logo: gSuiteLogo, color: "#4285f4" },
};

const CATEGORY_ICONS = [
  <MaterialIcon name="description"    size={30} color="#fff" fill={1} />,
  <MaterialIcon name="forum"          size={30} color="#fff" fill={1} />,
  <MaterialIcon name="calendar_month" size={30} color="#fff" fill={1} />,
  <MaterialIcon name="code"           size={30} color="#fff" fill={1} />,
];

// ─── 로딩 스켈레톤 ────────────────────────────────────────────────────────
function RecommendSkeleton() {
  return (
    <div style={{ padding: "24px 0" }}>
      <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 28 }} />
      <Row gutter={24}>
        <Col xs={24} md={12}><Skeleton active paragraph={{ rows: 6 }} /></Col>
        <Col xs={24} md={12}><Skeleton active paragraph={{ rows: 6 }} /></Col>
      </Row>
      <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: 32 }} />
    </div>
  );
}

// ─── 추천 콤보 카드 ───────────────────────────────────────────────────────
function ComboCard({ combo, onToolClick, onSimulationClick }) {
  return (
    <Card
      title={
        <span>
          {combo.label}{" "}
          <Tag color={combo.tagColor} style={{ fontWeight: 600 }}>{combo.tag}</Tag>
        </span>
      }
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          {combo.savings}
        </Text>
      }
      style={{ marginBottom: 24, borderRadius: 14 }}
      bodyStyle={{ padding: "16px 20px" }}
    >
      {(combo.tools || []).map((tool) => (
        <div
          key={tool.name}
          onClick={() => onToolClick(combo.type, tool)}
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            marginBottom: 10, cursor: "pointer", padding: "8px 10px", borderRadius: 8,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5ff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{ flex: 1, paddingRight: 12 }}>
            <b style={{ fontSize: 14 }}>{tool.name}</b>{" "}
            <span style={{ color: "#888", fontSize: 13 }}>{tool.desc}</span>
            {tool.reason && (
              <div style={{ color: "#6366f1", fontSize: 11, marginTop: 3 }}>
                💡 {tool.reason}
              </div>
            )}
          </div>
          <div style={{ fontWeight: 600, whiteSpace: "nowrap", fontSize: 13 }}>
            {tool.price === 0 ? (
              <Tag color="green">무료</Tag>
            ) : (
              tool.priceLabel || `$${tool.price}/월`
            )}
          </div>
        </div>
      ))}

      <Divider style={{ margin: "12px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, color: "#374151" }}>팀 전체 예상 비용</span>
        <span style={{ fontWeight: 800, color: combo.tagColor, fontSize: 16 }}>
          ${combo.totalPrice}
          <span style={{ fontWeight: 400, fontSize: 12, color: "#888", marginLeft: 4 }}>
            {combo.totalLabel || "/월"}
          </span>
        </span>
      </div>

      <Button
        type="primary"
        block
        style={{
          marginTop: 14, borderRadius: 8,
          background: combo.tagColor, borderColor: combo.tagColor, fontWeight: 600,
        }}
        onClick={() => onSimulationClick(combo.type)}
      >
        자세히 보기
      </Button>
    </Card>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────
function ToolfitResult(props) {
  const location = useLocation();
  const navigate = useNavigate();

  // router state 우선, 없으면 props fallback
  const s = location.state || {};
  const teamName        = s.teamName        || props.teamName        || "";
  const roles           = s.roles           || props.roles           || {};
  const selectedTools   = s.selectedTools   || props.selectedTools   || [];
  const email           = s.email           || props.email           || "";
  const selectedClouds  = s.selectedClouds  || props.selectedClouds  || [];
  const hostingType     = s.hostingType     || props.hostingType     || [];
  const monthlyBudget   = s.monthlyBudget   || props.monthlyBudget   || "";
  const selectedLLMs    = s.selectedLLMs    || props.selectedLLMs    || [];
  const useCases        = s.useCases        || props.useCases        || [];
  const monthlyAIBudget = s.monthlyAIBudget || props.monthlyAIBudget || "";
  const expectedUsage   = s.expectedUsage   || props.expectedUsage   || "";

  const [loading, setLoading]             = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError]                 = useState(null);
  const viewedRef = useRef(false);

  // ── Worker API 호출 ──────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${WORKER_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamName, roles, selectedTools, email,
        selectedClouds, hostingType, monthlyBudget,
        selectedLLMs, useCases, monthlyAIBudget, expectedUsage,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRecommendation(data);
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error("[ToolfitResult]", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── GA4 이벤트 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (recommendation && !viewedRef.current) {
      viewedRef.current = true;
      trackEvent(Events.RECOMMENDATION_VIEWED, {
        team_name: teamName,
        total_members: Object.values(roles).reduce((s, n) => s + (parseInt(n) || 0), 0),
        existing_tools: Array.isArray(selectedTools) ? selectedTools.join(",") : "",
      });
    }
  }, [recommendation, teamName, roles, selectedTools]);

  const onToolClick       = (combo, tool)  => trackEvent(Events.RECOMMENDATION_CLICKED, { combo, tool_name: tool.name, tool_price: tool.price });
  const onSimulationClick = (combo)        => trackEvent(Events.SIMULATION_CLICKED, { combo });
  const onProUpgradeClick = ()             => trackEvent(Events.PRO_UPGRADE_CLICKED, { source: "header" });

  // ── 렌더링 ───────────────────────────────────────────────────────────────
  return (
    <Layout style={{ minHeight: "100vh", background: "#f7f8fa" }}>

      {/* ── 헤더 ── */}
      <Header style={{
        background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        padding: 0, height: 64, display: "flex", alignItems: "center", zIndex: 10,
      }}>
        <div style={{
          display: "flex", alignItems: "center", height: "100%",
          width: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 24px",
        }}>
          <div
            onClick={() => navigate("/")}
            style={{
              fontWeight: 900, fontSize: 22, color: "#4c51bf", cursor: "pointer",
              fontFamily: "Pretendard, sans-serif", marginRight: 32,
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <img src={figmaLogo} alt="ToolFit" style={{ width: 28, height: 28, borderRadius: 6 }} />
            ToolFit
          </div>

          <Menu
            mode="horizontal"
            selectedKeys={["recommend"]}
            style={{ flex: 1, borderBottom: "none", background: "transparent", fontWeight: 600 }}
            items={[
              { key: "myteam",    label: "My Team" },
              { key: "explore",   label: "Explore" },
              { key: "recommend", label: "Recommend" },
            ]}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Button
              type="primary"
              onClick={onProUpgradeClick}
              style={{ borderRadius: 20, fontWeight: 600 }}
            >
              Pro 업그레이드
            </Button>
            <Badge count={2} size="small">
              <span style={{ cursor: "pointer", color: "#4c51bf", display: "inline-flex" }}>
                <MaterialIcon name="notifications" size={22} />
              </span>
            </Badge>
            <Avatar
              style={{ background: "#4c51bf", cursor: "pointer" }}
              icon={<MaterialIcon name="person" size={20} color="#fff" fill={1} />}
            />
          </div>
        </div>
      </Header>

      {/* ── 본문 ── */}
      <Content>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px 60px" }}>

          {/* 인사 배너 */}
          <Card
            style={{ background: "#5b5be5", borderRadius: 20, marginBottom: 28, border: "none" }}
            bodyStyle={{
              padding: "28px 32px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1 }}>
              {loading ? (
                <div>
                  <div style={{ height: 24, background: "rgba(255,255,255,0.25)", borderRadius: 6, width: 260, marginBottom: 12 }} />
                  <div style={{ height: 16, background: "rgba(255,255,255,0.15)", borderRadius: 6, width: 340 }} />
                </div>
              ) : (
                <>
                  <Title level={4} style={{ color: "#fff", margin: 0, fontFamily: "Pretendard, sans-serif" }}>
                    {recommendation?.greeting || (teamName ? `${teamName}님, 안녕하세요!` : "안녕하세요!")}
                  </Title>
                  <div style={{ fontSize: 15, marginTop: 8, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                    {recommendation?.insight || "팀에 딱 맞는 툴 스택을 찾아드립니다."}
                  </div>
                </>
              )}
              <Button
                style={{ marginTop: 16, background: "#fff", color: "#5b5be5", fontWeight: 700, border: "none" }}
                onClick={() => navigate("/")}
              >
                다시 분석하기
              </Button>
            </div>
            <img
              src="https://cdn.pixabay.com/photo/2017/01/10/19/05/icon-1970472_1280.png"
              alt=""
              style={{ width: 90, borderRadius: 12, marginLeft: 24, opacity: 0.9 }}
            />
          </Card>

          {/* 현재 사용 중인 툴 */}
          <Card style={{ marginBottom: 28, borderRadius: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: "#374151" }}>현재 사용 중인 툴</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {Array.isArray(selectedTools) && selectedTools.length > 0
                ? selectedTools.map((key) => {
                    const meta = TOOL_META[key] || { name: key };
                    return (
                      <Tag
                        key={key}
                        color={meta.color || "#5b5be5"}
                        style={{ fontSize: 14, padding: "5px 14px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        {meta.logo && <img src={meta.logo} alt={meta.name} style={{ width: 18, height: 18, borderRadius: 4 }} />}
                        {meta.icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{meta.icon}</span>}
                        {meta.name}
                      </Tag>
                    );
                  })
                : <Text type="secondary">선택된 툴이 없습니다.</Text>
              }
            </div>
          </Card>

          {/* 에러 상태 */}
          {error && (
            <Alert
              type="error"
              message="AI 추천 생성 실패"
              description={`${error} — 잠시 후 다시 시도해주세요.`}
              showIcon
              style={{ marginBottom: 24, borderRadius: 10 }}
              action={
                <Button size="small" onClick={() => window.location.reload()}>재시도</Button>
              }
            />
          )}

          {/* 로딩 */}
          {loading && <RecommendSkeleton />}

          {/* AI 추천 결과 */}
          {!loading && !error && recommendation && (
            <>
              {/* 추천 콤보 */}
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16, color: "#1f2937" }}>
                🤖 AI 맞춤 추천 조합
              </div>
              <Row gutter={24}>
                {(recommendation.combos || []).map((combo) => (
                  <Col xs={24} md={12} key={combo.type}>
                    <ComboCard
                      combo={combo}
                      onToolClick={onToolClick}
                      onSimulationClick={onSimulationClick}
                    />
                  </Col>
                ))}
              </Row>

              {/* 팁 */}
              {recommendation.tip && (
                <Alert
                  showIcon
                  type="info"
                  icon={<MaterialIcon name="tips_and_updates" size={18} color="#6366f1" fill={1} />}
                  message={<span style={{ fontWeight: 700, color: "#4c51bf" }}>이 팀을 위한 팁</span>}
                  description={<span style={{ lineHeight: 1.7 }}>{recommendation.tip}</span>}
                  style={{
                    marginBottom: 32, borderRadius: 10,
                    background: "#f0f0ff", border: "1px solid #c7d2fe",
                  }}
                />
              )}

              {/* 카테고리 */}
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16, color: "#1f2937" }}>
                카테고리별 추천 툴
              </div>
              <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
                {(recommendation.categories || []).map((cat, i) => (
                  <Col xs={24} sm={12} md={6} key={cat.title}>
                    <Card
                      hoverable
                      style={{ background: cat.color || "#6366f1", borderRadius: 14, border: "none", cursor: "pointer" }}
                      bodyStyle={{ padding: 20 }}
                    >
                      <div style={{ marginBottom: 8 }}>{CATEGORY_ICONS[i % CATEGORY_ICONS.length]}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{cat.title}</div>
                      <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>
                        {cat.tools}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* 다시 시작 */}
              <div style={{ textAlign: "center" }}>
                <Button size="large" onClick={() => navigate("/")} style={{ borderRadius: 10, fontWeight: 600 }}>
                  ← 팀 정보 다시 입력
                </Button>
              </div>
            </>
          )}

        </div>
      </Content>
    </Layout>
  );
}

export default ToolfitResult;
