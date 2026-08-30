'use client'

import { DesignedInput, expenseFormIcons } from '@/components/mobile/expense-design'
import { useTranslations } from '@/lib/i18n'

export type ExpenseCustomShare = {
  memberId: string
  amount: string
}

type ExpenseCustomShareMember = {
  id: string
  name?: string | null
}

export function buildCustomShares(memberIds: string[], shares: ExpenseCustomShare[]) {
  return memberIds.map((memberId) => ({
    memberId,
    amount: Number(shares.find((share) => share.memberId === memberId)?.amount ?? 0),
  }))
}

export function ExpenseCustomShareFields({
  members,
  memberIds,
  shares,
  onChange,
}: {
  members: ExpenseCustomShareMember[]
  memberIds: string[]
  shares: ExpenseCustomShare[]
  onChange: (shares: ExpenseCustomShare[]) => void
}) {
  const t = useTranslations('expenses')
  if (!memberIds.length) {
    return <div className="expense-empty-state">{t('selectMembersBeforeCustom')}</div>
  }

  return (
    <div className="space-y-2">
      {memberIds.map((memberId) => {
        const member = members.find((item) => item.id === memberId)
        return (
          <DesignedInput
            key={memberId}
            label={member?.name ?? memberId}
            icon={expenseFormIcons.amount}
            value={shares.find((share) => share.memberId === memberId)?.amount ?? ''}
            onChange={(event) => {
              const amount = event.target.value
              onChange([...shares.filter((share) => share.memberId !== memberId), { memberId, amount }])
            }}
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="0"
          />
        )
      })}
    </div>
  )
}
