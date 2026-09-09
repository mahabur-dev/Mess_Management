'use client'

import { Mail, Settings2, Sparkles } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import type { MonthlyReportSetting } from '@/lib/api-client'
import { useTranslations } from '@/lib/i18n'

type MonthlyReportSettingsProps = {
  settings: MonthlyReportSetting
  saving: boolean
  onChange: (settings: MonthlyReportSetting) => void
}

export function MonthlyReportSettings({
  settings,
  saving,
  onChange,
}: MonthlyReportSettingsProps) {
  const t = useTranslations('monthlyReports')

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
      <div className="flex items-start gap-3 border-b border-[var(--dashboard-line)] px-4 py-4 sm:px-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand)]">
          <Settings2 className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-[var(--dashboard-ink)]">{t('settings.title')}</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{t('settings.description')}</p>
        </div>
      </div>

      <div className="divide-y divide-[var(--dashboard-line)]">
        <SettingRow
          icon={Sparkles}
          title={t('settings.autoGenerate')}
          description={t('settings.autoGenerateHint')}
          checked={settings.auto_generate}
          disabled={saving}
          onCheckedChange={(checked) => onChange({ ...settings, auto_generate: checked })}
        />
        <SettingRow
          icon={Mail}
          title={t('settings.emailMembers')}
          description={t('settings.emailMembersHint')}
          checked={settings.email_members}
          disabled={saving}
          onCheckedChange={(checked) => onChange({ ...settings, email_members: checked })}
        />
      </div>
      {saving ? (
        <p className="border-t border-[var(--dashboard-line)] px-4 py-2.5 text-[11px] font-semibold text-muted-foreground sm:px-5">
          {t('settings.saving')}
        </p>
      ) : null}
    </section>
  )
}

function SettingRow({
  icon: Icon,
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  icon: typeof Settings2
  title: string
  description: string
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--dashboard-surface-subtle)] text-[var(--brand)]">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--dashboard-ink)]">{title}</p>
        <p className="mt-0.5 text-xs font-medium leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={title}
        className="shadow-none"
      />
    </div>
  )
}
