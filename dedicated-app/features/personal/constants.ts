import type { PersonalLocale, PersonalTransactionType } from "./types";

export const PERSONAL_CATEGORIES: Record<
  PersonalTransactionType,
  readonly string[]
> = {
  INCOME: ["SALARY", "BUSINESS", "FREELANCE", "GIFT", "OTHER"],
  EXPENSE: [
    "FOOD",
    "GROCERY",
    "TRANSPORT",
    "RENT",
    "EDUCATION",
    "MEDICAL",
    "SHOPPING",
    "BILLS",
    "ENTERTAINMENT",
    "OTHER",
  ],
  SAVING: ["BANK", "CASH", "INVESTMENT", "OTHER"],
};

export const PERSONAL_RELATIONS = [
  "FATHER",
  "MOTHER",
  "WIFE",
  "HUSBAND",
  "CHILD",
  "BROTHER",
  "SISTER",
  "OTHER",
] as const;

const CATEGORY_LABELS: Record<string, { en: string; bn: string }> = {
  SALARY: { en: "Salary", bn: "বেতন" },
  BUSINESS: { en: "Business", bn: "ব্যবসা" },
  FREELANCE: { en: "Freelance", bn: "ফ্রিল্যান্স" },
  GIFT: { en: "Gift", bn: "উপহার" },
  FOOD: { en: "Food", bn: "খাবার" },
  GROCERY: { en: "Grocery", bn: "বাজার" },
  TRANSPORT: { en: "Transport", bn: "যাতায়াত" },
  RENT: { en: "Rent", bn: "ভাড়া" },
  EDUCATION: { en: "Education", bn: "শিক্ষা" },
  MEDICAL: { en: "Medical", bn: "চিকিৎসা" },
  SHOPPING: { en: "Shopping", bn: "কেনাকাটা" },
  BILLS: { en: "Bills", bn: "বিল" },
  ENTERTAINMENT: { en: "Entertainment", bn: "বিনোদন" },
  BANK: { en: "Bank", bn: "ব্যাংক" },
  CASH: { en: "Cash", bn: "নগদ" },
  INVESTMENT: { en: "Investment", bn: "বিনিয়োগ" },
  OTHER: { en: "Other", bn: "অন্যান্য" },
};

const RELATION_LABELS: Record<string, { en: string; bn: string }> = {
  FATHER: { en: "Father", bn: "বাবা" },
  MOTHER: { en: "Mother", bn: "মা" },
  WIFE: { en: "Wife", bn: "স্ত্রী" },
  HUSBAND: { en: "Husband", bn: "স্বামী" },
  CHILD: { en: "Child", bn: "সন্তান" },
  BROTHER: { en: "Brother", bn: "ভাই" },
  SISTER: { en: "Sister", bn: "বোন" },
  OTHER: { en: "Other", bn: "অন্যান্য" },
};

export function categoryLabel(category: string, locale: PersonalLocale) {
  return CATEGORY_LABELS[category]?.[locale] ?? category;
}

export function relationLabel(relation: string, locale: PersonalLocale) {
  return RELATION_LABELS[relation]?.[locale] ?? relation;
}

export const PERSONAL_COPY = {
  en: {
    personal: "Personal",
    dashboard: "Dashboard",
    transactions: "Transactions",
    family: "Family",
    budget: "Budget",
    reports: "Reports",
    overview: "Your financial overview",
    monthlyIncome: "Monthly Income",
    monthlyExpense: "Monthly Expense",
    monthlySaving: "Monthly Saving",
    remainingBalance: "Remaining Balance",
    quickActions: "Quick Actions",
    addIncome: "Add Income",
    addExpense: "Add Expense",
    addSaving: "Add Saving",
    recentTransactions: "Recent Transactions",
    viewAll: "View all",
    noTransactions: "No transactions found.",
    transactionHistory: "Transaction History",
    addTransaction: "Add Transaction",
    editTransaction: "Edit Transaction",
    income: "Income",
    expense: "Expense",
    saving: "Saving",
    all: "All",
    category: "Category",
    amount: "Amount",
    date: "Date",
    description: "Description",
    optional: "Optional",
    familyMember: "For Family Member",
    none: "None",
    save: "Save",
    savingChanges: "Saving...",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    search: "Search transactions",
    filterType: "Filter by type",
    familyMembers: "Family Members",
    familySubtitle: "Track expenses for the people you care about",
    addFamilyMember: "Add Family Member",
    editFamilyMember: "Edit Family Member",
    name: "Name",
    relation: "Relation",
    monthlyFamilyExpense: "Monthly expense",
    noFamily: "No family members added yet.",
    monthlyBudget: "Monthly Budget",
    budgetSubtitle: "Set and track category spending limits",
    addBudget: "Add Budget",
    editBudget: "Edit Budget",
    limitAmount: "Budget limit",
    spent: "Spent",
    remaining: "Remaining",
    exceeded: "Exceeded",
    noBudgets: "No budgets set for this month.",
    monthlySummary: "Monthly Summary",
    categoryBreakdown: "Expense Category Breakdown",
    noExpenses: "No expense data for this month.",
    confirmDeleteTransaction: "Delete this transaction?",
    confirmDeleteFamily:
      "Delete this family member? Existing transactions will be kept.",
    confirmDeleteBudget: "Delete this budget?",
    requiredFields: "Please complete all required fields.",
    invalidAmount: "Enter an amount greater than zero.",
    loadFailed: "Failed to load personal finance data.",
    saveFailed: "Could not save. Please try again.",
    deleteFailed: "Could not delete. Please try again.",
    language: "বাংলা",
    currentMonth: "Current month",
    negativeBalance:
      "Your allocated spending and savings exceed this month’s income.",
  },
  bn: {
    personal: "পার্সোনাল",
    dashboard: "ড্যাশবোর্ড",
    transactions: "লেনদেন",
    family: "পরিবার",
    budget: "বাজেট",
    reports: "রিপোর্ট",
    overview: "আপনার আর্থিক সারসংক্ষেপ",
    monthlyIncome: "মাসিক আয়",
    monthlyExpense: "মাসিক খরচ",
    monthlySaving: "মাসিক সঞ্চয়",
    remainingBalance: "অবশিষ্ট ব্যালেন্স",
    quickActions: "দ্রুত কাজ",
    addIncome: "আয় যোগ করুন",
    addExpense: "খরচ যোগ করুন",
    addSaving: "সঞ্চয় যোগ করুন",
    recentTransactions: "সাম্প্রতিক লেনদেন",
    viewAll: "সব দেখুন",
    noTransactions: "কোনো লেনদেন পাওয়া যায়নি।",
    transactionHistory: "লেনদেনের ইতিহাস",
    addTransaction: "লেনদেন যোগ করুন",
    editTransaction: "লেনদেন সম্পাদনা",
    income: "আয়",
    expense: "খরচ",
    saving: "সঞ্চয়",
    all: "সব",
    category: "ক্যাটাগরি",
    amount: "পরিমাণ",
    date: "তারিখ",
    description: "বিবরণ",
    optional: "ঐচ্ছিক",
    familyMember: "পরিবারের সদস্যের জন্য",
    none: "কেউ নয়",
    save: "সংরক্ষণ করুন",
    savingChanges: "সংরক্ষণ হচ্ছে...",
    cancel: "বাতিল",
    edit: "সম্পাদনা",
    delete: "মুছুন",
    search: "লেনদেন খুঁজুন",
    filterType: "ধরন অনুযায়ী ফিল্টার",
    familyMembers: "পরিবারের সদস্য",
    familySubtitle: "পরিবারের সদস্যদের খরচ হিসাব করুন",
    addFamilyMember: "সদস্য যোগ করুন",
    editFamilyMember: "সদস্য সম্পাদনা",
    name: "নাম",
    relation: "সম্পর্ক",
    monthlyFamilyExpense: "মাসিক খরচ",
    noFamily: "এখনও কোনো সদস্য যোগ করা হয়নি।",
    monthlyBudget: "মাসিক বাজেট",
    budgetSubtitle: "ক্যাটাগরি অনুযায়ী খরচের সীমা নির্ধারণ করুন",
    addBudget: "বাজেট যোগ করুন",
    editBudget: "বাজেট সম্পাদনা",
    limitAmount: "বাজেট সীমা",
    spent: "খরচ হয়েছে",
    remaining: "বাকি",
    exceeded: "সীমা অতিক্রম",
    noBudgets: "এই মাসে কোনো বাজেট সেট করা হয়নি।",
    monthlySummary: "মাসিক সারসংক্ষেপ",
    categoryBreakdown: "খরচের ক্যাটাগরি বিশ্লেষণ",
    noExpenses: "এই মাসে কোনো খরচের তথ্য নেই।",
    confirmDeleteTransaction: "এই লেনদেনটি মুছে ফেলবেন?",
    confirmDeleteFamily: "এই সদস্যকে মুছে ফেলবেন? আগের লেনদেন সংরক্ষিত থাকবে।",
    confirmDeleteBudget: "এই বাজেটটি মুছে ফেলবেন?",
    requiredFields: "প্রয়োজনীয় সব তথ্য পূরণ করুন।",
    invalidAmount: "শূন্যের বেশি পরিমাণ লিখুন।",
    loadFailed: "পার্সোনাল ফাইন্যান্স তথ্য লোড করা যায়নি।",
    saveFailed: "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।",
    deleteFailed: "মুছে ফেলা যায়নি। আবার চেষ্টা করুন।",
    language: "English",
    currentMonth: "চলতি মাস",
    negativeBalance: "এই মাসের আয়ের চেয়ে খরচ ও সঞ্চয়ের বরাদ্দ বেশি হয়েছে।",
  },
} as const;

export function personalCopy(locale: PersonalLocale) {
  return PERSONAL_COPY[locale];
}

export function formatPersonalMoney(
  value: string | number | null | undefined,
  locale: PersonalLocale,
) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(locale === "bn" ? "bn" : "en", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatPersonalDate(value: string, locale: PersonalLocale) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

export function currentPersonalMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function currentPersonalDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
