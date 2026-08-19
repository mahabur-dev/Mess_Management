'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { Eye, Zap } from 'lucide-react'
import {
  DesignedInput,
  DesignedSelect,
  DesignedTextarea,
  FormPageShell,
  FormSection,
  FormStatusMessage,
  PaymentTypeSelector,
  UploadField,
  expenseFormIcons,
  formatTaka,
} from '@/components/mobile/expense-design'
import {
  ExpenseAdvancedOptions,
  ExpensePrimaryAction,
  SplitPreviewContent,
} from '@/components/mobile/expense-ui'
import {
  ExpenseCustomShareFields,
  buildCustomShares,
  type ExpenseCustomShare,
} from '@/components/mobile/expense-custom-shares'
import { MemberMultiSelect } from '@/components/mobile/member-multi-select'
import {
  ExpenseLineItemsEditor,
  createExpenseLineItem,
  expenseLineItemsPayload,
  type ExpenseLineItem,
} from '@/components/mobile/expense-line-items'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import { LABELS, UTILITY_FORM_OPTIONS, type ExpenseCategory, type ExpensePaymentType, type ExpenseSplitMethod, type ExpenseUsedBy } from '@/lib/form-options'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useAuth } from '../providers'
import { canManageMess } from '@/lib/app-permissions'

type FormState = {
  category: ExpenseCategory
  utilityType: string
  paymentBy: string
  items: ExpenseLineItem[]
  billDate: string
  description: string
  paymentType: ExpensePaymentType
  usedBy: ExpenseUsedBy
  splitMethod: ExpenseSplitMethod
  selectedMemberIds: string[]
  customShares: ExpenseCustomShare[]
}

type PreviewData = {
  title: string
  amount: number
  usedBy: ExpenseUsedBy
  splitMethod: ExpenseSplitMethod
  payerCredit: number
  totalSharedCost: number
  shares: Array<{ memberId: string; memberName?: string | null; shareAmount: number }>
  items: Array<{ itemName: string; quantity?: number | null; unit?: string | null; amount: number }>
}

const INITIAL_FORM: FormState = {
  category: 'ELECTRICITY',
  utilityType: 'ELECTRICITY',
  paymentBy: '',
  items: [{ id: 'initial-item', itemName: 'Electricity', quantity: '', unit: '', amount: '' }],
  billDate: new Date().toISOString().slice(0, 10),
  description: '',
  paymentType: 'FROM_DEPOSIT',
  usedBy: 'ALL_MEMBERS',
  splitMethod: 'EQUAL',
  selectedMemberIds: [],
  customShares: [],
}

export default function AddUtilityPage() {
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

  function payload() {
    const customShares =
      effectiveSplitMethod === 'CUSTOM'
        ? buildCustomShares(selectedMembers, form.customShares)
        : undefined

    return {
      messId,
      type: 'UTILITY',
      category: form.category,
      utilityType: form.utilityType,
      items: expenseLineItemsPayload(form.items),
      paidFrom: effectivePaymentType === 'FROM_DEPOSIT' ? 'MESS_DEPOSIT' : effectivePaymentType,
      paymentType: effectivePaymentType,
      usedBy: effectiveUsedBy,
      splitMethod: effectiveSplitMethod,
      selectedMemberIds: effectiveUsedBy === 'SELECTED_MEMBERS' ? form.selectedMemberIds : undefined,
      customShares,
      purchasedBy: isManager ? form.paymentBy || undefined : user?.id,
      expenseDate: form.billDate,
      description: form.description.trim() || undefined,
    }
  }

  async function handlePreview(event?: FormEvent) {
    event?.preventDefault()
    setMessage('')
    if (!messId) return setMessage('No mess selected.')
    if (form.items.some((item) => !item.itemName.trim() || !item.amount || Number(item.amount) <= 0)) {
      return setMessage('Every item requires a name and a valid line amount.')
    }
    if (effectiveUsedBy === 'SELECTED_MEMBERS' && !form.selectedMemberIds.length) return setMessage('Select members first.')
    if (effectiveSplitMethod === 'CUSTOM' && !selectedMembers.length) return setMessage('Select members before custom split.')

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
      setForm({ ...INITIAL_FORM, items: [createExpenseLineItem({ itemName: 'Electricity' })] })
      setReceiptFile(null)
      setPreview(null)
      setAdvancedOpen(false)
      setSuccess(true)
      setMessage(isManager ? 'Utility saved successfully.' : 'Utility submitted for manager approval.')
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
        <FormPageShell title="Add Utility" icon={Zap} backHref="/expenses">
          <FormSection title="Payment Source">
            <PaymentTypeSelector value={form.paymentType} onChange={(value) => update('paymentType', value)} showHeading={false} />
          </FormSection>

          <FormSection title="Utility Details">
            <DesignedSelect
              label="Utility Type"
              icon={expenseFormIcons.category}
              value={form.utilityType}
              onChange={(event) => {
                const option = UTILITY_FORM_OPTIONS.find((item) => item.utilityType === event.target.value) ?? UTILITY_FORM_OPTIONS[0]
                const previousLabel = UTILITY_FORM_OPTIONS.find((item) => item.utilityType === form.utilityType)?.label
                update('utilityType', option.utilityType)
                update('category', option.category)
                update('items', form.items.map((item, index) => (
                  index === 0 && (!item.itemName.trim() || item.itemName === previousLabel)
                    ? { ...item, itemName: option.label }
                    : item
                )))
              }}
            >
              {UTILITY_FORM_OPTIONS.map((option) => (
                <option key={option.utilityType} value={option.utilityType}>
                  {option.label}
                </option>
              ))}
            </DesignedSelect>
            {isManager ? <DesignedSelect label="Paid By" icon={expenseFormIcons.member} value={form.paymentBy} onChange={(event) => update('paymentBy', event.target.value)} required={form.paymentType === 'PERSONAL'}>
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </DesignedSelect> : null}
            <DesignedInput label="Bill Date" icon={expenseFormIcons.date} value={form.billDate} onChange={(event) => update('billDate', event.target.value)} type="date" required />
          </FormSection>

          <FormSection title="Items">
            <ExpenseLineItemsEditor items={form.items} onChange={(items) => update('items', items)} disabled={busy} />
          </FormSection>

          <ExpenseAdvancedOptions
            open={advancedOpen}
            usedBy={form.usedBy}
            splitMethod={form.splitMethod}
            allowMealMembers={false}
            allowMealCount={false}
            onOpen={() => setAdvancedOpen(true)}
            onClose={() => setAdvancedOpen(false)}
            onUsedByChange={(usedBy) => {
              update('usedBy', usedBy)
              if (usedBy === 'SELF_ONLY') update('splitMethod', 'EQUAL')
            }}
            onSplitMethodChange={(splitMethod) => update('splitMethod', splitMethod)}
          >
            {form.usedBy === 'SELECTED_MEMBERS' ? (
              <MemberMultiSelect members={members} selected={form.selectedMemberIds} onChange={(ids) => update('selectedMemberIds', ids)} />
            ) : null}
            {form.usedBy !== 'SELF_ONLY' && form.splitMethod === 'CUSTOM' ? (
              <ExpenseCustomShareFields
                members={members}
                memberIds={selectedMembers}
                shares={form.customShares}
                onChange={(shares) => update('customShares', shares)}
              />
            ) : null}
          </ExpenseAdvancedOptions>

          <FormSection title="Note">
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
