import { Input } from "antd";
import { useNavigate } from "react-router-dom";
import QuizLayout from "./components/QuizLayout";
import { MaterialIcon } from "./components/MaterialIcon";
import { trackEvent, Events } from "./lib/analytics";
import { useLanguage } from "./lib/LanguageContext";

// ── 글로벌 클라우드 플랫폼 (사용량 순) ──────────────────────────────────────
const CLOUD_PROVIDERS = [
  { key: "aws",        name: "AWS",              desc: "Amazon Web Services",    badge: "AWS", badgeColor: "#FF9900", popular: true },
  { key: "gcp",        name: "Google Cloud",     desc: "GCP",                    badge: "GCP", badgeColor: "#4285F4", popular: true },
  { key: "azure",      name: "Microsoft Azure",  desc: "Azure Cloud",            badge: "Az",  badgeColor: "#0078D4", popular: true },
  { key: "cloudflare", name: "Cloudflare",       desc: "Edge / Workers / Pages", badge: "CF",  badgeColor: "#F38020" },
  { key: "vercel",     name: "Vercel",           desc: "Frontend deployment",    badge: "▲",   badgeColor: "#000000" },
  { key: "supabase",   name: "Supabase",         desc: "Open source Firebase",   badge: "SB",  badgeColor: "#3ECF8E" },
  { key: "digitalocean",name: "DigitalOcean",    desc: "Developer cloud",        badge: "DO",  badgeColor: "#0080FF" },
  { key: "heroku",     name: "Heroku",           desc: "PaaS deployment",        badge: "H",   badgeColor: "#430098" },
  { key: "none",       name: "Not decided",      desc: "Planning stage",         badge: "?",   badgeColor: "#9ca3af" },
];

// ── 호스팅 형태 ──────────────────────────────────────────────────────────────
const HOSTING_TYPES = {
  ko: [
    { key: "cloud",      label: "클라우드",       desc: "완전 관리형 클라우드", icon: "cloud" },
    { key: "selfhosted", label: "자체 서버",       desc: "On-premise / 직접 운영", icon: "dns" },
    { key: "hybrid",     label: "하이브리드",      desc: "클라우드 + 자체 서버", icon: "device_hub" },
    { key: "serverless", label: "서버리스 / 엣지", desc: "Functions, Edge 중심", icon: "bolt" },
    { key: "unsure",     label: "미정",            desc: "아직 결정 전", icon: "help_outline" },
  ],
  en: [
    { key: "cloud",      label: "Cloud",       desc: "Fully managed cloud",  icon: "cloud" },
    { key: "selfhosted", label: "Self-hosted", desc: "On-premise / own infra", icon: "dns" },
    { key: "hybrid",     label: "Hybrid",      desc: "Cloud + on-premise",   icon: "device_hub" },
    { key: "serverless", label: "Serverless / Edge", desc: "Functions & edge-first", icon: "bolt" },
    { key: "unsure",     label: "Not sure yet",desc: "Still deciding",       icon: "help_outline" },
  ],
};

export default function CloudSelect({
  selectedClouds, setSelectedClouds,
  hostingType, setHostingType,
  monthlyBudget, setMonthlyBudget,
  teamName, roles, selectedTools,
}) {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const hostingOptions = HOSTING_TYPES[lang] || HOSTING_TYPES.en;

  const toggleCloud = (key) => {
    setSelectedClouds(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleHosting = (key) => {
    setHostingType(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleNext = () => {
    trackEvent(Events.QUIZ_STEP_COMPLETED, {
      step: 3, step_name: "cloud",
      selected_clouds: selectedClouds.join(","),
      hosting_types: hostingType.join(","),
      monthly_budget: monthlyBudget || null,
    });
    navigate("/llm");
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
        STEP 3 / 4
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
        {t("s3SideTitle")}
      </h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.6 }}>
        {t("s3SideDesc")}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CLOUD_PROVIDERS.filter(c => selectedClouds.includes(c.key)).map(c => (
          <div key={c.key} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 14px", background: "var(--bg-surface)", borderRadius: 10,
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: 6,
              background: c.badgeColor + "20",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 900, color: c.badgeColor,
            }}>{c.badge}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</span>
          </div>
        ))}
        {hostingType.map(h => {
          const opt = hostingOptions.find(o => o.key === h);
          return opt ? (
            <div key={h} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px", background: "var(--bg-surface)", borderRadius: 10,
            }}>
              <MaterialIcon name={opt.icon} size={14} color="var(--accent-indigo)" fill={1} />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{opt.label}</span>
            </div>
          ) : null;
        })}
        {monthlyBudget && (
          <div style={{
            padding: "8px 14px", background: "var(--bg-surface)", borderRadius: 10,
            fontSize: 13, color: "var(--text-secondary)",
          }}>
            💰 ${monthlyBudget}{t("s3BudgetSuffix")}
          </div>
        )}
        {selectedClouds.length === 0 && hostingType.length === 0 && !monthlyBudget && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
            {lang === "ko" ? "선택하면 여기에 표시됩니다" : "Your selections appear here"}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <QuizLayout
      step={3}
      title={t("s3Title")}
      subtitle={t("s3Subtitle")}
      onNext={handleNext}
      onBack={() => navigate("/tools")}
      nextLabel={t("s3NextLabel")}
      side={sidePanel}
    >
      {/* ── 클라우드 플랫폼 선택 ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <label style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
            {t("s3CloudLabel")}{" "}
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{t("s3CloudHint")}</span>
          </label>
          {selectedClouds.length > 0 && (
            <span style={{
              background: "rgba(99,102,241,0.15)", color: "#6366f1",
              fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20,
            }}>
              {selectedClouds.length} {lang === "ko" ? "개 선택" : "selected"}
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {CLOUD_PROVIDERS.map(({ key, name, desc, badge, badgeColor, popular }) => {
            const sel = selectedClouds.includes(key);
            return (
              <div
                key={key}
                onClick={() => toggleCloud(key)}
                style={{
                  position: "relative",
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", borderRadius: 14,
                  border: `2px solid ${sel ? "#6366f1" : "var(--border-subtle)"}`,
                  background: sel ? "rgba(99,102,241,0.07)" : "var(--bg-elevated)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {sel && (
                  <div style={{
                    position: "absolute", top: 7, right: 7,
                    width: 16, height: 16, borderRadius: "50%",
                    background: "#6366f1",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <MaterialIcon name="check" size={10} color="#fff" />
                  </div>
                )}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: sel ? badgeColor + "20" : "var(--bg-surface)",
                  border: `1.5px solid ${sel ? badgeColor : "var(--border-subtle)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: 9, color: sel ? badgeColor : "var(--text-muted)",
                  letterSpacing: -0.5,
                  transition: "all 0.15s",
                }}>
                  {badge}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 13,
                    color: sel ? "#6366f1" : "var(--text-primary)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {name}
                    {popular && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: "#f59e0b",
                        background: "rgba(245,158,11,0.15)",
                        padding: "1px 5px", borderRadius: 3,
                      }}>
                        {lang === "ko" ? "인기" : "Popular"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 호스팅 형태 ── */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", display: "block", marginBottom: 14 }}>
          {t("s3HostLabel")}
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {hostingOptions.map(({ key, label, desc, icon }) => {
            const sel = hostingType.includes(key);
            return (
              <div
                key={key}
                onClick={() => toggleHosting(key)}
                style={{
                  padding: "14px 8px", borderRadius: 12, textAlign: "center",
                  border: `2px solid ${sel ? "#6366f1" : "var(--border-subtle)"}`,
                  background: sel ? "rgba(99,102,241,0.08)" : "var(--bg-elevated)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <MaterialIcon
                  name={icon} size={22}
                  color={sel ? "#6366f1" : "var(--text-muted)"} fill={sel ? 1 : 0}
                />
                <div style={{
                  fontSize: 11, fontWeight: 700, marginTop: 6, lineHeight: 1.3,
                  color: sel ? "#6366f1" : "var(--text-primary)",
                }}>
                  {label}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 월 예산 ── */}
      <div>
        <label style={{ display: "block", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 10 }}>
          {t("s3BudgetLabel")}
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> (optional)</span>
        </label>
        <Input
          size="large"
          type="number"
          min={0}
          step={50}
          inputMode="numeric"
          placeholder={t("s3BudgetPlaceholder")}
          value={monthlyBudget}
          onChange={e => { if (/^\d*$/.test(e.target.value)) setMonthlyBudget(e.target.value); }}
          style={{
            borderRadius: 10, height: 52, maxWidth: 260,
            background: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
          prefix={<span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 16 }}>$</span>}
          suffix={<span style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("s3BudgetSuffix")}</span>}
        />
      </div>
    </QuizLayout>
  );
}
