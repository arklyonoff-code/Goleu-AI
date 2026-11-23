import React, { useEffect, useState } from "react";
import { consentDecided, setConsent } from "../lib/analytics";
import { useLanguage } from "../lib/LanguageContext";

export default function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!consentDecided()) setVisible(true);
  }, []);

  if (!visible) return null;

  const handle = (granted) => {
    setConsent(granted);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="goleu-consent-title"
      className="r-cookie-consent"
      style={{
        position: "fixed",
        left: 16, right: 16, bottom: 16,
        maxWidth: 720, margin: "0 auto",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        padding: 20,
        zIndex: 9999,
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ marginBottom: 14, lineHeight: 1.6 }}>
        <div id="goleu-consent-title" style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
          {t("cookieTitle")}
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          {t("cookieBody")}{" "}
          <a href="/privacy" style={{ color: "#6366f1", fontSize: 13 }}>
            {t("privacyLink")}
          </a>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          onClick={() => handle(false)}
          style={{
            height: 36, padding: "0 16px", borderRadius: 8,
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            color: "var(--text-secondary)",
            cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
          }}
        >
          {t("cookieDecline")}
        </button>
        <button
          onClick={() => handle(true)}
          style={{
            height: 36, padding: "0 16px", borderRadius: 8,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "none", color: "#fff",
            cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
          }}
        >
          {t("cookieAccept")}
        </button>
      </div>
    </div>
  );
}
