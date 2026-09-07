'use client'

import { MobileTourPlayer, type MobileTourStep } from '@/components/mobile-tour/mobile-tour-player'
import { MobileTourScreen, type MobileScreenId } from '@/components/mobile-tour/mobile-screen-library'

const mobileTourSteps = [
  { id: 'home-intro', screen: 'home', title: 'Start from the real Home screen', detail: 'See the manager header, Quick Actions, AI entry, overview, and bottom navigation.', x: 50, y: 8, duration: 2600 },
  { id: 'home-overview', screen: 'home', title: 'Complete monthly overview', detail: 'The tour scrolls through all 10 current metrics instead of showing a shortened placeholder.', x: 52, y: 58, duration: 2800, scrollY: 70 },
  { id: 'home-recent-expenses', screen: 'home', title: 'Recent three expenses', detail: 'The latest three real-looking records appear at the end of the Home overview, matching the current app.', x: 52, y: 66, duration: 2900, scrollY: 390 },

  { id: 'quick-meals', screen: 'home', title: 'Open Meals', detail: 'The first Quick Action opens today’s meal management.', x: 18, y: 16, duration: 1900, activeItem: 'meals' },
  { id: 'meals-screen', screen: 'meals', title: 'Meal Management', detail: 'Review breakfast, lunch, dinner, monthly totals, and manager controls.', x: 52, y: 45, duration: 2800 },
  { id: 'meals-status', screen: 'meals', title: 'Meal status and manager controls', detail: 'The full current status card, Add My Meal action, and manager entry remain visible in the tour.', x: 52, y: 61, duration: 2600, scrollY: 245 },
  { id: 'quick-expenses', screen: 'home', title: 'Open Expenses', detail: 'Return Home and choose the shared expense ledger.', x: 50, y: 16, duration: 1900, activeItem: 'expenses' },
  { id: 'expenses-screen', screen: 'expenses', title: 'My Expense Management', detail: 'The default My View shows Food, Utility, Rent, Total, and the exact monthly details card.', x: 52, y: 40, duration: 2700 },
  { id: 'expenses-manager-view', screen: 'expenses', title: 'Switch to Manager View', detail: 'Managers can switch to the complete shared-cost overview from the current segmented control.', x: 73, y: 20, duration: 2100, activeItem: 'manager-view' },
  { id: 'expenses-records', screen: 'expenses', title: 'Expense submissions and balances', detail: 'Manager funds and the current approval ledger remain on the same page.', x: 52, y: 56, duration: 2600, scrollY: 390, activeItem: 'manager-view' },
  { id: 'expense-fab', screen: 'expenses', title: 'Open the expense action menu', detail: 'Tap the current floating action button to choose Expense or Utility.', x: 86, y: 84, duration: 1900 },
  { id: 'expense-action-menu', screen: 'expense-actions', title: 'Choose Add Expense', detail: 'The same current action menu expands above the floating button.', x: 82, y: 79, duration: 1900 },
  { id: 'expense-payment', screen: 'add-expense', title: 'Choose payment source', detail: 'Select Mess Deposit or Personal payment before entering the purchase.', x: 51, y: 23, duration: 2100, activeItem: 'payment' },
  { id: 'expense-category', screen: 'add-expense', title: 'Select the category', detail: 'Food keeps the current meal-count split default.', x: 51, y: 39, duration: 1900, activeItem: 'category' },
  { id: 'expense-payer', screen: 'add-expense', title: 'Choose who paid', detail: 'Managers can record the member who completed the purchase.', x: 51, y: 47, duration: 1900, activeItem: 'paid-by' },
  { id: 'expense-date', screen: 'add-expense', title: 'Confirm expense date', detail: 'The expense is recorded against the correct billing date.', x: 51, y: 55, duration: 1800, activeItem: 'date' },
  { id: 'expense-item', screen: 'add-expense', title: 'Enter the item', detail: 'Add the purchased item name to the current line-item editor.', x: 51, y: 35, duration: 2100, activeItem: 'item-name', scrollY: 235 },
  { id: 'expense-quantity', screen: 'add-expense', title: 'Add quantity', detail: 'Optional quantity improves transparency for members.', x: 30, y: 44, duration: 1800, activeItem: 'quantity', scrollY: 235 },
  { id: 'expense-unit', screen: 'add-expense', title: 'Add unit', detail: 'Use kg, litre, piece, or the unit used in the receipt.', x: 70, y: 44, duration: 1800, activeItem: 'unit', scrollY: 235 },
  { id: 'expense-amount', screen: 'add-expense', title: 'Enter the paid amount', detail: 'The purchase total updates from the line amount.', x: 51, y: 54, duration: 2100, activeItem: 'amount', scrollY: 235 },
  { id: 'expense-split-options', screen: 'add-expense', title: 'Review split defaults', detail: 'Used By and Split Method remain visible and adjustable.', x: 51, y: 44, duration: 2100, activeItem: 'advanced', scrollY: 430 },
  { id: 'expense-note', screen: 'add-expense', title: 'Add an optional note', detail: 'A short explanation keeps the shared ledger clear.', x: 51, y: 48, duration: 1900, activeItem: 'note', scrollY: 540 },
  { id: 'expense-attachment', screen: 'add-expense', title: 'Attach the receipt', detail: 'Upload evidence without leaving the current expense flow.', x: 51, y: 55, duration: 1900, activeItem: 'attachment', scrollY: 620 },
  { id: 'expense-preview-button', screen: 'add-expense', title: 'Preview the split', detail: 'Nothing changes until the calculated member allocation is reviewed.', x: 51, y: 77, duration: 2100, activeItem: 'preview', scrollY: 665 },
  { id: 'expense-preview', screen: 'expense-preview', title: 'Review member allocation', detail: 'Messzen shows every share, the split rule, and the final shared total.', x: 53, y: 53, duration: 2800 },
  { id: 'expense-save', screen: 'expense-preview', title: 'Save the expense', detail: 'Confirm only after checking the complete split preview.', x: 70, y: 82, duration: 2100, activeItem: 'save' },
  { id: 'expense-success', screen: 'expense-success', title: 'Expense saved successfully', detail: 'The new record appears first and updated totals are visible immediately.', x: 50, y: 20, duration: 2900 },

  { id: 'utility-action-menu', screen: 'expense-actions', title: 'Choose Add Utility', detail: 'Utility entry starts from the same current floating action menu.', x: 82, y: 70, duration: 1900 },
  { id: 'utility-payment', screen: 'add-utility', title: 'Choose utility payment source', detail: 'Select Mess Deposit or Personal payment using the canonical shared form.', x: 51, y: 23, duration: 2000, activeItem: 'payment' },
  { id: 'utility-payer', screen: 'add-utility', title: 'Choose who paid the bill', detail: 'Managers can assign the utility payment to the correct member.', x: 51, y: 40, duration: 1900, activeItem: 'paid-by' },
  { id: 'utility-date', screen: 'add-utility', title: 'Confirm bill date', detail: 'The utility is applied to the correct billing date.', x: 51, y: 49, duration: 1800, activeItem: 'date' },
  { id: 'utility-type', screen: 'add-utility', title: 'Choose utility type', detail: 'Select Electricity, Gas, Water, Internet, Rent, or Other.', x: 29, y: 38, duration: 2000, activeItem: 'utility-type', scrollY: 215 },
  { id: 'utility-price', screen: 'add-utility', title: 'Enter utility price', detail: 'The current Utility Items editor calculates the total automatically.', x: 71, y: 38, duration: 2000, activeItem: 'utility-price', scrollY: 215 },
  { id: 'utility-split', screen: 'add-utility', title: 'Review equal split', detail: 'Utilities default to All Members with an Equal split.', x: 51, y: 45, duration: 2000, activeItem: 'advanced', scrollY: 370 },
  { id: 'utility-note', screen: 'add-utility', title: 'Add utility note', detail: 'Explain the billing period or meter details.', x: 51, y: 50, duration: 1800, activeItem: 'note', scrollY: 470 },
  { id: 'utility-attachment', screen: 'add-utility', title: 'Attach utility bill', detail: 'Keep the bill image with the shared record.', x: 51, y: 57, duration: 1800, activeItem: 'attachment', scrollY: 545 },
  { id: 'utility-preview-button', screen: 'add-utility', title: 'Preview utility split', detail: 'Review the calculated equal shares before saving.', x: 51, y: 78, duration: 2000, activeItem: 'preview', scrollY: 610 },
  { id: 'utility-preview', screen: 'utility-preview', title: 'Review utility allocation', detail: 'The current preview shows paid source, used by, split method, and member shares.', x: 52, y: 52, duration: 2700 },
  { id: 'utility-save', screen: 'utility-preview', title: 'Save the utility', detail: 'Confirm the verified utility allocation.', x: 70, y: 82, duration: 2000, activeItem: 'save' },
  { id: 'utility-success', screen: 'utility-success', title: 'Utility saved successfully', detail: 'Utility totals and the expense ledger update immediately.', x: 50, y: 20, duration: 2800 },

  { id: 'quick-deposits', screen: 'home', title: 'Open Deposits', detail: 'Choose Deposits from the Home Quick Actions.', x: 82, y: 16, duration: 1900, activeItem: 'deposits' },
  { id: 'deposits-screen', screen: 'deposits', title: 'Deposit Management', detail: 'See personal, total, pending, and recent approved contributions.', x: 53, y: 43, duration: 2700 },
  { id: 'deposit-add-button', screen: 'deposits', title: 'Open Submit Deposit', detail: 'Tap the current floating deposit button to open manual entry.', x: 86, y: 84, duration: 1900 },
  { id: 'deposit-method', screen: 'add-deposit', title: 'Choose deposit method', detail: 'Select bKash, cash, bank, or another current payment method.', x: 51, y: 28, duration: 1900, activeItem: 'method' },
  { id: 'deposit-amount', screen: 'add-deposit', title: 'Enter the deposit amount', detail: 'Record the exact amount already paid by the member.', x: 30, y: 39, duration: 1900, activeItem: 'amount' },
  { id: 'deposit-date', screen: 'add-deposit', title: 'Confirm deposit date', detail: 'Apply the contribution to the correct billing period.', x: 70, y: 39, duration: 1800, activeItem: 'date' },
  { id: 'deposit-member', screen: 'add-deposit', title: 'Choose Deposit For', detail: 'Managers can select the member whose balance should be updated.', x: 51, y: 49, duration: 2000, activeItem: 'paid-by' },
  { id: 'deposit-transaction', screen: 'add-deposit', title: 'Add transaction ID', detail: 'Keep the external payment reference for verification.', x: 51, y: 59, duration: 1900, activeItem: 'transaction' },
  { id: 'deposit-note', screen: 'add-deposit', title: 'Add an optional note', detail: 'Explain which month or bill the contribution covers.', x: 51, y: 69, duration: 1900, activeItem: 'note' },
  { id: 'deposit-submit', screen: 'add-deposit', title: 'Submit Deposit', detail: 'The current manager flow records and approves the entry.', x: 51, y: 83, duration: 2100, activeItem: 'submit', scrollY: 90 },
  { id: 'deposit-success', screen: 'deposit-success', title: 'Deposit added and approved', detail: 'Updated totals and the new contribution appear together.', x: 50, y: 20, duration: 2900 },

  { id: 'quick-bill', screen: 'home', title: 'Open Monthly Bill', detail: 'The bill summary is always one tap away.', x: 18, y: 26, duration: 1900, activeItem: 'monthly-bill' },
  { id: 'bill-screen', screen: 'monthly-bill', title: 'Monthly Bill Management', detail: 'Review deposits, total cost, due, remaining balance, and member bills.', x: 52, y: 42, duration: 2800 },
  { id: 'bill-members', screen: 'monthly-bill', title: 'Complete member bill overview', detail: 'Paid and due states appear in the same flat member list used by the current app.', x: 52, y: 62, duration: 2700, scrollY: 285 },
  { id: 'quick-notices', screen: 'home', title: 'Open Notices', detail: 'Tap Notices to review community updates.', x: 50, y: 26, duration: 1900, activeItem: 'notices' },
  { id: 'notices-screen', screen: 'notices', title: 'Community Notices', detail: 'The current Send Notice action and flat pinned notice board are both visible.', x: 52, y: 37, duration: 2500 },
  { id: 'notice-form', screen: 'notices', title: 'Create a complete notice', detail: 'Choose type, write title and message, then pin important announcements.', x: 52, y: 48, duration: 2500, activeItem: 'notice-form' },
  { id: 'notice-send', screen: 'notices', title: 'Send Notice', detail: 'The reusable deferred form ends with the current primary action.', x: 52, y: 76, duration: 1900, activeItem: 'notice-send', scrollY: 120 },
  { id: 'quick-members', screen: 'home', title: 'Open Members', detail: 'Managers can reach the member list directly from Home.', x: 82, y: 26, duration: 1900, activeItem: 'members' },
  { id: 'members-screen', screen: 'members', title: 'Member Management', detail: 'Search, tabs, active member rows, roles, rooms, and Add Member match the current app.', x: 52, y: 42, duration: 2500 },
  { id: 'member-requests', screen: 'members', title: 'Review join requests', detail: 'Managers can switch to pending requests and approve or reject each applicant.', x: 73, y: 27, duration: 2500, activeItem: 'join-requests' },
  { id: 'quick-ai', screen: 'home', title: 'Open Quick Add with AI', detail: 'Use the dedicated AI card for text or voice commands.', x: 51, y: 40, duration: 2100, activeItem: 'ai' },
  { id: 'ai-screen', screen: 'ai', title: 'Current AI assistant screen', detail: 'The violet assistant hero, supported entry types, composer, and safety note match the current app.', x: 50, y: 30, duration: 2800 },
  { id: 'ai-examples', screen: 'ai', title: 'Six multilingual quick examples', detail: 'Expense, utility, deposit, and meal commands are shown in English, Bangla, and Banglish.', x: 50, y: 67, duration: 2700, scrollY: 430 },
  { id: 'ai-command', screen: 'ai', title: 'Write a natural command', detail: 'Type in English, Bangla, or Banglish inside the current composer.', x: 50, y: 57, duration: 2200, activeItem: 'command' },
  { id: 'ai-voice', screen: 'ai', title: 'Use voice input', detail: 'The inline microphone changes to the live recording waveform state.', x: 83, y: 66, duration: 2200, activeItem: 'voice' },
  { id: 'ai-create-preview', screen: 'ai', title: 'Create Preview', detail: 'AI analyses the command without saving anything.', x: 50, y: 73, duration: 2200, activeItem: 'ready' },
  { id: 'ai-review', screen: 'ai-review', title: 'Review AI-prefilled Expense', detail: 'AI uses the same canonical Expense form, already filled and still editable.', x: 52, y: 43, duration: 2800, activeItem: 'payment' },
  { id: 'ai-review-details', screen: 'ai-review', title: 'Check every generated detail', detail: 'Category, payer, date, item, amount, split, and note remain visible before confirmation.', x: 52, y: 45, duration: 2600, activeItem: 'advanced', scrollY: 400 },
  { id: 'ai-review-preview', screen: 'ai-review', title: 'Preview the AI allocation', detail: 'The current AI review requires a split preview before save.', x: 70, y: 79, duration: 2100, activeItem: 'preview', scrollY: 650 },
  { id: 'ai-preview', screen: 'ai-preview', title: 'AI split preview', detail: 'Review the same canonical member allocation screen.', x: 52, y: 52, duration: 2600 },
  { id: 'ai-save', screen: 'ai-preview', title: 'Confirm and save AI entry', detail: 'Only this final confirmation creates the record.', x: 70, y: 82, duration: 2100, activeItem: 'save' },
  { id: 'ai-success', screen: 'ai-success', title: 'AI entry saved successfully', detail: 'The current success state offers Add another or View.', x: 50, y: 43, duration: 2800 },

  { id: 'footer-home', screen: 'home', title: 'Footer: Home', detail: 'The first footer button always returns to the Home overview.', x: 14, y: 92, duration: 1900 },
  { id: 'footer-expenses', screen: 'home', title: 'Footer: Expenses', detail: 'Open the primary expense destination from the bottom dock.', x: 38, y: 92, duration: 1900 },
  { id: 'footer-expenses-screen', screen: 'expenses', title: 'Expenses footer destination', detail: 'The footer opens the same real expense ledger.', x: 52, y: 36, duration: 2300 },
  { id: 'footer-pattern', screen: 'home', title: 'Footer: Meal Pattern', detail: 'Open recurring meal automation from the bottom dock.', x: 64, y: 92, duration: 1900 },
  { id: 'pattern-screen', screen: 'meal-pattern', title: 'Current active Meal Pattern', detail: 'See the current Assistant card, active Daily schedule, and Change Pattern action.', x: 52, y: 43, duration: 2600 },
  { id: 'pattern-change', screen: 'meal-pattern', title: 'Change pattern', detail: 'Start the same two-step setup used by the current app.', x: 52, y: 78, duration: 1900, activeItem: 'change' },
  { id: 'pattern-type', screen: 'meal-pattern-type', title: 'Step 1: Choose a plan', detail: 'Compare the full-height current Daily and Weekly assistant cards.', x: 29, y: 54, duration: 2700, scrollY: 115 },
  { id: 'pattern-weekly', screen: 'meal-pattern-type', title: 'Choose Weekly', detail: 'The selected Weekly card uses the same violet state, feature list, and action treatment.', x: 73, y: 54, duration: 2200, activeItem: 'weekly', scrollY: 115 },
  { id: 'pattern-continue', screen: 'meal-pattern-type', title: 'Continue with Daily', detail: 'The selected plan uses the current violet assistant-card state.', x: 52, y: 82, duration: 1900, activeItem: 'continue', scrollY: 230 },
  { id: 'pattern-breakfast', screen: 'meal-pattern-schedule', title: 'Set Breakfast count', detail: 'Use the current minus, count, and plus controls.', x: 78, y: 48, duration: 1900, activeItem: 'breakfast' },
  { id: 'pattern-lunch', screen: 'meal-pattern-schedule', title: 'Set Lunch count', detail: 'Each meal keeps its own configured quantity.', x: 78, y: 58, duration: 1800, activeItem: 'lunch' },
  { id: 'pattern-dinner', screen: 'meal-pattern-schedule', title: 'Set Dinner count', detail: 'The total updates to 2.5 meals per day.', x: 78, y: 68, duration: 1800, activeItem: 'dinner' },
  { id: 'pattern-activate', screen: 'meal-pattern-schedule', title: 'Activate pattern', detail: 'Save the complete routine after reviewing all meal counts.', x: 52, y: 81, duration: 2000, activeItem: 'activate' },
  { id: 'pattern-weekly-schedule', screen: 'meal-pattern-schedule', title: 'Weekly day-by-day editor', detail: 'Weekly setup keeps a separate Breakfast, Lunch, and Dinner counter for every day.', x: 52, y: 51, duration: 2800, activeItem: 'weekly-saturday' },
  { id: 'pattern-weekly-next-day', screen: 'meal-pattern-schedule', title: 'Continue through the week', detail: 'Each day remains a complete current-app schedule card; empty meals stay at zero.', x: 52, y: 59, duration: 2500, activeItem: 'weekly-sunday', scrollY: 245 },
  { id: 'pattern-success', screen: 'meal-pattern-success', title: 'Meal pattern activated', detail: 'The current assistant success card confirms automatic meal scheduling.', x: 52, y: 48, duration: 2800 },
  { id: 'footer-more', screen: 'home', title: 'Footer: More', detail: 'Open the complete secondary navigation drawer.', x: 87, y: 92, duration: 2100 },

  { id: 'more-profile', screen: 'more', title: 'More: Profile', detail: 'Personal details and account settings.', x: 58, y: 23, duration: 1900, activeItem: 'profile' },
  { id: 'profile-screen', screen: 'profile', title: 'Current Profile identity card', detail: 'Avatar upload, account status, manager role, and Edit Profile match the live app.', x: 50, y: 38, duration: 2500 },
  { id: 'profile-details', screen: 'profile', title: 'Complete profile information', detail: 'Contact, NID verification, address, and workspace access use the current structured cards.', x: 50, y: 57, duration: 2600, scrollY: 330 },
  { id: 'profile-workspace', screen: 'profile', title: 'Workspace access and settings', detail: 'The tour reaches the final workspace permissions and Account Settings action.', x: 50, y: 66, duration: 2400, scrollY: 720 },
  { id: 'more-settings', screen: 'more', title: 'More: Settings', detail: 'Security and preferences are grouped under Account.', x: 58, y: 29, duration: 1900, activeItem: 'settings' },
  { id: 'settings-screen', screen: 'settings', title: 'Settings screen', detail: 'Edit profile, change password, and manage notifications.', x: 50, y: 44, duration: 2300 },
  { id: 'more-complaints', screen: 'more', title: 'More: Complaints', detail: 'Raise and follow up mess issues.', x: 58, y: 42, duration: 1900, activeItem: 'complaints' },
  { id: 'complaints-screen', screen: 'complaints', title: 'Submit a complaint', detail: 'Category, title, description, and Submit Complaint match the current form layout.', x: 50, y: 43, duration: 2500 },
  { id: 'complaints-recent', screen: 'complaints', title: 'Recent complaint states', detail: 'Pending, Processing, Solved, response, filter, and manager edit actions are all represented.', x: 50, y: 59, duration: 2500, scrollY: 285 },
  { id: 'more-management', screen: 'more', title: 'More: Mess Management', detail: 'Managers can configure rooms, rules, and billing.', x: 58, y: 48, duration: 1900, activeItem: 'mess-management' },
  { id: 'management-screen', screen: 'mess-management', title: 'Workspace and subscription overview', detail: 'Current assistant metrics and subscription dates appear before settings.', x: 50, y: 40, duration: 2600 },
  { id: 'management-settings', screen: 'mess-management', title: 'Complete mess settings', detail: 'Name, address, category, seats, rent, deadline, meal cutoff, and bazar rules are included.', x: 50, y: 55, duration: 2800, scrollY: 325 },
  { id: 'management-rooms', screen: 'mess-management', title: 'Rooms and save setup', detail: 'Room name, capacity, price, Add Room, and Save Setup finish the current manager page.', x: 50, y: 63, duration: 2700, scrollY: 920 },
  { id: 'more-subscription', screen: 'more', title: 'More: Subscription', detail: 'Review the active plan and billing history.', x: 58, y: 54, duration: 1900, activeItem: 'subscription' },
  { id: 'subscription-screen', screen: 'subscription', title: 'Current subscription summary', detail: 'Workspace, active plan, start, end, and days-left metrics match the current assistant card.', x: 50, y: 40, duration: 2500 },
  { id: 'subscription-plans', screen: 'subscription', title: 'Available plan cards', detail: 'Current badge, price, duration, feature lists, and support action are shown exactly.', x: 50, y: 59, duration: 2600, scrollY: 205 },
  { id: 'more-guide', screen: 'more', title: 'More: How It Works', detail: 'The app guide explains the complete workflow.', x: 58, y: 55, duration: 1900, activeItem: 'how-it-works', scrollY: 88 },
  { id: 'guide-screen', screen: 'how-it-works', title: 'How It Works', detail: 'The current assistant introduction and numbered guidance cards explain the complete workflow.', x: 50, y: 43, duration: 2500 },
  { id: 'guide-sections', screen: 'how-it-works', title: 'Review every workflow stage', detail: 'Create or join, record activity, review before saving, and close the month are all visible.', x: 50, y: 60, duration: 2500, scrollY: 245 },
  { id: 'more-contact', screen: 'more', title: 'More: Contact Us', detail: 'Open support for access, billing, or AI help.', x: 58, y: 61, duration: 1900, activeItem: 'contact-us', scrollY: 88 },
  { id: 'contact-screen', screen: 'contact-us', title: 'Contact Us', detail: 'Account, billing, and AI support topics use the current numbered support-card layout.', x: 50, y: 43, duration: 2500 },
  { id: 'contact-actions', screen: 'contact-us', title: 'Reach support or read the guide', detail: 'Email support and How It Works actions complete the support destination.', x: 50, y: 68, duration: 2300, scrollY: 260 },
  { id: 'more-privacy', screen: 'more', title: 'More: Privacy Policy', detail: 'Review how account and workspace data is handled.', x: 58, y: 67, duration: 1900, activeItem: 'privacy-policy', scrollY: 88 },
  { id: 'privacy-screen', screen: 'privacy-policy', title: 'Privacy Policy', detail: 'Information use, visibility, choices, and updates use the exact current numbered sections.', x: 50, y: 43, duration: 2500 },
  { id: 'privacy-sections', screen: 'privacy-policy', title: 'Complete privacy summary', detail: 'The tour scrolls through every policy section and the privacy support action.', x: 50, y: 64, duration: 2500, scrollY: 390 },
  { id: 'more-terms', screen: 'more', title: 'More: Terms & Conditions', detail: 'Finish with the rules for using Messzen.', x: 58, y: 73, duration: 1900, activeItem: 'terms', scrollY: 88 },
  { id: 'terms-screen', screen: 'terms', title: 'Terms & Conditions', detail: 'Account, workspace, acceptable-use, and subscription responsibilities match the live app.', x: 50, y: 43, duration: 2700 },
  { id: 'terms-sections', screen: 'terms', title: 'Complete terms and actions', detail: 'Every numbered section plus Privacy and Contact actions is included.', x: 50, y: 65, duration: 2700, scrollY: 470 },
] as const satisfies readonly MobileTourStep<MobileScreenId>[]

export type MobileAppTourVariant = 'all' | 'ai' | 'meal-pattern' | 'app'

type MarketingMobileAppTourProps = {
  variant?: MobileAppTourVariant
  presentation?: 'full' | 'device'
}

const isAiStep = (step: MobileTourStep<MobileScreenId>) => step.id === 'quick-ai' || step.id.startsWith('ai-')
const isMealPatternStep = (step: MobileTourStep<MobileScreenId>) => step.id === 'footer-pattern' || step.id.startsWith('pattern-')

// The compact marketing embed keeps a stable viewport. Deep-scroll AI steps remain
// available in the full app tour, where vertical exploration is expected.
const aiShowcaseStepIds = new Set<string>([
  'quick-ai',
  'ai-screen',
  'ai-command',
  'ai-voice',
  'ai-create-preview',
  'ai-review',
  'ai-preview',
  'ai-save',
  'ai-success',
])

const tourStepsByVariant: Record<MobileAppTourVariant, readonly MobileTourStep<MobileScreenId>[]> = {
  all: mobileTourSteps,
  ai: mobileTourSteps.filter((step) => isAiStep(step) && aiShowcaseStepIds.has(step.id)),
  'meal-pattern': mobileTourSteps.filter(isMealPatternStep),
  app: mobileTourSteps.filter((step) => !isAiStep(step) && !isMealPatternStep(step)),
}

const tourLabels: Record<MobileAppTourVariant, string> = {
  all: 'Automatic walkthrough of the Messzen mobile application',
  ai: 'Automatic walkthrough of Quick Add with AI',
  'meal-pattern': 'Automatic walkthrough of Meal Pattern setup',
  app: 'Automatic walkthrough of the Messzen mobile application features',
}

export function MarketingMobileAppTour({ variant = 'all', presentation = 'full' }: MarketingMobileAppTourProps) {
  const steps = tourStepsByVariant[variant]

  return (
    <MobileTourPlayer steps={steps} ariaLabel={tourLabels[variant]} presentation={presentation}>
      {(step) => (
        <MobileTourScreen
          screen={step.screen}
          activeItem={step.activeItem}
          scrollY={step.scrollY}
        />
      )}
    </MobileTourPlayer>
  )
}
