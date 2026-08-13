'use client'

import { Coins } from 'lucide-react'
import {
  DesignedInput,
  DesignedSelect,
  DesignedTextarea,
  FormSection,
  FormSummaryCard,
  expenseFormIcons,
} from '@/components/mobile/expense-design'
import {
  DepositListItem,
  DepositManualNotice,
  DepositSectionTitle,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import type { MemberOption } from '@/hooks/use-mess-member-options'

export type AiDepositPreviewPayload = Record<string, unknown>

export function AiDepositPreview({
  payload,
  members,
  disabled,
  onPatch,
}: {
  payload: AiDepositPreviewPayload
  members: MemberOption[]
  disabled?: boolean
  onPatch: (patch: Record<string, unknown>) => void
}) {
  const memberId = typeof payload.memberId === 'string' ? payload.memberId : ''
  const member = members.find((item) => item.id === memberId)
  const amount = payload.amount == null ? '' : String(payload.amount)
  const date = typeof payload.date === 'string' ? payload.date : ''
  const note = typeof payload.note === 'string' ? payload.note : ''
  const previewItem: DepositListRecord = {
    id: 'ai-deposit-preview',
    amount: Number(amount || 0),
    status: 'APPROVED',
    method: 'CASH',
    payment_date: date,
    note: note || 'Member deposit',
    member: member ? { id: member.id, name: member.name, email: member.email } : null,
  }

  return (
    <div className="space-y-4">
      <FormSummaryCard
        eyebrow="AI Preview"
        title="Review deposit before saving"
        description="Check the member, amount and date. Nothing is saved until you confirm."
        icon={Coins}
      />

      <FormSection title="Deposit Details">
        <DesignedSelect
          label="Deposit For"
          icon={expenseFormIcons.member}
          value={memberId}
          onChange={(event) => onPatch({ memberId: event.target.value })}
          disabled={disabled}
          required
        >
          <option value="">Select member</option>
          {members.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </DesignedSelect>

        <div className="grid grid-cols-2 gap-3">
          <DesignedInput
            label="Amount"
            icon={expenseFormIcons.amount}
            value={amount}
            onChange={(event) => onPatch({ amount: event.target.value === '' ? '' : Number(event.target.value) })}
            placeholder="1500"
            type="number"
            min="1"
            step="1"
            disabled={disabled}
            required
          />
          <DesignedInput
            label="Date"
            icon={expenseFormIcons.date}
            value={date}
            onChange={(event) => onPatch({ date: event.target.value })}
            type="date"
            disabled={disabled}
            required
          />
        </div>

        <DesignedTextarea
          label="Note (Optional)"
          icon={expenseFormIcons.description}
          value={note}
          onChange={(event) => onPatch({ note: event.target.value })}
          placeholder="Monthly contribution"
          disabled={disabled}
        />
      </FormSection>

      <DepositManualNotice compact />

      <section className="app-section">
        <DepositSectionTitle title="Deposit Preview" />
        <div className="flush-list flush-list--panel mt-3">
          <DepositListItem item={previewItem} variant="horizontal" />
        </div>
      </section>
    </div>
  )
}
