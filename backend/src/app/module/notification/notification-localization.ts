export type NotificationLocale = 'en' | 'bn';

export type LocalizablePushMessage = {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
};

const paymentMethods: Record<NotificationLocale, Record<string, string>> = {
  en: {
    CASH: 'Cash',
    BKASH: 'bKash',
    NAGAD: 'Nagad',
    ROCKET: 'Rocket',
    BANK: 'Bank',
  },
  bn: {
    CASH: 'নগদ',
    BKASH: 'বিকাশ',
    NAGAD: 'নগদ',
    ROCKET: 'রকেট',
    BANK: 'ব্যাংক',
  },
};

const expenseSources: Record<NotificationLocale, Record<string, string>> = {
  en: {
    PERSONAL: 'Personal',
    FROM_DEPOSIT: 'Mess deposit',
    MESS_DEPOSIT: 'Mess deposit',
    COLLECTED_FUND: 'Mess fund',
  },
  bn: {
    PERSONAL: 'ব্যক্তিগত',
    FROM_DEPOSIT: 'মেস ডিপোজিট',
    MESS_DEPOSIT: 'মেস ডিপোজিট',
    COLLECTED_FUND: 'মেস ফান্ড',
  },
};

function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function number(value: unknown) {
  const parsed = Number(String(value ?? '').replaceAll(',', ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function localeOf(value?: string | null): NotificationLocale {
  return String(value ?? '')
    .toLowerCase()
    .startsWith('bn')
    ? 'bn'
    : 'en';
}

function money(value: unknown, locale: NotificationLocale) {
  return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
    style: 'currency',
    currency: 'BDT',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2,
  }).format(number(value));
}

function date(value: string, locale: NotificationLocale) {
  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(`${value}T00:00:00+06:00`));
}

function month(value: string, locale: NotificationLocale) {
  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function time(value: string, targetDate: string, locale: NotificationLocale) {
  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dhaka',
  }).format(
    new Date(
      `${targetDate}T${value.length === 5 ? `${value}:00` : value}+06:00`,
    ),
  );
}

export function isLocalizableSystemNotification(
  message: LocalizablePushMessage,
) {
  const source = text(message.data?.source);
  const type = text(message.data?.type);
  const sources = new Set([
    'MEMBER_JOIN_APPROVED',
    'MEMBER_JOIN_REJECTED',
    'MEMBER_JOIN_REQUEST',
    'MESS_CREATED',
    'MESS_REQUEST',
    'MESS_APPROVAL',
    'COMPLAINT',
    'PAYMENT',
    'PAYMENT_REVIEW',
    'EXPENSE',
  ]);
  return Boolean(
    sources.has(source) ||
    message.data?.contactRequestId ||
    [
      'MEAL_WINDOW_OPENED',
      'MEAL_DEADLINE_WARNING',
      'EXPENSE_REVIEWED',
      'EXPENSE_PRICE_REVIEW',
    ].includes(type) ||
    message.data?.closeRequestId,
  );
}

export function localizeSystemNotification(
  message: LocalizablePushMessage,
  preferredLocale?: string | null,
): LocalizablePushMessage {
  const locale = localeOf(preferredLocale);
  const data = message.data ?? {};
  const source = text(data.source);
  const type = text(data.type);
  const localized = (title: string, body: string): LocalizablePushMessage => ({
    ...message,
    title,
    body,
  });

  if (source === 'MEMBER_JOIN_APPROVED') {
    return localized(
      locale === 'bn' ? 'সদস্যের অনুরোধ অনুমোদিত' : 'Member request approved',
      locale === 'bn'
        ? 'মেসে যোগদানের আপনার অনুরোধ অনুমোদিত হয়েছে।'
        : 'Your request to join the mess has been approved.',
    );
  }
  if (source === 'MEMBER_JOIN_REJECTED') {
    return localized(
      locale === 'bn'
        ? 'সদস্যের অনুরোধ প্রত্যাখ্যাত'
        : 'Member request rejected',
      locale === 'bn'
        ? 'মেসে যোগদানের আপনার অনুরোধ প্রত্যাখ্যাত হয়েছে।'
        : 'Your request to join the mess was rejected.',
    );
  }
  if (source === 'MEMBER_JOIN_REQUEST') {
    const match = message.body.match(/^(.+) requested to join (.+)\.$/);
    return localized(
      locale === 'bn' ? 'নতুন সদস্যের অনুরোধ' : 'New member request',
      match
        ? locale === 'bn'
          ? `${match[1]}, ${match[2]}-এ যোগদানের অনুরোধ করেছেন।`
          : `${match[1]} requested to join ${match[2]}.`
        : message.body,
    );
  }
  if (source === 'MESS_CREATED') {
    const match = message.body.match(/^(.+) created (.+)\.$/);
    return localized(
      locale === 'bn' ? 'নতুন মেস তৈরি হয়েছে' : 'New mess created',
      match
        ? locale === 'bn'
          ? `${match[1]}, ${match[2]} তৈরি করেছেন।`
          : message.body
        : message.body,
    );
  }
  if (source === 'MESS_REQUEST') {
    const match = message.body.match(/^(.+) requested approval for (.+)\.$/);
    return localized(
      locale === 'bn'
        ? 'নতুন মেস নিবন্ধনের অনুরোধ'
        : 'New mess registration request',
      match
        ? locale === 'bn'
          ? `${match[1]}, ${match[2]}-এর অনুমোদনের অনুরোধ করেছেন।`
          : message.body
        : message.body,
    );
  }
  if (source === 'MESS_APPROVAL') {
    const rejected = text(data.status).toUpperCase() === 'REJECTED';
    const reviewNote = text(data.reviewNote);
    const trialDays = new Intl.NumberFormat(
      locale === 'bn' ? 'bn-BD' : 'en-BD',
    ).format(number(data.trialDays) || 30);
    return localized(
      locale === 'bn'
        ? rejected
          ? 'মেস নিবন্ধনের অনুরোধ প্রত্যাখ্যাত'
          : 'আপনার মেস অনুমোদিত হয়েছে'
        : rejected
          ? 'Mess registration request rejected'
          : 'Your mess is approved',
      locale === 'bn'
        ? rejected
          ? `আপনার মেস নিবন্ধনের অনুরোধ প্রত্যাখ্যাত হয়েছে।${reviewNote ? ` মন্তব্য: ${reviewNote}` : ''}`
          : `${trialDays} দিনের ফ্রি ট্রায়াল শুরু হয়েছে। ড্যাশবোর্ড থেকে যেকোনো সময় আপগ্রেড করতে পারবেন।`
        : rejected
          ? `Your mess registration request was rejected.${reviewNote ? ` Note: ${reviewNote}` : ''}`
          : `A ${trialDays}-day free trial has started. You can upgrade anytime from the dashboard.`,
    );
  }
  if (data.contactRequestId) {
    const name = message.body.match(/^(.+) submitted /)?.[1];
    const requestedPlan = text(data.requestedPlan).toUpperCase();
    const subject =
      locale === 'bn'
        ? requestedPlan === 'MONTHLY'
          ? 'মাসিক সাবস্ক্রিপশন প্ল্যানের অনুরোধ'
          : requestedPlan === 'YEARLY'
            ? 'বার্ষিক সাবস্ক্রিপশন প্ল্যানের অনুরোধ'
            : 'যোগাযোগের অনুরোধ'
        : requestedPlan === 'MONTHLY'
          ? 'a monthly plan request'
          : requestedPlan === 'YEARLY'
            ? 'a yearly plan request'
            : 'a contact request';
    return localized(
      locale === 'bn' ? 'নতুন যোগাযোগের অনুরোধ' : 'New contact request',
      name
        ? locale === 'bn'
          ? `${name}, একটি ${subject} জমা দিয়েছেন।`
          : `${name} submitted ${subject}.`
        : message.body,
    );
  }
  if (source === 'COMPLAINT') {
    const complaintTitle = message.title.replace(/^New complaint:\s*/i, '');
    return localized(
      locale === 'bn'
        ? `নতুন অভিযোগ: ${complaintTitle}`
        : `New complaint: ${complaintTitle}`,
      message.body,
    );
  }
  if (source === 'PAYMENT') {
    const match = message.body.match(
      /^(.+) submitted ([\d,.]+) via ([A-Z_]+)\.$/i,
    );
    return localized(
      locale === 'bn' ? 'পেমেন্ট জমা হয়েছে' : 'Payment submitted',
      match
        ? locale === 'bn'
          ? `${match[1]}, ${paymentMethods.bn[match[3].toUpperCase()] ?? match[3]}-এর মাধ্যমে ${money(match[2], locale)} জমা দিয়েছেন।`
          : `${match[1]} submitted ${money(match[2], locale)} via ${paymentMethods.en[match[3].toUpperCase()] ?? match[3]}.`
        : message.body,
    );
  }
  if (source === 'PAYMENT_REVIEW') {
    const approved = text(data.status).toUpperCase() === 'APPROVED';
    const amount = message.body.match(/deposit of ([\d,.]+)/i)?.[1];
    return localized(
      locale === 'bn'
        ? `ডিপোজিট ${approved ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}`
        : `Deposit ${approved ? 'approved' : 'rejected'}`,
      amount
        ? locale === 'bn'
          ? `আপনার ${money(amount, locale)} ডিপোজিট ${approved ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে।`
          : `Your deposit of ${money(amount, locale)} has been ${approved ? 'approved' : 'rejected'}.`
        : message.body,
    );
  }
  if (source === 'EXPENSE') {
    const match = message.body.match(/^(.+)\s+-\s+([\d,.]+)\s+\[([A-Z_]+)\]$/i);
    const utility = /^Utility Submitted/i.test(message.title);
    return localized(
      locale === 'bn'
        ? `অনুমোদনের জন্য ${utility ? 'ইউটিলিটি খরচ' : 'খরচ'} জমা হয়েছে`
        : `${utility ? 'Utility' : 'Expense'} submitted for approval`,
      match
        ? `${match[1]} — ${money(match[2], locale)} · ${expenseSources[locale][match[3].toUpperCase()] ?? match[3]}`
        : message.body,
    );
  }
  if (type === 'MEAL_WINDOW_OPENED') {
    const targetDate = text(data.targetDate);
    const endTime = text(data.endTime);
    return localized(
      locale === 'bn'
        ? 'মিল নির্বাচনের সময় শুরু হয়েছে'
        : 'Meal decision window is open',
      targetDate && endTime
        ? locale === 'bn'
          ? `আজ ${time(endTime, targetDate, locale)}-এর মধ্যে ${date(targetDate, locale)}-এর মিল নির্বাচন করুন।`
          : `Choose meals for ${date(targetDate, locale)} by ${time(endTime, targetDate, locale)} today.`
        : message.body,
    );
  }
  if (type === 'MEAL_DEADLINE_WARNING') {
    const targetDate = text(data.targetDate);
    const endTime = text(data.endTime);
    const minutes = new Intl.NumberFormat(
      locale === 'bn' ? 'bn-BD' : 'en-BD',
    ).format(number(data.leadMinutes));
    return localized(
      locale === 'bn'
        ? 'মিল নির্বাচনের সময় শেষ হতে যাচ্ছে'
        : 'Meal decision deadline approaching',
      targetDate && endTime
        ? locale === 'bn'
          ? `${date(targetDate, locale)}-এর মিল নির্বাচনের জন্য আপনার কাছে ${minutes} মিনিট আছে। সময় ${time(endTime, targetDate, locale)}-এ শেষ হবে।`
          : `You have ${minutes} minutes to choose meals for ${date(targetDate, locale)}. The window closes at ${time(endTime, targetDate, locale)}.`
        : message.body,
    );
  }
  if (data.closeRequestId && data.status) {
    const approved = text(data.status).toUpperCase() === 'APPROVED';
    return localized(
      locale === 'bn'
        ? approved
          ? 'মাসিক হিসাব বন্ধ হয়েছে'
          : 'মাসিক হিসাব বন্ধের অনুরোধ প্রত্যাখ্যাত'
        : approved
          ? 'Monthly calculation closed'
          : 'Monthly calculation close request rejected',
      locale === 'bn'
        ? approved
          ? 'আপনার অনুরোধ অনুমোদিত হয়েছে। বন্ধ করা ব্যালেন্স এখন শূন্য এবং পরের মাসে বহন হবে না।'
          : 'আগের হিসাব বন্ধের আপনার অনুরোধ প্রত্যাখ্যাত হয়েছে।'
        : approved
          ? 'Your request was approved. The closed balance is now zero and will not carry forward.'
          : 'Your request to close the previous calculation was rejected.',
    );
  }
  if (data.closeRequestId && data.month) {
    const name = message.body.match(/^(.+) requested to close /)?.[1];
    const monthLabel = month(text(data.month), locale);
    const balance = money(data.balance, locale);
    return localized(
      locale === 'bn'
        ? 'আগের হিসাব বন্ধের অনুরোধ'
        : 'Previous calculation close request',
      name
        ? locale === 'bn'
          ? `${name}, ${monthLabel}-এর ব্যালেন্স (${balance}) বন্ধ করার অনুরোধ করেছেন।`
          : `${name} requested to close the ${monthLabel} balance (${balance}).`
        : message.body,
    );
  }
  if (type === 'EXPENSE_REVIEWED') {
    const approved = text(data.approvalStatus).toUpperCase() === 'APPROVED';
    const item = message.body.match(/^(.+) was (?:approved|rejected)\.$/i)?.[1];
    return localized(
      locale === 'bn'
        ? `খরচ ${approved ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}`
        : `Expense ${approved ? 'approved' : 'rejected'}`,
      item
        ? locale === 'bn'
          ? `${item} ${approved ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে।`
          : `${item} was ${approved ? 'approved' : 'rejected'}.`
        : message.body,
    );
  }
  if (type === 'EXPENSE_PRICE_REVIEW') {
    const messName = message.title.match(
      /^Price review requested\s+-\s+(.+)$/i,
    )?.[1];
    return localized(
      locale === 'bn'
        ? `মূল্য পর্যালোচনার অনুরোধ${messName ? ` — ${messName}` : ''}`
        : message.title,
      message.body,
    );
  }

  return message;
}
