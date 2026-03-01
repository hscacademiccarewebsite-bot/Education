export const HOME_HERO_SLIDES = [
  {
    id: "slide-academic",
    eyebrow: "Academic Precision",
    title: "Modern HSC preparation with an admissions-ready roadmap.",
    description:
      "Follow a clear learning sequence with mentor supervision, chapter progression, and measurable monthly progress.",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80",
    cta: { label: "Explore Courses", href: "/courses" },
  },
  {
    id: "slide-practice",
    eyebrow: "Structured Practice",
    title: "From concepts to high-score performance, one disciplined cycle.",
    description:
      "Topic mastery, guided practice, and routine accountability designed for board plus admission outcomes.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80",
    cta: { label: "See Program Flow", href: "#about-us" },
  },
  {
    id: "slide-mentors",
    eyebrow: "Mentor Network",
    title: "Learn with a faculty-led ecosystem that tracks your consistency.",
    description:
      "Teachers and moderators continuously monitor courses, application approvals, and content delivery.",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80",
    cta: { label: "Meet Faculty", href: "#teacher-panel" },
  },
];

export const HOME_FALLBACK_BATCHES = [
  {
    _id: "public-target-aplus-2026",
    name: "Target A+ Batch 2026",
    description:
      "Board exam completion plan with admission alignment and weekly problem-solving sessions.",
    monthlyFee: 1000,
    currency: "BDT",
    status: "active",
  },
  {
    _id: "public-engineering-focus",
    name: "Engineering Admission Focus",
    description:
      "High-intensity Physics and Math practice designed for engineering admission preparation.",
    monthlyFee: 1200,
    currency: "BDT",
    status: "upcoming",
  },
  {
    _id: "public-medical-track",
    name: "Medical Admission Track",
    description:
      "Biology and Chemistry concept drills with chapter tests and faculty review sessions.",
    monthlyFee: 1100,
    currency: "BDT",
    status: "active",
  },
  {
    _id: "public-revision-sprint",
    name: "Revision Sprint Program",
    description:
      "Fast revision cycle for exam season with short tests and focused correction workflow.",
    monthlyFee: 800,
    currency: "BDT",
    status: "upcoming",
  },
];

export const HOME_FALLBACK_FACULTY = [
  {
    id: "fallback-teacher-rakib",
    fullName: "Md. Rakib Hasan",
    role: "Teacher",
    email: "physics@hscacademic.care",
    expertise: "Physics and Advanced Problem Solving",
    batches: ["Target A+ Batch 2026"],
  },
  {
    id: "fallback-teacher-farzana",
    fullName: "Farzana Rahman",
    role: "Teacher",
    email: "chemistry@hscacademic.care",
    expertise: "Chemistry and Admission-Oriented Practice",
    batches: ["Engineering Admission Focus"],
  },
  {
    id: "fallback-moderator-samiul",
    fullName: "Samiul Islam",
    role: "Moderator",
    email: "support@hscacademic.care",
    expertise: "Student Monitoring and Learning Support",
    batches: ["Medical Admission Track"],
  },
];

export const HOME_ABOUT_PILLARS = [
  {
    title: "Curriculum Architecture",
    description: "Every course is organized as Subject, Chapter, and Video for predictable progress.",
  },
  {
    title: "Enrollment Governance",
    description: "Student access is controlled through approval workflow by academic staff.",
  },
  {
    title: "Payment Transparency",
    description: "Monthly dues and payment history stay visible for both students and operations.",
  },
  {
    title: "Faculty Accountability",
    description: "Teachers and moderators run content and progress reviews in an operational dashboard.",
  },
];

export const HOME_KEY_STATS = [
  { label: "Learning Model", value: "Course > Subject > Chapter > Video" },
  { label: "Roles Managed", value: "Admin, Teacher, Moderator, Student" },
  { label: "Payment Mode", value: "Online + Offline Verification" },
];

export const HOME_QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Enrollments", href: "/enrollments" },
  { label: "Payments", href: "/payments" },
];
