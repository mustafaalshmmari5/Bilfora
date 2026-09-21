"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type AppLanguage = "ar" | "en";

type LanguageContextValue = {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  tr: (ar: string, en: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("spc-language") as AppLanguage | null;
    const next = saved === "en" ? "en" : "ar";
    setLangState(next);
    document.documentElement.lang = next === "ar" ? "ar-u-nu-latn" : "en";
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }, []);

  const setLang = (next: AppLanguage) => {
    setLangState(next);
    localStorage.setItem("spc-language", next);
    document.documentElement.lang = next === "ar" ? "ar-u-nu-latn" : "en";
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  };

  const toggleLanguage = () => setLang(lang === "ar" ? "en" : "ar");
  const tr = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
