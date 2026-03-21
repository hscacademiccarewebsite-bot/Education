export const LEGAL_PAGE_CONTENT = {
  en: {
    shared: {
      effectiveDateLabel: "Effective date",
      lastReviewedLabel: "Last reviewed",
      effectiveDate: "March 21, 2026",
      quickSummary: "Quick Summary",
      onThisPage: "On this page",
      contactTitle: "Need direct support?",
      contactDescription:
        "For admissions, billing, access issues, or account-specific help, please use the official support channels so the team can verify your records safely.",
      contactButton: "Contact Support",
      officialChannelsTitle: "Use official channels only",
      officialChannelsBody:
        "Do not share payment details, OTPs, passwords, or student records with unofficial accounts or personal inboxes.",
      relatedPages: "Related pages",
      faqTitle: "Frequently Asked Questions",
      faqDescription:
        "These are the most common operational questions students and guardians ask before contacting the team.",
      supportEmail: "Support email",
      supportPhone: "Support phone",
      supportFallback: "Use the Contact Us page for verified support.",
    },
    pages: {
      helpCenter: {
        eyebrow: "Support Center",
        title: "Help Center & FAQ",
        description:
          "Find clear answers about admissions, class access, payments, account issues, and support expectations before contacting the team.",
        coverage: "Admissions, classes, payments, account access, and operational support.",
        summary: [
          "Review course details, class mode, and fees before applying.",
          "Keep your phone, email, and payment information accurate in your account.",
          "Use official support channels for billing, access, and academic concerns.",
        ],
        sections: [
          {
            id: "admissions",
            title: "Admissions and enrollment support",
            paragraphs: [
              "Students should review the course scope, fee plan, class mode, and eligibility requirements before submitting an enrollment request. Approval may depend on seat availability, academic fit, and administrative review.",
              "If an application remains pending, students should wait for the official decision instead of submitting repeated applications for the same course.",
            ],
            bullets: [
              "Read the course description and payment terms carefully before applying.",
              "Use accurate guardian, phone, and email information.",
              "Make sure enrollment data matches the information used for payment and support requests.",
            ],
          },
          {
            id: "classes",
            title: "Classes, notes, and learning access",
            paragraphs: [
              "Course materials, classes, chapters, and notes are available according to the course structure and the student's approved access level. Some areas may remain unavailable until enrollment or payment requirements are completed.",
              "Students should regularly check the dashboard, notifications, and assigned course pages for updates about classes, materials, and academic instructions.",
            ],
            bullets: [
              "Use your registered account to access classes and learning materials.",
              "Do not share internal course links or paid resources outside the platform.",
              "If a lesson, chapter, or note appears missing, confirm enrollment status first and then contact support.",
            ],
          },
          {
            id: "payments",
            title: "Payments, dues, and verification",
            paragraphs: [
              "Monthly or course-based payments must be completed according to the approved plan for each batch or course. Access decisions may depend on successful payment verification.",
              "Students should keep screenshots, transaction details, and payment dates available in case the support team needs verification.",
            ],
            bullets: [
              "Always pay through approved methods announced by the institution.",
              "Do not submit the same payment claim multiple times unless support asks you to do so.",
              "Report duplicate charges or incorrect payment status through official support channels only.",
            ],
          },
          {
            id: "accounts",
            title: "Accounts, login, and security",
            paragraphs: [
              "Each student is responsible for protecting the login credentials associated with their account. Access may be restricted if suspicious activity, credential sharing, or misuse is detected.",
              "Community access, profile data, and academic records are tied to the logged-in account, so students should avoid using shared devices without logging out securely.",
            ],
            bullets: [
              "Use a strong password and keep it private.",
              "Log out from shared or public devices after each session.",
              "Contact support promptly if you suspect unauthorized account access.",
            ],
          },
          {
            id: "support",
            title: "Support expectations and escalation",
            paragraphs: [
              "Support is intended for admission guidance, access issues, billing follow-up, and platform-related operational help. Response time may vary based on office hours, workload, and the completeness of the student's submitted information.",
              "Students can often get faster support by sharing the correct course name, batch name, payment reference, and a clear description of the issue in the first message.",
            ],
            bullets: [
              "Write clear, specific questions when asking for help.",
              "Attach relevant screenshots only when needed.",
              "Use respectful communication with support staff and faculty members.",
            ],
          },
        ],
        faqs: [
          {
            question: "How do I enroll in a course?",
            answer:
              "Open the course page, review the fee structure and details, submit your enrollment request, and wait for approval from the academic or administrative team.",
          },
          {
            question: "Why can I not access some course materials yet?",
            answer:
              "Access may depend on enrollment approval, assigned course access, or payment verification. Check your dashboard first, then contact support if the issue remains.",
          },
          {
            question: "Can I access the community without logging in?",
            answer:
              "No. Community access is available only to signed-in users so the institution can keep discussions, notes, and profiles tied to verified accounts.",
          },
          {
            question: "What should I do if my payment status does not update?",
            answer:
              "Keep your payment proof and contact official support with the course name, payment date, amount, and any transaction reference so the team can verify it.",
          },
          {
            question: "Who should I contact for admission or support questions?",
            answer:
              "Use the official Contact Us page, verified phone number, email, or approved institution channels. Avoid sending sensitive information to unofficial accounts.",
          },
          {
            question: "Can I share paid materials or private links with friends?",
            answer:
              "No. Internal course materials, paid resources, and restricted access links are for authorized students only and must not be redistributed.",
          },
        ],
        related: ["studentGuidelines", "refundPolicy", "privacyPolicy"],
      },
      privacyPolicy: {
        eyebrow: "Legal Information",
        title: "Privacy Policy",
        description:
          "This policy explains what information we collect, why we use it, how we protect it, and what choices students and guardians have.",
        coverage: "Website usage, student accounts, enrollments, payments, support, and communication.",
        summary: [
          "We collect only the information needed to operate admissions, learning access, payments, and support.",
          "We use trusted service providers where necessary to host, secure, and deliver the platform.",
          "Students and guardians can contact the institution for correction or policy-related questions.",
        ],
        sections: [
          {
            id: "collection",
            title: "Information we collect",
            paragraphs: [
              "We may collect personal information such as student name, guardian information, phone number, email address, profile details, course interest, enrollment history, and learning activity necessary to operate the platform.",
              "We may also collect payment-related references, support messages, uploaded media, and technical data such as device information, browser details, logs, or usage activity that help maintain platform security and performance.",
            ],
            bullets: [
              "Account and profile information",
              "Enrollment, class, and academic workflow data",
              "Payment verification and billing records",
              "Support communication and technical usage data",
            ],
          },
          {
            id: "usage",
            title: "How we use information",
            paragraphs: [
              "Information is used to create and manage accounts, review enrollments, provide course access, track payments, send academic or operational updates, and respond to support requests.",
              "We also use relevant technical and behavioral information to improve reliability, prevent abuse, secure accounts, and maintain a safe learning environment.",
            ],
            bullets: [
              "To operate admissions, classes, payments, and support",
              "To verify user identity and protect accounts",
              "To communicate academic and administrative updates",
              "To improve service quality and platform reliability",
            ],
          },
          {
            id: "sharing",
            title: "How information may be shared",
            paragraphs: [
              "We do not sell student data. Information may be shared only when reasonably necessary with trusted service providers who support hosting, cloud storage, authentication, email delivery, media handling, analytics, or technical operations for the platform.",
              "Information may also be disclosed when required by law, to protect institutional rights, to investigate abuse, or to resolve verified payment or security incidents.",
            ],
            bullets: [
              "Shared only for operational, security, or legal reasons",
              "Limited to approved providers and verified administrative workflows",
              "Not sold for third-party advertising purposes",
            ],
          },
          {
            id: "communications",
            title: "Notifications, cookies, and communication",
            paragraphs: [
              "We may send emails, dashboard notifications, or operational messages related to admission, payment, course access, announcements, or support follow-up.",
              "The platform may also use cookies or similar technologies to maintain sessions, remember settings, measure performance, and improve user experience.",
            ],
            bullets: [
              "Session and login continuity",
              "Operational updates and support follow-up",
              "Performance and usability improvements",
            ],
          },
          {
            id: "security",
            title: "Security and data retention",
            paragraphs: [
              "We apply reasonable administrative and technical measures to protect student information, but no internet-based system can guarantee absolute security.",
              "Information is retained for as long as needed to operate courses, maintain records, resolve disputes, comply with obligations, or support institutional continuity.",
            ],
            bullets: [
              "Account protection and access control measures",
              "Retention based on academic, operational, and legal needs",
              "Security review and incident response when necessary",
            ],
          },
          {
            id: "rights",
            title: "Student and guardian rights",
            paragraphs: [
              "Students and guardians may request correction of inaccurate information or ask policy-related questions through official support channels. Certain requests may depend on account verification and institutional record requirements.",
              "If account closure or data removal is requested, some records may still be retained where needed for payment history, academic administration, fraud prevention, or legal compliance.",
            ],
            bullets: [
              "Request correction of inaccurate data",
              "Ask how information is used for operational purposes",
              "Seek clarification before submitting sensitive documents or payment proof",
            ],
          },
          {
            id: "updates",
            title: "Policy updates",
            paragraphs: [
              "This policy may be updated when platform features, legal expectations, institutional operations, or service providers change. Updated versions become effective when posted on the website.",
              "Students should review this page periodically, especially before submitting new information, enrollment requests, or payment details.",
            ],
          },
        ],
        related: ["termsOfService", "studentGuidelines", "helpCenter"],
      },
      termsOfService: {
        eyebrow: "Legal Information",
        title: "Terms of Service",
        description:
          "These terms describe the rules for using the website, student dashboard, learning tools, support channels, and related institutional services.",
        coverage: "Accounts, enrollments, payments, content usage, conduct, and service availability.",
        summary: [
          "Using the platform means you agree to follow institutional rules, payment conditions, and acceptable conduct standards.",
          "Students are responsible for accurate information, secure account usage, and respectful participation.",
          "The institution may limit or suspend access when misuse, fraud, or serious policy violations occur.",
        ],
        sections: [
          {
            id: "acceptance",
            title: "Acceptance and service scope",
            paragraphs: [
              "By accessing or using this website, students, guardians, and visitors agree to these terms and any related policies published on the platform.",
              "The platform supports admissions, academic content delivery, payments, communication, and student operations. Specific features may change over time as the institution updates its services.",
            ],
          },
          {
            id: "accounts",
            title: "Accounts and eligibility",
            paragraphs: [
              "Users must provide accurate information during registration, profile completion, enrollment, and support communication. The institution may request clarification if submitted data appears incomplete, misleading, or inconsistent.",
              "Each account is intended for the registered user only. Sharing access, impersonation, or using another person's identity is not allowed.",
            ],
            bullets: [
              "Provide truthful and current information",
              "Maintain the confidentiality of your login credentials",
              "Use the account only for legitimate academic and administrative purposes",
            ],
          },
          {
            id: "enrollments",
            title: "Enrollments, fees, and access",
            paragraphs: [
              "Course enrollment, approval, and access depend on institutional review, capacity, eligibility, and payment status. Submitting a request does not guarantee acceptance into a batch or course.",
              "Fees, due dates, access conditions, and renewal obligations may differ by program and are determined by the institution's published structure or direct communication.",
            ],
            bullets: [
              "Enrollment approval remains subject to institutional review",
              "Payment obligations must be completed on time",
              "Access may be paused or limited when required dues remain unresolved",
            ],
          },
          {
            id: "content",
            title: "Learning content and intellectual property",
            paragraphs: [
              "Classes, videos, notes, documents, designs, branding, and platform materials are provided for authorized educational use only. They remain protected by institutional rights and applicable law.",
              "Students may not copy, resell, redistribute, record, or publish restricted materials without written permission from the institution.",
            ],
            bullets: [
              "Personal study use only unless explicit permission is granted",
              "No unauthorized sharing of paid or protected content",
              "No misuse of logos, course identity, or platform assets",
            ],
          },
          {
            id: "conduct",
            title: "Acceptable use and conduct",
            paragraphs: [
              "Users must behave respectfully toward staff, faculty, students, and community members. Harassment, threats, hate speech, spam, fraud, abuse, and academic disruption are prohibited.",
              "The institution may monitor misuse reports and take action when behavior harms platform safety, academic integrity, or institutional operations.",
            ],
            bullets: [
              "Communicate respectfully and truthfully",
              "Do not attempt unauthorized access to accounts, data, or systems",
              "Do not use the platform to spread harmful, illegal, or deceptive content",
            ],
          },
          {
            id: "suspension",
            title: "Suspension, termination, and restrictions",
            paragraphs: [
              "The institution may suspend, restrict, or terminate access when accounts violate policy, misuse resources, create payment disputes, or pose operational or security risks.",
              "Where appropriate, the institution may also remove content, reject enrollments, limit community access, or require additional verification before restoring access.",
            ],
          },
          {
            id: "service",
            title: "Service changes and limitations",
            paragraphs: [
              "The institution may update course structures, schedules, instructors, platform features, or support workflows as needed for academic and operational reasons.",
              "While the platform is maintained with care, uninterrupted availability cannot be guaranteed at all times due to maintenance, third-party issues, internet disruption, or operational constraints.",
            ],
          },
          {
            id: "updates",
            title: "Updates to these terms",
            paragraphs: [
              "These terms may be revised from time to time. Continued use of the platform after updated terms are posted means the user accepts the revised version.",
            ],
          },
        ],
        related: ["privacyPolicy", "refundPolicy", "studentGuidelines"],
      },
      studentGuidelines: {
        eyebrow: "Student Success",
        title: "Student Guidelines",
        description:
          "These guidelines set expectations for discipline, learning behavior, communication, digital conduct, and administrative responsibility across the platform.",
        coverage: "Classroom discipline, assignments, community conduct, payments, communication, and account responsibility.",
        summary: [
          "Show consistency, discipline, and respect in all academic interactions.",
          "Follow instructions, schedules, and payment expectations on time.",
          "Use community, class, and support spaces responsibly and professionally.",
        ],
        sections: [
          {
            id: "discipline",
            title: "Academic discipline and punctuality",
            paragraphs: [
              "Students should attend classes on time, stay prepared, and maintain a serious approach to study. Regularity and discipline are essential for long-term academic performance.",
              "Missing repeated classes, ignoring instructions, or staying inactive for long periods may weaken academic progress and reduce the benefit of mentorship.",
            ],
            bullets: [
              "Join scheduled classes and complete assigned work regularly",
              "Keep track of notices, exams, and academic deadlines",
              "Ask for clarification early instead of waiting until problems grow",
            ],
          },
          {
            id: "classroom",
            title: "Behavior in classes and academic spaces",
            paragraphs: [
              "Students should respect teachers, moderators, staff, and classmates during live classes, recorded sessions, comments, and support interactions.",
              "Disruptive behavior, mocking others, repeated interruptions, abusive language, or off-topic disturbances are not acceptable.",
            ],
            bullets: [
              "Use respectful language in every academic space",
              "Keep class discussion focused and constructive",
              "Follow instructions given by teachers and academic moderators",
            ],
          },
          {
            id: "integrity",
            title: "Assignments, exams, and academic integrity",
            paragraphs: [
              "Students are expected to complete assignments, tests, and submissions honestly. Copying, cheating, impersonation, or falsifying academic work damages trust and learning outcomes.",
              "When academic performance is weak, students should ask for guidance rather than misrepresenting their work.",
            ],
            bullets: [
              "Submit original work whenever required",
              "Avoid unfair collaboration or dishonest exam behavior",
              "Use feedback to improve performance step by step",
            ],
          },
          {
            id: "digital",
            title: "Responsible digital and community conduct",
            paragraphs: [
              "The platform's community, notes, and communication spaces are extensions of the learning environment. Students should share helpful, educational, and respectful content only.",
              "Misuse such as spam, personal attacks, rumor spreading, harassment, or unauthorized sharing of private materials may lead to content removal or account restrictions.",
            ],
            bullets: [
              "Share useful academic content and clear questions",
              "Protect private course resources and student information",
              "Avoid posting misleading, abusive, or harmful material",
            ],
          },
          {
            id: "administration",
            title: "Payments and administrative cooperation",
            paragraphs: [
              "Students should complete dues on time, follow payment instructions carefully, and provide accurate information when support requests depend on billing review.",
              "Administrative delays often happen when names, course references, or payment details do not match submitted records.",
            ],
            bullets: [
              "Follow the announced payment process exactly",
              "Keep payment proof until status is confirmed",
              "Cooperate respectfully with verification requests",
            ],
          },
          {
            id: "readiness",
            title: "Device readiness and self-management",
            paragraphs: [
              "Students should maintain access to a usable device, stable internet when needed, and the habit of checking academic updates regularly.",
              "The platform can guide students effectively, but progress also depends on attention, consistency, revision, and personal responsibility.",
            ],
            bullets: [
              "Keep login access available and secure",
              "Check announcements, dashboard notices, and assigned materials frequently",
              "Take ownership of revision, practice, and follow-up questions",
            ],
          },
          {
            id: "escalation",
            title: "When problems arise",
            paragraphs: [
              "If a student faces access issues, payment confusion, class concerns, or misconduct from others, the matter should be reported through official support channels with a calm, clear explanation.",
              "Escalation works best when students provide the correct course name, date, screenshot, and short summary of the issue.",
            ],
          },
        ],
        related: ["helpCenter", "termsOfService", "privacyPolicy"],
      },
      refundPolicy: {
        eyebrow: "Billing Policy",
        title: "Refund Policy",
        description:
          "This policy explains when refund requests may be considered, which situations are usually non-refundable, and how approved refunds are processed.",
        coverage: "Duplicate payments, rejected enrollments, cancelled delivery, and verified billing errors.",
        summary: [
          "Refund approval depends on payment status, course access status, and the reason for the request.",
          "Digital learning services that have already been delivered are generally non-refundable unless a verified institutional error exists.",
          "Approved refunds are typically processed through the original payment route where possible.",
        ],
        sections: [
          {
            id: "principle",
            title: "General refund principle",
            paragraphs: [
              "Because the platform delivers digital access, academic planning, and operational support, refund requests are reviewed case by case rather than being granted automatically.",
              "Submitting a refund request does not guarantee approval. The institution may ask for payment proof, account verification, course details, and the reason for the request before making a decision.",
            ],
          },
          {
            id: "eligible",
            title: "Cases where a refund may be considered",
            paragraphs: [
              "A refund may be considered when there is a verified duplicate payment, an administrative rejection after payment collection, a cancelled program that cannot be reasonably delivered, or a confirmed billing error caused by the institution.",
            ],
            bullets: [
              "Duplicate or excess payment confirmed by records",
              "Enrollment rejected after an eligible fee was already collected",
              "Course or service cancelled by the institution without a workable alternative",
              "Clear operational or billing error verified by the institution",
            ],
          },
          {
            id: "nonrefundable",
            title: "Cases that are usually non-refundable",
            paragraphs: [
              "Refunds are generally not available when a student changes their mind after access has been granted, fails to attend classes, remains inactive, or does not use the resources already made available.",
              "Requests based on schedule preference, personal circumstance, late participation, incomplete understanding of the course after joining, or failure to follow instructions are usually not treated as refundable events.",
            ],
            bullets: [
              "Change of mind after access or materials have been delivered",
              "Absence, inactivity, or failure to attend classes",
              "Requests made after substantial academic use has already taken place",
              "Issues caused by incorrect information submitted by the student",
            ],
          },
          {
            id: "process",
            title: "How to request a refund review",
            paragraphs: [
              "Students should contact official support with the course name, payment date, amount, transaction reference, and a concise explanation of the request. Incomplete requests may delay review.",
              "The institution may review platform records, support history, enrollment status, and delivery status before issuing a final decision.",
            ],
            bullets: [
              "Use official support channels only",
              "Share complete payment and course information",
              "Wait for the institution's review outcome before escalating further",
            ],
          },
          {
            id: "timeline",
            title: "Review and payout timeline",
            paragraphs: [
              "If a refund is approved, processing time may vary depending on the payment method, provider timelines, and verification requirements. Reasonable administrative processing time should be expected.",
              "Where possible, approved refunds are returned through the original payment source. If that is not possible, the institution may use an alternate verified method.",
            ],
          },
          {
            id: "deductions",
            title: "Deductions and final decisions",
            paragraphs: [
              "Where legally or operationally necessary, transaction charges, transfer fees, or value already delivered may be deducted from an approved refund amount.",
              "Refund decisions are made based on records, course status, service usage, and institutional review. The institution's final verified decision applies unless a different remedy is required by law.",
            ],
          },
        ],
        related: ["helpCenter", "termsOfService", "privacyPolicy"],
      },
    },
  },
  bn: {
    shared: {
      effectiveDateLabel: "কার্যকর তারিখ",
      lastReviewedLabel: "সর্বশেষ পর্যালোচনা",
      effectiveDate: "২১ মার্চ ২০২৬",
      quickSummary: "দ্রুত সারসংক্ষেপ",
      onThisPage: "এই পেজে",
      contactTitle: "সরাসরি সহায়তা দরকার?",
      contactDescription:
        "ভর্তি, বিলিং, এক্সেস সমস্যা বা অ্যাকাউন্ট-সংক্রান্ত সহায়তার জন্য অফিসিয়াল সাপোর্ট ব্যবহার করুন, যাতে টিম নিরাপদভাবে আপনার রেকর্ড যাচাই করতে পারে।",
      contactButton: "সাপোর্টে যোগাযোগ করুন",
      officialChannelsTitle: "শুধু অফিসিয়াল চ্যানেল ব্যবহার করুন",
      officialChannelsBody:
        "অননুমোদিত অ্যাকাউন্ট বা ব্যক্তিগত ইনবক্সে পেমেন্ট তথ্য, OTP, পাসওয়ার্ড বা শিক্ষার্থীর ব্যক্তিগত রেকর্ড শেয়ার করবেন না।",
      relatedPages: "সম্পর্কিত পেজ",
      faqTitle: "সাধারণ জিজ্ঞাসা",
      faqDescription:
        "টিমের সাথে যোগাযোগের আগে শিক্ষার্থী ও অভিভাবকেরা সবচেয়ে বেশি যেসব অপারেশনাল প্রশ্ন করেন, সেগুলোর উত্তর এখানে দেওয়া আছে।",
      supportEmail: "সাপোর্ট ইমেইল",
      supportPhone: "সাপোর্ট ফোন",
      supportFallback: "ভেরিফায়েড সহায়তার জন্য Contact Us পেজ ব্যবহার করুন।",
    },
    pages: {
      helpCenter: {
        eyebrow: "সাপোর্ট সেন্টার",
        title: "হেল্প সেন্টার ও FAQ",
        description:
          "ভর্তি, ক্লাস এক্সেস, পেমেন্ট, অ্যাকাউন্ট সমস্যা এবং সাপোর্ট প্রক্রিয়া সম্পর্কে পরিষ্কার উত্তর এখানে পাবেন।",
        coverage: "ভর্তি, ক্লাস, পেমেন্ট, অ্যাকাউন্ট এক্সেস এবং অপারেশনাল সাপোর্ট।",
        summary: [
          "আবেদন করার আগে কোর্সের বিস্তারিত, ক্লাস মোড এবং ফি দেখে নিন।",
          "আপনার অ্যাকাউন্টে ফোন, ইমেইল ও পেমেন্ট তথ্য সঠিক রাখুন।",
          "বিলিং, এক্সেস এবং একাডেমিক সমস্যার জন্য অফিসিয়াল সাপোর্ট ব্যবহার করুন।",
        ],
        sections: [
          {
            id: "admissions",
            title: "ভর্তি ও এনরোলমেন্ট সহায়তা",
            paragraphs: [
              "এনরোলমেন্ট রিকোয়েস্ট দেওয়ার আগে শিক্ষার্থীদের কোর্সের পরিধি, ফি প্ল্যান, ক্লাস মোড এবং যোগ্যতার শর্ত দেখে নেওয়া উচিত। অনুমোদন সিটের প্রাপ্যতা, একাডেমিক উপযুক্ততা এবং প্রশাসনিক রিভিউয়ের উপর নির্ভর করতে পারে।",
              "কোনো আবেদন পেন্ডিং থাকলে একই কোর্সে বারবার নতুন আবেদন না করে অফিসিয়াল সিদ্ধান্তের জন্য অপেক্ষা করা উচিত।",
            ],
            bullets: [
              "আবেদন করার আগে কোর্সের বিবরণ ও পেমেন্ট শর্ত ভালোভাবে পড়ুন।",
              "সঠিক অভিভাবক, ফোন এবং ইমেইল তথ্য ব্যবহার করুন।",
              "এনরোলমেন্ট, পেমেন্ট এবং সাপোর্টে ব্যবহৃত তথ্য একে অপরের সাথে মিলিয়ে দিন।",
            ],
          },
          {
            id: "classes",
            title: "ক্লাস, নোটস এবং লার্নিং এক্সেস",
            paragraphs: [
              "কোর্স ম্যাটেরিয়াল, ক্লাস, চ্যাপ্টার এবং নোটস শিক্ষার্থীর অনুমোদিত এক্সেস লেভেল এবং কোর্স স্ট্রাকচার অনুযায়ী পাওয়া যায়। এনরোলমেন্ট বা পেমেন্ট সম্পূর্ণ না হলে কিছু অংশ সাময়িকভাবে বন্ধ থাকতে পারে।",
              "ক্লাস, ম্যাটেরিয়াল এবং একাডেমিক আপডেটের জন্য শিক্ষার্থীদের নিয়মিত ড্যাশবোর্ড, নোটিফিকেশন এবং অ্যাসাইন করা কোর্স পেজ দেখতে হবে।",
            ],
            bullets: [
              "নিজের রেজিস্টার্ড অ্যাকাউন্ট ব্যবহার করে ক্লাস ও ম্যাটেরিয়াল দেখুন।",
              "ইন্টারনাল কোর্স লিংক বা পেইড রিসোর্স প্ল্যাটফর্মের বাইরে শেয়ার করবেন না।",
              "কোনো লেসন বা নোটস না দেখালে আগে এনরোলমেন্ট স্ট্যাটাস যাচাই করুন, তারপর সাপোর্টে জানান।",
            ],
          },
          {
            id: "payments",
            title: "পেমেন্ট, ডিউ এবং ভেরিফিকেশন",
            paragraphs: [
              "প্রতিটি ব্যাচ বা কোর্সের অনুমোদিত প্ল্যান অনুযায়ী মাসিক বা কোর্সভিত্তিক পেমেন্ট সম্পন্ন করতে হবে। এক্সেস সিদ্ধান্ত সফল পেমেন্ট ভেরিফিকেশনের উপর নির্ভর করতে পারে।",
              "প্রয়োজনে যাচাইয়ের জন্য শিক্ষার্থীদের পেমেন্ট স্ক্রিনশট, ট্রানজ্যাকশন তথ্য এবং তারিখ সংরক্ষণ করে রাখা উচিত।",
            ],
            bullets: [
              "শুধু প্রতিষ্ঠানের অনুমোদিত মাধ্যমে পেমেন্ট করুন।",
              "সাপোর্ট না বললে একই পেমেন্ট ক্লেইম বারবার সাবমিট করবেন না।",
              "ডুপ্লিকেট চার্জ বা ভুল পেমেন্ট স্ট্যাটাস হলে শুধু অফিসিয়াল সাপোর্টে রিপোর্ট করুন।",
            ],
          },
          {
            id: "accounts",
            title: "অ্যাকাউন্ট, লগইন এবং নিরাপত্তা",
            paragraphs: [
              "প্রতিটি শিক্ষার্থী তার অ্যাকাউন্টের লগইন তথ্য নিরাপদ রাখার জন্য নিজেই দায়িত্বশীল। সন্দেহজনক কার্যকলাপ, ক্রেডেনশিয়াল শেয়ারিং বা অপব্যবহার ধরা পড়লে এক্সেস সীমিত হতে পারে।",
              "কমিউনিটি এক্সেস, প্রোফাইল ডেটা এবং একাডেমিক রেকর্ড লগইনকৃত অ্যাকাউন্টের সাথে সংযুক্ত থাকে, তাই শেয়ারড ডিভাইস ব্যবহার করলে অবশ্যই নিরাপদভাবে লগআউট করতে হবে।",
            ],
            bullets: [
              "শক্তিশালী পাসওয়ার্ড ব্যবহার করুন এবং গোপন রাখুন।",
              "শেয়ারড বা পাবলিক ডিভাইস থেকে কাজ শেষে লগআউট করুন।",
              "অ্যাকাউন্টে অননুমোদিত প্রবেশের সন্দেহ হলে দ্রুত সাপোর্টে জানান।",
            ],
          },
          {
            id: "support",
            title: "সাপোর্ট প্রত্যাশা ও এসকেলেশন",
            paragraphs: [
              "সাপোর্ট মূলত ভর্তি নির্দেশনা, এক্সেস সমস্যা, বিলিং ফলো-আপ এবং প্ল্যাটফর্ম-সংক্রান্ত সহায়তার জন্য। অফিস আওয়ার, কাজের চাপ এবং পাঠানো তথ্যের সম্পূর্ণতার উপর রেসপন্স টাইম ভিন্ন হতে পারে।",
              "প্রথম মেসেজেই সঠিক কোর্স নাম, ব্যাচ নাম, পেমেন্ট রেফারেন্স এবং সমস্যার পরিষ্কার বর্ণনা দিলে দ্রুত সহায়তা পাওয়া সহজ হয়।",
            ],
            bullets: [
              "সহায়তা চাইলে পরিষ্কার ও নির্দিষ্ট প্রশ্ন লিখুন।",
              "প্রয়োজন হলে তবেই প্রাসঙ্গিক স্ক্রিনশট দিন।",
              "সাপোর্ট স্টাফ ও শিক্ষকদের সাথে শ্রদ্ধাশীল আচরণ করুন।",
            ],
          },
        ],
        faqs: [
          {
            question: "আমি কীভাবে একটি কোর্সে এনরোল করব?",
            answer:
              "কোর্স পেজ খুলে ফি ও বিস্তারিত দেখে এনরোলমেন্ট রিকোয়েস্ট দিন, তারপর একাডেমিক বা প্রশাসনিক টিমের অনুমোদনের জন্য অপেক্ষা করুন।",
          },
          {
            question: "কেন আমি এখনো কিছু কোর্স ম্যাটেরিয়াল দেখতে পাচ্ছি না?",
            answer:
              "এনরোলমেন্ট অনুমোদন, অ্যাসাইন করা কোর্স এক্সেস বা পেমেন্ট ভেরিফিকেশনের উপর এক্সেস নির্ভর করতে পারে। আগে ড্যাশবোর্ড দেখুন, তারপরও সমস্যা থাকলে সাপোর্টে জানান।",
          },
          {
            question: "লগইন ছাড়া কি কমিউনিটি ব্যবহার করা যাবে?",
            answer:
              "না। কমিউনিটি শুধু লগইন করা ব্যবহারকারীদের জন্য, যাতে আলোচনা, নোটস এবং প্রোফাইল ভেরিফায়েড অ্যাকাউন্টের সাথে যুক্ত থাকে।",
          },
          {
            question: "আমার পেমেন্ট স্ট্যাটাস আপডেট না হলে কী করব?",
            answer:
              "পেমেন্ট প্রুফ সংরক্ষণ করুন এবং কোর্স নাম, পেমেন্ট তারিখ, পরিমাণ ও ট্রানজ্যাকশন রেফারেন্সসহ অফিসিয়াল সাপোর্টে জানান।",
          },
          {
            question: "ভর্তি বা সাপোর্টের জন্য কাদের সাথে যোগাযোগ করব?",
            answer:
              "Contact Us পেজ, ভেরিফায়েড ফোন নম্বর, ইমেইল বা প্রতিষ্ঠানের অনুমোদিত চ্যানেল ব্যবহার করুন। অননুমোদিত অ্যাকাউন্টে সংবেদনশীল তথ্য পাঠাবেন না।",
          },
          {
            question: "আমি কি পেইড ম্যাটেরিয়াল বা প্রাইভেট লিংক অন্যদের সাথে শেয়ার করতে পারব?",
            answer:
              "না। ইন্টারনাল কোর্স ম্যাটেরিয়াল, পেইড রিসোর্স এবং সীমিত এক্সেস লিংক শুধু অনুমোদিত শিক্ষার্থীদের জন্য।",
          },
        ],
        related: ["studentGuidelines", "refundPolicy", "privacyPolicy"],
      },
      privacyPolicy: {
        eyebrow: "লিগ্যাল তথ্য",
        title: "প্রাইভেসি পলিসি",
        description:
          "আমরা কী তথ্য সংগ্রহ করি, কেন ব্যবহার করি, কীভাবে সুরক্ষিত রাখি এবং শিক্ষার্থী ও অভিভাবকের কী কী অধিকার আছে, তা এই নীতিতে ব্যাখ্যা করা হয়েছে।",
        coverage: "ওয়েবসাইট ব্যবহার, শিক্ষার্থী অ্যাকাউন্ট, এনরোলমেন্ট, পেমেন্ট, সাপোর্ট এবং যোগাযোগ।",
        summary: [
          "ভর্তি, লার্নিং এক্সেস, পেমেন্ট ও সাপোর্ট চালাতে যতটুকু প্রয়োজন ততটুকু তথ্যই সংগ্রহ করা হয়।",
          "প্ল্যাটফর্ম পরিচালনা, নিরাপত্তা ও ডেলিভারির জন্য প্রয়োজন হলে বিশ্বস্ত সার্ভিস প্রোভাইডার ব্যবহার করা হয়।",
          "তথ্য সংশোধন বা নীতি-সংক্রান্ত প্রশ্নের জন্য শিক্ষার্থী ও অভিভাবক প্রতিষ্ঠানকে যোগাযোগ করতে পারবেন।",
        ],
        sections: [
          {
            id: "collection",
            title: "আমরা কী তথ্য সংগ্রহ করি",
            paragraphs: [
              "প্ল্যাটফর্ম পরিচালনার প্রয়োজন অনুযায়ী আমরা শিক্ষার্থীর নাম, অভিভাবকের তথ্য, ফোন নম্বর, ইমেইল, প্রোফাইল তথ্য, কোর্স আগ্রহ, এনরোলমেন্ট ইতিহাস এবং প্রয়োজনীয় লার্নিং অ্যাক্টিভিটি সংগ্রহ করতে পারি।",
              "এছাড়া পেমেন্ট-সংক্রান্ত রেফারেন্স, সাপোর্ট মেসেজ, আপলোড করা মিডিয়া এবং ডিভাইস তথ্য, ব্রাউজার, লগ বা ব্যবহারিক আচরণ সম্পর্কিত টেকনিক্যাল ডেটাও সংগ্রহ হতে পারে, যা নিরাপত্তা ও পারফরম্যান্স বজায় রাখতে সহায়তা করে।",
            ],
            bullets: [
              "অ্যাকাউন্ট ও প্রোফাইল তথ্য",
              "এনরোলমেন্ট, ক্লাস এবং একাডেমিক ওয়ার্কফ্লো ডেটা",
              "পেমেন্ট ভেরিফিকেশন ও বিলিং রেকর্ড",
              "সাপোর্ট যোগাযোগ ও টেকনিক্যাল ব্যবহার তথ্য",
            ],
          },
          {
            id: "usage",
            title: "তথ্য কীভাবে ব্যবহার করা হয়",
            paragraphs: [
              "তথ্য ব্যবহার করা হয় অ্যাকাউন্ট তৈরি ও পরিচালনা, এনরোলমেন্ট রিভিউ, কোর্স এক্সেস প্রদান, পেমেন্ট ট্র্যাকিং, একাডেমিক বা অপারেশনাল আপডেট পাঠানো এবং সাপোর্ট রিকোয়েস্টের উত্তর দেওয়ার জন্য।",
              "নিরাপত্তা জোরদার, অপব্যবহার রোধ, অ্যাকাউন্ট সুরক্ষা এবং সেবা উন্নত করার জন্য প্রয়োজনীয় টেকনিক্যাল ও বিহেভিয়ারাল তথ্যও ব্যবহৃত হয়।",
            ],
            bullets: [
              "ভর্তি, ক্লাস, পেমেন্ট ও সাপোর্ট পরিচালনার জন্য",
              "ব্যবহারকারীর পরিচয় যাচাই ও অ্যাকাউন্ট সুরক্ষার জন্য",
              "একাডেমিক ও প্রশাসনিক আপডেট পাঠানোর জন্য",
              "সেবার মান ও প্ল্যাটফর্মের নির্ভরযোগ্যতা বাড়ানোর জন্য",
            ],
          },
          {
            id: "sharing",
            title: "তথ্য কীভাবে শেয়ার হতে পারে",
            paragraphs: [
              "আমরা শিক্ষার্থীর তথ্য বিক্রি করি না। তবে হোস্টিং, ক্লাউড স্টোরেজ, অথেনটিকেশন, ইমেইল ডেলিভারি, মিডিয়া হ্যান্ডলিং, অ্যানালিটিক্স বা টেকনিক্যাল অপারেশনে সহায়তাকারী বিশ্বস্ত সার্ভিস প্রোভাইডারের সাথে যৌক্তিক প্রয়োজন অনুযায়ী সীমিত তথ্য শেয়ার হতে পারে।",
              "আইনগত প্রয়োজন, প্রতিষ্ঠানের অধিকার রক্ষা, অপব্যবহার তদন্ত বা ভেরিফায়েড পেমেন্ট ও নিরাপত্তা সমস্যার সমাধানের ক্ষেত্রেও তথ্য শেয়ার হতে পারে।",
            ],
            bullets: [
              "শুধু অপারেশনাল, নিরাপত্তা বা আইনগত প্রয়োজনে শেয়ার করা হয়",
              "অনুমোদিত প্রোভাইডার ও ভেরিফায়েড প্রশাসনিক ওয়ার্কফ্লো পর্যন্ত সীমিত থাকে",
              "তৃতীয় পক্ষের বিজ্ঞাপনের জন্য বিক্রি করা হয় না",
            ],
          },
          {
            id: "communications",
            title: "নোটিফিকেশন, কুকিজ এবং যোগাযোগ",
            paragraphs: [
              "ভর্তি, পেমেন্ট, কোর্স এক্সেস, ঘোষণা বা সাপোর্ট ফলো-আপের জন্য আমরা ইমেইল, ড্যাশবোর্ড নোটিফিকেশন বা অপারেশনাল বার্তা পাঠাতে পারি।",
              "সেশন বজায় রাখা, সেটিংস মনে রাখা, পারফরম্যান্স পরিমাপ এবং ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে কুকিজ বা অনুরূপ প্রযুক্তি ব্যবহার হতে পারে।",
            ],
            bullets: [
              "সেশন ও লগইন ধারাবাহিকতা",
              "অপারেশনাল আপডেট ও সাপোর্ট ফলো-আপ",
              "পারফরম্যান্স এবং ব্যবহারযোগ্যতা উন্নয়ন",
            ],
          },
          {
            id: "security",
            title: "নিরাপত্তা এবং তথ্য সংরক্ষণ",
            paragraphs: [
              "শিক্ষার্থীর তথ্য রক্ষায় আমরা যুক্তিসঙ্গত প্রশাসনিক ও টেকনিক্যাল ব্যবস্থা গ্রহণ করি, তবে ইন্টারনেটভিত্তিক কোনো সিস্টেমই শতভাগ নিরাপত্তা নিশ্চিত করতে পারে না।",
              "কোর্স পরিচালনা, রেকর্ড সংরক্ষণ, বিরোধ নিষ্পত্তি, আইনি বাধ্যবাধকতা এবং প্রাতিষ্ঠানিক ধারাবাহিকতার প্রয়োজন অনুযায়ী তথ্য সংরক্ষণ করা হতে পারে।",
            ],
            bullets: [
              "অ্যাকাউন্ট সুরক্ষা ও এক্সেস কন্ট্রোল ব্যবস্থা",
              "একাডেমিক, অপারেশনাল ও আইনগত প্রয়োজনভিত্তিক রিটেনশন",
              "প্রয়োজনে নিরাপত্তা পর্যালোচনা ও ইনসিডেন্ট রেসপন্স",
            ],
          },
          {
            id: "rights",
            title: "শিক্ষার্থী ও অভিভাবকের অধিকার",
            paragraphs: [
              "শিক্ষার্থী ও অভিভাবকেরা ভুল তথ্য সংশোধনের অনুরোধ করতে পারেন অথবা অফিসিয়াল সাপোর্টে নীতি-সংক্রান্ত প্রশ্ন করতে পারেন। কিছু অনুরোধ অ্যাকাউন্ট ভেরিফিকেশন ও প্রাতিষ্ঠানিক রেকর্ডের শর্তের উপর নির্ভর করবে।",
              "অ্যাকাউন্ট ক্লোজার বা ডেটা রিমুভালের অনুরোধ করা হলেও পেমেন্ট ইতিহাস, একাডেমিক প্রশাসন, জালিয়াতি প্রতিরোধ বা আইনি প্রয়োজনের জন্য কিছু রেকর্ড রাখা হতে পারে।",
            ],
            bullets: [
              "ভুল তথ্য সংশোধনের অনুরোধ করা",
              "তথ্য কীভাবে অপারেশনাল কাজে ব্যবহৃত হয় তা জানতে চাওয়া",
              "সংবেদনশীল ডকুমেন্ট বা পেমেন্ট প্রুফ পাঠানোর আগে পরিষ্কার নির্দেশনা নেওয়া",
            ],
          },
          {
            id: "updates",
            title: "নীতি আপডেট",
            paragraphs: [
              "প্ল্যাটফর্ম ফিচার, আইনগত প্রত্যাশা, প্রাতিষ্ঠানিক অপারেশন বা সার্ভিস প্রোভাইডার পরিবর্তিত হলে এই নীতি আপডেট করা হতে পারে। ওয়েবসাইটে প্রকাশের পর নতুন সংস্করণ কার্যকর হবে।",
              "বিশেষ করে নতুন তথ্য, এনরোলমেন্ট রিকোয়েস্ট বা পেমেন্ট তথ্য জমা দেওয়ার আগে শিক্ষার্থীদের এই পেজটি সময় সময় দেখে নেওয়া উচিত।",
            ],
          },
        ],
        related: ["termsOfService", "studentGuidelines", "helpCenter"],
      },
      termsOfService: {
        eyebrow: "লিগ্যাল তথ্য",
        title: "সেবার শর্তাবলি",
        description:
          "ওয়েবসাইট, শিক্ষার্থী ড্যাশবোর্ড, লার্নিং টুলস, সাপোর্ট চ্যানেল এবং সংশ্লিষ্ট প্রাতিষ্ঠানিক সেবা ব্যবহারের নিয়ম এই শর্তাবলিতে বর্ণনা করা হয়েছে।",
        coverage: "অ্যাকাউন্ট, এনরোলমেন্ট, পেমেন্ট, কনটেন্ট ব্যবহার, আচরণ এবং সেবা প্রাপ্যতা।",
        summary: [
          "প্ল্যাটফর্ম ব্যবহার মানে আপনি প্রাতিষ্ঠানিক নিয়ম, পেমেন্ট শর্ত এবং গ্রহণযোগ্য আচরণবিধি মেনে চলতে সম্মত হচ্ছেন।",
          "সঠিক তথ্য প্রদান, নিরাপদ অ্যাকাউন্ট ব্যবহার এবং শ্রদ্ধাশীল অংশগ্রহণের দায়িত্ব শিক্ষার্থীর নিজের।",
          "অপব্যবহার, জালিয়াতি বা গুরুতর নীতি ভঙ্গ হলে প্রতিষ্ঠান এক্সেস সীমিত বা স্থগিত করতে পারে।",
        ],
        sections: [
          {
            id: "acceptance",
            title: "গ্রহণযোগ্যতা ও সেবার পরিধি",
            paragraphs: [
              "এই ওয়েবসাইট ব্যবহার করলে শিক্ষার্থী, অভিভাবক এবং ভিজিটররা এই শর্তাবলি এবং প্ল্যাটফর্মে প্রকাশিত অন্যান্য প্রাসঙ্গিক নীতির সাথে সম্মত হয়েছেন বলে ধরা হবে।",
              "প্ল্যাটফর্ম ভর্তি, একাডেমিক কনটেন্ট ডেলিভারি, পেমেন্ট, যোগাযোগ এবং শিক্ষার্থী ব্যবস্থাপনা সহায়তা করে। প্রতিষ্ঠান প্রয়োজন অনুযায়ী সময়ের সাথে কিছু ফিচার পরিবর্তন করতে পারে।",
            ],
          },
          {
            id: "accounts",
            title: "অ্যাকাউন্ট ও যোগ্যতা",
            paragraphs: [
              "রেজিস্ট্রেশন, প্রোফাইল সম্পূর্ণকরণ, এনরোলমেন্ট এবং সাপোর্ট যোগাযোগের সময় সঠিক তথ্য দিতে হবে। তথ্য অসম্পূর্ণ, বিভ্রান্তিকর বা অসামঞ্জস্যপূর্ণ মনে হলে প্রতিষ্ঠান ব্যাখ্যা চাইতে পারে।",
              "প্রতিটি অ্যাকাউন্ট কেবল রেজিস্টার্ড ব্যবহারকারীর জন্য। অ্যাকাউন্ট শেয়ার করা, অন্যের পরিচয় ব্যবহার করা বা ছদ্মবেশ গ্রহণ করা অনুমোদিত নয়।",
            ],
            bullets: [
              "সত্য ও হালনাগাদ তথ্য প্রদান করুন",
              "লগইন তথ্য গোপন রাখুন",
              "শুধু বৈধ একাডেমিক ও প্রশাসনিক কাজে অ্যাকাউন্ট ব্যবহার করুন",
            ],
          },
          {
            id: "enrollments",
            title: "এনরোলমেন্ট, ফি এবং এক্সেস",
            paragraphs: [
              "কোর্স এনরোলমেন্ট, অনুমোদন এবং এক্সেস প্রাতিষ্ঠানিক রিভিউ, সিট, যোগ্যতা এবং পেমেন্ট স্ট্যাটাসের উপর নির্ভর করে। শুধুমাত্র রিকোয়েস্ট সাবমিট করলেই কোনো ব্যাচ বা কোর্সে নিশ্চিত সুযোগ তৈরি হয় না।",
              "প্রোগ্রামভেদে ফি, ডিউ ডেট, এক্সেস শর্ত ও নবায়ন নীতি ভিন্ন হতে পারে এবং তা প্রতিষ্ঠানের প্রকাশিত স্ট্রাকচার বা অফিসিয়াল যোগাযোগ অনুযায়ী নির্ধারিত হবে।",
            ],
            bullets: [
              "এনরোলমেন্ট অনুমোদন প্রাতিষ্ঠানিক রিভিউ-সাপেক্ষ",
              "পেমেন্ট দায়বদ্ধতা সময়মতো সম্পন্ন করতে হবে",
              "অমীমাংসিত ডিউ থাকলে এক্সেস সীমিত হতে পারে",
            ],
          },
          {
            id: "content",
            title: "লার্নিং কনটেন্ট ও মেধাস্বত্ব",
            paragraphs: [
              "ক্লাস, ভিডিও, নোটস, ডকুমেন্ট, ডিজাইন, ব্র্যান্ডিং এবং প্ল্যাটফর্ম ম্যাটেরিয়াল কেবল অনুমোদিত শিক্ষামূলক ব্যবহারের জন্য। এগুলো প্রতিষ্ঠানের অধিকার ও প্রযোজ্য আইন দ্বারা সুরক্ষিত।",
              "প্রতিষ্ঠানের লিখিত অনুমতি ছাড়া এসব সীমিত কনটেন্ট কপি, বিক্রি, পুনর্বিতরণ, রেকর্ড বা প্রকাশ করা যাবে না।",
            ],
            bullets: [
              "স্পষ্ট অনুমতি ছাড়া শুধুমাত্র ব্যক্তিগত পড়াশোনার জন্য ব্যবহার করুন",
              "পেইড বা সুরক্ষিত কনটেন্ট অনুমতি ছাড়া শেয়ার করবেন না",
              "লোগো, কোর্স পরিচিতি বা প্ল্যাটফর্ম অ্যাসেট অপব্যবহার করবেন না",
            ],
          },
          {
            id: "conduct",
            title: "গ্রহণযোগ্য ব্যবহার ও আচরণ",
            paragraphs: [
              "ব্যবহারকারীদের স্টাফ, শিক্ষক, শিক্ষার্থী ও কমিউনিটি সদস্যদের সাথে শ্রদ্ধাশীল আচরণ করতে হবে। হয়রানি, হুমকি, ঘৃণামূলক বক্তব্য, স্প্যাম, জালিয়াতি, অপব্যবহার এবং একাডেমিক ব্যাঘাত নিষিদ্ধ।",
              "প্ল্যাটফর্মের নিরাপত্তা, একাডেমিক সততা বা প্রাতিষ্ঠানিক কার্যক্রম ক্ষতিগ্রস্ত হলে প্রতিষ্ঠান রিপোর্ট পর্যালোচনা করে ব্যবস্থা নিতে পারে।",
            ],
            bullets: [
              "শ্রদ্ধাশীল ও সত্যভিত্তিক যোগাযোগ করুন",
              "অ্যাকাউন্ট, ডেটা বা সিস্টেমে অননুমোদিত প্রবেশের চেষ্টা করবেন না",
              "ক্ষতিকর, বেআইনি বা বিভ্রান্তিকর কনটেন্ট ছড়াবেন না",
            ],
          },
          {
            id: "suspension",
            title: "স্থগিতাদেশ, বাতিলকরণ ও সীমাবদ্ধতা",
            paragraphs: [
              "অ্যাকাউন্ট নীতি ভঙ্গ, রিসোর্স অপব্যবহার, পেমেন্ট বিরোধ বা অপারেশনাল/নিরাপত্তা ঝুঁকি তৈরি করলে প্রতিষ্ঠান এক্সেস স্থগিত, সীমিত বা বন্ধ করতে পারে।",
              "প্রয়োজনে কনটেন্ট অপসারণ, এনরোলমেন্ট বাতিল, কমিউনিটি এক্সেস সীমিত বা এক্সেস পুনরুদ্ধারের আগে অতিরিক্ত ভেরিফিকেশনও চাওয়া হতে পারে।",
            ],
          },
          {
            id: "service",
            title: "সেবা পরিবর্তন ও সীমাবদ্ধতা",
            paragraphs: [
              "একাডেমিক ও অপারেশনাল প্রয়োজনে প্রতিষ্ঠান কোর্স স্ট্রাকচার, সময়সূচি, শিক্ষক, প্ল্যাটফর্ম ফিচার বা সাপোর্ট ওয়ার্কফ্লো আপডেট করতে পারে।",
              "যথাসাধ্য যত্নে প্ল্যাটফর্ম পরিচালিত হলেও রক্ষণাবেক্ষণ, থার্ড-পার্টি সমস্যা, ইন্টারনেট ব্যাঘাত বা অপারেশনাল সীমাবদ্ধতার কারণে সবসময় নিরবচ্ছিন্ন সেবা নিশ্চিত করা সম্ভব নয়।",
            ],
          },
          {
            id: "updates",
            title: "এই শর্তাবলির আপডেট",
            paragraphs: [
              "সময়ের সাথে এই শর্তাবলি সংশোধিত হতে পারে। নতুন সংস্করণ প্রকাশের পরও প্ল্যাটফর্ম ব্যবহার চালিয়ে গেলে তা সংশোধিত শর্ত মেনে নেওয়া হয়েছে বলে ধরা হবে।",
            ],
          },
        ],
        related: ["privacyPolicy", "refundPolicy", "studentGuidelines"],
      },
      studentGuidelines: {
        eyebrow: "শিক্ষার্থী উন্নয়ন",
        title: "শিক্ষার্থী নির্দেশিকা",
        description:
          "এই নির্দেশিকায় শৃঙ্খলা, শেখার অভ্যাস, যোগাযোগ, ডিজিটাল আচরণ এবং প্রশাসনিক দায়িত্বের প্রত্যাশা বর্ণনা করা হয়েছে।",
        coverage: "ক্লাসরুম শৃঙ্খলা, অ্যাসাইনমেন্ট, কমিউনিটি আচরণ, পেমেন্ট, যোগাযোগ ও অ্যাকাউন্ট দায়িত্ব।",
        summary: [
          "সব একাডেমিক ইন্টারঅ্যাকশনে ধারাবাহিকতা, শৃঙ্খলা ও সম্মান বজায় রাখুন।",
          "নির্দেশনা, সময়সূচি এবং পেমেন্ট প্রত্যাশা সময়মতো অনুসরণ করুন।",
          "কমিউনিটি, ক্লাস ও সাপোর্ট স্পেস দায়িত্বশীলভাবে ব্যবহার করুন।",
        ],
        sections: [
          {
            id: "discipline",
            title: "একাডেমিক শৃঙ্খলা ও সময়ানুবর্তিতা",
            paragraphs: [
              "শিক্ষার্থীদের সময়মতো ক্লাসে অংশগ্রহণ, প্রস্তুত থাকা এবং পড়াশোনার প্রতি সিরিয়াস মনোভাব বজায় রাখা প্রয়োজন। দীর্ঘমেয়াদি ভালো ফলাফলের জন্য নিয়মিততা ও শৃঙ্খলা অত্যন্ত গুরুত্বপূর্ণ।",
              "নিয়মিত ক্লাস মিস করা, নির্দেশনা উপেক্ষা করা বা দীর্ঘ সময় নিষ্ক্রিয় থাকা একাডেমিক অগ্রগতিকে দুর্বল করে দিতে পারে।",
            ],
            bullets: [
              "নির্ধারিত ক্লাসে অংশ নিন এবং নিয়মিত কাজ সম্পন্ন করুন",
              "নোটিশ, পরীক্ষা ও একাডেমিক ডেডলাইন অনুসরণ করুন",
              "সমস্যা বড় হওয়ার আগে দ্রুত ব্যাখ্যা বা সহায়তা নিন",
            ],
          },
          {
            id: "classroom",
            title: "ক্লাস ও একাডেমিক স্পেসে আচরণ",
            paragraphs: [
              "লাইভ ক্লাস, রেকর্ডেড সেশন, কমেন্ট বা সাপোর্ট ইন্টারঅ্যাকশনে শিক্ষক, মডারেটর, স্টাফ এবং সহপাঠীদের প্রতি সম্মান প্রদর্শন করতে হবে।",
              "অযথা ব্যাঘাত, অন্যকে উপহাস করা, বারবার বাধা দেওয়া, অশোভন ভাষা ব্যবহার বা অফ-টপিক বিশৃঙ্খলা গ্রহণযোগ্য নয়।",
            ],
            bullets: [
              "প্রতিটি একাডেমিক স্পেসে ভদ্র ভাষা ব্যবহার করুন",
              "ক্লাস আলোচনাকে প্রাসঙ্গিক ও গঠনমূলক রাখুন",
              "শিক্ষক ও একাডেমিক মডারেটরের নির্দেশনা অনুসরণ করুন",
            ],
          },
          {
            id: "integrity",
            title: "অ্যাসাইনমেন্ট, পরীক্ষা ও একাডেমিক সততা",
            paragraphs: [
              "অ্যাসাইনমেন্ট, টেস্ট ও সাবমিশন সততার সাথে সম্পন্ন করতে হবে। কপি করা, প্রতারণা, অন্যের হয়ে পরীক্ষা দেওয়া বা কাজ ভুয়া দেখানো শেখার পরিবেশকে ক্ষতিগ্রস্ত করে।",
              "একাডেমিক পারফরম্যান্স দুর্বল হলে শিক্ষার্থীদের অসততার পথ না নিয়ে সাহায্য বা গাইডলাইন চাইতে হবে।",
            ],
            bullets: [
              "যেখানে প্রয়োজন সেখানে নিজস্ব কাজ জমা দিন",
              "অন্যায্য সহযোগিতা বা প্রতারণামূলক পরীক্ষার আচরণ এড়িয়ে চলুন",
              "ফিডব্যাক ব্যবহার করে ধাপে ধাপে উন্নতি করুন",
            ],
          },
          {
            id: "digital",
            title: "দায়িত্বশীল ডিজিটাল ও কমিউনিটি আচরণ",
            paragraphs: [
              "প্ল্যাটফর্মের কমিউনিটি, নোটস এবং যোগাযোগের জায়গাগুলোও শেখার অংশ। এখানে কেবল উপকারী, শিক্ষামূলক এবং সম্মানজনক কনটেন্ট শেয়ার করতে হবে।",
              "স্প্যাম, ব্যক্তিগত আক্রমণ, গুজব, হয়রানি বা প্রাইভেট ম্যাটেরিয়াল অনুমতি ছাড়া শেয়ার করলে কনটেন্ট অপসারণ বা অ্যাকাউন্ট সীমাবদ্ধতা হতে পারে।",
            ],
            bullets: [
              "সহায়ক একাডেমিক কনটেন্ট ও পরিষ্কার প্রশ্ন শেয়ার করুন",
              "প্রাইভেট কোর্স রিসোর্স ও শিক্ষার্থীর তথ্য সুরক্ষিত রাখুন",
              "বিভ্রান্তিকর, আক্রমণাত্মক বা ক্ষতিকর পোস্ট এড়িয়ে চলুন",
            ],
          },
          {
            id: "administration",
            title: "পেমেন্ট ও প্রশাসনিক সহযোগিতা",
            paragraphs: [
              "ডিউ সময়মতো পরিশোধ করতে হবে, পেমেন্ট নির্দেশনা সতর্কভাবে অনুসরণ করতে হবে, এবং সাপোর্টের প্রয়োজন হলে সঠিক বিলিং তথ্য দিতে হবে।",
              "নাম, কোর্স রেফারেন্স বা পেমেন্ট তথ্য মিল না থাকলে প্রশাসনিক যাচাইয়ে দেরি হতে পারে।",
            ],
            bullets: [
              "ঘোষিত পেমেন্ট প্রক্রিয়া হুবহু অনুসরণ করুন",
              "স্ট্যাটাস নিশ্চিত না হওয়া পর্যন্ত পেমেন্ট প্রুফ রাখুন",
              "ভেরিফিকেশন রিকোয়েস্টে শ্রদ্ধাশীলভাবে সহযোগিতা করুন",
            ],
          },
          {
            id: "readiness",
            title: "ডিভাইস প্রস্তুতি ও স্ব-ব্যবস্থাপনা",
            paragraphs: [
              "শিক্ষার্থীদের ব্যবহারযোগ্য ডিভাইস, প্রয়োজন অনুযায়ী স্থিতিশীল ইন্টারনেট এবং নিয়মিত একাডেমিক আপডেট দেখার অভ্যাস বজায় রাখা দরকার।",
              "প্ল্যাটফর্ম গাইড করতে পারে, কিন্তু অগ্রগতি নির্ভর করে মনোযোগ, ধারাবাহিকতা, রিভিশন এবং ব্যক্তিগত দায়িত্বশীলতার উপর।",
            ],
            bullets: [
              "লগইন এক্সেস সচল ও নিরাপদ রাখুন",
              "ঘন ঘন ঘোষণা, ড্যাশবোর্ড নোটিশ ও অ্যাসাইন করা ম্যাটেরিয়াল দেখুন",
              "রিভিশন, অনুশীলন ও ফলো-আপ প্রশ্নের দায়িত্ব নিজে নিন",
            ],
          },
          {
            id: "escalation",
            title: "সমস্যা হলে কী করবেন",
            paragraphs: [
              "এক্সেস সমস্যা, পেমেন্ট বিভ্রান্তি, ক্লাস সংক্রান্ত উদ্বেগ বা অন্যের অসদাচরণ হলে অফিসিয়াল সাপোর্টে শান্ত ও পরিষ্কারভাবে বিষয়টি জানাতে হবে।",
              "সঠিক কোর্স নাম, তারিখ, স্ক্রিনশট এবং সমস্যার সংক্ষিপ্ত সারসংক্ষেপ দিলে সমাধান দ্রুত হয়।",
            ],
          },
        ],
        related: ["helpCenter", "termsOfService", "privacyPolicy"],
      },
      refundPolicy: {
        eyebrow: "বিলিং নীতি",
        title: "রিফান্ড নীতি",
        description:
          "কোন পরিস্থিতিতে রিফান্ড বিবেচিত হতে পারে, কোন ক্ষেত্রে সাধারণত রিফান্ড দেওয়া হয় না, এবং অনুমোদিত রিফান্ড কীভাবে প্রক্রিয়াকরণ হয় - তা এখানে ব্যাখ্যা করা হয়েছে।",
        coverage: "ডুপ্লিকেট পেমেন্ট, প্রত্যাখ্যাত এনরোলমেন্ট, বাতিলকৃত সেবা এবং ভেরিফায়েড বিলিং ভুল।",
        summary: [
          "রিফান্ড অনুমোদন নির্ভর করে পেমেন্ট স্ট্যাটাস, কোর্স এক্সেস স্ট্যাটাস এবং অনুরোধের কারণের উপর।",
          "ডিজিটাল শিক্ষাসেবা ইতোমধ্যে দেওয়া হয়ে গেলে, ভেরিফায়েড প্রাতিষ্ঠানিক ভুল না থাকলে সাধারণত রিফান্ড দেওয়া হয় না।",
          "অনুমোদিত রিফান্ড সম্ভব হলে মূল পেমেন্ট চ্যানেলেই ফেরত দেওয়া হয়।",
        ],
        sections: [
          {
            id: "principle",
            title: "রিফান্ডের সাধারণ নীতি",
            paragraphs: [
              "প্ল্যাটফর্মে ডিজিটাল এক্সেস, একাডেমিক পরিকল্পনা এবং অপারেশনাল সাপোর্ট দেওয়া হয় বলে রিফান্ড রিকোয়েস্ট স্বয়ংক্রিয়ভাবে অনুমোদিত হয় না; প্রতিটি অনুরোধ আলাদাভাবে পর্যালোচনা করা হয়।",
              "রিফান্ড রিকোয়েস্ট পাঠালেই অনুমোদন নিশ্চিত হয় না। সিদ্ধান্তের আগে প্রতিষ্ঠান পেমেন্ট প্রুফ, অ্যাকাউন্ট ভেরিফিকেশন, কোর্স তথ্য এবং কারণ চাইতে পারে।",
            ],
          },
          {
            id: "eligible",
            title: "যে ক্ষেত্রে রিফান্ড বিবেচিত হতে পারে",
            paragraphs: [
              "ডুপ্লিকেট পেমেন্ট, ফি নেওয়ার পর প্রশাসনিকভাবে ভর্তি বাতিল, প্রতিষ্ঠান থেকে কোর্স বা সেবা বাতিল হয়ে কার্যকর বিকল্প না থাকা, অথবা প্রতিষ্ঠানের নিশ্চিত বিলিং ভুল - এমন ক্ষেত্রে রিফান্ড বিবেচিত হতে পারে।",
            ],
            bullets: [
              "রেকর্ড অনুযায়ী নিশ্চিত ডুপ্লিকেট বা অতিরিক্ত পেমেন্ট",
              "যোগ্যতার ভিত্তিতে ফি নেওয়ার পর এনরোলমেন্ট বাতিল",
              "প্রতিষ্ঠান কর্তৃক কোর্স বা সেবা বাতিল এবং কার্যকর বিকল্পের অনুপস্থিতি",
              "প্রতিষ্ঠানের নিশ্চিত অপারেশনাল বা বিলিং ত্রুটি",
            ],
          },
          {
            id: "nonrefundable",
            title: "যে ক্ষেত্রে সাধারণত রিফান্ড দেওয়া হয় না",
            paragraphs: [
              "শিক্ষার্থী এক্সেস পাওয়ার পর মত পরিবর্তন করলে, ক্লাসে অংশ না নিলে, নিষ্ক্রিয় থাকলে, অথবা দেওয়া রিসোর্স ব্যবহার না করলেও সাধারণত রিফান্ড প্রযোজ্য হয় না।",
              "সূচি পছন্দ না হওয়া, ব্যক্তিগত কারণ, দেরিতে অংশগ্রহণ, যোগদানের পর কোর্স সম্পর্কে ভুল বোঝাবুঝি, বা নির্দেশনা না মানার কারণে সৃষ্ট পরিস্থিতি সাধারণত রিফান্ডযোগ্য বিবেচিত হয় না।",
            ],
            bullets: [
              "এক্সেস বা ম্যাটেরিয়াল পাওয়ার পর মত পরিবর্তন",
              "অনুপস্থিতি, নিষ্ক্রিয়তা বা ক্লাসে অংশগ্রহণ না করা",
              "উল্লেখযোগ্য একাডেমিক ব্যবহার হওয়ার পর রিফান্ড চাওয়া",
              "শিক্ষার্থীর ভুল তথ্যের কারণে সৃষ্ট সমস্যা",
            ],
          },
          {
            id: "process",
            title: "রিফান্ড রিভিউ কীভাবে চাইবেন",
            paragraphs: [
              "কোর্স নাম, পেমেন্ট তারিখ, পরিমাণ, ট্রানজ্যাকশন রেফারেন্স এবং সংক্ষিপ্ত কারণসহ অফিসিয়াল সাপোর্টে যোগাযোগ করতে হবে। অসম্পূর্ণ রিকোয়েস্ট হলে রিভিউতে দেরি হতে পারে।",
              "চূড়ান্ত সিদ্ধান্তের আগে প্রতিষ্ঠান প্ল্যাটফর্ম রেকর্ড, সাপোর্ট ইতিহাস, এনরোলমেন্ট স্ট্যাটাস এবং সেবা ডেলিভারির অবস্থা যাচাই করতে পারে।",
            ],
            bullets: [
              "শুধু অফিসিয়াল সাপোর্ট চ্যানেল ব্যবহার করুন",
              "পূর্ণাঙ্গ পেমেন্ট ও কোর্স তথ্য দিন",
              "রিভিউ চলাকালে প্রতিষ্ঠানের সিদ্ধান্তের জন্য অপেক্ষা করুন",
            ],
          },
          {
            id: "timeline",
            title: "রিভিউ ও পেআউট টাইমলাইন",
            paragraphs: [
              "রিফান্ড অনুমোদিত হলে পেমেন্ট পদ্ধতি, প্রোভাইডার সময়সীমা এবং ভেরিফিকেশন প্রয়োজনের উপর ভিত্তি করে প্রসেসিং টাইম ভিন্ন হতে পারে। প্রশাসনিকভাবে যুক্তিসঙ্গত সময় অপেক্ষা করতে হবে।",
              "সম্ভব হলে অনুমোদিত রিফান্ড মূল পেমেন্ট উৎসে ফেরত দেওয়া হয়। তা সম্ভব না হলে প্রতিষ্ঠান বিকল্প ভেরিফায়েড পদ্ধতি ব্যবহার করতে পারে।",
            ],
          },
          {
            id: "deductions",
            title: "কর্তন ও চূড়ান্ত সিদ্ধান্ত",
            paragraphs: [
              "আইনগত বা অপারেশনালভাবে প্রয়োজন হলে ট্রানজ্যাকশন চার্জ, ট্রান্সফার ফি বা ইতোমধ্যে দেওয়া সেবার মূল্য অনুমোদিত রিফান্ড থেকে সমন্বয় করা হতে পারে।",
              "রিফান্ড সিদ্ধান্ত রেকর্ড, কোর্স স্ট্যাটাস, সেবা ব্যবহার এবং প্রাতিষ্ঠানিক রিভিউয়ের ভিত্তিতে নেওয়া হয়। আইন ভিন্ন কিছু না বললে প্রতিষ্ঠানের ভেরিফায়েড চূড়ান্ত সিদ্ধান্ত কার্যকর থাকবে।",
            ],
          },
        ],
        related: ["helpCenter", "termsOfService", "privacyPolicy"],
      },
    },
  },
};

export function getLegalLocale(language = "en") {
  return LEGAL_PAGE_CONTENT[language] || LEGAL_PAGE_CONTENT.en;
}
