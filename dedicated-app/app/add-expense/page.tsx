'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { Eye, ReceiptText } from 'lucide-react'
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
import {
  ExpensePrimaryAction,
  ExpenseSplitMethodSelector,
  ExpenseUsedBySelector,
  SplitPreviewContent,
} from '@/components/mobile/expense-ui'
import {
  ExpenseCustomShareFields,
  buildCustomShares,
  type ExpenseCustomShare,
} from '@/components/mobile/expense-custom-shares'
import { MemberMultiSelect } from '@/components/mobile/member-multi-select'
import { currentMonthValue } from '@/components/mobile/meals-design'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import {
  GENERAL_EXPENSE_CATEGORIES,
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
  amount: string
  itemName: string
  quantity: string
  unit: string
  expenseDate: string
  billingMonth: string
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
}

const INITIAL_FORM: FormState = {
  category: 'FOOD',
  purchasedBy: '',
  amount: '',
  itemName: '',
  quantity: '',
  unit: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  billingMonth: currentMonthValue(),
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
      amount: Number(form.amount),
      itemName: form.itemName.trim() || LABELS.EXPENSE_CATEGORIES[form.category],
      quantity: form.quantity ? Number(form.quantity) : undefined,
      unit: form.unit.trim() || undefined,
      expenseDate: form.expenseDate,
      billingMonth: `${form.billingMonth}-01`,
      description: form.description.trim() || undefined,
    }
  }

  async function handlePreview(event?: FormEvent) {
    event?.preventDefault()
    setMessage('')
    setSuccess(false)
    if (!messId) return setMessage('No mess selected.')
    if (!form.amount) return setMessage('Amount is required.')
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

      setForm(INITIAL_FORM)
      setReceiptFile(null)
      setPreview(null)
      setSuccess(true)
      setMessage(isManager ? 'Expense saved successfully.' : 'Expense submitted for manager approval.')
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
          <FormSection title="Paid From">
            <PaymentTypeSelector value={form.paymentType} onChange={(value) => update('paymentType', value)} showHeading={false} />
          </FormSection>

          <FormSection title="Used By">
            <ExpenseUsedBySelector
              value={form.usedBy}
              onChange={(usedBy) => {
                update('usedBy', usedBy)
                if (usedBy === 'SELF_ONLY') update('splitMethod', 'EQUAL')
                if (usedBy === 'MEAL_ON_MEMBERS' && form.splitMethod === 'CUSTOM') update('splitMethod', 'MEAL_COUNT')
              }}
            />
            {form.usedBy === 'SELECTED_MEMBERS' ? (
              <MemberMultiSelect members={members} selected={form.selectedMemberIds} onChange={(ids) => update('selectedMemberIds', ids)} />
            ) : null}
          </FormSection>

          {form.usedBy !== 'SELF_ONLY' ? (
            <FormSection title="Split Method">
              <ExpenseSplitMethodSelector
                value={form.splitMethod}
                onChange={(splitMethod) => update('splitMethod', splitMethod)}
                allowCustom={form.usedBy !== 'MEAL_ON_MEMBERS'}
              />
              {form.splitMethod === 'CUSTOM' ? (
                <ExpenseCustomShareFields
                  members={members}
                  memberIds={selectedMembers}
                  shares={form.customShares}
                  onChange={(shares) => update('customShares', shares)}
                />
              ) : null}
            </FormSection>
          ) : null}

          <FormSection title="Expense Details">
            <FormFieldGrid>
              <DesignedSelect label="Category" icon={expenseFormIcons.category} value={form.category} onChange={(event) => update('category', event.target.value as ExpenseCategory)}>
                {GENERAL_EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {LABELS.EXPENSE_CATEGORIES[category]}
                  </option>
                ))}
              </DesignedSelect>
              <DesignedInput label="Item" icon={expenseFormIcons.item} value={form.itemName} onChange={(event) => update('itemName', event.target.value)} placeholder="Expense item" />
            </FormFieldGrid>
            {form.category === 'FOOD' || form.category === 'GROCERY' ? (
              <FormFieldGrid>
                <DesignedInput label="Quantity (Optional)" icon={expenseFormIcons.item} value={form.quantity} onChange={(event) => update('quantity', event.target.value)} placeholder="0" type="number" />
                <DesignedInput label="Unit (Optional)" icon={expenseFormIcons.item} value={form.unit} onChange={(event) => update('unit', event.target.value)} placeholder="kg" />
              </FormFieldGrid>
            ) : null}
            <DesignedInput label="Amount" icon={expenseFormIcons.amount} value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Enter amount" type="number" min="0.01" step="0.01" required />
            <FormFieldGrid>
              <DesignedInput label="Expense Date" icon={expenseFormIcons.date} value={form.expenseDate} onChange={(event) => update('expenseDate', event.target.value)} type="date" required />
              <DesignedInput label="Billing Month" icon={expenseFormIcons.date} value={form.billingMonth} onChange={(event) => update('billingMonth', event.target.value)} type="month" required />
            </FormFieldGrid>
            {isManager ? <DesignedSelect label={form.paymentType === 'PERSONAL' ? 'Paid By' : 'Purchased By'} icon={expenseFormIcons.member} value={form.purchasedBy} onChange={(event) => update('purchasedBy', event.target.value)} required={form.paymentType === 'PERSONAL'}>
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
