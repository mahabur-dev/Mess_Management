"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
  const railRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const activeItem = activeItemRef.current;
    if (!rail || !activeItem) return;

    const itemEnd = activeItem.offsetLeft + activeItem.offsetWidth;
    const visibleEnd = rail.scrollLeft + rail.clientWidth;

    if (activeItem.offsetLeft < rail.scrollLeft) {
      rail.scrollLeft = activeItem.offsetLeft;
    } else if (itemEnd > visibleEnd) {
      rail.scrollLeft = itemEnd - rail.clientWidth;
    }
  }, [active]);

  return (
    <nav
      ref={railRef}
      className="personal-action-rail"
      aria-label={copy.navigationLabel}
    >
      {links.map(({ href, key, icon: Icon }) => (
        <Link
          key={href}
          ref={active === key ? activeItemRef : undefined}
          href={appHref(href)}
          aria-current={active === key ? "page" : undefined}
          className="personal-action-card"
          data-active={active === key}
        >
          <span className="personal-action-card__icon" aria-hidden="true">
            <Icon size={18} strokeWidth={2.2} />
          </span>
          <span className="personal-action-card__label">{copy[key]}</span>
        </Link>
      ))}
    </nav>
  );
}
