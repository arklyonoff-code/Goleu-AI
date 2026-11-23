import React, { useCallback, useEffect, useState } from "react";
import {
  Drawer, Button, Tag, Divider, Skeleton, Alert,
  Progress, Typography, Row, Col,
} from "antd";
import { MaterialIcon } from "./components/MaterialIcon";

const { Text } = Typography;
const WORKER_URL = import.meta.env.VITE_WORKER_URL;

function resolveWorkerUrl() {
  const u = WORKER_URL?.trim();
  if (u && !u.includes("YOUR-ACCOUNT")) return u;
  return import.meta.env.PROD ? null : "http://localhost:8787";
}

function StarScore({ score, label }) {
  const full = Math.floor(score);
  const half = score % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 18 }}>
        {"★".repeat(full)}{half ? "⯨" : ""}{"☆".repeat(empty)}
      </span>
      {label && <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>}
    </div>
  );
}

const AI_SCORE_LABELS = {
  agentCompatibility: "AI Agent 적합도",
  automation: "자동화",
  api: "API",
  mcp: "MCP",
  integration: "Integration",
};

export default function ToolDetailDrawer({ open, onClose, tool, combo, teamInfo }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(() => {
    if (!tool) return;
    const url = resolveWorkerUrl();
    if (!url) { setError("서비스 설정 필요"); return; }

    setLoading(true);
    setError(null);
    setDetail(null);

    fetch(`${url}/detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool, combo, teamInfo }),
    })
      .then(async (r) => {
        if (!r.ok) {
          let msg = `서버 오류 (${r.status})`;
          try {
            const errData = await r.json();
            if (errData.error) msg = errData.error;
          } catch {
            /* ignore */
          }
          throw new Error(msg);
        }
        return r.json();
      })
      .then((d) => { if (d.error) throw new Error(d.error); setDetail(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tool, combo, teamInfo]);

  useEffect(() => { if (open && tool) fetchDetail(); }, [open, tool, fetchDetail]);

  const totalMembers = Object.values(teamInfo?.roles || {})
    .reduce((s, n) => s + (parseInt(n) || 0), 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      className="tool-detail-drawer"
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 900, fontSize: 18 }}>{tool?.name}</span>
          {detail && <Tag color="#6366f1">{detail.tagline}</Tag>}
        </div>
      }
      extra={
        <Button size="small" onClick={fetchDetail} disabled={loading}>
          <MaterialIcon name="refresh" size={14} color="#6b7280" />
        </Button>
      }
      styles={{ body: { padding: "20px 24px" } }}
    >
      {loading && <Skeleton active paragraph={{ rows: 12 }} />}
      {error && (
        <Alert
          type="error"
          message="상세 정보를 불러올 수 없습니다"
          description={
            <div>
              <div style={{ marginBottom: 8 }}>{error}</div>
              {error.includes("설정") && (
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Worker URL 또는 서버 설정을 확인한 뒤 다시 시도해 주세요.
                </div>
              )}
            </div>
          }
          showIcon
          action={<Button size="small" onClick={fetchDetail}>재시도</Button>}
        />
      )}

      {detail && (
        <>
          <div style={{ marginBottom: 24 }}>
            <StarScore score={detail.overallScore} label="AI Builder 추천 점수" />
          </div>

          <Section title="왜 추천했나요?" icon="check_circle">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(detail.whyRecommended || []).map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <MaterialIcon name="check_circle" size={16} color="#10b981" fill={1} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6 }}>{r}</span>
                </div>
              ))}
            </div>
          </Section>

          <Divider style={{ margin: "18px 0" }} />

          <Row gutter={16} style={{ marginBottom: 18 }}>
            <Col span={12}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#10b981", marginBottom: 10 }}>장점</div>
              {(detail.pros || []).map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: "#10b981", flexShrink: 0 }}>•</span>
                  <span style={{ color: "var(--text-primary)" }}>{p}</span>
                </div>
              ))}
            </Col>
            <Col span={12}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#ef4444", marginBottom: 10 }}>단점</div>
              {(detail.cons || []).map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: "#ef4444", flexShrink: 0 }}>•</span>
                  <span style={{ color: "var(--text-primary)" }}>{c}</span>
                </div>
              ))}
            </Col>
          </Row>

          <Divider style={{ margin: "18px 0" }} />

          <Section title="예상 비용" icon="payments">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {(detail.pricing?.tiers || []).map((tier) => (
                <div
                  key={tier.name}
                  style={{
                    padding: "10px 16px", borderRadius: 10,
                    border: `2px solid ${tier.highlight ? "#6366f1" : "var(--border-subtle)"}`,
                    background: tier.highlight ? "rgba(99,102,241,0.08)" : "var(--bg-elevated)",
                    textAlign: "center", minWidth: 80,
                  }}
                >
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{tier.name}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: tier.highlight ? "#6366f1" : "var(--text-primary)" }}>
                    {tier.price === 0 ? "무료" : `$${tier.price}`}
                  </div>
                  {tier.price > 0 && <div style={{ fontSize: 10, color: "var(--text-muted)" }}>/인당</div>}
                </div>
              ))}
            </div>
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)",
            }}>
              <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, marginBottom: 6 }}>
                {totalMembers}명 팀 기준
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>월 비용</span>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "#6366f1" }}>
                    ${detail.pricing?.teamMonthly ?? "—"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>연 비용</span>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "#4f46e5" }}>
                    ${detail.pricing?.teamAnnual ?? "—"}
                  </div>
                </div>
              </div>
              {detail.pricing?.note && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                  💡 {detail.pricing.note}
                </div>
              )}
            </div>
          </Section>

          <Divider style={{ margin: "18px 0" }} />

          <Section title="AI 활용도" icon="auto_awesome">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(AI_SCORE_LABELS).map(([key, label]) => {
                const score = detail.aiScore?.[key] ?? 0;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)", width: 120, flexShrink: 0 }}>{label}</span>
                    <Progress
                      percent={score * 20}
                      showInfo={false}
                      strokeColor="#6366f1"
                      trailColor="var(--border-subtle)"
                      style={{ flex: 1, margin: 0 }}
                      size="small"
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", width: 24, textAlign: "right" }}>{score}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          <Divider style={{ margin: "18px 0" }} />

          <Section title="추천 워크플로우" icon="account_tree">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
              {(detail.workflow || []).map((step, i) => (
                <React.Fragment key={i}>
                  <div style={{
                    padding: "8px 18px", borderRadius: 8,
                    background: step === tool.name ? "#6366f1" : "var(--bg-elevated)",
                    border: `1px solid ${step === tool.name ? "#6366f1" : "var(--border-subtle)"}`,
                    fontWeight: step === tool.name ? 700 : 500,
                    color: step === tool.name ? "#fff" : "var(--text-primary)",
                    fontSize: 14,
                  }}>
                    {step}
                  </div>
                  {i < detail.workflow.length - 1 && (
                    <div style={{ paddingLeft: 18, color: "var(--text-muted)", fontSize: 18, lineHeight: 1 }}>↓</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </Section>

          <Divider style={{ margin: "18px 0" }} />

          <Row gutter={16}>
            <Col span={12}>
              <Section title="비슷한 서비스" icon="compare">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(detail.similar || []).map((s) => (
                    <Tag key={s} style={{ borderRadius: 6, fontSize: 13, padding: "4px 10px" }}>{s}</Tag>
                  ))}
                </div>
              </Section>
            </Col>
            <Col span={12}>
              <Section title="추천하지 않는 경우" icon="do_not_disturb_on">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(detail.notFor || []).map((n, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, fontSize: 13 }}>
                      <span style={{ color: "#9ca3af", flexShrink: 0 }}>✗</span>
                      <span style={{ color: "var(--text-secondary)" }}>{n}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </Col>
          </Row>
        </>
      )}
    </Drawer>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <MaterialIcon name={icon} size={16} color="#6366f1" fill={1} />
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
