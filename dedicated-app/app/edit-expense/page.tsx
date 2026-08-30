'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptText, Save, Zap } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
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
} from '@/components/mobile/expense-design'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MemberMultiSelect } from '@/components/mobile/member-multi-select'
import {
  ExpenseLineItemsEditor,
  expenseLineItemsPayload,
  type ExpenseLineItem,
} from '@/components/mobile/expense-line-items'
import {
  UtilityLineItemsEditor,
  utilityLineItemsPayload,
  utilityOptionForItemName,
} from '@/components/mobile/utility-line-items'
import { ExpenseAdvancedOptions, ExpensePrimaryAction } from '@/components/mobile/expense-ui'
import {
  ExpenseCustomShareFields,
  buildCustomShares,
  type ExpenseCustomShare,
} from '@/components/mobile/expense-custom-shares'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import {
  EXPENSE_USED_BY,
  GENERAL_EXPENSE_CATEGORIES,
  UTILITY_FORM_OPTIONS,
  type ExpenseCategory,
  type ExpensePaymentType,
  type ExpenseSplitMethod,
  type ExpenseUsedBy,
} from '@/lib/form-options'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'
import { expenseCategoryLabel, formatIsoDate, useLocale, useLocalizedNotice, useTranslations } from '@/lib/i18n'

type ExpenseRecord = {
  id: string
  type?: 'EXPENSE' | 'UTILITY'
  category: ExpenseCategory
  utilityType?: string | null
  purchasedBy?: string | null
  amount: string | number
  itemName?: string | null
  quantity?: string | number | null
  unit?: string | null
  items?: Array<{
    id?: string
    itemName: string
    quantity?: string | number | null
    unit?: string | null
    amount: string | number
  }>
  expenseDate?: string | null
  billingMonth?: string | null
  description?: string | null
  receiptUrl?: string | null
  paymentType?: ExpensePaymentType | null
  usedBy?: string | null
  splitMethod?: ExpenseSplitMethod | null
  createdById?: string | null
  creator?: { id?: string | null } | null
  shares?: Array<{ memberId: string; shareAmount: number }>
}

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

const UTILITY_CATEGORY_SET = new Set<ExpenseCategory>(UTILITY_FORM_OPTIONS.map((option) => option.category))
const LEGACY_UTILITY_CATEGORY_SET = new Set<ExpenseCategory>([
  ...UTILITY_CATEGORY_SET,
  'MAINTENANCE',
  'BUABILL',
])

function dateValue(value?: string | null) {
  return value?.slice(0, 10) || formatIsoDate()
}

function supportedUsedBy(value?: string | null): ExpenseUsedBy {
  return EXPENSE_USED_BY.includes(value as ExpenseUsedBy)
    ? (value as ExpenseUsedBy)
    : 'ALL_MEMBERS'
}

const INITIAL_FORM: FormState = {
  category: 'FOOD',
  purchasedBy: '',
  items: [{ id: 'initial-item', itemName: '', quantity: '', unit: '', amount: '' }],
  expenseDate: formatIsoDate(),
  description: '',
  paymentType: 'FROM_DEPOSIT',
  usedBy: 'ALL_MEMBERS',
  splitMethod: 'MEAL_COUNT',
  selectedMemberIds: [],
  customShares: [],
}

export default function EditExpensePage() {
  const { locale } = useLocale()
  const t = useTranslations('expenses')
  const { notice, clearNotice, showMessage, showError } = useLocalizedNotice('expenses')
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user } = useAuth()
  const expenseId = searchParams.get('expenseId') ?? ''
  const messId = searchParams.get('messId') ?? user?.memberships?.[0]?.mess_id ?? ''
  const isManager = canManageMess(user)
  const members = useMessMemberOptions(messId, user)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null)
  const [removeReceipt, setRemoveReceipt] = useState(false)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [recordType, setRecordType] = useState<'EXPENSE' | 'UTILITY'>('EXPENSE')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    if (!expenseId || !messId) return
    let alive = true
    setLoading(true)
    clearNotice()

    api
      .getExpenseById(expenseId)
      .then((res) => {
        if (!alive) return
        const found = (res.data as ExpenseRecord | null) ?? null
        if (!found) {
          showMessage('expenseNotFound', 'danger')
          return
        }
        const createdById = found.createdById ?? found.creator?.id
        if (!isManager && createdById !== user?.id) {
          router.replace(`/expense-details?expenseId=${encodeURIComponent(expenseId)}&messId=${encodeURIComponent(messId)}`)
          return
        }

        const shares = found.shares ?? []
        const foundType = found.type ?? (LEGACY_UTILITY_CATEGORY_SET.has(found.category) ? 'UTILITY' : 'EXPENSE')
        const normalizedUsedBy = supportedUsedBy(found.usedBy)
        setRecordType(foundType)
        setExistingReceiptUrl(found.receiptUrl ?? null)
        if (found.usedBy && normalizedUsedBy !== found.usedBy) {
          showMessage('legacyAllocationWarning', 'warning')
        }
        const fallbackUtilityLabel =
          UTILITY_FORM_OPTIONS.find((option) => option.utilityType === found.utilityType)?.label ??
          UTILITY_FORM_OPTIONS.find((option) => option.category === found.category)?.label ??
          'Other'
        setForm({
          category: found.category ?? 'FOOD',
          purchasedBy: found.purchasedBy ?? '',
          items: found.items?.length
            ? found.items.map((item, index) => ({
                id: item.id ?? `expense-item-${index}`,
                itemName:
                  foundType === 'UTILITY'
                    ? utilityOptionForItemName(item.itemName)?.label ?? fallbackUtilityLabel
                    : item.itemName,
                quantity: item.quantity == null ? '' : String(item.quantity),
                unit: item.unit ?? '',
                amount: String(item.amount),
              }))
            : [{
                id: 'legacy-item',
                itemName:
                  foundType === 'UTILITY'
                    ? utilityOptionForItemName(found.itemName ?? '')?.label ?? fallbackUtilityLabel
                    : found.itemName ?? expenseCategoryLabel(found.category, locale),
                quantity: found.quantity == null ? '' : String(found.quantity),
                unit: found.unit ?? '',
                amount: String(found.amount ?? ''),
              }],
          expenseDate: dateValue(found.expenseDate),
          description: found.description ?? '',
          paymentType: found.paymentType ?? 'FROM_DEPOSIT',
          usedBy: foundType === 'UTILITY' && normalizedUsedBy === 'MEAL_ON_MEMBERS' ? 'ALL_MEMBERS' : normalizedUsedBy,
          splitMethod: foundType === 'UTILITY' && found.splitMethod === 'MEAL_COUNT' ? 'EQUAL' : found.splitMethod ?? 'EQUAL',
          selectedMemberIds: shares.map((share) => share.memberId),
          customShares: shares.map((share) => ({
            memberId: share.memberId,
            amount: String(share.shareAmount),
          })),
        })
      })
      .catch((error) => {
        if (alive) showError(error, 'loadExpenseDetailsFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [expenseId, isManager, messId, router, user?.id])

  const affectedMemberIds = useMemo(() => {
    if (form.usedBy === 'SELECTED_MEMBERS') return form.selectedMemberIds
    if (form.usedBy === 'ALL_MEMBERS') return members.map((member) => member.id)
    return form.selectedMemberIds
  }, [form.purchasedBy, form.selectedMemberIds, form.usedBy, members])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    clearNotice()
    if (!expenseId) return showMessage('missingExpenseContext', 'danger')
    if (form.usedBy === 'SELECTED_MEMBERS' && !form.selectedMemberIds.length) {
      return showMessage('selectAtLeastOneMember', 'danger')
    }
    if (form.splitMethod === 'CUSTOM' && !affectedMemberIds.length) {
      return showMessage('selectMembersBeforeCustom', 'danger')
    }
    if (form.items.some((item) => !item.itemName.trim() || !item.amount || Number(item.amount) <= 0)) {
      return showMessage('everyItemRequired', 'danger')
    }

    const customShares =
      form.splitMethod === 'CUSTOM'
        ? buildCustomShares(affectedMemberIds, form.customShares)
        : undefined

    const isUtilityExpense = recordType === 'UTILITY'
    const selectedUtilityOptions = form.items
      .map((item) => utilityOptionForItemName(item.itemName))
      .filter((option) => option !== undefined)
    const utilityTypes = new Set(selectedUtilityOptions.map((option) => option.utilityType))
    const singleUtilityOption = utilityTypes.size === 1 ? selectedUtilityOptions[0] : undefined
    const payload = {
      type: isUtilityExpense ? 'UTILITY' : 'EXPENSE',
      utilityType: isUtilityExpense ? singleUtilityOption?.utilityType ?? 'OTHER' : null,
      purchasedBy: isManager ? form.purchasedBy || undefined : undefined,
      category: isUtilityExpense ? singleUtilityOption?.category ?? 'UTILITY' : form.category,
      items: isUtilityExpense
        ? utilityLineItemsPayload(form.items)
        : expenseLineItemsPayload(form.items),
      expenseDate: form.expenseDate,
      description: form.description.trim() || null,
      paymentType: form.paymentType,
      usedBy: form.usedBy,
      splitMethod: form.splitMethod,
      selectedMemberIds: form.usedBy === 'SELECTED_MEMBERS' ? form.selectedMemberIds : undefined,
      customShares,
      receiptUrl: removeReceipt && !receiptFile ? null : undefined,
    }

    setBusy(true)
    try {
      if (receiptFile) {
        const data = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined) return
          if (key === 'utilityType' && value === null) return
          if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            data.append(key, JSON.stringify(value))
          } else if (value === null) {
            data.append(key, '')
          } else {
            data.append(key, String(value))
          }
        })
        data.append('receipt', receiptFile)
        await api.updateExpense(expenseId, data)
      } else {
        await api.updateExpense(expenseId, payload)
      }

      router.replace(`/expense-details?expenseId=${encodeURIComponent(expenseId)}&messId=${encodeURIComponent(messId)}`)
    } catch (error) {
      showError(error, 'updateExpenseFailed')
    } finally {
      setBusy(false)
    }
  }

  const isUtilityExpense = recordType === 'UTILITY'

  return (
    <MobileShell>
      <form onSubmit={handleSubmit}>
        <FormPageShell title={isUtilityExpense ? t('editUtility') : t('editExpense')} icon={isUtilityExpense ? Zap : ReceiptText} backHref="/expenses">
          {loading ? <LoadingIndicator variant="card" label={t('loadingExpense')} /> : null}

          <FormSection title={t('paymentDetails')}>
            <PaymentTypeSelector value={form.paymentType} onChange={(paymentType) => update('paymentType', paymentType)} showHeading={false} />
          </FormSection>

          <FormSection title={isUtilityExpense ? t('utilityDetails') : t('expenseDetails')}>
            {!isUtilityExpense ? (
              <DesignedSelect label={t('category')} icon={expenseFormIcons.category} value={form.category} onChange={(event) => update('category', event.target.value as ExpenseCategory)}>
                {GENERAL_EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{expenseCategoryLabel(category, locale)}</option>
                ))}
              </DesignedSelect>
            ) : null}
            {isManager ? (
              <DesignedSelect label={t('paidBy')} icon={expenseFormIcons.member} value={form.purchasedBy} onChange={(event) => update('purchasedBy', event.target.value)} required={form.paymentType === 'PERSONAL'}>
                <option value="">{t('selectMember')}</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </DesignedSelect>
            ) : null}
            <DesignedInput label={isUtilityExpense ? t('billDate') : t('expenseDate')} icon={expenseFormIcons.date} value={form.expenseDate} onChange={(event) => update('expenseDate', event.target.value)} type="date" required />
          </FormSection>

          <FormSection title={isUtilityExpense ? t('utilityItems') : t('items')}>
            {isUtilityExpense ? (
              <UtilityLineItemsEditor items={form.items} onChange={(items) => update('items', items)} disabled={busy} />
            ) : (
              <ExpenseLineItemsEditor items={form.items} onChange={(items) => update('items', items)} disabled={busy} />
            )}
          </FormSection>

          <ExpenseAdvancedOptions
            open={advancedOpen}
            usedBy={form.usedBy}
            splitMethod={form.splitMethod}
            allowMealMembers={!isUtilityExpense}
            allowMealCount={!isUtilityExpense}
            allowCustom={isUtilityExpense || form.usedBy !== 'MEAL_ON_MEMBERS'}
            onOpen={() => setAdvancedOpen(true)}
            onClose={() => setAdvancedOpen(false)}
            onUsedByChange={(usedBy) => {
              update('usedBy', usedBy)
              if (usedBy === 'MEAL_ON_MEMBERS' && form.splitMethod === 'CUSTOM') update('splitMethod', 'MEAL_COUNT')
            }}
            onSplitMethodChange={(splitMethod) => update('splitMethod', splitMethod)}
          >
            {form.usedBy === 'SELECTED_MEMBERS' ? (
              <MemberMultiSelect members={members} selected={form.selectedMemberIds} onChange={(ids) => update('selectedMemberIds', ids)} />
            ) : null}
            {form.splitMethod === 'CUSTOM' ? (
              <ExpenseCustomShareFields
                members={members}
                memberIds={affectedMemberIds}
                shares={form.customShares}
                onChange={(shares) => update('customShares', shares)}
              />
            ) : null}
          </ExpenseAdvancedOptions>

          <FormSection title={t('note')}>
            <DesignedTextarea label={t('noteOptional')} icon={expenseFormIcons.description} value={form.description} onChange={(event) => update('description', event.target.value.slice(0, 250))} placeholder={t('addNote')} count={`${form.description.length}/250`} />
          </FormSection>

          <FormSection title={t('attachment')}>
            {existingReceiptUrl && !removeReceipt ? (
              <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#cfeeed] bg-[#edfafa] px-3.5 py-3">
                <a href={existingReceiptUrl} target="_blank" rel="noreferrer" className="truncate text-label font-bold text-[#008d8c]">
                  {t('viewCurrentReceipt')}
                </a>
                <button type="button" onClick={() => setRemoveReceipt(true)} className="text-caption font-bold text-[#e02d37]">
                  {t('remove')}
                </button>
              </div>
            ) : null}
            <UploadField label={t('replaceReceiptOptional')} fileName={receiptFile?.name} onChange={(file) => { setReceiptFile(file); if (file) setRemoveReceipt(false) }} />
          </FormSection>

          <FormStatusMessage message={notice?.message ?? ''} success={notice?.tone === 'success'} />
          <ExpensePrimaryAction type="submit" disabled={busy}>
            <Save size={17} />
            {busy ? t('saving') : t('saveChanges')}
          </ExpensePrimaryAction>
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
