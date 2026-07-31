'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { Eye, Scale, User, Users, UtensilsCrossed, Zap } from 'lucide-react'
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
import { ExpenseChoiceCard, ExpensePrimaryAction, SplitPreviewContent } from '@/components/mobile/expense-ui'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import { LABELS, type ExpenseCategory, type ExpensePaymentType, type ExpenseSplitMethod, type ExpenseUsedBy } from '@/lib/form-options'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useAuth } from '../providers'
import { canManageMess } from '@/lib/app-permissions'

const UTILITY_OPTIONS: Array<{ category: ExpenseCategory; utilityType: string; label: string }> = [
  { category: 'ELECTRICITY', utilityType: 'ELECTRICITY', label: 'Electricity' },
  { category: 'GAS', utilityType: 'GAS', label: 'Gas' },
  { category: 'WATER', utilityType: 'WATER', label: 'Water' },
  { category: 'WIFI', utilityType: 'WIFI', label: 'Wifi' },
  { category: 'CLEANER', utilityType: 'CLEANING', label: 'Cleaning' },
  { category: 'UTILITY', utilityType: 'OTHER', label: 'Other' },
]

type FormState = {
  category: ExpenseCategory
  utilityType: string
  paymentBy: string
  amount: string
  billingMonth: string
  billDate: string
  description: string
  paymentType: ExpensePaymentType
  usedBy: ExpenseUsedBy
  splitMethod: ExpenseSplitMethod
  selectedMemberIds: string[]
}

type PreviewData = {
  title: string
  amount: number
  usedBy: ExpenseUsedBy
  splitMethod: ExpenseSplitMethod
  payerCredit: number
  totalSharedCost: number
  shares: Array<{ memberId: string; memberName?: string | null; shareAmount: number }>
}

const INITIAL_FORM: FormState = {
  category: 'ELECTRICITY',
  utilityType: 'ELECTRICITY',
  paymentBy: '',
  amount: '',
  billingMonth: new Date().toISOString().slice(0, 7),
  billDate: new Date().toISOString().slice(0, 10),
  description: '',
  paymentType: 'FROM_DEPOSIT',
  usedBy: 'ALL_MEMBERS',
  splitMethod: 'EQUAL',
  selectedMemberIds: [],
}

function SmallChoice({
  active,
  icon: Icon,
  title,
  onClick,
  vertical = false,
}: {
  active: boolean
  icon: typeof User
  title: string
  onClick: () => void
  vertical?: boolean
}) {
  return (
    <ExpenseChoiceCard active={active} icon={Icon} title={title} onClick={onClick} compact={!vertical} layout={vertical ? 'vertical' : 'horizontal'} />
  )
}

export default function AddUtilityPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const members = useMessMemberOptions(messId, user)
  const isManager = canManageMess(user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const effectivePaymentType: ExpensePaymentType = isManager ? form.paymentType : 'PERSONAL'
  const effectiveUsedBy: ExpenseUsedBy = isManager ? form.usedBy : 'SELF_ONLY'
  const effectiveSplitMethod: ExpenseSplitMethod = isManager ? form.splitMethod : 'EQUAL'

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setPreview(null)
    setForm((current) => ({ ...current, [key]: value }))
  }

  function payload() {
    return {
      messId,
      type: 'UTILITY',
      category: form.category,
      utilityType: form.utilityType,
      amount: Number(form.amount),
      itemName: LABELS.EXPENSE_CATEGORIES[form.category],
      paidFrom: effectivePaymentType === 'FROM_DEPOSIT' ? 'MESS_DEPOSIT' : effectivePaymentType,
      paymentType: effectivePaymentType,
      usedBy: effectiveUsedBy,
      splitMethod: effectiveSplitMethod,
      selectedMemberIds: effectiveUsedBy === 'SELECTED_MEMBERS' ? form.selectedMemberIds : undefined,
      purchasedBy: isManager ? form.paymentBy || undefined : user?.id,
      expenseDate: form.billDate,
      billingMonth: `${form.billingMonth}-01`,
      description: form.description.trim() || undefined,
    }
  }

  async function handlePreview(event?: FormEvent) {
    event?.preventDefault()
    setMessage('')
    if (!messId) return setMessage('No mess selected.')
    if (!form.amount) return setMessage('Amount is required.')
    if (effectiveUsedBy === 'SELECTED_MEMBERS' && !form.selectedMemberIds.length) return setMessage('Select members first.')

    setBusy(true)
    try {
      const res = await api.previewExpense(payload())
      setPreview(res.data as PreviewData)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to preview utility.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    setBusy(true)
    setMessage('')
    try {
      const body = payload()
      if (receiptFile) {
        const data = new FormData()
        Object.entries(body).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') return
          if (Array.isArray(value) || typeof value === 'object') data.append(key, JSON.stringify(value))
          else data.append(key, String(value))
        })
        data.append('receipt', receiptFile)
        await api.createExpense(data)
      } else {
        await api.createExpense(body)
      }
      setForm(INITIAL_FORM)
      setReceiptFile(null)
      setPreview(null)
      setSuccess(true)
      setMessage('Utility saved successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save utility.')
    } finally {
      setBusy(false)
    }
  }

  if (preview) {
    return (
      <MobileShell>
        <FormPageShell title="Split Preview" icon={Eye} backHref="/add-utility">
          <SplitPreviewContent
            title={preview.title}
            amount={preview.amount}
            paidFrom={LABELS.EXPENSE_PAYMENT_TYPES[effectivePaymentType]}
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
        <FormPageShell title="Add Utility" icon={Zap} backHref="/expenses">
          {isManager ? <FormSection title="Paid From">
            <PaymentTypeSelector value={form.paymentType} onChange={(value) => update('paymentType', value)} showHeading={false} />
          </FormSection> : (
            <div className="rounded-[16px] border border-[#cfeeed] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#00777a]">
              Member entries are saved as your personal, self-only utility expenses.
            </div>
          )}
          {isManager ? <FormSection title="Used By">
            <div className="grid grid-cols-2 gap-2.5 min-[390px]:grid-cols-4">
              <SmallChoice active={form.usedBy === 'SELF_ONLY'} icon={User} title="Self Only" onClick={() => { update('usedBy', 'SELF_ONLY'); update('splitMethod', 'EQUAL') }} vertical />
              <SmallChoice active={form.usedBy === 'SELECTED_MEMBERS'} icon={Users} title="Selected" onClick={() => update('usedBy', 'SELECTED_MEMBERS')} vertical />
              <SmallChoice active={form.usedBy === 'ALL_MEMBERS'} icon={Users} title="All Members" onClick={() => update('usedBy', 'ALL_MEMBERS')} vertical />
              <SmallChoice active={form.usedBy === 'MEAL_ON_MEMBERS'} icon={UtensilsCrossed} title="Meal-On" onClick={() => update('usedBy', 'MEAL_ON_MEMBERS')} vertical />
            </div>
            {form.usedBy === 'SELECTED_MEMBERS' ? (
              <div className="grid grid-cols-2 gap-2">
                {members.map((member) => {
                  const active = form.selectedMemberIds.includes(member.id)
                  return (
                    <button key={member.id} type="button" onClick={() => update('selectedMemberIds', active ? form.selectedMemberIds.filter((id) => id !== member.id) : [...form.selectedMemberIds, member.id])} className={`rounded-[13px] border px-3 py-2.5 text-left text-label font-bold ${active ? 'border-[#008d8c] bg-[#edfafa] text-[#008d8c]' : 'border-[#dce5ec] bg-white text-[#123748]'}`}>
                      {member.name}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </FormSection> : null}
          {isManager && form.usedBy !== 'SELF_ONLY' ? (
            <FormSection title="Split Method">
              <div className="grid grid-cols-2 gap-2.5">
                <SmallChoice active={form.splitMethod === 'EQUAL'} icon={Scale} title="Equal" onClick={() => update('splitMethod', 'EQUAL')} vertical />
                <SmallChoice active={form.splitMethod === 'MEAL_COUNT'} icon={UtensilsCrossed} title="Meal Count" onClick={() => update('splitMethod', 'MEAL_COUNT')} vertical />
              </div>
            </FormSection>
          ) : null}
          <FormSection title="Utility Details">
            <DesignedSelect
              label="Utility Type"
              icon={expenseFormIcons.category}
              value={form.utilityType}
              onChange={(event) => {
                const option = UTILITY_OPTIONS.find((item) => item.utilityType === event.target.value) ?? UTILITY_OPTIONS[0]
                update('utilityType', option.utilityType)
                update('category', option.category)
              }}
            >
              {UTILITY_OPTIONS.map((option) => (
                <option key={option.utilityType} value={option.utilityType}>
                  {option.label}
                </option>
              ))}
            </DesignedSelect>
            <FormFieldGrid>
              <DesignedInput label="Billing Month" icon={expenseFormIcons.date} value={form.billingMonth} onChange={(event) => update('billingMonth', event.target.value)} type="month" required />
              <DesignedInput label="Bill Date" icon={expenseFormIcons.date} value={form.billDate} onChange={(event) => update('billDate', event.target.value)} type="date" required />
            </FormFieldGrid>
            <DesignedInput label="Amount" icon={expenseFormIcons.amount} value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" type="number" min="0.01" step="0.01" required />
            {isManager ? <DesignedSelect label="Paid By" icon={expenseFormIcons.member} value={form.paymentBy} onChange={(event) => update('paymentBy', event.target.value)} required={form.paymentType === 'PERSONAL'}>
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </DesignedSelect> : null}
            <DesignedTextarea label="Note (Optional)" icon={expenseFormIcons.description} value={form.description} onChange={(event) => update('description', event.target.value.slice(0, 250))} placeholder="Add a note" count={`${form.description.length}/250`} />
          </FormSection>
          <FormSection title="Attachment">
            <UploadField fileName={receiptFile?.name} onChange={setReceiptFile} />
          </FormSection>
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
