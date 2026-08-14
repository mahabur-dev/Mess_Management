import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Terms and Conditions | Messzen',
  description: 'Read the terms governing accounts, mess roles, automation, AI-assisted actions, subscriptions, billing records, and use of the Messzen Service.',
}

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance and eligibility',
    content: (
      <>
        <p>These Terms and Conditions ("Terms") are a binding agreement between you and Messzen ("Messzen", "we", "our", or "us") governing your access to the Messzen website, web dashboard, dedicated mobile application, AI-assisted tools, notifications, and related services (collectively, the "Service").</p>
        <p>By creating an account, joining a mess, purchasing or requesting a plan, or otherwise using the Service, you agree to these Terms and the <a href="/privacy-policy">Privacy Policy</a>. If you use the Service for an organization or mess, you confirm that you are authorized to bind that organization to these Terms.</p>
        <p>You must have legal capacity to accept these Terms. If you do not, you may use the Service only with the valid authorization and supervision of a responsible parent, guardian, organization, or mess manager.</p>
      </>
    ),
  },
  {
    id: 'service',
    title: 'What Messzen provides',
    content: (
      <>
        <p>Messzen provides tools for managing shared-living operations, which may include members, roles, meals, recurring meal patterns, attendance, shopping, expenses, utilities, deposits, payments, monthly bills, reports, notices, complaints, contact requests, AI-assisted entries, and push notifications.</p>
        <p>Messzen is a record-management and workflow platform. Unless an expressly identified feature states otherwise, Messzen is not a bank, wallet, money-transfer service, accountant, landlord, hostel operator, or legal adviser. A record in the Service does not by itself prove that an external payment, purchase, or legal obligation occurred.</p>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Accounts and account security',
    content: (
      <>
        <ul>
          <li>Provide accurate, current, and complete registration and profile information.</li>
          <li>Keep your password, device, authentication token, and active session secure.</li>
          <li>Do not share an account in a way that defeats role-based permissions or audit history.</li>
          <li>Notify Messzen promptly if you suspect unauthorized access, a compromised password, or inaccurate account ownership.</li>
          <li>You are responsible for actions performed through your account unless caused by a failure for which Messzen is legally responsible.</li>
        </ul>
        <p>We may require identity or authority verification before changing access, responding to a sensitive request, or restoring an account.</p>
      </>
    ),
  },
  {
    id: 'roles-and-permissions',
    title: 'Mess roles, permissions, and manager responsibilities',
    content: (
      <>
        <p>The Service may assign different capabilities to administrators, managers, organizers, and members. A mess manager or similarly authorized user controls many operational decisions and is responsible for:</p>
        <ul>
          <li>Inviting or approving the correct people and assigning appropriate roles.</li>
          <li>Having authority to enter and manage member information and mess records.</li>
          <li>Keeping meal rules, expense categories, utility charges, deposits, balances, and billing settings accurate.</li>
          <li>Reviewing approvals, disputes, join requests, notices, and access when a member leaves.</li>
          <li>Communicating internal mess rules that are separate from these Terms.</li>
        </ul>
        <p>Members must use the information visible to them only for legitimate shared-living purposes and must raise suspected errors promptly with the responsible manager.</p>
      </>
    ),
  },
  {
    id: 'meal-patterns',
    title: 'Recurring meal patterns',
    content: (
      <>
        <p>An authorized user may configure a daily or weekly meal pattern. Once activated, that pattern may continue creating scheduled meal records automatically until it is changed, paused, disabled, or removed.</p>
        <p>You are responsible for confirming that the pattern, members, meal quantities, dates, time zone, and effective period are correct. Changes may apply prospectively and may not automatically correct previously generated records. Review active patterns regularly, especially when a member's routine changes or the mess closes meals for a period.</p>
      </>
    ),
  },
  {
    id: 'ai-features',
    title: 'AI, text, and voice commands',
    content: (
      <>
        <p>AI-assisted features may interpret Bangla, English, or Banglish text and voice commands relating to meals, expenses, utilities, deposits, and other supported actions. These features are intended to reduce repetitive entry but may misunderstand a person, amount, date, category, or instruction.</p>
        <ul>
          <li>Review the generated preview and all important fields before confirming.</li>
          <li>Edit or cancel an inaccurate preview rather than relying on the confidence indicator alone.</li>
          <li>Do not submit unlawful content, another person's sensitive information without authority, or instructions outside the supported workflow.</li>
          <li>Keep source receipts or evidence where a mess rule or legal obligation requires it.</li>
        </ul>
        <p>Once you confirm a preview, the resulting entry is treated as an action authorized through your account. AI availability, language recognition, and output quality may vary by device, connection, wording, and provider availability.</p>
      </>
    ),
  },
  {
    id: 'financial-records',
    title: 'Meals, expenses, deposits, and monthly calculations',
    content: (
      <>
        <p>Monthly calculations depend on the records and settings entered by authorized users, including meal counts, meal rates, expenses, utilities, deposits, payments, custom shares, and previous balances. Incorrect or late data can produce an incorrect result.</p>
        <p>A deposit or payment entry records information for mess tracking. Unless Messzen expressly processes the underlying transaction and provides confirmation, users remain responsible for verifying that money was actually received through cash, bank, mobile financial service, or another external method.</p>
        <p>Managers should review monthly summaries before treating them as final. Messzen may provide calculations and reports, but users remain responsible for accounting, tax, contractual, and payment decisions.</p>
      </>
    ),
  },
  {
    id: 'notifications',
    title: 'Notifications and reminders',
    content: (
      <>
        <p>With permission, Messzen may send meal reminders, payment-due alerts, bazar alarms, notices, monthly bill updates, and security or service communications. Delivery can be delayed or prevented by device settings, browser support, network conditions, battery restrictions, an expired push subscription, or a third-party delivery provider.</p>
        <p>Notifications are a convenience and should not be the only method used for an urgent, safety-critical, contractual, or time-sensitive obligation. You are responsible for checking the Service and maintaining appropriate backup communication within your mess.</p>
      </>
    ),
  },
  {
    id: 'subscriptions',
    title: 'Plans, subscriptions, and fees',
    content: (
      <>
        <p>Available plans, trial periods, features, prices, duration, and currency are shown in the Service or communicated during the subscription process. Plan availability and included features may change for future subscription periods.</p>
        <ul>
          <li>Provide accurate subscription and contact information.</li>
          <li>Pay applicable fees using an approved method and within the communicated period.</li>
          <li>Understand that a trial or subscription may expire, be limited, or require renewal.</li>
          <li>Contact us promptly about a billing or plan error.</li>
        </ul>
        <p>Unless required by applicable law or stated in a separate written offer, fees already earned for a subscription period are not automatically refundable. We will apply any mandatory consumer rights that cannot lawfully be excluded.</p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    content: (
      <>
        <p>You must not:</p>
        <ul>
          <li>Use the Service unlawfully, fraudulently, deceptively, or to harass or harm another person.</li>
          <li>Enter false financial records, impersonate another person, or manipulate a mess calculation without authority.</li>
          <li>Attempt to bypass permissions, probe security, access another mess, distribute malware, or disrupt the Service.</li>
          <li>Reverse engineer, scrape, copy, resell, or exploit the Service except where the law expressly permits it.</li>
          <li>Use automated tools at a volume that degrades availability or interferes with other users.</li>
          <li>Upload content that infringes privacy, confidentiality, intellectual-property, or other rights.</li>
        </ul>
        <p>We may investigate suspected misuse and restrict relevant access while protecting the Service and other users.</p>
      </>
    ),
  },
  {
    id: 'user-content',
    title: 'Your data and content',
    content: (
      <>
        <p>You retain ownership of information and content you lawfully submit. You grant Messzen a limited, non-exclusive right to host, process, reproduce, transmit, and display that content only as needed to provide, secure, support, and improve the Service.</p>
        <p>You confirm that you have the necessary authority and permissions for the information you submit, including information about other members. Your use of personal information is also subject to the <a href="/privacy-policy">Privacy Policy</a> and applicable law.</p>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Messzen intellectual property',
    content: (
      <p>The Service, software, interface, branding, visual design, documentation, workflows, and original content are owned by or licensed to Messzen and are protected by applicable intellectual-property laws. These Terms give you a limited, revocable, non-transferable right to use the Service for its intended purpose; they do not transfer ownership or permit unauthorized commercial reuse.</p>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and changes to the Service',
    content: (
      <>
        <p>We work to provide a reliable Service, but uninterrupted or error-free availability is not guaranteed. Maintenance, security events, provider outages, network failures, device limitations, or events outside reasonable control may affect access.</p>
        <p>We may add, improve, limit, replace, or discontinue a feature. Where a material change adversely affects an active paid plan, we will provide reasonable notice when practicable and apply rights required by law.</p>
      </>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    content: (
      <p>To the maximum extent permitted by law, the Service is provided on an "as available" basis. Messzen does not guarantee that AI output, recurring records, notifications, calculations, third-party integrations, or user-entered information will always be accurate, timely, complete, or suitable for a particular decision. Nothing in these Terms excludes a warranty or right that applicable law does not allow us to exclude.</p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    content: (
      <>
        <p>To the maximum extent permitted by applicable law, Messzen will not be liable for indirect, incidental, special, punitive, or consequential loss, or for lost profits, lost data, missed notifications, disputed member records, or decisions based on unverified entries.</p>
        <p>Where liability cannot be excluded, Messzen's aggregate liability arising from the Service will be limited to the amount you paid Messzen for the affected Service during the six months before the event giving rise to the claim, unless applicable law requires a different remedy or limit.</p>
      </>
    ),
  },
  {
    id: 'suspension',
    title: 'Suspension and termination',
    content: (
      <>
        <p>You may stop using the Service at any time and may request eligible account deletion. Mess managers should resolve ownership, export, access, and record-retention needs before closing a mess.</p>
        <p>We may suspend or terminate access where reasonably necessary for non-payment, material breach, fraud, security risk, unlawful activity, harm to others, or protection of the Service. Where appropriate, we will provide notice and an opportunity to resolve the issue. Provisions that by their nature should survive termination will remain effective.</p>
      </>
    ),
  },
  {
    id: 'law-and-disputes',
    title: 'Governing law and disputes',
    content: (
      <>
        <p>These Terms are governed by the applicable laws of Bangladesh, without excluding mandatory rights that apply to you. Before filing a formal claim, you and Messzen agree to make a good-faith attempt to resolve the dispute by contacting the other party and allowing a reasonable response period.</p>
        <p>Unless applicable law requires otherwise, unresolved disputes will be submitted to the courts of competent jurisdiction in Bangladesh.</p>
      </>
    ),
  },
  {
    id: 'changes-and-contact',
    title: 'Changes and contact',
    content: (
      <>
        <p>We may update these Terms to reflect Service, business, security, or legal changes. The updated page will show a revised date. If a change is material, we may provide additional notice. Continued use after the effective date means you accept the updated Terms, except where applicable law requires another form of consent.</p>
        <p>Questions about these Terms may be sent to <a href="mailto:support@messzen.com">support@messzen.com</a> or <a href="tel:01797515386">01797515386</a>.</p>
      </>
    ),
  },
]

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      kind="terms"
      eyebrow="Fair use and clear responsibilities"
      title="Terms and Conditions"
      description="These Terms explain the rules for accounts, mess roles, automation, AI-assisted actions, operational records, subscriptions, and responsible use of Messzen."
      effectiveDate="August 15, 2026"
      lastUpdated="August 15, 2026"
      sections={sections}
    />
  )
}
