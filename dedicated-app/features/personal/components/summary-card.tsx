import type { LucideIcon } from "lucide-react";
import { ExpenseSummaryCard } from "@/components/mobile/expense-ui";

export function SummaryCard({
  icon,
  label,
  value,
  caption,
  accent = "teal",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
  accent?: "teal" | "blue" | "violet" | "green" | "orange";
}) {
  return (
    <ExpenseSummaryCard
      icon={icon}
      label={label}
      value={value}
      caption={caption}
      accent={accent}
    />
  );
}
