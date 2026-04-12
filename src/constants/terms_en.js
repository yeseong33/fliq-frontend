/**
 * Terms of Service, Privacy Policy, and Support (English)
 */

export const TERMS_OF_SERVICE_EN = {
  title: 'Terms of Service',
  version: '1.1',
  lastUpdated: 'April 11, 2026',
  sections: [
    {
      title: 'Article 1 (Purpose)',
      content: 'These Terms govern the conditions and procedures for using the group expense splitting service (the "Service") provided by Fliq (the "Company"), and define the rights, obligations, and responsibilities between users and the Company.',
    },
    {
      title: 'Article 2 (Definitions)',
      content: `1. "Service" refers to the features provided by the Company, including group creation, expense recording, settlement calculation, and payment integration.
2. "User" refers to any person who agrees to these Terms and registers for the Service.
3. "Gathering" refers to an expense-splitting unit created by a User within the Service.`,
    },
    {
      title: 'Article 3 (Effect and Amendment of Terms)',
      content: `1. These Terms take effect when posted on the Service or otherwise communicated to Users.
2. The Company may amend these Terms to the extent permitted by applicable law and will provide at least 7 days' prior notice of any changes.`,
    },
    {
      title: 'Article 4 (Use of the Service)',
      content: `1. Users may create gatherings, record expenses, and request settlements through the Service.
2. The Service does not directly process financial transactions (e.g., money transfers). It provides integration with external payment services.`,
    },
    {
      title: 'Article 5 (User Obligations)',
      content: `1. Users must not misappropriate others' information or register false information.
2. Users must not use the Service for fraudulent or unlawful purposes.`,
    },
    {
      title: 'Article 6 (Limitation of Liability)',
      content: `1. The Company is not directly liable for financial transactions between Users.
2. The Company is not liable for service interruptions caused by force majeure, including natural disasters or system failures.`,
    },
    {
      title: 'Article 7 (Eligibility)',
      content: `1. The Service is available only to users aged 14 or older.
2. Users under 14 may not register for the Service. If such registration is discovered, the Company may immediately terminate the account.`,
    },
  ],
  additionalTerms: [
    {
      title: 'Electronic Financial Transactions Terms',
      sections: [
        {
          title: 'Article 1 (Purpose)',
          content: 'These terms govern the conditions for using electronic financial transaction-related services provided by Fliq (the "Company").',
        },
        {
          title: 'Article 2 (Scope of Service)',
          content: `1. The Company does not directly process electronic financial transactions (transfers, payments).
2. The Company provides settlement amount calculations and integration with external payment services (e.g., Toss).
3. Actual money transfers are made directly by Users through external payment services.`,
        },
        {
          title: 'Article 3 (Payment Method Information)',
          content: `1. Users may register bank account information to receive settlements.
2. Registered account information is used solely for settlement guidance within gatherings.
3. The Company does not guarantee the accuracy of account information.`,
        },
        {
          title: 'Article 4 (User Protection)',
          content: `1. The Company encrypts and securely stores Users' financial information.
2. The Company may restrict Service usage upon suspicion of fraudulent transactions.`,
        },
        {
          title: 'Article 5 (Disclaimer)',
          content: `1. The Company is not liable for damages caused by errors or failures of external payment services.
2. The Company has no obligation to mediate disputes arising from transfers between Users.`,
        },
      ],
    },
    {
      title: 'Consent to Third-Party Provision of Personal Information',
      sections: [
        {
          title: '1. Recipients',
          content: `• Payment service providers (e.g., Toss Payments)
• Identity verification service providers`,
        },
        {
          title: '2. Purpose of Provision',
          content: `• Processing settlement transfers and payment service integration
• Identity verification and fraud prevention`,
        },
        {
          title: '3. Information Provided',
          content: '• Name (nickname), email address, bank account information (if registered)',
        },
        {
          title: '4. Retention and Usage Period',
          content: `• Until the purpose of provision is fulfilled or the User withdraws consent
• However, if retention is required by applicable law, until the end of the applicable retention period

You have the right to refuse consent; however, refusal may limit your use of settlement and transfer features.`,
        },
      ],
    },
  ],
  notice: 'For inquiries about these Terms, please contact fliq.support@gmail.com.',
};

export const PRIVACY_POLICY_EN = {
  title: 'Privacy Policy',
  version: '1.1',
  lastUpdated: 'April 11, 2026',
  sections: [
    {
      title: '1. Personal Information Collected and Purpose of Use',
      content: `[Required Information]
• Email address: User identification, login, service-related notices
• Name (nickname): Displaying participants within gatherings, identifying settlement parties
• Passkey (WebAuthn public key): Secure login authentication

[Automatically Collected During Service Use]
• Service usage records: Gathering creation/participation history, expense records, settlement history
• Device information: Browser type, OS information (for service optimization)`,
    },
    {
      title: '2. Retention and Usage Period',
      content: `• Personal information is retained until account deletion and destroyed immediately upon deletion.
• However, where retention is required by applicable law:
  - Transaction records under the Act on Consumer Protection in Electronic Commerce: 5 years
  - Access logs under the Protection of Communications Secrets Act: 3 months`,
    },
    {
      title: '3. Provision of Personal Information to Third Parties',
      content: `• We do not provide personal information to third parties without the User's separate consent.
• Exceptions are made when required by law.`,
    },
    {
      title: '4. Destruction of Personal Information',
      content: `• Personal information is destroyed without delay when the retention period expires or the purpose of processing is achieved.
• Electronic files: Deleted using methods that prevent recovery
• Paper documents: Shredded or incinerated`,
    },
    {
      title: '5. User Rights',
      content: `• Users may request access to, correction, deletion, or suspension of processing of their personal information.
• Requests can be made through the profile settings within the Service or by contacting customer support.`,
    },
    {
      title: '6. Privacy Officer',
      content: `• Officer: Yeseong Oh
• Contact: fliq.support@gmail.com`,
    },
    {
      title: '7. Protection of Children Under 14',
      content: `• The Company does not collect personal information from children under 14.
• Children under 14 may not register for the Service.
• If the Company becomes aware that personal information from a child under 14 has been collected, it will immediately destroy such information.`,
    },
  ],
  notice: 'For inquiries about this policy, please contact fliq.support@gmail.com.',
};

export const SUPPORT_INFO_EN = {
  title: 'Support',
  lastUpdated: 'April 1, 2026',
  sections: [
    {
      title: 'Customer Support',
      content: `If you encounter any issues or need assistance while using Fliq, please contact us through the following channels.

• Email: fliq.support@gmail.com
• Hours: Weekdays 10:00 AM – 6:00 PM KST (excluding public holidays)
• Response time: Within 1–2 business days of receipt`,
    },
    {
      title: 'Inquiry Types',
      content: `• Account: Sign-up, login, passkey authentication errors, account recovery
• Service usage: Creating/joining gatherings, recording expenses, settlement inquiries
• Payments: Registering payment methods, transfer integration inquiries
• Bug reports: App errors, display issues, feature malfunctions
• Other: Service improvement suggestions, general inquiries`,
    },
    {
      title: 'Information to Include in Your Inquiry',
      content: `To help us assist you more quickly, please include the following information in your message.

• Your registered email address
• The screen or feature where the issue occurred
• A description of the issue (with screenshots if possible)
• Your device and browser information`,
    },
    {
      title: 'Personal Data Requests',
      content: `To request access to, correction, deletion, or suspension of processing of your personal data, please email fliq.support@gmail.com.
Requests will be processed within 5 business days after identity verification.`,
    },
    {
      title: 'Service Information',
      content: `• Service name: Fliq
• Operator: Yeseong Oh
• Contact: fliq.support@gmail.com`,
    },
  ],
  notice: 'For support inquiries, please contact fliq.support@gmail.com.',
};
