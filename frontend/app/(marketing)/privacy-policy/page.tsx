import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | Messzen',
  description: 'Learn how Messzen collects, uses, stores, and protects information across its website, dashboard, dedicated app, AI tools, and notification services.',
}

const sections: LegalSection[] = [
  {
    id: 'scope',
    title: 'Scope and who we are',
    content: (
      <>
        <p>This Privacy Policy explains how Messzen (&quot;Messzen&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) handles personal information when you use the Messzen website, web dashboard, dedicated mobile application, AI-assisted tools, push notifications, support channels, and related services (collectively, the &quot;Service&quot;).</p>
        <p>Messzen is a mess and shared-living management platform. Managers may create and administer a mess, while organizers and members may access information and actions permitted by their role. This Policy applies to information handled through those activities. It does not govern an independent third-party service that links to its own privacy notice.</p>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    content: (
      <>
        <p>We collect information you provide, information created while operating a mess, and limited technical information needed to run the Service.</p>
        <h3>Account and profile information</h3>
        <ul>
          <li>Name, email address, phone number, profile image, account role, and authentication credentials.</li>
          <li>Password reset details, one-time verification codes, and account security events.</li>
        </ul>
        <h3>Mess and membership information</h3>
        <ul>
          <li>Mess name, address, description, seat information, membership, assigned role, join requests, and manager details.</li>
          <li>Attendance, meal schedules, daily or weekly meal patterns, shopping lists, notices, complaints, and related activity.</li>
        </ul>
        <h3>Operational and financial records</h3>
        <ul>
          <li>Meals, meal rates, bazar and other expenses, utilities, deposits, payments, previous balances, monthly bills, and approval history.</li>
          <li>These are management records. Messzen does not itself prove that cash or an external bank payment changed hands unless the Service expressly provides and confirms that payment-processing function.</li>
        </ul>
        <h3>AI and voice information</h3>
        <ul>
          <li>Text commands, voice input, resulting transcripts, detected intent, confidence information, generated previews, corrections, confirmations, and command history needed to provide AI-assisted actions.</li>
          <li>When voice input is used, audio may be processed to create a transcript and preview. You should avoid including unrelated sensitive information in a command.</li>
        </ul>
        <h3>Contact, subscription, and support information</h3>
        <ul>
          <li>Contact form details, requested plan, support messages, administrative notes, subscription status, and service communications.</li>
        </ul>
        <h3>Device and technical information</h3>
        <ul>
          <li>Browser or device type, user agent, IP address, request logs, error information, and timestamps.</li>
          <li>Push subscription endpoint and encryption keys when you enable notifications, plus local preferences described below.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-information',
    title: 'How we use information',
    content: (
      <>
        <p>We use information only for legitimate purposes connected with operating, securing, improving, and supporting Messzen, including to:</p>
        <ul>
          <li>Create accounts, authenticate users, maintain profiles, and enforce role-based access.</li>
          <li>Operate mess workflows, meal patterns, expenses, deposits, monthly calculations, reports, notices, and approvals.</li>
          <li>Interpret text or voice commands, generate a reviewable preview, apply a confirmed action, and improve command reliability.</li>
          <li>Send account, meal, payment-due, bazar, notice, security, and service notifications where enabled.</li>
          <li>Respond to contact requests, provide support, administer plans, and communicate important Service changes.</li>
          <li>Prevent misuse, investigate errors or security incidents, comply with legal obligations, and protect users and the Service.</li>
          <li>Understand aggregate Service performance and improve usability without using operational records for unrelated advertising profiles.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ai-processing',
    title: 'AI-assisted features and automated processing',
    content: (
      <>
        <p>Messzen&apos;s AI tools are designed to reduce repetitive entry, not to remove user control. A text or voice command is interpreted into a proposed action. The Service presents a preview so the user can review important fields, edit them where supported, cancel, or confirm before saving.</p>
        <p>Recurring meal patterns operate differently: once an authorized user activates a daily or weekly pattern, the Service may continue creating the scheduled meal records until that pattern is changed, paused, or removed. Managers and members should review their active patterns and permissions regularly.</p>
        <p>AI output may occasionally be incomplete or incorrect. We may use qualified service providers to process commands or transcribe audio. Only submit information you are authorized to process, and verify every preview before confirmation.</p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'When information is shared',
    content: (
      <>
        <p>We do not sell personal information. We may share it in the following limited circumstances:</p>
        <ul>
          <li><strong>Within your mess:</strong> with managers, organizers, members, or administrators according to their role and the relevant workflow.</li>
          <li><strong>Service providers:</strong> with hosting, database, notification-delivery, email, security, support, analytics, AI, or speech-processing providers that help operate the Service.</li>
          <li><strong>Legal and safety reasons:</strong> where reasonably necessary to comply with law, respond to lawful process, prevent fraud or abuse, or protect rights and safety.</li>
          <li><strong>Business changes:</strong> in connection with a merger, financing, acquisition, restructuring, or transfer of the Service, subject to appropriate confidentiality safeguards.</li>
          <li><strong>With your direction:</strong> when you request, authorize, or intentionally make a disclosure.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'storage-and-cookies',
    title: 'Local storage, cookies, and notifications',
    content: (
      <>
        <p>Messzen uses limited browser storage to make the Service work:</p>
        <ul>
          <li>An authentication token may be stored in your browser&apos;s local storage to keep you signed in.</li>
          <li>Theme or interface preferences may be stored locally, and a short-lived cookie may remember whether the dashboard sidebar is open.</li>
          <li>Password-reset progress may temporarily use session storage until the verification flow is complete.</li>
          <li>If you enable push notifications, the browser creates a device-specific push subscription. You can change permission in browser or device settings and may unsubscribe through available Service controls.</li>
        </ul>
        <p>Blocking essential storage may prevent login, navigation preferences, password reset, or notifications from working correctly.</p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'Retention and deletion',
    content: (
      <>
        <p>We retain information for as long as reasonably needed to provide the Service, maintain accurate mess and billing history, comply with legal or accounting obligations, resolve disputes, enforce agreements, and protect the Service.</p>
        <p>Retention varies by record. Active account and mess records generally remain while the account or mess is active. Security logs, support requests, billing records, and backups may remain for a limited period after deletion where necessary. Push subscription data may remain until it is deactivated, replaced, or removed.</p>
        <p>Deleting a record from the visible interface may not immediately remove it from protected backups. When retention is no longer justified, we delete, anonymize, or securely isolate the information.</p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    content: (
      <>
        <p>We use administrative, technical, and organizational safeguards designed to protect information, including authenticated access, role-based permissions, encrypted transport where available, controlled service access, and monitoring for operational errors.</p>
        <p>No website, app, transmission, or storage system is completely secure. You are responsible for protecting your password, device, and active session; using accurate account information; and promptly reporting suspected unauthorized access.</p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your choices and rights',
    content: (
      <>
        <p>Subject to applicable law and the role under which a mess record is controlled, you may ask to:</p>
        <ul>
          <li>Access, correct, or update your profile and personal information.</li>
          <li>Receive information about how your data is used or shared.</li>
          <li>Delete your account or request deletion of eligible personal information.</li>
          <li>Object to, restrict, or withdraw consent for certain processing where that right applies.</li>
          <li>Disable push notifications in your browser or device settings.</li>
          <li>Raise a concern about an inaccurate record with the relevant mess manager or Messzen support.</li>
        </ul>
        <p>Some requests may be limited where we must preserve another person&apos;s rights, mess accounting integrity, security evidence, or a record required by law. To make a privacy request, email <a href="mailto:support@messzen.com">support@messzen.com</a>.</p>
      </>
    ),
  },
  {
    id: 'children-and-third-parties',
    title: 'Children and third-party information',
    content: (
      <>
        <p>The Service is intended for people who can lawfully create an account or who use it under the authorization and supervision of a responsible organization, mess manager, parent, or guardian. Do not independently create an account if you lack the legal capacity to accept the Terms.</p>
        <p>If you enter information about another person, including a member&apos;s name, phone number, meal activity, or financial record, you confirm that you are authorized to do so and will use it only for legitimate mess-management purposes.</p>
      </>
    ),
  },
  {
    id: 'international-processing',
    title: 'International processing',
    content: (
      <p>Some infrastructure or specialist providers may process information outside the country where you live. When this occurs, we take reasonable steps to use providers and arrangements that protect information consistently with this Policy and applicable law.</p>
    ),
  },
  {
    id: 'changes-and-contact',
    title: 'Changes and contact',
    content: (
      <>
        <p>We may update this Policy as the Service, technology, or legal requirements change. The revised version will show a new &quot;Last updated&quot; date. If a change materially affects how we handle personal information, we may provide additional notice through the Service or an account communication.</p>
        <p>For privacy questions or requests, contact Messzen at <a href="mailto:support@messzen.com">support@messzen.com</a> or <a href="tel:01797515386">01797515386</a>.</p>
      </>
    ),
  },
]

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      kind="privacy"
      eyebrow="Trust and transparency"
      title="Privacy Policy"
      description="This Policy explains what information Messzen handles, why it is needed, how it supports automation and shared-living workflows, and what choices you have."
      effectiveDate="August 15, 2026"
      lastUpdated="August 15, 2026"
      sections={sections}
    />
  )
}
