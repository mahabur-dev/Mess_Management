'use client'

import type { ExpenseCustomShare } from '@/components/mobile/expense-custom-shares'
import { ExpenseCustomShareFields } from '@/components/mobile/expense-custom-shares'
import {
  DesignedInput,
  DesignedSelect,
  DesignedTextarea,
  FormSection,
  PaymentTypeSelector,
  UploadField,
  expenseFormIcons,
} from '@/components/mobile/expense-design'
import {
  ExpenseAdvancedOptions,
} from '@/components/mobile/expense-ui'
import {
  ExpenseLineItemsEditor,
  type ExpenseLineItem,
} from '@/components/mobile/expense-line-items'
import { UtilityLineItemsEditor } from '@/components/mobile/utility-line-items'
import { MemberMultiSelect } from '@/components/mobile/member-multi-select'
import type { MemberOption } from '@/hooks/use-mess-member-options'
import {
  GENERAL_EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type ExpensePaymentType,
  type ExpenseSplitMethod,
  type ExpenseUsedBy,
} from '@/lib/form-options'
import { expenseCategoryLabel, useLocale, useTranslations } from '@/lib/i18n'

export type ExpenseEntryFormProps = {
  kind: 'expense' | 'utility'
  paymentType: ExpensePaymentType
  onPaymentTypeChange: (value: ExpensePaymentType) => void
  category?: ExpenseCategory
  onCategoryChange?: (value: ExpenseCategory) => void
  paidBy: string
  onPaidByChange: (value: string) => void
  showPaidBy: boolean
  date: string
  onDateChange: (value: string) => void
  items: ExpenseLineItem[]
  onItemsChange: (items: ExpenseLineItem[]) => void
  advancedOpen: boolean
  onAdvancedOpen: () => void
  onAdvancedClose: () => void
  usedBy: ExpenseUsedBy
  onUsedByChange: (value: ExpenseUsedBy) => void
  splitMethod: ExpenseSplitMethod
  onSplitMethodChange: (value: ExpenseSplitMethod) => void
  members: MemberOption[]
  selectedMemberIds: string[]
  onSelectedMemberIdsChange: (ids: string[]) => void
  customShares: ExpenseCustomShare[]
  customShareMemberIds: string[]
  onCustomSharesChange: (shares: ExpenseCustomShare[]) => void
  description: string
  onDescriptionChange: (value: string) => void
  busy?: boolean
  attachment?: {
    fileName?: string
    onChange: (file: File | null) => void
  }
}

/**
 * Canonical Expense/Utility entry surface. Manual entry and AI-prefilled entry
 * both render this component so field order, controls and conditional rules
 * cannot drift into separate designs.
 */
export function ExpenseEntryForm({
  kind,
  paymentType,
  onPaymentTypeChange,
  category = 'OTHER',
  onCategoryChange,
  paidBy,
  onPaidByChange,
  showPaidBy,
  date,
  onDateChange,
  items,
  onItemsChange,
  advancedOpen,
  onAdvancedOpen,
  onAdvancedClose,
  usedBy,
  onUsedByChange,
  splitMethod,
  onSplitMethodChange,
  members,
  selectedMemberIds,
  onSelectedMemberIdsChange,
  customShares,
  customShareMemberIds,
  onCustomSharesChange,
  description,
  onDescriptionChange,
  busy,
  attachment,
}: ExpenseEntryFormProps) {
  const { locale } = useLocale()
  const t = useTranslations('expenses')
  const isUtility = kind === 'utility'

  return (
    <>
      <FormSection title={t('paymentDetails')}>
        <PaymentTypeSelector value={paymentType} onChange={onPaymentTypeChange} showHeading={false} />
      </FormSection>

      <FormSection title={isUtility ? t('utilityDetails') : t('expenseDetails')}>
        {!isUtility ? (
          <DesignedSelect
            label={t('category')}
            icon={expenseFormIcons.category}
            value={category}
            onChange={(event) => onCategoryChange?.(event.target.value as ExpenseCategory)}
          >
            {GENERAL_EXPENSE_CATEGORIES.map((option) => (
              <option key={option} value={option}>{expenseCategoryLabel(option, locale)}</option>
            ))}
          </DesignedSelect>
        ) : null}

        {showPaidBy ? (
          <DesignedSelect
            label={t('paidBy')}
            icon={expenseFormIcons.member}
            value={paidBy}
            onChange={(event) => onPaidByChange(event.target.value)}
            required={paymentType === 'PERSONAL'}
          >
            <option value="">{t('selectMember')}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </DesignedSelect>
        ) : null}

        <DesignedInput
          label={isUtility ? t('billDate') : t('expenseDate')}
          icon={expenseFormIcons.date}
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          type="date"
          required
        />
      </FormSection>

      <FormSection title={isUtility ? t('utilityItems') : t('items')}>
        {isUtility ? (
          <UtilityLineItemsEditor items={items} onChange={onItemsChange} disabled={busy} />
        ) : (
          <ExpenseLineItemsEditor items={items} onChange={onItemsChange} disabled={busy} />
        )}
      </FormSection>

      <ExpenseAdvancedOptions
        open={advancedOpen}
        usedBy={usedBy}
        splitMethod={splitMethod}
        allowMealMembers={!isUtility}
        allowMealCount={!isUtility}
        allowCustom={isUtility || usedBy !== 'MEAL_ON_MEMBERS'}
        onOpen={onAdvancedOpen}
        onClose={onAdvancedClose}
        onUsedByChange={onUsedByChange}
        onSplitMethodChange={onSplitMethodChange}
      >
        {usedBy === 'SELECTED_MEMBERS' ? (
          <MemberMultiSelect
            members={members}
            selected={selectedMemberIds}
            onChange={onSelectedMemberIdsChange}
          />
        ) : null}
        {splitMethod === 'CUSTOM' ? (
          <ExpenseCustomShareFields
            members={members}
            memberIds={customShareMemberIds}
            shares={customShares}
            onChange={onCustomSharesChange}
          />
        ) : null}
      </ExpenseAdvancedOptions>

      <FormSection title={t('note')}>
        <DesignedTextarea
          label={t('noteOptional')}
          icon={expenseFormIcons.description}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value.slice(0, 250))}
          placeholder={t('addNote')}
          count={`${description.length}/250`}
        />
      </FormSection>

      {attachment ? (
        <FormSection title={t('attachment')}>
          <UploadField fileName={attachment.fileName} onChange={attachment.onChange} />
        </FormSection>
      ) : null}
    </>
  )
}
