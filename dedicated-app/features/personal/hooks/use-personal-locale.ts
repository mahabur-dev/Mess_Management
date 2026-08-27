"use client";

import { useEffect, useState } from "react";
import { personalCopy } from "../constants";
import type { PersonalLocale } from "../types";

const STORAGE_KEY = "messzen:personal-locale";

export function usePersonalLocale() {
  const [locale, setLocale] = useState<PersonalLocale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "bn" || stored === "en") setLocale(stored);
  }, []);

  const changeLocale = (next: PersonalLocale) => {
    setLocale(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return {
    locale,
    copy: personalCopy(locale),
    setLocale: changeLocale,
    toggleLocale: () => changeLocale(locale === "en" ? "bn" : "en"),
  };
}
