import React, { useEffect, useState } from "react";
import {
  Layout, Card, Tag, Button, Typography, Row, Col,
  Divider, Avatar, Empty, Tooltip, Badge,
} from "antd";
import { useNavigate } from "react-router-dom";
import { loadSession, clearSession } from "./lib/storage";
import { MaterialIcon } from "./components/MaterialIcon";
import { SlackMark, GithubMark } from "./icons/BrandIcons";
import figmaLogo from "./assets/Figma.svg";
import notionLogo from "./assets/Notion.svg";
import trelloLogo from "./assets/trello.svg";
import { trackEvent } from "./lib/analytics";
import { useLanguage } from "./lib/LanguageContext";
import LangToggle from "./components/LangToggle";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// ─── 현재 툴 메타 ────────────────────────────────────────────────────────────
const LOGO_STYLE = { width: 16, height: 16, objectFit: "contain", background: "#fff", borderRadius: 3, padding: 2 };

const TOOL_META = {
  figma:  { name: "Figma",   logo: figmaLogo,  color: "#a259ff" },
  notion: { name: "Notion",  logo: notionLogo, color: "#000" },
  slack:  { name: "Slack",   icon: <SlackMark size={18} style={{ color: "#4a154b" }} />, color: "#4a154b" },
  trello: { name: "Trello",  logo: trelloLogo, color: "#0079bf" },
  github: { name: "GitHub",  icon: <GithubMark size={18} style={{ color: "#24292e" }} />, color: "#24292e" },
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

const ROLE_LABELS = {
  product: "Product",
  engineering: "Engineering",
  design: "Design",
  data: "Data & Analytics",
  marketing: "Marketing & Growth",
  sales: "Sales",
  cs: "CS / Support",
  operations: "Operations",
};

const ROLE_COLORS = {
  product: "#ede9fe",
  engineering: "#e9d8fd",
  design: "#fce7f3",
  data: "#cffafe",
  marketing: "#fef9c3",
  sales: "#d1fae5",
  cs: "#ffedd5",
  operations: "#f1f5f9",
};

// ─── 다운로드 헬퍼 ────────────────────────────────────────────────────────────
function downloadJSON(session) {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `goleu-${session.inputs?.teamName || "result"}-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  trackEvent("mypage_download", { format: "json" });
}

function downloadHTML(session) {
  const { inputs = {}, recommendation = {}, savedAt } = session;
  const totalMembers = Object.values(inputs.roles || {}).reduce((s, n) => s + (parseInt(n) || 0), 0);

  const roleRows = Object.entries(inputs.roles || {})
    .filter(([, n]) => parseInt(n) > 0)
    .map(([k, n]) => `<li>${ROLE_LABELS[k] || k}: ${n}명</li>`)
    .join("");

  const comboHTML = (recommendation.combos || []).map(combo => `
    <div class="combo">
      <h3>${combo.label} <span class="tag">${combo.tag}</span> <span class="savings">${combo.savings || ""}</span></h3>
      <table>
        <thead><tr><th>툴</th><th>역할</th><th>가격</th><th>추천 이유</th></tr></thead>
        <tbody>
          ${(combo.tools || []).map(t => `
            <tr>
              <td><b>${t.name}</b></td>
              <td>${t.desc || ""}</td>
              <td>${t.price === 0 ? "무료" : (t.priceLabel || `$${t.price}/월`)}</td>
              <td>${t.reason || ""}</td>
            </tr>`).join("")}
        </tbody>
      </table>
      <p class="total">팀 전체 예상 비용: <b>$${combo.totalPrice}${combo.totalLabel ? " " + combo.totalLabel : "/월"}</b></p>
    </div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<title>Goleu AI 스펙 리포트 — ${inputs.teamName || "팀"}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Apple SD Gothic Neo', 'Pretendard', sans-serif; color: #1a1a2e; padding: 40px; max-width: 860px; margin: 0 auto; }
  h1 { color: #4c51bf; font-size: 28px; margin-bottom: 4px; }
  .meta { color: #888; font-size: 13px; margin-bottom: 32px; }
  h2 { font-size: 18px; color: #374151; margin: 28px 0 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  h3 { font-size: 16px; color: #4c51bf; margin-bottom: 10px; }
  .tag { background: #e0e7ff; color: #4c51bf; font-size: 11px; padding: 2px 8px; border-radius: 10px; margin-left: 6px; }
  .savings { color: #10b981; font-size: 13px; font-weight: normal; }
  ul { padding-left: 20px; }
  li { margin-bottom: 4px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 13px; }
  th { background: #f5f5ff; color: #4c51bf; padding: 8px 10px; text-align: left; }
  td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
  .total { font-size: 14px; color: #374151; margin-top: 4px; text-align: right; }
  .combo { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; margin-bottom: 20px; }
  .tip { background: #f0f0ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 16px; font-size: 14px; line-height: 1.8; color: #374151; }
  .insight { background: #fff; border-left: 4px solid #6366f1; padding: 12px 16px; margin: 12px 0; font-size: 14px; color: #374151; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #aaa; text-align: center; }
  @media print {
    body { padding: 20px; }
    .combo { break-inside: avoid; }
  }
</style>
</head>
<body>
  <h1>🔧 Goleu AI 스펙 리포트</h1>
  <div class="meta">생성일: ${savedAt ? new Date(savedAt).toLocaleString("ko-KR") : ""} &nbsp;|&nbsp; goleu.ai</div>

  <h2>📋 팀 정보</h2>
  <ul>
    <li>팀 이름: <b>${inputs.teamName || "미입력"}</b></li>
    <li>총 인원: <b>${totalMembers}명</b></li>
    ${roleRows}
    ${inputs.monthlyBudget ? `<li>월 예산: <b>${inputs.monthlyBudget}</b></li>` : ""}
    ${inputs.selectedClouds?.length ? `<li>클라우드: ${inputs.selectedClouds.join(", ")}</li>` : ""}
    ${inputs.selectedLLMs?.length ? `<li>AI 서비스: ${inputs.selectedLLMs.join(", ")}</li>` : ""}
  </ul>
  ${inputs.selectedTools?.length ? `
  <h2>🛠 현재 사용 툴</h2>
  <ul>${inputs.selectedTools.map(t => `<li>${getToolMeta(t).name}</li>`).join("")}</ul>` : ""}

  <h2>🤖 AI 추천 결과</h2>
  ${recommendation.insight ? `<div class="insight">💡 ${recommendation.insight}</div>` : ""}
  ${comboHTML}

  ${recommendation.tip ? `
  <h2>✨ 이 팀을 위한 팁</h2>
  <div class="tip">${recommendation.tip}</div>` : ""}

  <div class="footer">Goleu AI — AI 에이전트 빌더를 위한 도구 추천 | goleu.ai</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `goleu-${inputs.teamName || "report"}-${new Date().toISOString().slice(0,10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
  trackEvent("mypage_download", { format: "html" });
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function MyPage() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(loadSession());
    setLoading(false);
    trackEvent("mypage_viewed", {});
  }, []);

  const handleClear = () => {
    clearSession();
    setSession(null);
    trackEvent("mypage_cleared", {});
  };

  const inputs         = session?.inputs || {};
  const recommendation = session?.recommendation || {};
  const totalMembers   = Object.values(inputs.roles || {}).reduce((s, n) => s + (parseInt(n) || 0), 0);
  const savedDate      = session?.savedAt
    ? new Date(session.savedAt).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <Layout style={{ minHeight: "100vh", background: "var(--bg-base)" }}>

      {/* ── 헤더 ── */}
      <Header style={{
        background: "var(--header-bg)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: 0, height: 64, display: "flex", alignItems: "center", zIndex: 10,
        position: "sticky", top: 0,
      }}>
        <div className="r-mypage-header" style={{
          display: "flex", alignItems: "center",
        }}>
          <div
            onClick={() => navigate("/")}
            style={{
              fontWeight: 900, fontSize: 22, cursor: "pointer",
              fontFamily: "var(--font-sans)", display: "inline-flex", alignItems: "center", gap: 8,
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
          <div style={{ flex: 1 }} />
          <LangToggle style={{ marginRight: 12 }} />
          <span style={{ color: "#6366f1", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-sans)" }}>{t("mypageTitle")}</span>
        </div>
      </Header>

      {/* ── 본문 ── */}
      <Content style={{ background: "var(--bg-base)" }}>
        <div className="r-mypage-content">

          {/* 빈 상태 */}
          {!loading && !session && (
            <Card style={{ borderRadius: 16, textAlign: "center", padding: "40px 0", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <Empty
                description={
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                      {t("mypageEmpty")}
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                      {t("mypageEmptyDesc")}
                    </div>
                  </div>
                }
              />
              <Button
                type="primary"
                size="large"
                style={{ marginTop: 24, borderRadius: 10, fontWeight: 700 }}
                onClick={() => navigate("/")}
              >
                {t("mypageStartBtn")}
              </Button>
            </Card>
          )}

          {/* 세션 있을 때 */}
          {!loading && session && (
            <>
              {/* 프로필 배너 */}
              <Card
                style={{ background: "#5b5be5", borderRadius: 20, marginBottom: 24, border: "none" }}
                bodyStyle={{ padding: "24px 28px" }}
              >
                <div className="r-profile-banner">
                <Avatar
                  size={64}
                  style={{ background: "rgba(255,255,255,0.25)", flexShrink: 0, fontSize: 28 }}
                >
                  {inputs.teamName ? inputs.teamName[0].toUpperCase() : "T"}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ color: "#fff", margin: 0, fontFamily: "Pretendard, sans-serif" }}>
                    {inputs.teamName || "내 팀"} 스펙 리포트
                  </Title>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>
                    {savedDate && `마지막 분석: ${savedDate}`}
                    {totalMembers > 0 && ` · 총 ${totalMembers}명`}
                  </div>
                </div>
                <div className="r-profile-actions" style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                  <Tooltip title="HTML 파일로 다운로드 (인쇄 가능)">
                    <Button
                      icon={<MaterialIcon name="download" size={16} color="#fff" fill={1} />}
                      type="primary"
                      onClick={() => downloadHTML(session)}
                    >
                      {t("mypageReport")}
                    </Button>
                  </Tooltip>
                  <Tooltip title="JSON 데이터로 다운로드">
                    <Button
                      icon={<MaterialIcon name="data_object" size={16} color="#6b7280" fill={1} />}
                      onClick={() => downloadJSON(session)}
                    >
                      {t("mypageJSON")}
                    </Button>
                  </Tooltip>
                </div>
                </div>
              </Card>

              {/* 팀 정보 */}
              <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                  <Card style={{ borderRadius: 12, height: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }} bodyStyle={{ padding: "18px 20px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, fontSize: 14 }}>
                      {t("mypageTeamComp")}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {Object.entries(inputs.roles || {})
                        .filter(([, n]) => parseInt(n) > 0)
                        .map(([key, n]) => (
                          <Tag
                            key={key}
                            style={{
                              background: ROLE_COLORS[key] || "#f3f4f6",
                              border: "none", borderRadius: 20,
                              padding: "4px 12px", fontSize: 13, fontWeight: 600,
                            }}
                          >
                            {ROLE_LABELS[key] || key} {n}명
                          </Tag>
                        ))}
                      {totalMembers === 0 && <Text type="secondary">구성 없음</Text>}
                    </div>
                    {inputs.monthlyBudget && (
                      <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)" }}>
                        💰 월 예산: <b style={{ color: "var(--text-primary)" }}>{inputs.monthlyBudget}</b>
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card style={{ borderRadius: 12, height: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }} bodyStyle={{ padding: "18px 20px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, fontSize: 14 }}>
                      {t("mypageCurrentTools")}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(inputs.selectedTools || []).length > 0
                        ? inputs.selectedTools.map(key => {
                            const meta = getToolMeta(key);
                            return (
                              <Tag
                                key={key}
                                color={meta.color || "#5b5be5"}
                                style={{ fontSize: 13, padding: "3px 12px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}
                              >
                                {meta.logo && <img src={meta.logo} alt={meta.name} style={LOGO_STYLE} />}
                                {meta.badge && (
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    width: 16, height: 16, borderRadius: 3,
                                    background: meta.badgeColor + "25",
                                    fontWeight: 900, fontSize: 9, color: meta.badgeColor,
                                  }}>{meta.badge}</span>
                                )}
                                {meta.icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{meta.icon}</span>}
                                {meta.name}
                              </Tag>
                            );
                          })
                        : <Text type="secondary">선택된 툴 없음</Text>
                      }
                    </div>
                    {(inputs.selectedClouds || []).length > 0 && (
                      <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
                        ☁️ 클라우드: {inputs.selectedClouds.join(", ")}
                      </div>
                    )}
                    {(inputs.selectedLLMs || []).length > 0 && (
                      <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>
                        🤖 AI 서비스: {inputs.selectedLLMs.join(", ")}
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>

              {/* AI 추천 인사이트 */}
              {recommendation.insight && (
                <div style={{
                  background: "var(--gl-primary-light)", border: "1px solid var(--gl-primary-border)",
                  borderRadius: 10, padding: "12px 18px", marginBottom: 20,
                  fontSize: 14, color: "var(--accent-indigo)", fontWeight: 600,
                }}>
                  💡 {recommendation.insight}
                </div>
              )}

              {/* 추천 콤보 */}
              {(recommendation.combos || []).length > 0 && (
                <>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 14 }}>
                    {t("mypageStackTitle")}
                  </div>
                  <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                    {recommendation.combos.map(combo => (
                      <Col xs={24} md={12} xl={8} key={combo.type}>
                        <Card
                          style={{ borderRadius: 12, height: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                          bodyStyle={{ padding: "18px 20px" }}
                          title={
                            <span>
                              {combo.label}{" "}
                              <Tag color={combo.tagColor} style={{ fontWeight: 600 }}>{combo.tag}</Tag>
                            </span>
                          }
                          extra={
                            <Text type="secondary" style={{ fontSize: 12 }}>{combo.savings}</Text>
                          }
                        >
                          {(combo.tools || []).map(tool => (
                            <div
                              key={tool.name}
                              style={{
                                display: "flex", justifyContent: "space-between",
                                alignItems: "flex-start", marginBottom: 10,
                                padding: "6px 0", borderBottom: "1px solid var(--border-subtle)",
                              }}
                            >
                              <div style={{ flex: 1, paddingRight: 10 }}>
                                <b style={{ fontSize: 14, color: "var(--text-primary)" }}>{tool.name}</b>{" "}
                                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{tool.desc}</span>
                                {tool.reason && (
                                  <div style={{ color: "#6366f1", fontSize: 11, marginTop: 2 }}>
                                    💡 {tool.reason}
                                  </div>
                                )}
                              </div>
                              <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
                                {tool.price === 0
                                  ? <Tag color="green">무료</Tag>
                                  : tool.priceLabel || `$${tool.price}/월`}
                              </div>
                            </div>
                          ))}
                          <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginTop: 12,
                          }}>
                            <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 13 }}>
                              팀 전체 예상 비용
                            </span>
                            <span style={{ fontWeight: 800, color: combo.tagColor, fontSize: 16 }}>
                              ${combo.totalPrice}
                              <span style={{ fontWeight: 400, fontSize: 11, color: "#9ca3af", marginLeft: 3 }}>
                                {combo.totalLabel || "/월"}
                              </span>
                            </span>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              )}

              {/* 팁 */}
              {recommendation.tip && (
                <Card
                  style={{ borderRadius: 12, marginBottom: 24, background: "var(--gl-primary-light)", border: "1px solid var(--gl-primary-border)" }}
                  bodyStyle={{ padding: "18px 20px" }}
                >
                  <div style={{ fontWeight: 700, color: "var(--accent-indigo)", marginBottom: 8, fontSize: 14 }}>
                    {t("mypageTipTitle")}
                  </div>
                  <div style={{ color: "var(--text-primary)", fontSize: 14, lineHeight: 1.8 }}>
                    {recommendation.tip}
                  </div>
                </Card>
              )}

              {/* 액션 버튼들 */}
              <Divider />
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<MaterialIcon name="download" size={18} color="#fff" fill={1} />}
                  onClick={() => downloadHTML(session)}
                >
                  {t("mypageReport")}
                </Button>
                <Button
                  size="large"
                  icon={<MaterialIcon name="data_object" size={18} color="#374151" fill={1} />}
                  onClick={() => downloadJSON(session)}
                >
                  {t("mypageJSON")}
                </Button>
                <Button
                  size="large"
                  icon={<MaterialIcon name="refresh" size={18} color="#374151" fill={1} />}
                  onClick={() => navigate("/")}
                >
                  {t("mypageRestart")}
                </Button>
                <Button
                  size="large"
                  danger
                  onClick={handleClear}
                >
                  {t("mypageClear")}
                </Button>
              </div>
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
}
