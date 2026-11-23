import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Row, Col, Card, Tag, Button, Typography, Divider,
  Layout, Menu, Avatar, Badge, Skeleton, Alert, message,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import figmaLogo from "./assets/Figma.svg";
import notionLogo from "./assets/Notion.svg";
import trelloLogo from "./assets/trello.svg";
import { MaterialIcon } from "./components/MaterialIcon";
import { SlackMark, GithubMark } from "./icons/BrandIcons";
import { trackEvent, Events } from "./lib/analytics";
import { saveSession } from "./lib/storage";
import ToolDetailDrawer from "./ToolDetailDrawer";
import { useLanguage } from "./lib/LanguageContext";
import LangToggle from "./components/LangToggle";

const { Title, Text } = Typography;
const { Header, Content } = Layout;

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

const IS_PROD = import.meta.env.PROD;

const LOGO_STYLE = { width: 26, height: 26, objectFit: "contain", background: "#fff", borderRadius: 4, padding: 2 };

function resolveWorkerUrl() {
  const configured = WORKER_URL?.trim();
  if (configured && !configured.includes("YOUR-ACCOUNT")) return configured;
  if (!IS_PROD) return "http://localhost:8787";
  return null;
}

// ─── 현재 사용 중인 툴 메타데이터 ─────────────────────────────────────────
const TOOL_META = {
  figma:  { name: "Figma",   logo: figmaLogo,  color: "#a259ff" },
  notion: { name: "Notion",  logo: notionLogo, color: "#000" },
  slack:  { name: "Slack",   icon: <SlackMark size={20} style={{ color: "#4a154b" }} />, color: "#4a154b" },
  trello: { name: "Trello",  logo: trelloLogo, color: "#0079bf" },
  github: { name: "GitHub",  icon: <GithubMark size={20} style={{ color: "#24292e" }} />, color: "#24292e" },
  gsuite: { name: "Google Workspace", badge: "G", badgeColor: "#4285F4", color: "#4285f4" },
  jira:        { name: "Jira",             badge: "J",  badgeColor: "#0052CC", color: "#0052CC" },
  linear:      { name: "Linear",           badge: "L",  badgeColor: "#5E6AD2", color: "#5E6AD2" },
  vercel:      { name: "Vercel",           badge: "▲",  badgeColor: "#000",    color: "#000" },
  miro:        { name: "Miro",             badge: "M",  badgeColor: "#FFD02F", color: "#f5a623" },
  zeplin:      { name: "Zeplin",           badge: "Z",  badgeColor: "#FBBF24", color: "#FBBF24" },
  ga4:         { name: "Google Analytics", badge: "GA", badgeColor: "#E37400", color: "#E37400" },
  mixpanel:    { name: "Mixpanel",         badge: "MP", badgeColor: "#7856FF", color: "#7856FF" },
  amplitude:   { name: "Amplitude",        badge: "A",  badgeColor: "#1654F0", color: "#1654F0" },
  hubspot:     { name: "HubSpot",          badge: "H",  badgeColor: "#FF7A59", color: "#FF7A59" },
  mailchimp:   { name: "Mailchimp",        badge: "MC", badgeColor: "#FFE01B", color: "#c79a00" },
  semrush:     { name: "Semrush",          badge: "SR", badgeColor: "#FF642D", color: "#FF642D" },
  salesforce:  { name: "Salesforce",       badge: "SF", badgeColor: "#00A1E0", color: "#00A1E0" },
  apollo:      { name: "Apollo.io",        badge: "Ap", badgeColor: "#5C4EFF", color: "#5C4EFF" },
  outreach:    { name: "Outreach",         badge: "O",  badgeColor: "#5951E5", color: "#5951E5" },
  zendesk:     { name: "Zendesk",          badge: "Z",  badgeColor: "#03363D", color: "#03363D" },
  intercom:    { name: "Intercom",         badge: "I",  badgeColor: "#1F8DED", color: "#1F8DED" },
  gainsight:   { name: "Gainsight",        badge: "G",  badgeColor: "#FF6600", color: "#FF6600" },
  ms365:       { name: "Microsoft 365",    badge: "M",  badgeColor: "#D83B01", color: "#D83B01" },
};

function getToolMeta(key) {
  return TOOL_META[key] || {
    name: key.startsWith("custom_")
      ? key.replace("custom_", "").replace(/_/g, " ")
      : key,
    color: "#6366f1",
  };
}

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
function ComboCard({ combo, onToolClick, onDetailClick }) {
  const { lang, t } = useLanguage();
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
      style={{ marginBottom: 12, borderRadius: 14, width: "100%", height: "100%" }}
      bodyStyle={{ padding: "16px 20px" }}
    >
      {(combo.tools || []).map((tool) => (
        <div
          key={tool.name}
          onClick={() => onToolClick(combo, tool)}
          className="gl-row-hover"
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            marginBottom: 10, cursor: "pointer", padding: "8px 10px",
          }}
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
              <Tag color="green">{lang === "ko" ? "무료" : "Free"}</Tag>
            ) : (
              tool.priceLabel || `$${tool.price}${lang === "ko" ? "/월" : "/mo"}`
            )}
          </div>
        </div>
      ))}

      <Divider style={{ margin: "12px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, color: "#374151" }}>{t("resultTeamCost")}</span>
        <span style={{ fontWeight: 800, color: combo.tagColor, fontSize: 16 }}>
          ${combo.totalPrice}
          <span style={{ fontWeight: 400, fontSize: 12, color: "#888", marginLeft: 4 }}>
            {combo.totalLabel || (lang === "ko" ? "/월" : "/mo")}
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
        onClick={() => onDetailClick(combo)}
      >
        {t("resultDetailBtn")}
      </Button>
    </Card>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────
function GoleuResult(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  // router state 우선, 없으면 props fallback
  const s = location.state || {};
  const teamName        = s.teamName        || props.teamName        || "";
  const roles           = s.roles           || props.roles           || {};
  const selectedTools   = s.selectedTools   || props.selectedTools   || [];
  const selectedClouds  = s.selectedClouds  || props.selectedClouds  || [];
  const hostingType     = s.hostingType     || props.hostingType     || [];
  const monthlyBudget   = s.monthlyBudget   || props.monthlyBudget   || "";
  const selectedLLMs    = s.selectedLLMs    || props.selectedLLMs    || [];
  const useCases        = s.useCases        || props.useCases        || [];
  const monthlyAIBudget = s.monthlyAIBudget || props.monthlyAIBudget || "";
  const expectedUsage   = s.expectedUsage   || props.expectedUsage   || "";
  const savedRecommendation = props.savedRecommendation || null;
  const isSharedView    = props.isSharedView || false;

  const [loading, setLoading]             = useState(!savedRecommendation);
  const [recommendation, setRecommendation] = useState(savedRecommendation);
  const [error, setError]                 = useState(null);
  const [saveLoading, setSaveLoading]     = useState(false);
  const [savedId, setSavedId]             = useState(null);
  const [copied, setCopied]               = useState(false);
  const [detailDrawer, setDetailDrawer]   = useState({ open: false, tool: null, combo: null });
  const viewedRef = useRef(false);

  // ── Worker API 호출 ──────────────────────────────────────────────────────
  const fetchRecommendation = useCallback(() => {
    const url = resolveWorkerUrl();
    if (!url) {
      setError("서비스 점검 중입니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${url}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamName, roles, selectedTools,
        selectedClouds, hostingType, monthlyBudget,
        selectedLLMs, useCases, monthlyAIBudget, expectedUsage,
        lang,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRecommendation(data);
        saveSession({
          inputs: {
            teamName, roles, selectedTools,
            selectedClouds, hostingType, monthlyBudget,
            selectedLLMs, useCases, monthlyAIBudget, expectedUsage,
          },
          recommendation: data,
        });
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error("[GoleuResult]", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [
    teamName, roles, selectedTools,
    selectedClouds, hostingType, monthlyBudget,
    selectedLLMs, useCases, monthlyAIBudget, expectedUsage, lang,
  ]);

  useEffect(() => {
    if (savedRecommendation) {
      setRecommendation(savedRecommendation);
      setLoading(false);
      return;
    }
    fetchRecommendation();
  }, [fetchRecommendation, savedRecommendation]);

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

  const handleShare = async () => {
    if (!savedId) return handleSave();
    await navigator.clipboard.writeText(`${window.location.origin}/result/${savedId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSave = async () => {
    if (savedId) return handleShare();
    const url = resolveWorkerUrl();
    if (!url) return;
    setSaveLoading(true);
    try {
      const res = await fetch(`${url}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName, roles, selectedTools, selectedClouds,
          hostingType, monthlyBudget, selectedLLMs,
          useCases, monthlyAIBudget, expectedUsage,
          recommendation,
        }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setSavedId(d.id);
      await navigator.clipboard.writeText(`${window.location.origin}/result/${d.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      trackEvent("result_saved", { id: d.id });
    } catch {
      message.error("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePDF = () => {
    trackEvent("pdf_download", { team_name: teamName });
    window.print();
  };

  const openDetail = (combo, tool) => {
    trackEvent(Events.RECOMMENDATION_CLICKED, { combo: combo.type, tool_name: tool.name, tool_price: tool.price });
    setDetailDrawer({ open: true, tool, combo: combo.type });
  };
  const onToolClick = (combo, tool) => openDetail(combo, tool);
  const onDetailClick = (combo) => {
    trackEvent(Events.SIMULATION_CLICKED, { combo: combo.type });
    if (combo.tools?.length) openDetail(combo, combo.tools[0]);
  };
  const onProUpgradeClick = () => trackEvent(Events.PRO_UPGRADE_CLICKED, { source: "header" });

  // ── 렌더링 ───────────────────────────────────────────────────────────────
  return (
    <Layout style={{ minHeight: "100vh", background: "var(--bg-base)" }}>

      {/* ── 헤더 ── */}
      <Header className="no-print" style={{
        background: "var(--header-bg)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: 0, height: 64, display: "flex", alignItems: "center", zIndex: 10,
      }}>
        <div className="r-result-header">
          <div
            className="r-result-logo"
            onClick={() => navigate("/quiz")}
            style={{
              fontWeight: 900, fontSize: 20, cursor: "pointer",
              fontFamily: "var(--font-sans)", marginRight: 32,
              letterSpacing: "-0.5px", display: "inline-flex", alignItems: "center", gap: 8,
            }}
          >
            <img src="/favicon.svg" alt="" width={24} height={24} style={{ display: "block" }} />
            <span>
              <span style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Goleu</span>
              <span style={{ color: "var(--brand-ai-color)" }}> AI</span>
            </span>
          </div>

          <Menu
            className="r-result-nav"
            mode="horizontal"
            selectedKeys={["recommend"]}
            style={{ flex: 1, borderBottom: "none", background: "transparent", fontWeight: 600, color: "var(--text-primary)" }}
            items={[
              { key: "myteam",    label: "My Team" },
              { key: "explore",   label: "Explore" },
              { key: "recommend", label: "Recommend" },
            ]}
          />

          <div className="r-result-actions">
            <LangToggle style={{ marginRight: 8 }} />
            <Button
              type="primary"
              onClick={onProUpgradeClick}
              style={{ borderRadius: 20 }}
            >
              <span className="r-result-hide-sm">Pro </span>업그레이드
            </Button>
            <Badge count={2} size="small" className="r-result-hide-sm">
              <span style={{ cursor: "pointer", color: "#4c51bf", display: "inline-flex" }}>
                <MaterialIcon name="notifications" size={22} />
              </span>
            </Badge>
            <Avatar
              style={{ background: "#4c51bf", cursor: "pointer" }}
              icon={<MaterialIcon name="person" size={20} color="#fff" fill={1} />}
              onClick={() => navigate("/mypage")}
            />
          </div>
        </div>
      </Header>

      {/* ── 본문 ── */}
      <Content>
        <div className="r-result-content">

          <div id="print-header" style={{
            borderBottom: "2px solid #6366f1", paddingBottom: 12, marginBottom: 20,
          }}>
            <div style={{ fontWeight: 900, fontSize: 22, color: "#6366f1" }}>Goleu AI</div>
            <div style={{ fontSize: 13, color: "#888" }}>
              SaaS 스택 추천 결과 — {teamName || "팀"} ·
              생성일: {new Date().toLocaleDateString("ko-KR")}
            </div>
          </div>

          {/* 인사 배너 */}
          <Card
            style={{ background: "#5b5be5", borderRadius: 20, marginBottom: 28, border: "none" }}
            bodyStyle={{ padding: "28px 32px" }}
          >
            <div className="r-banner-flex">
            <div style={{ flex: 1 }}>
              {loading ? (
                <div>
                  <div style={{ height: 24, background: "rgba(255,255,255,0.25)", borderRadius: 6, width: 260, marginBottom: 12 }} />
                  <div style={{ height: 16, background: "rgba(255,255,255,0.15)", borderRadius: 6, width: 340 }} />
                </div>
              ) : (
                <>
                  <Title level={4} style={{ color: "#fff", margin: 0, fontFamily: "Pretendard, sans-serif" }}>
                    {recommendation?.greeting || (teamName && lang === "ko" ? `${teamName}님, ${t("resultGreetingFallback")}` : t("resultGreetingFallback"))}
                  </Title>
                  <div style={{ fontSize: 15, marginTop: 8, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                    {recommendation?.insight || t("resultInsightFallback")}
                  </div>
                </>
              )}
              <Button
                style={{ marginTop: 16, background: "#fff", color: "#5b5be5", fontWeight: 700, border: "none" }}
                onClick={() => navigate("/quiz")}
              >
                {t("btnRestart")}
              </Button>
            </div>
            <img
              className="r-banner-img"
              src="https://cdn.pixabay.com/photo/2017/01/10/19/05/icon-1970472_1280.png"
              alt=""
              style={{ width: 90, borderRadius: 12, marginLeft: 24, opacity: 0.9 }}
            />
            </div>
          </Card>

          {/* 현재 사용 중인 툴 */}
          <Card style={{ marginBottom: 28, borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: "var(--text-primary)" }}>{t("resultCurrentTools")}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {Array.isArray(selectedTools) && selectedTools.length > 0
                ? selectedTools.map((key) => {
                    const meta = getToolMeta(key);
                    return (
                      <Tag
                        key={key}
                        color={meta.color || "#5b5be5"}
                        style={{ fontSize: 14, padding: "5px 14px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        {meta.logo && <img src={meta.logo} alt={meta.name} style={{ ...LOGO_STYLE, width: 18, height: 18 }} />}
                        {meta.badge && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 18, height: 18, borderRadius: 4,
                            background: meta.badgeColor + "25",
                            fontWeight: 900, fontSize: 10, color: meta.badgeColor,
                          }}>{meta.badge}</span>
                        )}
                        {meta.icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{meta.icon}</span>}
                        {meta.name}
                      </Tag>
                    );
                  })
                : <Text type="secondary">{t("resultNoTools")}</Text>
              }
            </div>
          </Card>

          {/* 에러 상태 */}
          {error && (
            <Alert
              type="error"
              message={t("resultErrorTitle")}
              description={`${error} — ${lang === "ko" ? "잠시 후 다시 시도해주세요." : "Please try again later."}`}
              showIcon
              style={{ marginBottom: 24, borderRadius: 10 }}
              action={
                <Button size="small" onClick={fetchRecommendation}>{t("btnRetry")}</Button>
              }
            />
          )}

          {/* 로딩 */}
          {loading && <RecommendSkeleton />}

          {/* AI 추천 결과 */}
          {!loading && !error && recommendation && (
            <>
              {isSharedView ? (
                <div className="no-print" style={{ marginBottom: 24 }}>
                  <Button type="primary" onClick={() => navigate("/")} style={{ borderRadius: 8, fontWeight: 700 }}>
                    나도 분석하기 →
                  </Button>
                </div>
              ) : (
                <>
                  <div className="no-print" style={{
                    display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap",
                    padding: "14px 18px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 12,
                  }}>
                    <Button
                      type="primary"
                      icon={<MaterialIcon name="bookmark" size={16} color="#fff" fill={1} />}
                      loading={saveLoading}
                      onClick={handleSave}
                      style={{ borderRadius: 8, fontWeight: 700 }}
                    >
                      {savedId ? t("saved") : t("btnSave")}
                    </Button>
                    <Button
                      icon={<MaterialIcon name="share" size={16} color="#6366f1" />}
                      onClick={handleShare}
                      disabled={!savedId}
                      style={{ borderRadius: 8, fontWeight: 600, color: "#6366f1", borderColor: "#6366f1" }}
                    >
                      {copied ? t("saved") : t("btnShare")}
                    </Button>
                    <Button
                      icon={<MaterialIcon name="picture_as_pdf" size={16} color="#374151" />}
                      onClick={handlePDF}
                      style={{ borderRadius: 8, fontWeight: 600 }}
                    >
                      {t("btnPDF")}
                    </Button>
                  </div>

                  {copied && (
                    <Alert
                      type="success"
                      message={t("resultLinkCopied")}
                      showIcon
                      closable
                      className="no-print"
                      style={{ marginBottom: 16, borderRadius: 8 }}
                    />
                  )}
                </>
              )}

              {/* 추천 콤보 */}
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16, color: "#1f2937" }}>
                {t("resultCombosTitle")}
              </div>
              <Row gutter={24} align="stretch" style={{ marginBottom: 32 }}>
                {(recommendation.combos || []).map((combo) => (
                  <Col xs={24} md={12} key={combo.type} style={{ display: "flex" }}>
                    <ComboCard
                      combo={combo}
                      onToolClick={onToolClick}
                      onDetailClick={onDetailClick}
                    />
                  </Col>
                ))}
              </Row>

              {/* 팁 */}
              {recommendation.tip && (
                <Alert
                  showIcon
                  type="info"
                  message={<span style={{ fontWeight: 700, color: "#4c51bf" }}>{t("resultTipTitle")}</span>}
                  description={<span style={{ lineHeight: 1.7 }}>{recommendation.tip}</span>}
                  style={{
                    marginBottom: 32, borderRadius: 10,
                    background: "#f0f0ff", border: "1px solid #c7d2fe",
                  }}
                />
              )}

              {/* 카테고리 */}
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16, color: "#1f2937" }}>
                {t("resultCategoryTitle")}
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
                <Button size="large" onClick={() => navigate("/quiz")} style={{ borderRadius: 10, fontWeight: 600 }}>
                  {t("btnBackTeam")}
                </Button>
              </div>
            </>
          )}

        </div>

        <ToolDetailDrawer
          open={detailDrawer.open}
          onClose={() => setDetailDrawer((d) => ({ ...d, open: false }))}
          tool={detailDrawer.tool}
          combo={detailDrawer.combo}
          teamInfo={{
            teamName, roles, selectedTools, selectedClouds,
            hostingType, monthlyBudget, selectedLLMs,
            useCases, monthlyAIBudget, expectedUsage, lang,
          }}
        />
      </Content>
    </Layout>
  );
}

export default GoleuResult;
