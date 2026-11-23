import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent, Events } from "./lib/analytics";
import { MaterialIcon } from "./components/MaterialIcon";
import { useLanguage } from "./lib/LanguageContext";
import LangToggle from "./components/LangToggle";
import Seo from "./components/Seo";
import { FAQ_IDS, buildLandingJsonLd } from "./lib/seo";

const LANDING_JSON_LD = buildLandingJsonLd();

function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 36, height: 36, borderRadius: 8,
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-elevated)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-secondary)",
        transition: "all 0.15s",
      }}
    >
      <MaterialIcon name={dark ? "light_mode" : "dark_mode"} size={18} color="var(--text-secondary)" />
    </button>
  );
}

function ToolCard({ tool, lang }) {
  const freeLabel = lang === "ko" ? "✓ 무료티어" : "✓ Free tier";
  const paidLabel = lang === "ko" ? "유료" : "Paid";
  const koreanYes = lang === "ko" ? "한국어 ✓" : "Korean ✓";
  const koreanNo = lang === "ko" ? "한국어 ✗" : "Korean ✗";

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-card)",
      padding: "24px 28px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: tool.accent,
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 17, color: "var(--text-primary)" }}>{tool.name}</span>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
              color: tool.accent, background: tool.accent + "18",
              padding: "2px 6px", borderRadius: 4,
            }}>{tool.category}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
              color: tool.free ? "#10b981" : "var(--text-secondary)",
              background: tool.free ? "#10b98118" : "var(--bg-elevated)",
              padding: "2px 8px", borderRadius: 4,
            }}>
              {tool.free ? freeLabel : paidLabel}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--text-secondary)",
              background: "var(--bg-elevated)",
              padding: "2px 8px", borderRadius: 4,
            }}>
              {tool.price}
            </span>
            {tool.korean !== undefined && <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: tool.korean ? "#06b6d4" : "var(--text-muted)",
              background: tool.korean ? "#06b6d418" : "var(--bg-elevated)",
              padding: "2px 8px", borderRadius: 4,
            }}>
              {tool.korean ? koreanYes : koreanNo}
            </span>}
          </div>
        </div>
      </div>

      <p style={{
        fontSize: 14, color: "var(--text-secondary)",
        lineHeight: 1.6, margin: 0,
        borderTop: "1px solid var(--border-subtle)",
        paddingTop: 14,
      }}>
        → {tool.reason}
      </p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  // SSG/첫 렌더는 라이트 고정, 마운트 후 저장된 테마 반영 (hydration 일치)
  const [dark, setDark] = useState(false);
  const themeLoaded = useRef(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("goleu_theme") === "dark") setDark(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // 첫 실행에서는 저장값을 덮어쓰지 않음 (App.jsx가 data-theme 복원)
    if (!themeLoaded.current) {
      themeLoaded.current = true;
      return;
    }
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("goleu_theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  const handleStart = () => {
    trackEvent(Events.QUIZ_STARTED, { entry_step: "landing" });
    navigate("/build");
  };

  const HOW_IT_WORKS = useMemo(() => [
    { step: "01", icon: "group",       title: t("step01Title"), desc: t("step01Desc"), color: "#6366f1" },
    { step: "02", icon: "psychology",  title: t("step02Title"), desc: t("step02Desc"), color: "#8b5cf6" },
    { step: "03", icon: "receipt_long",title: t("step03Title"), desc: t("step03Desc"), color: "#06b6d4" },
  ], [t]);

  const FEATURES = useMemo(() => [
    { icon: "bolt",      title: t("feat1Title"), desc: t("feat1Desc") },
    { icon: "fact_check",title: t("feat2Title"), desc: t("feat2Desc") },
    { icon: "language",  title: t("feat3Title"), desc: t("feat3Desc") },
    { icon: "autorenew", title: t("feat4Title"), desc: t("feat4Desc") },
  ], [t]);

  const STATS = useMemo(() => [
    { value: t("stat1Val"), label: t("stat1Label") },
    { value: t("stat2Val"), label: t("stat2Label") },
    { value: t("stat3Val"), label: t("stat3Label") },
  ], [t]);

  const SAMPLE_TOOLS = useMemo(() => lang === "ko" ? [
    { name: "Gemini 3.7 Flash", category: "LLM", free: false, price: "약 $98/월", reason: "균형 등급 중 현재 가장 저렴합니다(2026-12-31까지 할인가). 이후에는 GPT-6.1 Terra가 더 저렴해집니다.", accent: "#6366f1" },
    { name: "LlamaIndex", category: "프레임워크", free: true, price: "오픈소스", reason: "문서 적재·분할·검색 파이프라인을 바로 쓸 수 있어 RAG 구현이 빠릅니다.", accent: "#8b5cf6" },
    { name: "Supabase pgvector", category: "벡터 DB", free: true, price: "$0 (Free)", reason: "월 사용자 1,000명 규모면 무료 플랜으로 시작할 수 있습니다.", accent: "#06b6d4" },
  ] : [
    { name: "Gemini 3.7 Flash", category: "LLM", free: false, price: "~$98/mo", reason: "Currently the cheapest balanced-tier model (promo price through Dec 31, 2026); after that GPT-6.1 Terra becomes cheaper.", accent: "#6366f1" },
    { name: "LlamaIndex", category: "Framework", free: true, price: "Open source", reason: "Ready-made ingestion, chunking and retrieval pipelines make RAG fast to build.", accent: "#8b5cf6" },
    { name: "Supabase pgvector", category: "Vector DB", free: true, price: "$0 (Free)", reason: "At 1,000 monthly users you can start on the free plan.", accent: "#06b6d4" },
  ], [lang]);

  const MINI_STACK = useMemo(() => lang === "ko" ? [
    { name: "Gemini 3.7 Flash", tag: "LLM", color: "#6366f1" },
    { name: "LlamaIndex", tag: "프레임워크", color: "#8b5cf6" },
    { name: "pgvector", tag: "벡터 DB", color: "#06b6d4" },
    { name: "Railway", tag: "배포", color: "#a259ff" },
  ] : [
    { name: "Gemini 3.7 Flash", tag: "LLM", color: "#6366f1" },
    { name: "LlamaIndex", tag: "Framework", color: "#8b5cf6" },
    { name: "pgvector", tag: "Vector DB", color: "#06b6d4" },
    { name: "Railway", tag: "Hosting", color: "#a259ff" },
  ], [lang]);

  const s = {
    section: {},
    inner: { maxWidth: 1280, margin: "0 auto" },
    sectionLabel: {
      fontFamily: "var(--font-mono)",
      fontSize: 11, fontWeight: 700, letterSpacing: 2,
      color: "var(--accent-indigo)",
      textTransform: "uppercase",
      display: "block", marginBottom: 16,
    },
    h2: {
      fontSize: "clamp(30px, 3vw, 46px)", fontWeight: 800,
      color: "var(--text-primary)", margin: "0 0 16px",
      lineHeight: 1.2,
    },
    bodyText: {
      fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0,
    },
  };

  return (
    <div style={{ background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
      <Seo
        title="Goleu AI — AI stack & monthly cost for your app"
        description={`${LANDING_JSON_LD[0].description} No sign-up required.`}
        path="/"
        lang={lang}
        jsonLd={LANDING_JSON_LD}
      />

      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: dark ? "rgba(10,10,15,0.85)" : "#fff",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div className="r-page-header" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 64,
        }}>
          <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.5px", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <img src="/favicon.svg" alt="" width={24} height={24} style={{ display: "block" }} />
            <span>
              <span className="gradient-text">Goleu</span>
              <span style={{ color: "var(--brand-ai-color)" }}> AI</span>
            </span>
          </div>
          <div className="r-landing-header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LangToggle />
            <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} />
            <button
              onClick={handleStart}
              className="r-landing-cta-short"
              style={{
                height: 40, padding: "0 22px", borderRadius: "var(--radius-button)",
                background: "var(--gradient-accent)", border: "none",
                color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: "pointer", fontFamily: "var(--font-sans)",
              }}
            >
              {t("btnStart")}
            </button>
          </div>
        </div>
      </header>

      <section className="r-hero-section">
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="r-grid-hero">
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              borderRadius: 20, padding: "6px 14px",
              fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
              marginBottom: 36,
            }}>
              {t("landingBadge")}
            </div>

            <h1 style={{
              fontSize: "clamp(36px, 4vw, 64px)", fontWeight: 900,
              lineHeight: 1.1, margin: "0 0 28px",
              color: "var(--text-primary)", letterSpacing: "-1px",
            }}>
              {t("landingH1a")}<br />
              <span className="gradient-text">{t("landingH1b")}</span><br />
              {t("landingH1c")}
            </h1>

            <p style={{
              fontSize: 18, color: "var(--text-secondary)",
              margin: "0 0 44px", lineHeight: 1.7, maxWidth: 480,
            }}>
              {t("landingSubtitle")}
            </p>

            <div className="r-hero-cta" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <button
                onClick={handleStart}
                className="r-hero-cta-btn"
                style={{
                  height: 56, padding: "0 44px", borderRadius: 14,
                  background: "var(--gradient-accent)", border: "none",
                  color: "#fff", fontWeight: 800, fontSize: 17,
                  cursor: "pointer", fontFamily: "var(--font-sans)",
                  boxShadow: "0 0 40px rgba(99,102,241,0.35)",
                }}
              >
                {t("btnStartFree")}
              </button>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                {t("noSignup")}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="r-grid-3 r-stats-grid">
              {STATS.map(({ value, label }) => (
                <div key={label} style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12, padding: "24px 20px", textAlign: "center",
                }}>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 900,
                    background: "var(--gradient-accent)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    backgroundClip: "text", marginBottom: 6,
                  }}>{value}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 14, padding: "24px",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 16, letterSpacing: 1 }}>
                {t("sampleLabel")}
              </div>
              {MINI_STACK.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none",
                }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{item.name}</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                    color: item.color, background: item.color + "18",
                    padding: "3px 8px", borderRadius: 4,
                  }}>{item.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="r-divider-wrap">
        <div style={{ height: 1, background: "var(--border-subtle)" }} />
      </div>

      <section className="r-section">
        <div style={{ ...s.inner, textAlign: "center" }}>
          <span style={s.sectionLabel}>HOW IT WORKS</span>
          <h2 style={{ ...s.h2, textAlign: "center" }}>{t("howTitle")}</h2>
          <p style={{ ...s.bodyText, textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
            {t("landingDefinition")}
          </p>

          <div className="r-grid-3 r-grid-3--steps">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-card)",
                  padding: "40px 36px",
                  textAlign: "left",
                  position: "relative",
                }}
              >
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                  color: item.color, letterSpacing: 1, marginBottom: 24,
                }}>
                  STEP {item.step}
                </div>
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: item.color + "18",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 24,
                }}>
                  <MaterialIcon name={item.icon} size={28} color={item.color} fill={1} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>
                  {item.title}
                </h3>
                <p style={{ ...s.bodyText, fontSize: 15 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="r-divider-wrap">
        <div style={{ height: 1, background: "var(--border-subtle)" }} />
      </div>

      <section className="r-section">
        <div style={s.inner}>
          <span style={s.sectionLabel}>WHY GOLEU</span>
          <h2 style={s.h2}>{t("whyTitle")}</h2>

          <div className="r-grid-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-card)",
                  padding: "32px 28px",
                }}
              >
                <MaterialIcon name={f.icon} size={26} color="var(--accent-indigo)" fill={1} />
                <h4 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: "16px 0 10px" }}>
                  {f.title}
                </h4>
                <p style={{ ...s.bodyText, fontSize: 14 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="r-divider-wrap">
        <div style={{ height: 1, background: "var(--border-subtle)" }} />
      </div>

      <section className="r-section">
        <div style={s.inner}>
          <span style={s.sectionLabel}>PREVIEW</span>
          <h2 style={s.h2}>{t("previewTitle")}</h2>
          <p style={{ ...s.bodyText, maxWidth: 600, marginBottom: 52 }}>
            {t("previewDesc")}
          </p>

          <div className="r-grid-3 r-grid-3--preview">
            {SAMPLE_TOOLS.map((tool) => (
              <ToolCard key={tool.name} tool={tool} lang={lang} />
            ))}
          </div>

          <div style={{
            marginTop: 28, padding: "16px 24px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-card)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <MaterialIcon name="info" size={16} color="var(--accent-indigo)" fill={1} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              {t("sampleNote")}
            </span>
          </div>
        </div>
      </section>

      <div className="r-divider-wrap">
        <div style={{ height: 1, background: "var(--border-subtle)" }} />
      </div>

      <section className="r-section" id="faq">
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <span style={s.sectionLabel}>FAQ</span>
          <h2 style={s.h2}>{t("faqTitle")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
            {FAQ_IDS.map((n) => (
              <details
                key={n}
                onToggle={(e) => {
                  if (e.currentTarget.open) trackEvent(Events.FAQ_OPENED, { question_index: n });
                }}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-card)",
                  padding: "20px 24px",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 17, color: "var(--text-primary)" }}>
                  <h3 style={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", margin: 0 }}>
                    {t(`faq${n}Q`)}
                  </h3>
                </summary>
                <p style={{ ...s.bodyText, fontSize: 15, marginTop: 12 }}>{t(`faq${n}A`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="r-divider-wrap">
        <div style={{ height: 1, background: "var(--border-subtle)" }} />
      </div>

      <section className="r-section" style={{ textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ ...s.h2, textAlign: "center" }}>{t("ctaTitle")}</h2>
          <p style={{ ...s.bodyText, textAlign: "center", marginBottom: 48 }}>
            {t("ctaDesc")}
          </p>
          <button
            onClick={handleStart}
            style={{
              height: 56, padding: "0 44px", borderRadius: 14,
              background: "var(--gradient-accent)", border: "none",
              color: "#fff", fontWeight: 800, fontSize: 17,
              cursor: "pointer", fontFamily: "var(--font-sans)",
              boxShadow: "0 0 40px rgba(99,102,241,0.3)",
            }}
          >
            {t("btnStart")}
          </button>
        </div>
      </section>

      <footer className="r-footer" style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "32px 40px",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            {t("footerCopy")}
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            <a
              href="/privacy"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}
              onMouseEnter={(e) => { e.target.style.color = "#6366f1"; }}
              onMouseLeave={(e) => { e.target.style.color = "var(--text-muted)"; }}
            >
              {t("privacyLink")}
            </a>
            <a
              href="/terms"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}
              onMouseEnter={(e) => { e.target.style.color = "#6366f1"; }}
              onMouseLeave={(e) => { e.target.style.color = "var(--text-muted)"; }}
            >
              {t("termsLink")}
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
