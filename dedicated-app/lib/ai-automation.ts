export type AiLocale = 'en' | 'bn'
export type AiIntent = 'EXPENSE_CREATE' | 'UTILITY_CREATE' | 'DEPOSIT_CREATE' | 'MEAL_CREATE' | 'UNKNOWN' | 'NEEDS_CLARIFICATION'
export type AiCommandStatus = 'PENDING' | 'NEEDS_CLARIFICATION' | 'PROCESSING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED'

export type AiCommand = {
  id: string
  messId: string
  sourceType: 'TEXT' | 'VOICE'
  intent: AiIntent
  status: AiCommandStatus
  locale: AiLocale
  input?: string | null
  transcript?: string | null
  payload?: Record<string, unknown> | null
  preview?: Record<string, unknown> | null
  missingFields: string[]
  clarification?: string | null
  confidence?: number | null
  result?: { id?: string; intent?: AiIntent; redirectTo?: string } | null
  errorCode?: string | null
  createdAt: string
  confirmedAt?: string | null
}

export type AiCapabilities = {
  enabled: boolean
  locale: AiLocale
  supportedLocales: AiLocale[]
  supportedInputLanguages: string[]
  intents: AiIntent[]
  voice: { enabled: boolean; maxBytes: number; maxDurationSeconds: number }
  confirmationRequired: boolean
  multiAction: boolean
}

export const AI_COPY = {
  en: {
    title: 'Quick Add with AI',
    subtitle: 'Speak or type, review, then confirm',
    intro: 'Add an expense, utility, deposit, or meal using Bangla, English, or Banglish.',
    inputLabel: 'What would you like to add?',
    placeholder: 'Example: Add 850 taka grocery expense for today',
    examples: ['Today grocery 850 taka', 'Add Rahim deposit 2000', 'Tomorrow dinner 2 meals'],
    generate: 'Create Preview',
    generating: 'Creating preview...',
    record: 'Record voice',
    recording: 'Recording',
    stop: 'Stop & process',
    preview: 'Review before confirming',
    previewHelp: 'AI has not saved anything yet. Check and edit every important detail.',
    confirm: 'Confirm & Save',
    confirming: 'Saving...',
    cancel: 'Cancel',
    newCommand: 'Add another',
    success: 'Saved successfully',
    disabled: 'AI automation is not enabled on the server.',
    unsupportedVoice: 'Voice recording is not supported on this device. You can still type your command.',
    microphoneDenied: 'Microphone permission was not granted.',
    transcript: 'Transcript',
    fields: {
      amount: 'Amount', date: 'Date', category: 'Category', utilityType: 'Utility type',
      itemName: 'Item', description: 'Note', memberId: 'Member', mealName: 'Meal',
      mealCount: 'Meal count', status: 'Status',
    },
  },
  bn: {
    title: 'AI দিয়ে দ্রুত যোগ করুন',
    subtitle: 'বলুন বা লিখুন, যাচাই করে নিশ্চিত করুন',
    intro: 'বাংলা, English বা Banglish ব্যবহার করে খরচ, ইউটিলিটি, ডিপোজিট বা মিল যোগ করুন।',
    inputLabel: 'আপনি কী যোগ করতে চান?',
    placeholder: 'উদাহরণ: আজকের বাজার খরচ ৮৫০ টাকা যোগ করো',
    examples: ['আজ বাজার ৮৫০ টাকা', 'রহিমের ডিপোজিট ২০০০ যোগ করো', 'আগামীকাল ডিনার ২ মিল'],
    generate: 'প্রিভিউ তৈরি করুন',
    generating: 'প্রিভিউ তৈরি হচ্ছে...',
    record: 'ভয়েস রেকর্ড করুন',
    recording: 'রেকর্ড হচ্ছে',
    stop: 'থামান ও প্রসেস করুন',
    preview: 'নিশ্চিত করার আগে যাচাই করুন',
    previewHelp: 'AI এখনো কিছু সেভ করেনি। গুরুত্বপূর্ণ প্রতিটি তথ্য দেখে প্রয়োজনে পরিবর্তন করুন।',
    confirm: 'নিশ্চিত করে সেভ করুন',
    confirming: 'সেভ হচ্ছে...',
    cancel: 'বাতিল',
    newCommand: 'আরেকটি যোগ করুন',
    success: 'সফলভাবে সেভ হয়েছে',
    disabled: 'Server-এ AI automation চালু নেই।',
    unsupportedVoice: 'এই device-এ voice recording support নেই। আপনি লিখে command দিতে পারবেন।',
    microphoneDenied: 'Microphone permission দেওয়া হয়নি।',
    transcript: 'ভয়েস থেকে পাওয়া লেখা',
    fields: {
      amount: 'পরিমাণ', date: 'তারিখ', category: 'ক্যাটাগরি', utilityType: 'ইউটিলিটির ধরন',
      itemName: 'আইটেম', description: 'নোট', memberId: 'সদস্য', mealName: 'মিল',
      mealCount: 'মিল সংখ্যা', status: 'স্ট্যাটাস',
    },
  },
} as const

export function aiCopy(locale: AiLocale) {
  return AI_COPY[locale]
}
