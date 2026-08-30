'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { Eye, Zap } from 'lucide-react'
import {
  FormPageShell,
  FormStatusMessage,
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
import { type ExpensePaymentType, type ExpenseSplitMethod, type ExpenseUsedBy } from '@/lib/form-options'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useAuth } from '../providers'
import { canManageMess } from '@/lib/app-permissions'
import {
  expensePaymentSourceLabel,
  expenseSplitMethodLabel,
  expenseUsedByLabel,
  formatIsoDate,
  useLocale,
  useLocaleFormatters,
  useLocalizedNotice,
  useTranslations,
} from '@/lib/i18n'

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
  billDate: formatIsoDate(),
  description: '',
  paymentType: 'FROM_DEPOSIT',
  usedBy: 'ALL_MEMBERS',
  splitMethod: 'EQUAL',
  selectedMemberIds: [],
  customShares: [],
}

export default function AddUtilityPage() {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('expenses')
  const { notice, clearNotice, showMessage, showError } = useLocalizedNotice('expenses')
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const members = useMessMemberOptions(messId, user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
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
    clearNotice()
    if (!messId) return showMessage('missingExpenseContext', 'danger')
    if (form.items.some((item) => !item.itemName.trim() || !item.amount || Number(item.amount) <= 0)) {
      return showMessage('everyItemRequired', 'danger')
    }
    if (effectiveUsedBy === 'SELECTED_MEMBERS' && !form.selectedMemberIds.length) return showMessage('selectAtLeastOneMember', 'danger')
    if (effectiveSplitMethod === 'CUSTOM' && !selectedMembers.length) return showMessage('selectMembersBeforeCustom', 'danger')

    setBusy(true)
    try {
      const res = await api.previewExpense(payload())
      setPreview(res.data as PreviewData)
    } catch (error) {
      showError(error, 'utilityPreviewFailed')
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    setBusy(true)
    clearNotice()
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
      const autoApproved = isManager
      showMessage(autoApproved ? 'utilitySaved' : 'utilitySubmitted', 'success')
    } catch (error) {
      showError(error, 'saveUtilityFailed')
    } finally {
      setBusy(false)
    }
  }

  if (preview) {
    return (
      <MobileShell>
        <FormPageShell title={t('splitPreview')} icon={Eye} backHref="/add-utility">
          <SplitPreviewContent
            title={preview.title}
            amount={preview.amount}
            paidFrom={expensePaymentSourceLabel(effectivePaymentType, locale)}
            usedBy={expenseUsedByLabel(preview.usedBy, locale)}
            splitMethod={expenseSplitMethodLabel(preview.splitMethod, locale)}
            payerCredit={preview.payerCredit}
            totalSharedCost={preview.totalSharedCost}
            items={preview.items}
            shares={preview.shares}
            formatMoney={format.money}
            busy={busy}
            onBack={() => setPreview(null)}
            onSave={() => void handleSave()}
          />
          <FormStatusMessage message={notice?.message ?? ''} success={notice?.tone === 'success'} />
        </FormPageShell>
      </MobileShell>
    )
  }

  return (
    <MobileShell>
      <form onSubmit={handlePreview}>
        <FormPageShell title={t('addUtility')} icon={Zap} backHref="/expenses">
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
          <FormStatusMessage message={notice?.message ?? ''} success={notice?.tone === 'success'} />
          <ExpensePrimaryAction type="submit" disabled={busy}>
            <Eye size={17} />
            {busy ? t('calculating') : t('previewSplit')}
          </ExpensePrimaryAction>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
