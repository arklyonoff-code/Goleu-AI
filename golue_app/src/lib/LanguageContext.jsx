import { createContext, useContext, useState } from "react";
import { translations } from "./i18n";

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem("goleu_lang") || "en";
    } catch {
      return "en";
    }
  });

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
