"use client";

import Link from "next/link";
import {
  BarChart3,
  ChartPie,
  LayoutDashboard,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import { appHref } from "@/lib/routes";
import type { PersonalLocale } from "../types";
import { personalCopy } from "../constants";

const links = [
  { href: "/personal", key: "dashboard", icon: LayoutDashboard },
  { href: "/personal/transactions", key: "transactions", icon: ReceiptText },
  { href: "/personal/family", key: "family", icon: UsersRound },
  { href: "/personal/budget", key: "budget", icon: BarChart3 },
  { href: "/personal/reports", key: "reports", icon: ChartPie },
] as const;

export function PersonalNavigation({
  locale,
  active,
}: {
  locale: PersonalLocale;
  active: (typeof links)[number]["key"];
}) {
  const copy = personalCopy(locale);
  return (
    <nav
      className="grid grid-cols-5 gap-1 rounded-[18px] border border-[#dce9ec] bg-white p-1.5 shadow-[0_8px_18px_rgba(18,55,72,0.04)]"
      aria-label="Personal finance"
    >
      {links.map(({ href, key, icon: Icon }) => (
        <Link
          key={href}
          href={appHref(href)}
          aria-current={active === key ? "page" : undefined}
          className={`flex min-w-0 flex-col items-center gap-1 rounded-[13px] px-1 py-2 text-center text-[10px] font-bold transition ${active === key ? "bg-[#e8f8f7] text-[#00777a]" : "text-[#65838b]"}`}
        >
          <Icon size={17} strokeWidth={2.3} />
          <span className="w-full truncate">{copy[key]}</span>
        </Link>
      ))}
    </nav>
  );
}

export function PersonalLanguageButton({
  locale,
  onToggle,
}: {
  locale: PersonalLocale;
  onToggle: () => void;
}) {
  const copy = personalCopy(locale);
  return (
    <button
      type="button"
      onClick={onToggle}
      className="ui-btn ui-btn--ghost ui-btn--sm min-w-[76px]"
      aria-label={
        locale === "en" ? "Switch to Bangla" : "ইংরেজিতে পরিবর্তন করুন"
      }
    >
      {copy.language}
    </button>
  );
}
