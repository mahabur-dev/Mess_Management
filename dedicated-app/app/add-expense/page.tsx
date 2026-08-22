'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { Eye, ReceiptText } from 'lucide-react'
import {
  FormPageShell,
  FormStatusMessage,
  formatTaka,
} from '@/components/mobile/expense-design'
import {
  ExpensePrimaryAction,
  SplitPreviewContent,
} from '@/components/mobile/expense-ui'
import {
  buildCustomShares,
  type ExpenseCustomShare,
} from '@/components/mobile/expense-custom-shares'
import { ExpenseEntryForm } from '@/components/mobile/expense-entry-form'
import {
  createExpenseLineItem,
  expenseLineItemsPayload,
  type ExpenseLineItem,
} from '@/components/mobile/expense-line-items'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import {
  LABELS,
  type ExpenseCategory,
  type ExpensePaymentType,
  type ExpenseSplitMethod,
  type ExpenseUsedBy,
} from '@/lib/form-options'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useAuth } from '../providers'
import { canManageMess } from '@/lib/app-permissions'

type FormState = {
  category: ExpenseCategory
  purchasedBy: string
  items: ExpenseLineItem[]
  expenseDate: string
  description: string
  paymentType: ExpensePaymentType
  usedBy: ExpenseUsedBy
  splitMethod: ExpenseSplitMethod
  selectedMemberIds: string[]
  customShares: ExpenseCustomShare[]
}

type PreviewShare = {
  memberId: string
  memberName?: string | null
  mealCount?: number | null
  shareAmount: number
}

type PreviewData = {
  title: string
  amount: number
  paidFrom: string
  usedBy: ExpenseUsedBy
  splitMethod: ExpenseSplitMethod
  payerCredit: number
  personalHistoryAmount: number
  totalSharedCost: number
  shares: PreviewShare[]
  items: Array<{ itemName: string; quantity?: number | null; unit?: string | null; amount: number }>
}

const INITIAL_FORM: FormState = {
  category: 'FOOD',
  purchasedBy: '',
  items: [{ id: 'initial-item', itemName: '', quantity: '', unit: '', amount: '' }],
  expenseDate: new Date().toISOString().slice(0, 10),
  description: '',
  paymentType: 'FROM_DEPOSIT',
  usedBy: 'ALL_MEMBERS',
  splitMethod: 'MEAL_COUNT',
  selectedMemberIds: [],
  customShares: [],
}

export default function AddExpensePage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const members = useMessMemberOptions(messId, user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [advancedCustomized, setAdvancedCustomized] = useState(false)

  const effectivePaymentType: ExpensePaymentType = form.paymentType
  const effectiveUsedBy: ExpenseUsedBy = form.usedBy
  const effectiveSplitMethod: ExpenseSplitMethod = form.splitMethod
  const selectedMembers =
    effectiveUsedBy === 'SELECTED_MEMBERS'
      ? form.selectedMemberIds
      : effectiveUsedBy === 'SELF_ONLY'
        ? user?.id
          ? [user.id]
          : []
        : members.map((member) => member.id)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setPreview(null)
    setForm((current) => ({ ...current, [key]: value }))
  }

  function buildPayload() {
    const selectedMemberIds = effectiveUsedBy === 'SELECTED_MEMBERS' ? form.selectedMemberIds : undefined
    const customShares =
      effectiveSplitMethod === 'CUSTOM'
        ? buildCustomShares(selectedMembers, form.customShares)
        : undefined

    return {
      messId,
      type: 'EXPENSE',
      paidFrom: effectivePaymentType === 'FROM_DEPOSIT' ? 'MESS_DEPOSIT' : effectivePaymentType,
      paymentType: effectivePaymentType,
      usedBy: effectiveUsedBy,
      splitMethod: effectiveSplitMethod,
      selectedMemberIds,
      customShares,
      purchasedBy: isManager ? form.purchasedBy || undefined : user?.id,
      category: form.category,
      items: expenseLineItemsPayload(form.items),
      expenseDate: form.expenseDate,
      description: form.description.trim() || undefined,
    }
  }

  async function handlePreview(event?: FormEvent) {
    event?.preventDefault()
    setMessage('')
    setSuccess(false)
    if (!messId) return setMessage('No mess selected.')
    if (form.items.some((item) => !item.itemName.trim() || !item.amount || Number(item.amount) <= 0)) {
      return setMessage('Every item requires a name and a valid line amount.')
    }
    if (effectiveUsedBy === 'SELECTED_MEMBERS' && !form.selectedMemberIds.length) return setMessage('Select at least one member.')

    setBusy(true)
    try {
      const res = await api.previewExpense(buildPayload())
      setPreview((res.data as PreviewData) ?? null)
    } catch (error) {
      setPreview(null)
      setMessage(error instanceof Error ? error.message : 'Failed to calculate split.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    setMessage('')
    setSuccess(false)
    setBusy(true)
    try {
      const payload = buildPayload()
      if (receiptFile) {
        const data = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') return
          if (Array.isArray(value) || typeof value === 'object') data.append(key, JSON.stringify(value))
          else data.append(key, String(value))
        })
        data.append('receipt', receiptFile)
        await api.createExpense(data)
      } else {
        await api.createExpense(payload)
      }

      setForm({ ...INITIAL_FORM, items: [createExpenseLineItem()] })
      setReceiptFile(null)
      setPreview(null)
      setAdvancedOpen(false)
      setAdvancedCustomized(false)
      setSuccess(true)
      const autoApproved = isManager || (
        effectivePaymentType === 'PERSONAL' && effectiveUsedBy === 'SELF_ONLY'
      )
      setMessage(autoApproved ? 'Expense saved successfully.' : 'Expense submitted for manager approval.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save expense.')
    } finally {
      setBusy(false)
    }
  }

  if (preview) {
    return (
      <MobileShell>
        <FormPageShell title="Split Preview" icon={Eye} backHref="/add-expense">
          <SplitPreviewContent
            title={preview.title}
            amount={preview.amount}
            paidFrom={LABELS.EXPENSE_PAYMENT_TYPES[effectivePaymentType]}
            usedBy={LABELS.EXPENSE_USED_BY[preview.usedBy]}
            splitMethod={LABELS.EXPENSE_SPLIT_METHODS[preview.splitMethod]}
            payerCredit={preview.payerCredit}
            totalSharedCost={preview.totalSharedCost}
            items={preview.items}
            shares={preview.shares}
            formatMoney={formatTaka}
            busy={busy}
            onBack={() => setPreview(null)}
            onSave={() => void handleSave()}
          />
          <FormStatusMessage message={message} success={success} />
        </FormPageShell>
      </MobileShell>
    )
  }

  return (
    <MobileShell>
      <form onSubmit={handlePreview}>
        <FormPageShell title="Add Expense" icon={ReceiptText} backHref="/expenses">
          <ExpenseEntryForm
            kind="expense"
            paymentType={form.paymentType}
            onPaymentTypeChange={(value) => update('paymentType', value)}
            category={form.category}
            onCategoryChange={(category) => {
              update('category', category)
              if (!advancedCustomized) {
                update('usedBy', 'ALL_MEMBERS')
                update('splitMethod', category === 'FOOD' || category === 'GROCERY' ? 'MEAL_COUNT' : 'EQUAL')
              }
            }}
            paidBy={form.purchasedBy}
            onPaidByChange={(value) => update('purchasedBy', value)}
            showPaidBy={isManager}
            date={form.expenseDate}
            onDateChange={(value) => update('expenseDate', value)}
            items={form.items}
            onItemsChange={(items) => update('items', items)}
            advancedOpen={advancedOpen}
            onAdvancedOpen={() => setAdvancedOpen(true)}
            onAdvancedClose={() => setAdvancedOpen(false)}
            usedBy={form.usedBy}
            onUsedByChange={(usedBy) => {
              setAdvancedCustomized(true)
              update('usedBy', usedBy)
              if (usedBy === 'SELF_ONLY') update('splitMethod', 'EQUAL')
              if (usedBy === 'MEAL_ON_MEMBERS' && form.splitMethod === 'CUSTOM') update('splitMethod', 'MEAL_COUNT')
            }}
            splitMethod={form.splitMethod}
            onSplitMethodChange={(splitMethod) => {
              setAdvancedCustomized(true)
              update('splitMethod', splitMethod)
            }}
            members={members}
            selectedMemberIds={form.selectedMemberIds}
            onSelectedMemberIdsChange={(ids) => update('selectedMemberIds', ids)}
            customShares={form.customShares}
            customShareMemberIds={selectedMembers}
            onCustomSharesChange={(shares) => update('customShares', shares)}
            description={form.description}
            onDescriptionChange={(value) => update('description', value)}
            busy={busy}
            attachment={{ fileName: receiptFile?.name, onChange: setReceiptFile }}
          />

          <FormStatusMessage message={message} success={success} />
          <ExpensePrimaryAction type="submit" disabled={busy}>
            <Eye size={17} />
            {busy ? 'Calculating...' : 'Preview Split'}
          </ExpensePrimaryAction>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
