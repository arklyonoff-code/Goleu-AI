import { useNavigate } from "react-router-dom";
import { MaterialIcon } from "./MaterialIcon";
import { useLanguage } from "../lib/LanguageContext";

export default function QuizLayout({
  step, total = 4,
  title, subtitle,
  onNext, onBack, backPath,
  nextLabel = "다음 →",
  nextDisabled = false,
  nextHint,
  children,
  side,
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const pct = (step / total) * 100;

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(backPath || -1);
  };

  return (
    <div className="quiz-layout" style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-sans)",
    }}>

      {/* ── 스티키 헤더 ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--header-bg)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div className="r-quiz-header">
          <div
            onClick={() => navigate("/")}
            style={{ fontWeight: 900, fontSize: 20, cursor: "pointer", letterSpacing: "-0.5px", display: "inline-flex", alignItems: "center", gap: 8 }}
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

          {/* 스텝 인디케이터 */}
          <div className="r-quiz-steps" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {[1, 2, 3, 4].map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: s === step ? 32 : 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: s < step ? "#6366f1" : s === step ? "#6366f1" : "var(--border-subtle)",
                  transition: "all 0.3s",
                }} />
                {s < 4 && (
                  <div className="r-step-connector" style={{
                    width: 24, height: 1,
                    background: s < step ? "#6366f1" : "var(--border-subtle)",
                    transition: "background 0.3s",
                  }} />
                )}
              </div>
            ))}
            <span className="r-quiz-step-label" style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, marginLeft: 8 }}>
              {step} / {total}
            </span>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div style={{ height: 3, background: "var(--border-subtle)" }}>
          <div style={{
            height: 3,
            width: `${pct}%`,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            borderRadius: 3,
            transition: "width 0.4s ease",
          }} />
        </div>
      </header>

      {/* ── 본문 (2열 레이아웃) ── */}
      <div className={`r-quiz-body ${side ? "r-quiz-body--with-side" : "r-quiz-body--solo"}`}>
        <div className="r-quiz-main">
          {(title || subtitle) && (
            <div style={{ marginBottom: 36 }}>
              {title && (
                <h1 style={{
                  fontSize: "clamp(22px, 2.5vw, 32px)", fontWeight: 800,
                  color: "var(--text-primary)", margin: "0 0 10px",
                }}>
                  {title}
                </h1>
              )}
              {subtitle && (
                <p style={{ fontSize: 16, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>

        {/* 사이드 패널 (선택적) */}
        {side && (
          <div className="r-quiz-side" style={{ position: "sticky", top: 100 }}>
            {side}
          </div>
        )}
      </div>

      {/* ── 하단 네비게이션 (고정) ── */}
      <div className="r-quiz-footer" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="r-quiz-back-btn"
              onClick={handleBack}
              style={{
                height: 48, padding: "0 20px", borderRadius: 10, fontWeight: 600,
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
                cursor: "pointer", fontFamily: "var(--font-sans)",
                display: "flex", alignItems: "center", gap: 8,
                flexShrink: 0, fontSize: 15,
              }}
            >
              <MaterialIcon name="arrow_back" size={18} color="var(--text-secondary)" />
              <span className="r-quiz-back-label">{t("btnBack")}</span>
            </button>
            <div className="r-quiz-next-wrap">
              <button
                onClick={onNext}
                disabled={nextDisabled}
                style={{
                  width: "100%", height: 48, borderRadius: 10, fontWeight: 700, fontSize: 16,
                  background: nextDisabled ? "var(--border-subtle)" : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  border: "none", color: "#fff",
                  cursor: nextDisabled ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {nextLabel}
              </button>
              {nextHint && (
                <div style={{ color: "#ff4d4f", fontSize: 13, marginTop: 6, textAlign: "center" }}>
                  {nextHint}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
