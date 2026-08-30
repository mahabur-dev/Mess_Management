"use client";

import { ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";
import { FloatingActionMenu } from "@/components/mobile/floating-action-menu";
import { MealMonthSelector } from "@/components/mobile/meals-design";
import { MobileShell } from "@/components/mobile-shell";
import { TopScreen } from "@/components/top-screen";
import {
  currentPersonalMonth,
  personalCopy,
} from "@/features/personal/constants";
import { PersonalDashboard } from "@/features/personal/components/personal-dashboard";
import { PersonalNavigation } from "@/features/personal/components/personal-navigation";
import { usePersonalLocale } from "@/features/personal/hooks/use-personal-locale";
import { useState } from "react";

export default function PersonalPage() {
  const { locale } = usePersonalLocale();
  const copy = personalCopy(locale);
  const [month, setMonth] = useState(currentPersonalMonth());
  return (
    <MobileShell showBottomNavigation hasFloatingAction>
      <TopScreen
        title={copy.personal}
        subtitle={copy.overview}
        backHref="/"
      />
      <div className="screen space-y-4">
        <MealMonthSelector month={month} onChange={setMonth} />
        <PersonalNavigation locale={locale} active="dashboard" />
        <PersonalDashboard locale={locale} month={month} />
      </div>

      <FloatingActionMenu
        label={copy.quickActions}
        items={[
          {
            href: "/personal/transactions/add?type=INCOME",
            label: copy.addIncome,
            icon: <ArrowDownLeft size={20} strokeWidth={2.3} />,
          },
          {
            href: "/personal/transactions/add?type=EXPENSE",
            label: copy.addExpense,
            icon: <ArrowUpRight size={20} strokeWidth={2.3} />,
          },
          {
            href: "/personal/transactions/add?type=SAVING",
            label: copy.addSaving,
            icon: <PiggyBank size={20} strokeWidth={2.3} />,
          },
        ]}
      />
    </MobileShell>
  );
}
