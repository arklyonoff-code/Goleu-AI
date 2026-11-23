import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "./i18n";

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  // 서버(SSG)와 첫 클라이언트 렌더는 항상 "en" → hydration 일치.
  // 마운트 후 저장된 언어로 전환.
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("goleu_lang");
      if (saved && saved !== "en") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = (newLang) => {
    setLangState(newLang);
    try { localStorage.setItem("goleu_lang", newLang); } catch {}
  };

  const t = (key) =>
    translations[lang]?.[key] ??
    translations["en"]?.[key] ??
    key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
