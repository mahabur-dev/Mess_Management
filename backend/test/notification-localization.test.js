const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isLocalizableSystemNotification,
  localizeSystemNotification,
} = require('../dist/app/module/notification/notification-localization');

test('keeps user-authored notices unchanged', () => {
  const message = {
    title: 'বাসা ভাড়ার নোটিশ',
    body: '১০ তারিখের মধ্যে জমা দিন।',
    data: { source: 'NOTICE' },
  };

  assert.equal(isLocalizableSystemNotification(message), false);
  assert.deepEqual(localizeSystemNotification(message, 'bn'), message);
});

test('localizes member join requests for Bangla recipients', () => {
  const message = {
    title: 'New member request',
    body: 'Rahim requested to join Sunrise Mess.',
    data: { source: 'MEMBER_JOIN_REQUEST' },
  };
  const localized = localizeSystemNotification(message, 'bn');

  assert.equal(localized.title, 'নতুন সদস্যের অনুরোধ');
  assert.match(localized.body, /Rahim/);
  assert.match(localized.body, /Sunrise Mess/);
  assert.match(localized.body, /অনুরোধ করেছেন/);
});

test('localizes payment method and system copy without translating member names', () => {
  const message = {
    title: 'Payment Submitted - Sunrise Mess',
    body: 'Karim submitted 1,250 via BKASH.',
    data: { source: 'PAYMENT' },
  };
  const localized = localizeSystemNotification(message, 'bn');

  assert.equal(localized.title, 'পেমেন্ট জমা হয়েছে');
  assert.match(localized.body, /Karim/);
  assert.match(localized.body, /বিকাশ/);
});

test('localizes meal deadline metadata using Bangla number and date formatting', () => {
  const localized = localizeSystemNotification(
    {
      title: 'Meal decision deadline approaching — Sunrise Mess',
      body: 'You have 30 minutes to choose meals for 2026-08-30. The window closes at 22:00.',
      data: {
        type: 'MEAL_DEADLINE_WARNING',
        targetDate: '2026-08-30',
        endTime: '22:00',
        leadMinutes: 30,
      },
    },
    'bn',
  );

  assert.equal(localized.title, 'মিল নির্বাচনের সময় শেষ হতে যাচ্ছে');
  assert.match(localized.body, /৩০ মিনিট/);
});

test('localizes direct expense review pushes', () => {
  const localized = localizeSystemNotification(
    {
      title: 'Expense approved',
      body: 'Rice was approved.',
      data: { type: 'EXPENSE_REVIEWED', approvalStatus: 'APPROVED' },
    },
    'bn',
  );

  assert.equal(localized.title, 'খরচ অনুমোদিত');
  assert.equal(localized.body, 'Rice অনুমোদিত হয়েছে।');
});

test('defaults unknown locale preferences to English', () => {
  const localized = localizeSystemNotification(
    {
      title: 'Member request rejected',
      body: 'Your request to join the mess was rejected.',
      data: { source: 'MEMBER_JOIN_REJECTED' },
    },
    null,
  );

  assert.equal(localized.title, 'Member request rejected');
  assert.match(localized.body, /was rejected/);
});

test('localizes mess registration requests for administrators', () => {
  const localized = localizeSystemNotification(
    {
      title: 'New mess registration request',
      body: 'Nadia requested approval for Lake View Mess.',
      data: { source: 'MESS_REQUEST' },
    },
    'bn',
  );

  assert.equal(localized.title, 'নতুন মেস নিবন্ধনের অনুরোধ');
  assert.match(localized.body, /Nadia/);
  assert.match(localized.body, /Lake View Mess/);
});

test('localizes configurable trial length and mess rejection feedback', () => {
  const approved = localizeSystemNotification(
    {
      title: 'Your mess is approved',
      body: 'A free trial has started.',
      data: { source: 'MESS_APPROVAL', status: 'APPROVED', trialDays: 45 },
    },
    'bn',
  );
  const rejected = localizeSystemNotification(
    {
      title: 'Mess registration request rejected',
      body: 'Your mess registration request was rejected.',
      data: {
        source: 'MESS_APPROVAL',
        status: 'REJECTED',
        reviewNote: 'ঠিকানা অসম্পূর্ণ',
      },
    },
    'bn',
  );

  assert.match(approved.body, /৪৫ দিনের/);
  assert.equal(rejected.title, 'মেস নিবন্ধনের অনুরোধ প্রত্যাখ্যাত');
  assert.match(rejected.body, /ঠিকানা অসম্পূর্ণ/);
});

test('localizes subscription contact requests while preserving the requester name', () => {
  const localized = localizeSystemNotification(
    {
      title: 'New contact request',
      body: 'Sadia submitted a monthly plan.',
      data: {
        source: 'SUBSCRIPTION',
        contactRequestId: 'request-1',
        requestedPlan: 'MONTHLY',
      },
    },
    'bn',
  );

  assert.equal(localized.title, 'নতুন যোগাযোগের অনুরোধ');
  assert.match(localized.body, /Sadia/);
  assert.match(localized.body, /মাসিক সাবস্ক্রিপশন/);
});

test('localizes bazar schedule metadata without translating the mess name', () => {
  const localized = localizeSystemNotification(
    {
      title: 'Bazar schedule is available',
      body: 'Lake View Mess: 9/2026 bazar duties are ready to select.',
      data: {
        source: 'BAZAR_SCHEDULE_GENERATED',
        messName: 'Lake View Mess',
        month: 9,
        year: 2026,
      },
    },
    'bn',
  );

  assert.equal(localized.title, 'বাজারের সময়সূচি প্রস্তুত');
  assert.match(localized.body, /Lake View Mess/);
  assert.match(localized.body, /সেপ্টেম্বর/);
});

test('localizes bazar assignment dates for Bangla recipients', () => {
  const localized = localizeSystemNotification(
    {
      title: 'Bazar duty assigned',
      body: 'You were assigned bazar duty for 2026-09-12.',
      data: {
        source: 'BAZAR_DUTY_ASSIGNED',
        dutyDate: '2026-09-12',
      },
    },
    'bn',
  );

  assert.equal(localized.title, 'বাজারের দায়িত্ব দেওয়া হয়েছে');
  assert.match(localized.body, /১২/);
  assert.match(localized.body, /সেপ/);
});
