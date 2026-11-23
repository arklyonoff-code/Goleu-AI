import { useLanguage } from "../lib/LanguageContext";

export default function LangToggle({ style = {} }) {
  const { lang, setLang } = useLanguage();

  return (
    <div style={{
      display: "inline-flex",
      border: "1px solid var(--border-subtle)",
      borderRadius: 8, overflow: "hidden",
      ...style,
    }}>
      {["en", "ko"].map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: "6px 12px",
            fontSize: 12, fontWeight: 700,
            fontFamily: "var(--font-mono)",
            border: "none", cursor: "pointer",
            background: lang === l ? "#6366f1" : "transparent",
            color: lang === l ? "#fff" : "var(--text-muted)",
            transition: "all 0.15s",
            letterSpacing: 0.5,
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
