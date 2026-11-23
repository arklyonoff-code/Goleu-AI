import { useEffect, useRef, useState } from "react";
import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import QuizLayout from "./components/QuizLayout";
import { MaterialIcon } from "./components/MaterialIcon";
import { trackEvent, Events } from "./lib/analytics";
import { useLanguage } from "./lib/LanguageContext";

const ROLES = [
  {
    key: "product",
    label: "Product",
    labelKo: "프로덕트",
    desc: "PM · PO · Strategy",
    emoji: "🎯",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.15)",
  },
  {
    key: "engineering",
    label: "Engineering",
    labelKo: "엔지니어링",
    desc: "Frontend · Backend · DevOps · AI",
    emoji: "💻",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.15)",
  },
  {
    key: "design",
    label: "Design",
    labelKo: "디자인",
    desc: "UX · UI · Research · Creative",
    emoji: "🎨",
    color: "#ec4899",
    bg: "rgba(236,72,153,0.15)",
  },
  {
    key: "data",
    label: "Data & Analytics",
    labelKo: "데이터",
    desc: "Analyst · Scientist · BI",
    emoji: "📊",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.15)",
  },
  {
    key: "marketing",
    label: "Marketing & Growth",
    labelKo: "마케팅",
    desc: "Content · SEO · Performance",
    emoji: "📣",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
  },
  {
    key: "sales",
    label: "Sales",
    labelKo: "세일즈",
    desc: "AE · BDR · SDR · Account Mgr",
    emoji: "💼",
    color: "#10b981",
    bg: "rgba(16,185,129,0.15)",
  },
  {
    key: "cs",
    label: "CS / Support",
    labelKo: "고객 성공",
    desc: "Customer Success · Support",
    emoji: "🤝",
    color: "#f97316",
    bg: "rgba(249,115,22,0.15)",
  },
  {
    key: "operations",
    label: "Operations",
    labelKo: "운영",
    desc: "HR · Finance · Legal · Admin",
    emoji: "⚙️",
    color: "#64748b",
    bg: "rgba(100,116,139,0.15)",
  },
];

export default function GoleuMain({ teamName, setTeamName, roles, setRoles }) {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const quizStartedRef = useRef(false);

  const [selectedKeys, setSelectedKeys] = useState(() =>
    Object.keys(roles).filter((k) => (roles[k] || 0) > 0)
  );

  useEffect(() => {
    if (quizStartedRef.current) return;
    quizStartedRef.current = true;
    trackEvent(Events.QUIZ_STARTED, { entry_step: 1 });
  }, []);

  const toggleRole = (key) => {
    setSelectedKeys((prev) => {
      if (prev.includes(key)) {
        setRoles((r) => ({ ...r, [key]: 0 }));
        return prev.filter((k) => k !== key);
      }
      setRoles((r) => ({ ...r, [key]: r[key] || 1 }));
      return [...prev, key];
    });
  };

  const changeCount = (key, delta) => {
    setRoles((prev) => ({ ...prev, [key]: Math.max(1, (prev[key] || 1) + delta) }));
  };

  const totalMembers = Object.values(roles).reduce((s, n) => s + (Number(n) || 0), 0);

  const handleNext = () => {
    trackEvent(Events.QUIZ_STEP_COMPLETED, {
      step: 1,
      step_name: "team",
      team_name_provided: !!teamName,
      total_headcount: totalMembers,
      selected_roles: selectedKeys.join(","),
      ...Object.fromEntries(ROLES.map((r) => [`role_${r.key}`, roles[r.key] || 0])),
    });
    navigate("/tools");
  };

  const sidePanel = (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 16, padding: "28px",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
        color: "var(--accent-indigo)", letterSpacing: 1, marginBottom: 20,
      }}>
        STEP 1 / 4
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
        {t("s1SideTitle")}
      </h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 24px", lineHeight: 1.6 }}>
        {t("s1SideDesc")}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {teamName && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg-surface)", borderRadius: 10 }}>
            <MaterialIcon name="group" size={16} color="var(--accent-indigo)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{teamName}</span>
          </div>
        )}
        {totalMembers > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg-surface)", borderRadius: 10 }}>
            <MaterialIcon name="people" size={16} color="var(--accent-indigo)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              {lang === "ko" ? "총" : "Total"} {totalMembers}{lang === "ko" ? "명" : " members"}
            </span>
          </div>
        )}
        {ROLES.filter((r) => selectedKeys.includes(r.key) && (roles[r.key] || 0) > 0).map((r) => (
          <div key={r.key} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 14px", background: "var(--bg-surface)", borderRadius: 10,
          }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {r.emoji} {r.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>
              {roles[r.key]}{lang === "ko" ? "명" : ""}
            </span>
          </div>
        ))}
        {selectedKeys.length === 0 && !teamName && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>
            {lang === "ko" ? <>직무를 선택하면<br />여기에 표시됩니다</> : <>Select roles to<br />see them here</>}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <QuizLayout
      step={1}
      title={t("s1Title")}
      subtitle={t("s1Subtitle")}
      onNext={handleNext}
      onBack={() => navigate("/")}
      nextLabel={t("btnNext")}
      nextDisabled={totalMembers < 1}
      nextHint={totalMembers < 1 ? t("s1NextHint") : undefined}
      side={sidePanel}
    >
      <div style={{ marginBottom: 28 }}>
        <label style={{
          display: "block", fontWeight: 700, fontSize: 15,
          color: "var(--text-primary)", marginBottom: 10,
        }}>
          {t("s1TeamLabel")} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{t("s1TeamOptional")}</span>
        </label>
        <Input
          size="large"
          placeholder={t("s1TeamPlaceholder")}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          style={{
            borderRadius: 10, fontSize: 16,
            background: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
            height: 52,
          }}
          prefix={<MaterialIcon name="group" size={20} color="var(--text-muted)" />}
        />
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", display: "block", marginBottom: 14 }}>
          {t("s1RoleLabel")}{" "}
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{t("s1RoleHint")}</span>
        </label>

        <div className="role-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {ROLES.map(({ key, label, desc, emoji, color, bg }) => {
            const selected = selectedKeys.includes(key);
            return (
              <div
                key={key}
                onClick={() => toggleRole(key)}
                style={{
                  position: "relative",
                  padding: "16px 14px",
                  borderRadius: 14,
                  border: `2px solid ${selected ? color : "var(--border-subtle)"}`,
                  background: selected ? bg : "var(--bg-elevated)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "center",
                  userSelect: "none",
                }}
              >
                {selected && (
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    width: 18, height: 18, borderRadius: "50%",
                    background: color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <MaterialIcon name="check" size={12} color="#fff" />
                  </div>
                )}
                <div style={{ fontSize: 26, marginBottom: 8 }}>{emoji}</div>
                <div style={{
                  fontWeight: 700, fontSize: 13,
                  color: selected ? color : "var(--text-primary)",
                  lineHeight: 1.3, marginBottom: 4,
                }}>
                  {label}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedKeys.length > 0 && (
        <div style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: 14,
          padding: "20px 20px 12px",
          background: "var(--bg-surface)",
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>
            {t("s1HeadcountLabel")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ROLES.filter((r) => selectedKeys.includes(r.key)).map(({ key, label, labelKo, emoji, color, bg }) => (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--bg-elevated)",
                  border: `1.5px solid ${color}25`,
                  borderRadius: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {emoji}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{labelKo}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); changeCount(key, -1); }}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: "1.5px solid var(--border-subtle)",
                      background: "var(--bg-surface)",
                      cursor: (roles[key] || 1) <= 1 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 16, color: "var(--text-secondary)",
                      opacity: (roles[key] || 1) <= 1 ? 0.4 : 1,
                    }}
                    disabled={(roles[key] || 1) <= 1}
                  >
                    −
                  </button>
                  <span style={{
                    width: 36, textAlign: "center",
                    fontWeight: 800, fontSize: 18, color,
                  }}>
                    {roles[key] || 1}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); changeCount(key, 1); }}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: `1.5px solid ${color}`,
                      background: bg,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 16, color,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalMembers > 0 && (
            <div style={{
              marginTop: 14,
              padding: "10px 16px",
              background: "rgba(99,102,241,0.08)",
              borderRadius: 10,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                {t("s1TotalLabel")}
              </span>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#6366f1" }}>
                {totalMembers}{lang === "ko" ? "명" : " members"}
              </span>
            </div>
          )}
        </div>
      )}
    </QuizLayout>
  );
}
