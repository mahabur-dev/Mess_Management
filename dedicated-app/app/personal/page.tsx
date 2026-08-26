"use client";

import { MobileShell } from "@/components/mobile-shell";
import { TopScreen } from "@/components/top-screen";
import {
  currentPersonalMonth,
  personalCopy,
} from "@/features/personal/constants";
import { PersonalDashboard } from "@/features/personal/components/personal-dashboard";
import {
  PersonalLanguageButton,
  PersonalNavigation,
} from "@/features/personal/components/personal-navigation";
import { usePersonalLocale } from "@/features/personal/hooks/use-personal-locale";
import { useState } from "react";

export default function PersonalPage() {
  const { locale, toggleLocale } = usePersonalLocale();
  const copy = personalCopy(locale);
  const [month, setMonth] = useState(currentPersonalMonth());
  return (
    <MobileShell showBottomNavigation>
      <TopScreen title={copy.personal} subtitle={copy.overview} backHref="/" />
      <div className="screen space-y-4">
        <div className="flex items-center gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{copy.currentMonth}</span>
            <input
              className="field"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>
          <PersonalLanguageButton locale={locale} onToggle={toggleLocale} />
        </div>
        <PersonalNavigation locale={locale} active="dashboard" />
        <PersonalDashboard locale={locale} month={month} />
      </div>
    </MobileShell>
  );
}
