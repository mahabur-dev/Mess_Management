'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { Eye, Zap } from 'lucide-react'
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
  type ExpenseLineItem,
} from '@/components/mobile/expense-line-items'
import {
  utilityLineItemsPayload,
  utilityOptionForItemName,
} from '@/components/mobile/utility-line-items'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import { LABELS, type ExpensePaymentType, type ExpenseSplitMethod, type ExpenseUsedBy } from '@/lib/form-options'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useAuth } from '../providers'
import { canManageMess } from '@/lib/app-permissions'

type FormState = {
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

    const selectedUtilityOptions = form.items
      .map((item) => utilityOptionForItemName(item.itemName))
      .filter((option) => option !== undefined)
    const utilityTypes = new Set(selectedUtilityOptions.map((option) => option.utilityType))
    const singleUtilityOption = utilityTypes.size === 1 ? selectedUtilityOptions[0] : undefined

    return {
      messId,
      type: 'UTILITY',
      category: singleUtilityOption?.category ?? 'UTILITY',
      utilityType: singleUtilityOption?.utilityType ?? 'OTHER',
      items: utilityLineItemsPayload(form.items),
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
      const autoApproved = isManager
      setMessage(autoApproved ? 'Utility saved successfully.' : 'Utility submitted for manager approval.')
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
          <ExpenseEntryForm
            kind="utility"
            paymentType={form.paymentType}
            onPaymentTypeChange={(value) => update('paymentType', value)}
            paidBy={form.paymentBy}
            onPaidByChange={(value) => update('paymentBy', value)}
            showPaidBy={isManager}
            date={form.billDate}
            onDateChange={(value) => update('billDate', value)}
            items={form.items}
            onItemsChange={(items) => update('items', items)}
            advancedOpen={advancedOpen}
            onAdvancedOpen={() => setAdvancedOpen(true)}
            onAdvancedClose={() => setAdvancedOpen(false)}
            usedBy={form.usedBy}
            onUsedByChange={(usedBy) => {
              update('usedBy', usedBy)
            }}
            splitMethod={form.splitMethod}
            onSplitMethodChange={(splitMethod) => update('splitMethod', splitMethod)}
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
