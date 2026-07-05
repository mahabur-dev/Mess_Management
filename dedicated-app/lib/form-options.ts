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
export const EXPENSE_PAYMENT_TYPES = ['FROM_DEPOSIT', 'PERSONAL'] as const
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
    FROM_DEPOSIT: 'From Deposit',
    PERSONAL: 'Personal',
  },
  MEAL_NAMES: {
    BREAKFAST: 'Breakfast',
    LUNCH: 'Lunch',
    DINNER: 'Dinner',
  },
  NOTICE_TYPES: {
    MEAL: 'Meal',
    PAYMENT: 'Payment',
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
    PAYMENT_CORRECTION: 'Payment Correction',
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
export type MealName = (typeof MEAL_NAMES)[number]
export type NoticeType = (typeof NOTICE_TYPES)[number]
export type BillStatus = (typeof BILL_STATUSES)[number]
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number]
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number]
