"use client";

import { useLocale } from "@/lib/i18n";
import { personalCopy } from "../constants";

export function usePersonalLocale() {
  const { locale } = useLocale();

  return {
    locale,
    copy: personalCopy(locale),
  };
}
