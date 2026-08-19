export const MEMBER_ROLES = ['MEMBER', 'MANAGER'] as const
export const EXPENSE_CATEGORIES = [
  'GROCERY',
  'FOOD',
  'UTILITY',
  'RENT',
  'GAS',
  'ELECTRICITY',
  'WIFI',
  'CLEANER',
  'MAINTENANCE',
  'BUABILL',
  'WATER',
  'OTHER',
] as const
export const EXPENSE_PAYMENT_TYPES = ['FROM_DEPOSIT', 'PERSONAL', 'COLLECTED_FUND'] as const
export const EXPENSE_PAID_FROM = ['PERSONAL', 'MESS_DEPOSIT', 'COLLECTED_FUND'] as const
export const EXPENSE_USED_BY = ['SELF_ONLY', 'SELECTED_MEMBERS', 'ALL_MEMBERS', 'MEAL_ON_MEMBERS'] as const
export const EXPENSE_SPLIT_METHODS = ['EQUAL', 'MEAL_COUNT', 'CUSTOM'] as const
export const MEAL_NAMES = ['BREAKFAST', 'LUNCH', 'DINNER'] as const
export const NOTICE_TYPES = ['MEAL', 'PAYMENT', 'EMERGENCY', 'MEETING', 'RULE_UPDATE', 'GENERAL'] as const
export const BILL_STATUSES = ['PENDING', 'PAID', 'PARTIAL'] as const
export const PAYMENT_METHODS = ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK'] as const
export const PAYMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export const COMPLAINT_CATEGORIES = [
  'MEAL_CORRECTION',
  'PAYMENT_CORRECTION',
  'LEAVE_REQUEST',
  'ROOM_ISSUE',
  'FOOD_ISSUE',
  'MAINTENANCE_ISSUE',
  'OTHER',
] as const
export const COMPLAINT_STATUSES = ['PENDING', 'PROCESSING', 'SOLVED', 'REJECTED'] as const

export const LABELS = {
  MEMBER_ROLES: {
    MEMBER: 'Member',
    MANAGER: 'Manager',
  },
  EXPENSE_CATEGORIES: {
    GROCERY: 'Grocery',
    FOOD: 'Food',
    UTILITY: 'Utility',
    RENT: 'Rent',
    GAS: 'Gas',
    ELECTRICITY: 'Electricity',
    WIFI: 'Wifi',
    CLEANER: 'Cleaner',
    MAINTENANCE: 'Maintenance',
    BUABILL: 'BUA Bill',
    WATER: 'Water',
    OTHER: 'Other',
  },
  EXPENSE_PAYMENT_TYPES: {
    FROM_DEPOSIT: 'Deposit Balance',
    PERSONAL: 'Personal',
    COLLECTED_FUND: 'Mess Fund',
  },
  EXPENSE_PAID_FROM: {
    PERSONAL: 'Personal',
    MESS_DEPOSIT: 'Deposit Balance',
    COLLECTED_FUND: 'Mess Fund',
  },
  EXPENSE_USED_BY: {
    SELF_ONLY: 'Only Me',
    SELECTED_MEMBERS: 'Specific Members',
    ALL_MEMBERS: 'All Members',
    MEAL_ON_MEMBERS: 'Meal Members',
  },
  EXPENSE_SPLIT_METHODS: {
    EQUAL: 'Equal',
    MEAL_COUNT: 'By Meal Count',
    CUSTOM: 'Manual Split',
  },
  MEAL_NAMES: {
    BREAKFAST: 'Breakfast',
    LUNCH: 'Lunch',
    DINNER: 'Dinner',
  },
  NOTICE_TYPES: {
    MEAL: 'Meal',
    PAYMENT: 'Deposit',
    EMERGENCY: 'Emergency',
    MEETING: 'Meeting',
    RULE_UPDATE: 'Rule Update',
    GENERAL: 'General',
  },
  BILL_STATUSES: {
    PENDING: 'Pending',
    PAID: 'Paid',
    PARTIAL: 'Partial',
  },
  PAYMENT_METHODS: {
    CASH: 'Cash',
    BKASH: 'bKash',
    NAGAD: 'Nagad',
    ROCKET: 'Rocket',
    BANK: 'Bank',
  },
  PAYMENT_STATUSES: {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  },
  COMPLAINT_CATEGORIES: {
    MEAL_CORRECTION: 'Meal Correction',
    PAYMENT_CORRECTION: 'Deposit Correction',
    LEAVE_REQUEST: 'Leave Request',
    ROOM_ISSUE: 'Room Issue',
    FOOD_ISSUE: 'Food Issue',
    MAINTENANCE_ISSUE: 'Maintenance Issue',
    OTHER: 'Other',
  },
  COMPLAINT_STATUSES: {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SOLVED: 'Solved',
    REJECTED: 'Rejected',
  },
} as const

export type MemberRole = (typeof MEMBER_ROLES)[number]
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type ExpensePaymentType = (typeof EXPENSE_PAYMENT_TYPES)[number]
export type ExpensePaidFrom = (typeof EXPENSE_PAID_FROM)[number]
export type ExpenseUsedBy = (typeof EXPENSE_USED_BY)[number]
export type ExpenseSplitMethod = (typeof EXPENSE_SPLIT_METHODS)[number]
export type MealName = (typeof MEAL_NAMES)[number]
export type NoticeType = (typeof NOTICE_TYPES)[number]
export type BillStatus = (typeof BILL_STATUSES)[number]
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number]
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number]

export const GENERAL_EXPENSE_CATEGORIES = EXPENSE_CATEGORIES.filter(
  (category): category is Extract<ExpenseCategory, 'GROCERY' | 'FOOD' | 'RENT' | 'MAINTENANCE' | 'OTHER'> =>
    ['GROCERY', 'FOOD', 'RENT', 'MAINTENANCE', 'OTHER'].includes(category),
)

export const UTILITY_FORM_OPTIONS: ReadonlyArray<{
  category: ExpenseCategory
  utilityType: string
  label: string
}> = [
  { category: 'ELECTRICITY', utilityType: 'ELECTRICITY', label: 'Electricity' },
  { category: 'GAS', utilityType: 'GAS', label: 'Gas' },
  { category: 'WATER', utilityType: 'WATER', label: 'Water' },
  { category: 'WIFI', utilityType: 'WIFI', label: 'Wifi' },
  { category: 'CLEANER', utilityType: 'CLEANING', label: 'Cleaning' },
  { category: 'UTILITY', utilityType: 'OTHER', label: 'Other' },
]
