'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { Eye, ReceiptText, Scale, User, Users, UtensilsCrossed } from 'lucide-react'
import {
  DesignedInput,
  DesignedSelect,
  DesignedTextarea,
  FormFieldGrid,
  FormPageShell,
  FormSection,
  FormStatusMessage,
  PaymentTypeSelector,
  UploadField,
  expenseFormIcons,
  formatTaka,
} from '@/components/mobile/expense-design'
import { ExpenseChoiceCard, SplitPreviewContent } from '@/components/mobile/expense-ui'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import {
  EXPENSE_CATEGORIES,
  LABELS,
  type ExpenseCategory,
  type ExpensePaymentType,
  type ExpenseSplitMethod,
  type ExpenseUsedBy,
} from '@/lib/form-options'
import { useMessMemberOptions, type MemberOption } from '@/hooks/use-mess-member-options'
import { useAuth } from '../providers'

type CustomShare = {
  memberId: string
  amount: string
}

type FormState = {
  category: ExpenseCategory
  purchasedBy: string
  amount: string
  itemName: string
  quantity: string
  unit: string
  expenseDate: string
  billingMonth: string
  description: string
  receiptUrl: string
  paymentType: ExpensePaymentType
  usedBy: ExpenseUsedBy
  splitMethod: ExpenseSplitMethod
  selectedMemberIds: string[]
  customShares: CustomShare[]
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
}

const INITIAL_FORM: FormState = {
  category: 'FOOD',
  purchasedBy: '',
  amount: '',
  itemName: '',
  quantity: '',
  unit: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  billingMonth: new Date().toISOString().slice(0, 7),
  description: '',
  receiptUrl: '',
  paymentType: 'FROM_DEPOSIT',
  usedBy: 'ALL_MEMBERS',
  splitMethod: 'MEAL_COUNT',
  selectedMemberIds: [],
  customShares: [],
}

function ChoiceButton({
  active,
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean
  icon: typeof User
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <ExpenseChoiceCard active={active} icon={Icon} title={title} subtitle={subtitle} onClick={onClick} layout="vertical" />
  )
}

function MemberSelector({
  members,
  selected,
  onChange,
}: {
  members: MemberOption[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const selectedSet = new Set(selected)
  return (
    <div className="grid grid-cols-2 gap-2">
      {members.map((member) => {
        const active = selectedSet.has(member.id)
        return (
          <button
            type="button"
            key={member.id}
            onClick={() => {
              onChange(active ? selected.filter((id) => id !== member.id) : [...selected, member.id])
            }}
            className={`rounded-[13px] border px-3 py-2.5 text-left text-label font-bold transition ${
              active ? 'border-[#008d8c] bg-[#edfafa] text-[#008d8c]' : 'border-[#dce5ec] bg-white text-[#123748]'
            }`}
          >
            {member.name}
          </button>
        )
      })}
    </div>
  )
}

export default function AddExpensePage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const members = useMessMemberOptions(messId, user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)

  const selectedMembers = form.usedBy === 'SELECTED_MEMBERS' ? form.selectedMemberIds : members.map((member) => member.id)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setPreview(null)
    setForm((current) => ({ ...current, [key]: value }))
  }

  function buildPayload() {
    const selectedMemberIds = form.usedBy === 'SELECTED_MEMBERS' ? form.selectedMemberIds : undefined
    const customShares =
      form.splitMethod === 'CUSTOM'
        ? selectedMembers.map((memberId) => ({
            memberId,
            amount: Number(form.customShares.find((share) => share.memberId === memberId)?.amount ?? 0),
          }))
        : undefined

    return {
      messId,
      type: 'EXPENSE',
      paidFrom: form.paymentType === 'FROM_DEPOSIT' ? 'MESS_DEPOSIT' : form.paymentType,
      paymentType: form.paymentType,
      usedBy: form.usedBy,
      splitMethod: form.splitMethod,
      selectedMemberIds,
      customShares,
      purchasedBy: form.purchasedBy || undefined,
      category: form.category,
      amount: Number(form.amount),
      itemName: form.itemName.trim() || LABELS.EXPENSE_CATEGORIES[form.category],
      quantity: form.quantity ? Number(form.quantity) : undefined,
      unit: form.unit.trim() || undefined,
      expenseDate: form.expenseDate,
      billingMonth: `${form.billingMonth}-01`,
      description: form.description.trim() || undefined,
      receiptUrl: form.receiptUrl.trim() || undefined,
    }
  }

  async function handlePreview(event?: FormEvent) {
    event?.preventDefault()
    setMessage('')
    setSuccess(false)
    if (!messId) return setMessage('No mess selected.')
    if (!form.amount) return setMessage('Amount is required.')
    if (form.usedBy === 'SELECTED_MEMBERS' && !form.selectedMemberIds.length) return setMessage('Select at least one member.')

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

      setForm(INITIAL_FORM)
      setReceiptFile(null)
      setPreview(null)
      setSuccess(true)
      setMessage('Expense saved successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save expense.')
    } finally {
      setBusy(false)
    }
  }

  if (preview) {
    return (
      <MobileShell>
        <FormPageShell title="Split Preview" description="See exactly how this expense will be calculated" icon={Eye} backHref="/add-expense">
          <SplitPreviewContent
            title={preview.title}
            amount={preview.amount}
            paidFrom={LABELS.EXPENSE_PAYMENT_TYPES[form.paymentType]}
            usedBy={LABELS.EXPENSE_USED_BY[preview.usedBy]}
            splitMethod={LABELS.EXPENSE_SPLIT_METHODS[preview.splitMethod]}
            payerCredit={preview.payerCredit}
            totalSharedCost={preview.totalSharedCost}
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
        <FormPageShell title="Add Expense" description="Record food, rent, or other expenses" icon={ReceiptText} backHref="/expenses">
          <FormSection title="1. Paid From">
            <PaymentTypeSelector value={form.paymentType} onChange={(value) => update('paymentType', value)} showHeading={false} />
          </FormSection>

          <FormSection title="2. Used By">
            <div className="grid grid-cols-2 gap-2.5 min-[390px]:grid-cols-4">
              <ChoiceButton active={form.usedBy === 'SELF_ONLY'} icon={User} title="Self Only" subtitle="Only purchaser" onClick={() => update('usedBy', 'SELF_ONLY')} />
              <ChoiceButton active={form.usedBy === 'SELECTED_MEMBERS'} icon={Users} title="Selected" subtitle="Choose members" onClick={() => update('usedBy', 'SELECTED_MEMBERS')} />
              <ChoiceButton active={form.usedBy === 'ALL_MEMBERS'} icon={Users} title="All Members" subtitle="Everyone active" onClick={() => update('usedBy', 'ALL_MEMBERS')} />
              <ChoiceButton active={form.usedBy === 'MEAL_ON_MEMBERS'} icon={UtensilsCrossed} title="Meal-On" subtitle="Active meal members" onClick={() => update('usedBy', 'MEAL_ON_MEMBERS')} />
            </div>
            {form.usedBy === 'SELECTED_MEMBERS' ? <MemberSelector members={members} selected={form.selectedMemberIds} onChange={(ids) => update('selectedMemberIds', ids)} /> : null}
          </FormSection>

          <FormSection title="3. Split Method">
            <div className="grid grid-cols-3 gap-2.5">
              <ChoiceButton active={form.splitMethod === 'EQUAL'} icon={Scale} title="Equal" subtitle="Same share" onClick={() => update('splitMethod', 'EQUAL')} />
              <ChoiceButton active={form.splitMethod === 'MEAL_COUNT'} icon={UtensilsCrossed} title="Meals" subtitle="Meal count" onClick={() => update('splitMethod', 'MEAL_COUNT')} />
              <ChoiceButton active={form.splitMethod === 'CUSTOM'} icon={Scale} title="Custom" subtitle="Exact amount" onClick={() => update('splitMethod', 'CUSTOM')} />
            </div>
            {form.splitMethod === 'CUSTOM' ? (
              <div className="space-y-2">
                {selectedMembers.map((memberId) => {
                  const member = members.find((item) => item.id === memberId)
                  return (
                    <DesignedInput
                      key={memberId}
                      label={member?.name ?? memberId}
                      icon={expenseFormIcons.amount}
                      value={form.customShares.find((share) => share.memberId === memberId)?.amount ?? ''}
                      onChange={(event) => {
                        const amount = event.target.value
                        update('customShares', [...form.customShares.filter((share) => share.memberId !== memberId), { memberId, amount }])
                      }}
                      type="number"
                      placeholder="0"
                    />
                  )
                })}
              </div>
            ) : null}
          </FormSection>

          <FormSection title="4. Expense Details">
            <FormFieldGrid>
              <DesignedSelect label="Category" icon={expenseFormIcons.category} value={form.category} onChange={(event) => update('category', event.target.value as ExpenseCategory)}>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {LABELS.EXPENSE_CATEGORIES[category]}
                  </option>
                ))}
              </DesignedSelect>
              <DesignedInput label="Item Name" icon={expenseFormIcons.item} value={form.itemName} onChange={(event) => update('itemName', event.target.value)} placeholder="Rice, grocery..." />
            </FormFieldGrid>
            <FormFieldGrid>
              <DesignedInput label="Quantity" icon={expenseFormIcons.item} value={form.quantity} onChange={(event) => update('quantity', event.target.value)} placeholder="5" type="number" />
              <DesignedInput label="Unit" icon={expenseFormIcons.item} value={form.unit} onChange={(event) => update('unit', event.target.value)} placeholder="kg" />
            </FormFieldGrid>
            <DesignedInput label="Amount" icon={expenseFormIcons.amount} value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" type="number" />
            <FormFieldGrid>
              <DesignedInput label="Expense Date" icon={expenseFormIcons.date} value={form.expenseDate} onChange={(event) => update('expenseDate', event.target.value)} type="date" />
              <DesignedInput label="Billing Month" icon={expenseFormIcons.date} value={form.billingMonth} onChange={(event) => update('billingMonth', event.target.value)} type="month" />
            </FormFieldGrid>
            <DesignedSelect label="Purchased By" icon={expenseFormIcons.member} value={form.purchasedBy} onChange={(event) => update('purchasedBy', event.target.value)}>
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </DesignedSelect>
            <DesignedTextarea label="Description" icon={expenseFormIcons.description} value={form.description} onChange={(event) => update('description', event.target.value.slice(0, 250))} placeholder="Add expense note..." count={`${form.description.length}/250`} />
          </FormSection>

          <FormSection>
            <DesignedInput label="Receipt URL" icon={expenseFormIcons.receipt} value={form.receiptUrl} onChange={(event) => update('receiptUrl', event.target.value)} placeholder="https://..." />
            <UploadField fileName={receiptFile?.name} onChange={setReceiptFile} />
          </FormSection>

          <FormStatusMessage message={message} success={success} />
          <button type="submit" disabled={busy} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[15px] border border-[#008d8c] bg-white text-label font-bold text-[#008d8c] disabled:opacity-70">
            <Eye size={17} />
            {busy ? 'Calculating...' : 'Preview Split'}
          </button>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
