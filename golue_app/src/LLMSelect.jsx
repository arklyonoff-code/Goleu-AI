import { Input, Select } from "antd";
import { useNavigate } from "react-router-dom";
import QuizLayout from "./components/QuizLayout";
import { MaterialIcon } from "./components/MaterialIcon";
import { trackEvent, Events } from "./lib/analytics";
import { useLanguage } from "./lib/LanguageContext";

const LLMS = [
  { key: "openai",     name: "OpenAI GPT",       desc: "GPT · 이미지 생성 · 가장 범용적", price: "$0.03/1K",  color: "#00A67E", popular: true },
  { key: "anthropic",  name: "Anthropic Claude", desc: "Claude · 분석·글쓰기 특화",  price: "$0.025/1K", color: "#D97706", popular: true },
  { key: "google",     name: "Google Gemini",    desc: "멀티모달 · 검색 연동",          price: "$0.02/1K",  color: "#4285F4" },
  { key: "cohere",     name: "Cohere",           desc: "기업용 NLP · 검색·요약 특화",   price: "$0.015/1K", color: "#9333EA" },
  { key: "opensource", name: "오픈소스 모델",    desc: "Llama · Mistral · 완전 커스텀", price: "호스팅만",  color: "#059669" },
];

export default function LLMSelect({
  selectedLLMs, setSelectedLLMs,
  useCases, setUseCases,
  monthlyAIBudget, setMonthlyAIBudget,
  expectedUsage, setExpectedUsage,
  teamName, roles, selectedTools, selectedClouds,
}) {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const USE_CASES = [
    { key: "content",     name: lang === "ko" ? "콘텐츠 생성" : "Content creation", icon: "edit" },
    { key: "coding",      name: lang === "ko" ? "코딩 지원"   : "Coding assistant",  icon: "code" },
    { key: "analysis",    name: lang === "ko" ? "데이터 분석" : "Data analysis",     icon: "bar_chart" },
    { key: "translation", name: lang === "ko" ? "번역"        : "Translation",       icon: "translate" },
    { key: "customer",    name: lang === "ko" ? "고객 지원"   : "Customer support",  icon: "forum" },
    { key: "research",    name: lang === "ko" ? "리서치"      : "Research",          icon: "lightbulb" },
  ];

  const USAGE_OPTIONS = lang === "ko" ? [
    { value: "light",      label: "가볍게 — 월 10만 토큰 이하" },
    { value: "medium",     label: "보통 — 월 10만~100만 토큰" },
    { value: "heavy",      label: "많이 — 월 100만 토큰 이상" },
    { value: "enterprise", label: "기업용 — 대량 사용" },
  ] : [
    { value: "light",      label: "Light — under 100K tokens/mo" },
    { value: "medium",     label: "Medium — 100K–1M tokens/mo" },
    { value: "heavy",      label: "Heavy — over 1M tokens/mo" },
    { value: "enterprise", label: "Enterprise — large scale" },
  ];

  const toggleLLM = (key) =>
    setSelectedLLMs(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const toggleUseCase = (key) =>
    setUseCases(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const handleNext = () => {
    trackEvent(Events.QUIZ_STEP_COMPLETED, {
      step: 4, step_name: "llm",
      selected_llms: selectedLLMs.join(","),
      use_cases: useCases.join(","),
      monthly_ai_budget: monthlyAIBudget || null,
      expected_usage: expectedUsage || null,
    });
    trackEvent(Events.QUIZ_COMPLETED, {
      total_tools_selected: (selectedTools || []).length,
      total_clouds_selected: (selectedClouds || []).length,
      total_llms_selected: selectedLLMs.length,
    });
    navigate("/recommend");
  };

  const sidePanel = (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 16, padding: "28px",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--accent-indigo)", letterSpacing: 1, marginBottom: 20 }}>
          STEP 4 / 4
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>{t("s4Title")}</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
          {t("s4Subtitle")}
        </p>
      </div>

      {useCases.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>{t("s4UseCaseLabel")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {useCases.map(k => {
              const uc = USE_CASES.find(u => u.key === k);
              return (
                <span key={k} style={{ padding: "4px 10px", background: "rgba(99,102,241,0.15)", color: "#6366f1", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                  {uc?.name || k}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {selectedLLMs.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>{t("s4LLMLabel")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {selectedLLMs.map(k => {
              const llm = LLMS.find(l => l.key === k);
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--bg-surface)", borderRadius: 8 }}>
                  <MaterialIcon name="check_circle" size={14} color="#6366f1" fill={1} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{llm?.name || k}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {expectedUsage && (
        <div style={{ padding: "10px 14px", background: "var(--bg-surface)", borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>{t("s4UsageLabel")}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {USAGE_OPTIONS.find(u => u.value === expectedUsage)?.label}
          </div>
        </div>
      )}

      {useCases.length === 0 && selectedLLMs.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
          {lang === "ko" ? <>선택하면 여기에<br />표시됩니다</> : <>Your selections<br />appear here</>}
        </p>
      )}
    </div>
  );

  return (
    <QuizLayout
      step={4}
      title={t("s4Title")}
      subtitle={t("s4Subtitle")}
      onNext={handleNext}
      onBack={() => navigate("/cloud")}
      nextLabel={t("s4NextLabel")}
      side={sidePanel}
    >
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 12 }}>
          {t("s4UseCaseLabel")} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{t("s4UseCaseHint")}</span>
        </div>
        <div className="r-grid-6">
          {USE_CASES.map(({ key, name, icon }) => {
            const sel = useCases.includes(key);
            return (
              <div
                key={key}
                onClick={() => toggleUseCase(key)}
                style={{
                  padding: "16px 8px", borderRadius: 12, textAlign: "center",
                  border: `2px solid ${sel ? "#6366f1" : "var(--border-subtle)"}`,
                  background: sel ? "var(--gl-primary-light)" : "var(--bg-elevated)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <MaterialIcon name={icon} size={24} color={sel ? "#6366f1" : "var(--text-muted)"} fill={sel ? 1 : 0} />
                <div style={{ fontSize: 12, fontWeight: 700, color: sel ? "#6366f1" : "var(--text-primary)", marginTop: 8 }}>
                  {name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 예상 사용량 + AI 예산 */}
      <div className="r-grid-2 r-grid-2--gap16">
        <div>
          <label style={{ display: "block", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 10 }}>
            {t("s4UsageLabel")}
          </label>
          <Select
            style={{ width: "100%" }}
            size="large"
            placeholder={lang === "ko" ? "선택" : "Select"}
            value={expectedUsage || undefined}
            onChange={setExpectedUsage}
            options={USAGE_OPTIONS}
          />
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 10 }}>
            {t("s4BudgetLabel")}
          </label>
          <Input
            size="large"
            type="number"
            min={0}
            step={10}
            inputMode="numeric"
            placeholder="100"
            value={monthlyAIBudget}
            onChange={e => { if (/^\d*$/.test(e.target.value)) setMonthlyAIBudget(e.target.value); }}
            style={{
              borderRadius: 10, height: 52,
              background: "var(--bg-elevated)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
            prefix={<span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 16 }}>$</span>}
            suffix={<span style={{ color: "var(--text-muted)", fontSize: 13 }}>{lang === "ko" ? "/월" : "/mo"}</span>}
          />
        </div>
      </div>

      {/* LLM 서비스 선택 — 2열 */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 12 }}>
          {t("s4LLMLabel")} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{t("s4LLMHint")}</span>
        </div>
        <div className="r-grid-2 r-grid-2--gap10">
          {LLMS.map(({ key, name, desc, price, color, popular }) => {
            const sel = selectedLLMs.includes(key);
            return (
              <div
                key={key}
                onClick={() => toggleLLM(key)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 18px", borderRadius: 14,
                  border: `2px solid ${sel ? "#6366f1" : "var(--border-subtle)"}`,
                  background: sel ? "var(--gl-primary-light)" : "var(--bg-elevated)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: color + "25",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, fontSize: 10, color,
                  }}>
                    AI
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: sel ? "#6366f1" : "var(--text-primary)" }}>{name}</span>
                      {popular && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: "#f59e0b",
                          background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)",
                          padding: "1px 6px", borderRadius: 4,
                        }}>{lang === "ko" ? "인기" : "Popular"}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: sel ? "#6366f1" : "var(--text-secondary)" }}>{price}</span>
                  {sel && <MaterialIcon name="check_circle" size={18} color="#6366f1" fill={1} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </QuizLayout>
  );
}
