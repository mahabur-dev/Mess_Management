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
  LABELS,
  type ExpenseCategory,
  type ExpensePaymentType,
  type ExpenseSplitMethod,
  type ExpenseUsedBy,
} from '@/lib/form-options'

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
  const isUtility = kind === 'utility'

  return (
    <>
      <FormSection title="Payment Details">
        <PaymentTypeSelector value={paymentType} onChange={onPaymentTypeChange} showHeading={false} />
      </FormSection>

      <FormSection title={isUtility ? 'Utility Details' : 'Expense Details'}>
        {!isUtility ? (
          <DesignedSelect
            label="Category"
            icon={expenseFormIcons.category}
            value={category}
            onChange={(event) => onCategoryChange?.(event.target.value as ExpenseCategory)}
          >
            {GENERAL_EXPENSE_CATEGORIES.map((option) => (
              <option key={option} value={option}>{LABELS.EXPENSE_CATEGORIES[option]}</option>
            ))}
          </DesignedSelect>
        ) : null}

        {showPaidBy ? (
          <DesignedSelect
            label="Paid By"
            icon={expenseFormIcons.member}
            value={paidBy}
            onChange={(event) => onPaidByChange(event.target.value)}
            required={paymentType === 'PERSONAL'}
          >
            <option value="">Select member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </DesignedSelect>
        ) : null}

        <DesignedInput
          label={isUtility ? 'Bill Date' : 'Expense Date'}
          icon={expenseFormIcons.date}
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          type="date"
          required
        />
      </FormSection>

      <FormSection title={isUtility ? 'Utility Items' : 'Items'}>
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
        {usedBy !== 'SELF_ONLY' && splitMethod === 'CUSTOM' ? (
          <ExpenseCustomShareFields
            members={members}
            memberIds={customShareMemberIds}
            shares={customShares}
            onChange={onCustomSharesChange}
          />
        ) : null}
      </ExpenseAdvancedOptions>

      <FormSection title="Note">
        <DesignedTextarea
          label="Note (Optional)"
          icon={expenseFormIcons.description}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value.slice(0, 250))}
          placeholder="Add a note"
          count={`${description.length}/250`}
        />
      </FormSection>

      {attachment ? (
        <FormSection title="Attachment">
          <UploadField fileName={attachment.fileName} onChange={attachment.onChange} />
        </FormSection>
      ) : null}
    </>
  )
}
