# Private Developer Handover Report

This file contains copy-ready LaTeX for Overleaf.

Confidentiality note: this document contains live credentials and operational handover details. Do not commit it to a public repository or share it outside the authorized handover chain.

```latex
\documentclass[11pt,a4paper]{article}

\usepackage[margin=1in]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern}
\usepackage{microtype}
\usepackage[table,dvipsnames]{xcolor}
\usepackage{array}
\usepackage{booktabs}
\usepackage{longtable}
\usepackage{tabularx}
\usepackage{enumitem}
\usepackage{fancyhdr}
\usepackage{hyperref}
\usepackage{titlesec}
\usepackage{lastpage}
\usepackage{ragged2e}
\usepackage{setspace}
\usepackage{url}
\usepackage{xurl}
\usepackage{needspace}
\usepackage{tikz}
\usepackage{verbatim}

\definecolor{brand}{HTML}{0F766E}
\definecolor{branddark}{HTML}{115E59}
\definecolor{brandsoft}{HTML}{ECFDF5}
\definecolor{ink}{HTML}{0F172A}
\definecolor{muted}{HTML}{475569}
\definecolor{panel}{HTML}{F8FAFC}
\definecolor{line}{HTML}{CBD5E1}
\definecolor{warnbg}{HTML}{FFF7ED}
\definecolor{warnborder}{HTML}{F59E0B}
\definecolor{riskbg}{HTML}{FEF2F2}
\definecolor{riskborder}{HTML}{DC2626}
\definecolor{inksoft}{HTML}{E2E8F0}

\hypersetup{
  colorlinks=true,
  linkcolor=brand,
  urlcolor=brand,
  pdftitle={HSC Academic and Admission Care Developer Handover Report},
  pdfauthor={Shuvo Chakma},
  pdfsubject={Developer brief, credentials, architecture, deployment, and operating guide}
}

\setstretch{1.08}
\setlength{\parindent}{0pt}
\setlength{\parskip}{7pt}
\renewcommand{\arraystretch}{1.25}
\setlist[itemize]{leftmargin=18pt, itemsep=4pt, topsep=4pt}
\setlist[enumerate]{leftmargin=20pt, itemsep=4pt, topsep=4pt}

\newcolumntype{L}[1]{>{\RaggedRight\arraybackslash}p{#1}}
\newcolumntype{Y}{>{\RaggedRight\arraybackslash}X}
\newcommand{\mono}[1]{{\ttfamily\nolinkurl{#1}}}

\titleformat{\section}{\Large\bfseries\color{ink}}{\thesection.}{0.6em}{}
\titleformat{\subsection}{\large\bfseries\color{ink}}{\thesubsection}{0.6em}{}
\titleformat{\subsubsection}{\normalsize\bfseries\color{ink}}{\thesubsubsection}{0.6em}{}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\textcolor{muted}{HSC Academic \& Admission Care}}
\fancyhead[R]{\textcolor{muted}{Developer Handover}}
\fancyfoot[C]{\textcolor{muted}{Page \thepage\ of \pageref{LastPage}}}

\begin{document}

\begin{titlepage}
\thispagestyle{empty}
\color{ink}

\begin{tikzpicture}[remember picture,overlay]
\draw[line width=1.7pt,color=muted]
  ([xshift=0.58in,yshift=-0.58in]current page.north west)
  rectangle
  ([xshift=-0.58in,yshift=0.58in]current page.south east);
\draw[line width=0.7pt,color=inksoft]
  ([xshift=0.74in,yshift=-0.74in]current page.north west)
  rectangle
  ([xshift=-0.74in,yshift=0.74in]current page.south east);
\end{tikzpicture}

\begin{center}
\vspace*{1.05cm}

\fcolorbox{line}{brandsoft}{\parbox{0.54\textwidth}{
\centering
\textcolor{branddark}{\small\bfseries CONFIDENTIAL DOCUMENT}\par
\vspace{0.08cm}
\textcolor{muted}{\footnotesize Restricted internal circulation and controlled handover copy}
}}

\vspace{0.7cm}
{\Large\bfseries\textcolor{branddark}{HSC Academic \& Admission Care}\par}
\vspace{0.28cm}
{\fontsize{30}{34}\selectfont\bfseries Developer Handover Report\par}
\vspace{0.18cm}
{\large\textcolor{muted}{Access credentials, system architecture, deployment workflow, and formal sign-off}\par}

\vspace{0.38cm}
\textcolor{brand}{\rule{0.16\textwidth}{1.3pt}}
\vspace{0.18cm}
\textcolor{inksoft}{\rule{0.68\textwidth}{0.8pt}}
\vspace{0.32cm}

\fcolorbox{line}{panel}{\parbox{0.86\textwidth}{
\small
\begin{tabularx}{\linewidth}{@{}L{0.28\linewidth}Y@{}}
\textbf{Website} & \url{https://www.hscacademiccare.com} \\
\textbf{Developed by} & Shuvo Chakma (\textit{Full Stack Developer}) \\
 & Binoy Kumar Chakma (\textit{Frontend Developer}) \\
\textbf{Delivered to} & Supon Chakma (\textit{Founder, HSC Academic \& Admission Care}) \\
\textbf{Prepared / revised on} & 22 March 2026 \\
\textbf{Document type} & Confidential developer handover package \\
\end{tabularx}
}}

\vspace{0.25cm}
\fcolorbox{line}{white}{\parbox{0.86\textwidth}{
\small
This document is the controlled handover copy for project access, technical structure, deployment context, and ownership transition. It is being delivered by the development team and received by project founder Supon Chakma.
}}
\end{center}

\vspace{0.35cm}

\begin{center}
\fcolorbox{line}{panel}{\parbox{0.88\textwidth}{
\textbf{Delivery and Receipt Signatures}

\vspace{0.25cm}
\small
\begin{tabularx}{\linewidth}{@{}Y Y Y@{}}
\textbf{Delivered by} & \textbf{Delivered by} & \textbf{Received by} \\
Shuvo Chakma & Binoy Kumar Chakma & Supon Chakma \\
\textit{Full Stack Developer} & \textit{Frontend Developer} & \textit{Founder, HSC Academic \& Admission Care} \\[0.68cm]
\rule{0.88\linewidth}{0.6pt} & \rule{0.88\linewidth}{0.6pt} & \rule{0.88\linewidth}{0.6pt} \\
Signature and date & Signature and date & Signature and date \\
\end{tabularx}
}}
\end{center}
\end{titlepage}

\tableofcontents
\newpage

\section{Credentials}

\subsection{Purpose and Handling Standard}
This section is the operational access register for the project. It captures the credentials and service-entry points that were explicitly supplied during handover, plus the service relationships confirmed from the codebase. In an industry-standard setup, these items should be migrated into a password manager and rotated immediately after the new developer confirms successful access.

\fcolorbox{riskborder}{riskbg}{\parbox{0.95\textwidth}{
\textbf{Security warning.}
The shared Gmail password, hosting passwords, and server panel password have been exposed in plaintext during this handover. Best practice is to rotate them immediately after onboarding, enable multi-factor authentication, and replace shared-password access with named operator accounts wherever the provider supports that model.
}}

\subsection{Master Access Account}
The project appears to be anchored around a single shared Gmail identity. Based on the handover notes, this Gmail account is the root recovery path for GitHub access and for most third-party dashboards used by the application.

\begin{center}
\begin{tabularx}{\textwidth}{L{0.26\textwidth}Y}
\toprule
\textbf{Field} & \textbf{Value} \\
\midrule
Primary shared email / Google identity & \mono{hscacademiccare.website@gmail.com} \\
Primary shared email password & \mono{ShuvoBinoyMango@\#12} \\
Operational role & Root mailbox for service sign-in, password reset, and Google-based authentication across GitHub-adjacent and cloud dashboards \\
Mandatory next step & Confirm mailbox recovery options, enable 2FA, and register at least one secondary owner-controlled recovery method \\
\bottomrule
\end{tabularx}
\end{center}

\subsection{Service Access Matrix}
\Needspace{10\baselineskip}
\begingroup
\footnotesize
\sloppy
\setlength{\tabcolsep}{4pt}
\begin{longtable}{@{}L{0.16\textwidth}L{0.24\textwidth}L{0.26\textwidth}L{0.26\textwidth}@{}}
\toprule
\textbf{System} & \textbf{Login / URL} & \textbf{Known credential or access path} & \textbf{Operational note} \\
\midrule
\endfirsthead
\toprule
\textbf{System} & \textbf{Login / URL} & \textbf{Known credential or access path} & \textbf{Operational note} \\
\midrule
\endhead
Gmail / Google & \mono{hscacademiccare.website@gmail.com} & Password: \mono{ShuvoBinoyMango@\#12} & Master recovery identity for the stack; secure this first \\
GitHub repository & \url{https://github.com/hscacademiccarewebsite-bot/Education} & Access is expected through the Gmail-linked GitHub account; no separate password was provided in the handover text & Source code repository for frontend and backend \\
Vercel & \url{https://vercel.com/} & Sign in using the shared Gmail / Google identity above & Used for frontend hosting according to owner instructions \\
Firebase Console & \url{https://console.firebase.google.com/} & Sign in using the shared Gmail / Google identity above & Used for Firebase Authentication and client/admin credentials \\
MongoDB Atlas & \url{https://cloud.mongodb.com/} & Sign in using the shared Gmail / Google identity above & Database provider is inferred from the MongoDB connection pattern and owner note; verify exact project once logged in \\
Cloudinary & \url{https://cloudinary.com/console} & Sign in using the shared Gmail / Google identity above & Used for image storage and deletion lifecycle \\
Nodemailer / Gmail SMTP & SMTP host \mono{smtp.gmail.com:465} & Runtime account sender: \mono{hscacademiccare.website@gmail.com}; SMTP secret is stored in runtime environment, not supplied separately in plaintext & Application uses Nodemailer; if Gmail uses app passwords, the SMTP secret may differ from the normal Gmail password \\
ExonHost & Shared account email \mono{hscacademiccare.website@gmail.com} & Password: \mono{chtacademiccare2580} & Owner states ExonHost is used for domain management \\
HostSeba customer identity & Shared account email \mono{hscacademiccare.website@gmail.com} & Access path appears to be tied to the shared email plus provider panel access details below & HostSeba is used for backend hosting based on owner instruction and setup email \\
HostSeba Webuzo panel & \url{https://meghna.hostseba.com:2003/} & Username: \mono{chtacade}; Password: \mono{5fA\#Nh46JSn9@q} & This is the concrete server-control credential included in the hosting setup email \\
\bottomrule
\end{longtable}
\endgroup

\subsection{Domain and Hosting Information from Provider Email}
The following values were supplied directly from the HostSeba account setup email and should be treated as the current hosting-reference record unless superseded in the provider dashboard.

\begin{center}
\begin{tabularx}{\textwidth}{L{0.33\textwidth}Y}
\toprule
\textbf{Item} & \textbf{Recorded value} \\
\midrule
Hosting package & BDIX MERN - Standard \\
Domain & \mono{chtacademiccare.com} \\
First payment amount & BDT 2,229.20 \\
Recurring amount & BDT 4,948.29 annually \\
Next due date & Friday, 19 March 2027 \\
Server name & Meghna \\
Server IP & \mono{103.65.139.98} \\
Primary control panel & \url{https://meghna.hostseba.com:2003/} \\
Temporary FTP hostname & \mono{103.65.139.98} \\
Post-propagation FTP hostname & \mono{chtacademiccare.com} \\
Public website URL in email & \url{http://www.chtacademiccare.com} \\
Nameserver 1 & \mono{nsbd3.hostseba.com} (\mono{103.65.139.98}) \\
Nameserver 2 & \mono{nsbd4.hostseba.com} (\mono{103.65.139.98}) \\
\bottomrule
\end{tabularx}
\end{center}

\textbf{Operational note.}
The setup email also mentions a domain-based control-panel URL rendered as \url{https://www.chtacademiccare.com2003/}. That string appears malformed because the port separator is missing. The known-good panel URL from the same email is the server URL \url{https://meghna.hostseba.com:2003/}, which should be treated as the canonical access URL unless the panel itself shows a corrected domain-based alias.

\textbf{Current website note.}
The owner supplied the live website link \url{https://www.hscacademiccare.com} after the initial report draft. This does \textbf{not} match the \texttt{chtacademiccare.com} domain values recorded in the HostSeba onboarding email. The next developer should verify which domain is the current production domain, whether one domain redirects to the other, and where the authoritative DNS zone is maintained.

\subsection{Credential Dependency Order}
For continuity planning, the access chain should be understood in this order:

\begin{enumerate}
\item Secure the shared Gmail account first. This is the likely recovery root for GitHub, Vercel, Firebase, MongoDB, and Cloudinary.
\item Verify GitHub repository access and confirm which GitHub user or bot owns \url{https://github.com/hscacademiccarewebsite-bot/Education}.
\item Verify frontend deployment access in Vercel.
\item Verify backend hosting access in HostSeba Webuzo.
\item Verify domain ownership and DNS control in ExonHost.
\item Verify runtime secret ownership in MongoDB, Firebase, Cloudinary, and Gmail SMTP.
\end{enumerate}

\subsection{Runtime Secret Inventory}
The repository contains local environment files for both applications. The codebase confirms the following environment-key inventory. This table intentionally distinguishes \emph{what exists} from \emph{who manages it}. It does not reproduce hidden API secrets that were not explicitly provided during handover.

\begingroup
\small
\sloppy
\setlength{\tabcolsep}{4pt}
\begin{longtable}{@{}L{0.26\textwidth}L{0.17\textwidth}L{0.21\textwidth}L{0.28\textwidth}@{}}
\toprule
\textbf{Environment key} & \textbf{Layer} & \textbf{Observed state} & \textbf{Purpose} \\
\midrule
\endfirsthead
\toprule
\textbf{Environment key} & \textbf{Layer} & \textbf{Observed state} & \textbf{Purpose} \\
\midrule
\endhead
\path{MONGO_URL} or \path{MONGO_URI} & Backend & Configured locally & MongoDB connection string used by the Express server \\
\path{FIREBASE_PROJECT_ID} & Backend & Configured locally & Firebase Admin SDK project identity \\
\path{FIREBASE_CLIENT_EMAIL} & Backend & Configured locally & Firebase Admin service-account email \\
\path{FIREBASE_PRIVATE_KEY} & Backend & Configured locally & Firebase Admin private key \\
\path{FIREBASE_SERVICE_ACCOUNT_JSON} & Backend & Supported by code & Optional single-variable JSON alternative for admin credentials \\
\path{FIREBASE_STORAGE_BUCKET} & Backend & Configured locally & Firebase storage bucket binding \\
\path{CLOUDINARY_CLOUD_NAME} & Backend & Configured locally & Cloudinary account identification \\
\path{CLOUDINARY_API_KEY} & Backend & Configured locally & Cloudinary API authentication \\
\path{CLOUDINARY_API_SECRET} & Backend & Configured locally & Cloudinary API authentication \\
\path{CLOUDINARY_UPLOAD_FOLDER} & Backend & Local value: \mono{hsc-academic/courses} & Default Cloudinary folder for uploads \\
\path{BKASH_BASE_URL} & Backend & Local value points to sandbox base & Declared bKash base URL in environment \\
\path{BKASH_APP_KEY} & Backend & Configured locally & bKash integration credential \\
\path{BKASH_APP_SECRET} & Backend & Configured locally & bKash integration credential \\
\path{BKASH_USERNAME} & Backend & Configured locally & bKash integration credential \\
\path{BKASH_PASSWORD} & Backend & Configured locally & bKash integration credential \\
\path{FRONTEND_URL} & Backend & Local value: \mono{http://localhost:3000} & Used for payment callback links and email links \\
\path{SMTP_HOST} & Backend & Local value: \mono{smtp.gmail.com} & Outbound email transport host \\
\path{SMTP_PORT} & Backend & Local value: \mono{465} & Outbound email transport port \\
\path{SMTP_USER} & Backend & Configured locally & SMTP authentication user \\
\path{SMTP_PASS} & Backend & Configured locally & SMTP authentication secret \\
\path{SMTP_FROM_NAME} & Backend & Local value: \mono{HSC Academic \& Admission Care} & Human-readable sender label \\
\path{SMTP_FROM_EMAIL} & Backend & Local value: \mono{hscacademiccare.website@gmail.com} & Outbound sender email \\
\path{PORT} & Backend & Local value: \mono{8000} & Express listen port fallback \\
\path{NEXT_PUBLIC_FIREBASE_API_KEY} & Frontend & Configured locally & Firebase web client config \\
\path{NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN} & Frontend & Configured locally & Firebase web client config \\
\path{NEXT_PUBLIC_FIREBASE_PROJECT_ID} & Frontend & Configured locally & Firebase web client config \\
\path{NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET} & Frontend & Configured locally & Firebase web client config \\
\path{NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID} & Frontend & Configured locally & Firebase web client config \\
\path{NEXT_PUBLIC_FIREBASE_APP_ID} & Frontend & Configured locally & Firebase web client config \\
\path{NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID} & Frontend & Configured locally & Firebase analytics client config \\
\path{NEXT_PUBLIC_SITE_URL} & Frontend & Local value: \mono{https://localhost:3000} & Canonical site URL for metadata and SEO; current local value should be reviewed \\
\path{NEXT_PUBLIC_API_BASE_URL} & Frontend & Local value: \mono{http://localhost:8000/api} & Frontend API base URL \\
\path{NEXT_PUBLIC_ENABLE_BKASH_SANDBOX} & Frontend & Local value: \mono{false} & Frontend payment-mode flag \\
\path{NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME} & Frontend & Optional by design & Enables direct unsigned browser upload to Cloudinary \\
\path{NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET} & Frontend & Optional by design & Enables direct unsigned browser upload to Cloudinary \\
\path{NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} & Frontend & Supported by code & Search-console verification token \\
\path{NEXT_PUBLIC_BING_SITE_VERIFICATION} & Frontend & Supported by code & Bing verification token \\
\bottomrule
\end{longtable}
\endgroup

\subsection{Credential Governance Recommendation}
The new developer should not continue operating from a plaintext report as the source of truth. The recommended migration path is:

\begin{enumerate}
\item Rotate the Gmail, ExonHost, and HostSeba passwords immediately.
\item Export all runtime secrets into a secure password manager or organization vault.
\item Recreate production environment variables in Vercel and the backend host from that vault.
\item Remove plaintext credentials from working notes and private repository files.
\item Enable 2FA for Gmail, GitHub, Vercel, Firebase, MongoDB Atlas, Cloudinary, ExonHost, and HostSeba.
\end{enumerate}

\section{Developer Guideline}

\subsection{System Summary}
HSC Academic \& Admission Care is a web platform for academic program marketing, student onboarding, course delivery, enrollment processing, payment tracking, faculty presentation, community interaction, and administrative operations. The repository is a split frontend/backend codebase:

\begin{itemize}
\item The frontend is a Next.js App Router application intended for Vercel deployment.
\item The backend is an Express + Mongoose API intended for Node hosting on HostSeba.
\item Firebase is the authentication identity provider.
\item MongoDB stores application data and content settings.
\item Cloudinary stores images and media metadata.
\item Gmail SMTP through Nodemailer sends transactional emails.
\item bKash is integrated for student online payment flow, although the code currently targets sandbox endpoints.
\end{itemize}

\subsection{Repository Layout}
The repository is organized into two primary applications:

\begin{verbatim}
Education/
  backend/
    app.js
    config/
    controllers/
    middlewares/
    model/
    routes/
    utils/
    .env
    .env.example
    package.json
  frontend/
    app/
    components/
    lib/
    src/
    public/
    .env
    .env.example
    package.json
    jsconfig.json
    next.config.mjs
\end{verbatim}

\textbf{Observed repository state on 21 March 2026:}

\begin{itemize}
\item No project README was present.
\item No CI/CD workflow files were present.
\item No Docker, docker-compose, or infrastructure-as-code files were present.
\item The git working tree was clean at the time of audit.
\end{itemize}

\subsection{Technology Stack}
\begin{center}
\begin{tabularx}{\textwidth}{L{0.18\textwidth}L{0.24\textwidth}Y}
\toprule
\textbf{Layer} & \textbf{Primary technologies} & \textbf{Role in system} \\
\midrule
Frontend & Next.js 16, React 19, Redux Toolkit, RTK Query, Tailwind CSS 4, Framer Motion & Public website, authenticated application UI, dashboard flows, API consumption, client-side PDF receipt generation \\
Backend & Node.js, Express 5, Mongoose 9, Firebase Admin, Nodemailer, Cloudinary SDK, node-cron, PDFKit, Sharp & REST API, RBAC enforcement, business logic, data persistence, PDF export, email sending, scheduled cleanup \\
Authentication & Firebase Auth (frontend) + Firebase Admin (backend) & Google sign-in, ID token issuance, server-side token verification \\
Database & MongoDB via Mongoose & Persistent storage for users, courses, academic content, enrollments, payments, site content, community, and notifications \\
Media & Cloudinary & Asset upload, asset replacement, asset deletion lifecycle \\
Email & Gmail SMTP + Nodemailer & Welcome email, enrollment alerts, payment receipt / waived-payment communication \\
Payments & bKash tokenized checkout & Student payment initiation and confirmation flow \\
Hosting & Vercel (frontend), HostSeba (backend), ExonHost (domain per owner note) & Delivery environment \\
\bottomrule
\end{tabularx}
\end{center}

\subsection{Delivery Topology}
The intended production topology, combining repository evidence and the owner handover note, is as follows:

\begin{center}
\begin{tabularx}{\textwidth}{L{0.19\textwidth}L{0.19\textwidth}Y}
\toprule
\textbf{Tier} & \textbf{Provider} & \textbf{Expected responsibility} \\
\midrule
Frontend web & Vercel & Build and serve the Next.js frontend application \\
Backend API & HostSeba & Run the Express server from the \path{backend} application and expose the API used by the frontend \\
Database & MongoDB & Store all operational and content data \\
Auth identity & Firebase & Handle Google-based sign-in and token issuance \\
Asset storage & Cloudinary & Store images used by profiles, site settings, banners, enrollment photos, and community content \\
Email channel & Gmail SMTP & Deliver transactional mail through Nodemailer \\
Payments & bKash & Accept and confirm online student payments \\
Domain and DNS & ExonHost plus HostSeba nameserver data & Domain control must be checked against both the owner note and the hosting email \\
\bottomrule
\end{tabularx}
\end{center}

\textbf{Important clarification.}
The repository itself does not contain infrastructure manifests or deployment scripts that prove the exact production binding between domain, frontend, and backend. The provider mapping above is therefore based on:

\begin{itemize}
\item explicit owner instruction that Vercel is used for frontend,
\item explicit owner instruction that HostSeba is used for backend,
\item explicit owner instruction that ExonHost is used for domain,
\item code-level evidence of a standard Next.js frontend and Express backend split.
\end{itemize}

\subsection{Frontend Guide}

\subsubsection{Frontend Architecture}
The frontend under \path{frontend/} is a Next.js App Router application. It uses:

\begin{itemize}
\item \path{app/} for route segments and layouts,
\item \path{components/} for reusable UI,
\item \path{lib/features/} for RTK Query feature APIs and Redux slices,
\item \path{src/shared/} and \path{src/app/} for shared API helpers, SEO helpers, store wiring, and language provider logic,
\item \path{public/} for logo and PWA assets.
\end{itemize}

The application uses a global Redux store, RTK Query for API access, a Firebase client for authentication, and a language provider for English/Bangla content switching.

\subsubsection{Primary Route Areas}
\begin{center}
\begin{tabularx}{\textwidth}{L{0.25\textwidth}Y}
\toprule
\textbf{Route area} & \textbf{Purpose} \\
\midrule
\path{/} & Public homepage with hero slider, running courses, faculty, statistics, contact, and SEO metadata \\
\path{/courses} and \path{/courses/[courseId]} & Public course listing and course detail views \\
\path{/faculty} & Public faculty presentation \\
\path{/contact-us} & Public contact page \\
\path{/auth} & Authentication entry route \\
\path{/dashboard} & Authenticated dashboard \\
\path{/dashboard/site-settings} & Admin page for site settings such as tagline, footer, logo, about, and contact information \\
\path{/dashboard/slider-control} & Admin page for homepage hero slide management \\
\path{/profile} & Current-user profile view and update flow \\
\path{/community}, \path{/community/posts/[postId]}, \path{/community/shared-notes}, \path{/community/my-notes} & Community timeline, comments, reactions, and shared-note features \\
\path{/enrollments} & Student enrollment request tracking and staff review workflows \\
\path{/payments} and \path{/payments/bkash-callback} & Student payment records, online payment callback, and receipt access \\
\path{/analytics} & Admin analytics interface \\
\path{/teacher-panel} & Staff-facing teaching workflow area \\
\path{/users}, \path{/users/[userId]}, \path{/users/[userId]/details} & User listing, public profile, and detailed admin/staff user views \\
\path{/subjects/...}, \path{/chapters/...}, \path{/notes/...}, \path{/batches/...} & Academic content creation and traversal flows \\
\bottomrule
\end{tabularx}
\end{center}

\subsubsection{Frontend State and API Pattern}
The frontend uses a single Redux store configured in \path{frontend/src/app/store/index.js}. RTK Query is centralized through \path{frontend/src/shared/api/baseApi.js}, which:

\begin{itemize}
\item reads \path{NEXT_PUBLIC_API_BASE_URL},
\item attaches Firebase bearer tokens through \path{prepareAuthHeaders},
\item redirects the browser to \path{/} on API-level 401 or 403 responses.
\end{itemize}

Feature modules are grouped under \path{frontend/lib/features/}, including:

\begin{itemize}
\item \path{auth/} for sync between Firebase and backend user records,
\item \path{user/} for user management and role operations,
\item \path{batch/} for course creation and staff assignment,
\item \path{content/} for subjects, chapters, videos, and notes,
\item \path{enrollment/} for application and review flows,
\item \path{payment/} for my-payments, global payments, due generation, waiver, and bKash actions,
\item \path{community/} for posts, comments, likes, and shared notes,
\item \path{notification/} for unread counts and notification feeds,
\item \path{analytics/} for admin analytics.
\end{itemize}

\subsubsection{Authentication Flow}
Authentication on the frontend works as follows:

\begin{enumerate}
\item The navigation layer triggers Google sign-in using Firebase Auth and \path{signInWithPopup}.
\item \path{AuthSync.jsx} listens to token changes through \path{onIdTokenChanged}.
\item The Firebase ID token is stored in Redux state.
\item On first authenticated session sync, the frontend calls \path{/users/register} to ensure a MongoDB user record exists.
\item The frontend then requests \path{/users/me} to hydrate the current application user.
\end{enumerate}

This means Firebase is the identity authority, while MongoDB stores role, profile, and domain-specific user data.

\subsubsection{SEO, i18n, and UX Details}
The frontend includes several non-trivial platform features:

\begin{itemize}
\item Search metadata, OpenGraph data, robots, sitemap, and generated social cards.
\item English/Bangla localization through a custom language provider backed by local storage.
\item Animated interfaces using Framer Motion.
\item Client-side payment-receipt PDF generation through \path{jspdf} and \path{jspdf-autotable}.
\item Reusable upload components with size-aware image resizing before upload.
\end{itemize}

\subsubsection{Frontend Media Handling}
Image upload is implemented with a two-path strategy:

\begin{itemize}
\item If \path{NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME} and \path{NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET} are present, the browser can upload directly to Cloudinary using unsigned upload.
\item Otherwise, authenticated users can upload to the backend endpoint \path{/api/uploads/image}, which proxies the image into Cloudinary using server credentials.
\end{itemize}

This dual-path model is useful operationally, but the team should standardize which path is used in production to reduce debugging complexity.

\subsection{Backend Guide}

\subsubsection{Backend Architecture}
The backend under \path{backend/} is a CommonJS Express application launched from \path{backend/app.js}. It:

\begin{itemize}
\item loads environment variables through \path{dotenv},
\item connects to MongoDB using \path{MONGO_URI} or \path{MONGO_URL},
\item conditionally initializes Cloudinary if credentials are present,
\item exposes public and protected REST endpoints under \path{/api/...},
\item starts a scheduler for daily community-post cleanup.
\end{itemize}

The server defaults to port \texttt{8000}. It exposes both \path{/health} and \path{/api/health}.

\subsubsection{Backend Route Groups}
\begin{center}
\begin{tabularx}{\textwidth}{L{0.28\textwidth}Y}
\toprule
\textbf{Route prefix} & \textbf{Purpose} \\
\midrule
\path{/api/users} and \path{/api/user} & User sync, current user, user search, public profile, role updates, batch assignment \\
\path{/api/batches} and \path{/api/courses} & Course/batch CRUD, staff assignment, student listing \\
\path{/api/subjects} & Subject CRUD \\
\path{/api/chapters} & Chapter CRUD \\
\path{/api/videos} & Video CRUD \\
\path{/api/uploads} & Cloudinary-backed image upload and deletion \\
\path{/api/public} & Home content, about/contact/faculty data, admin site settings, admin hero-slider management \\
\path{/api/enrollments} and aliases & Student enrollment requests and staff review \\
\path{/api/payments} & Student payments, global payments, batch payments, due generation, waiver, bKash actions \\
\path{/api/analytics} & Admin analytics overview and downloadable reports \\
\path{/api/notifications} & Notification list, unread count, mark-read operations \\
\path{/api/notes} & Subject note retrieval and staff note CRUD \\
\path{/api/community} and \path{/api/v1/community} & Community posts, comments, likes, and deletion \\
\path{/api/shared-notes} and \path{/api/v1/shared-notes} & Shared note CRUD \\
\bottomrule
\end{tabularx}
\end{center}

\subsubsection{Authentication and RBAC}
Backend authorization is implemented in \path{backend/middlewares/authMiddleware.js}. The flow is:

\begin{enumerate}
\item Extract bearer token from the request.
\item Verify it with Firebase Admin.
\item Resolve the local MongoDB user by Firebase UID.
\item Provision a new student record if allowed by the route and the user does not yet exist.
\item Enforce role checks through \path{requireRoles(...)}.
\end{enumerate}

The supported application roles are:

\begin{itemize}
\item \texttt{admin}
\item \texttt{teacher}
\item \texttt{moderator}
\item \texttt{student}
\end{itemize}

\subsubsection{Role Capability Summary}
\begin{center}
\begin{tabularx}{\textwidth}{L{0.18\textwidth}Y}
\toprule
\textbf{Role} & \textbf{Observed capabilities from code} \\
\midrule
Admin & Full user management, role updates, course creation, batch staff assignment, site settings, hero slides, global payments, due generation, analytics report access, enrollment review, note creation, and broad operational control \\
Teacher & Batch update and delete permissions, subject/chapter/video management, note management, student listing on accessible batches \\
Moderator & Enrollment review, batch payment operations, note management, accessible-batch student visibility \\
Student & Sign-in, profile maintenance, enrollment submission, personal payment tracking, bKash payment flow, community participation, notification access \\
\bottomrule
\end{tabularx}
\end{center}

\subsubsection{Core Domain Model}
\begin{center}
\begin{tabularx}{\textwidth}{L{0.22\textwidth}Y}
\toprule
\textbf{Model} & \textbf{Responsibility} \\
\midrule
\path{User} & Firebase-linked application user with role, profile, batch assignments, and activity state \\
\path{Batch} & Course container with fee, schedule status, staff assignment, and banner \\
\path{Subject} & Subject within a batch \\
\path{Chapter} & Chapter within a subject and batch \\
\path{Video} & Lesson/video record tied to batch, subject, and chapter; includes Facebook video URL \\
\path{EnrollmentRequest} & Student application into a batch, with snapshot data and approval/rejection workflow \\
\path{PaymentRecord} & Monthly due / payment ledger record for a student and batch \\
\path{SiteContent} & CMS-like homepage/site settings document for hero slides, about, contact, logo, footer, and counters \\
\path{Note} & Subject-specific Google Drive note managed by staff \\
\path{SharedNote} & Community-shared note with privacy options \\
\path{CommunityPost} & Community post with privacy, image assets, likes, and mentions \\
\path{CommunityComment} & Comment tree for community posts with image assets and likes \\
\path{Notification} & User-facing or admin-facing notification record \\
\bottomrule
\end{tabularx}
\end{center}

\subsubsection{Business Rules Confirmed from Code}
Important rules that a new developer should understand immediately:

\begin{itemize}
\item Course hierarchy is \textbf{Batch/Course -> Subject -> Chapter -> Video}.
\item Students authenticate through Firebase but are represented locally in MongoDB for role and domain logic.
\item Enrollment approval creates the first payment due for the \textbf{next month}, not the current month.
\item Monthly dues can be generated in bulk by admins.
\item Payment states are \texttt{due}, \texttt{paid\_online}, \texttt{paid\_offline}, and \texttt{waived}.
\item Community posts can be public or restricted to enrolled members of selected batches.
\item Community posts older than two years are deleted by the scheduled cleanup job.
\item Site settings and hero slides are stored in MongoDB and edited through admin APIs, not hardcoded files.
\end{itemize}

\subsubsection{Email and PDF Operations}
The backend uses Nodemailer for transactional email. From the repository evidence, the email layer supports at least:

\begin{itemize}
\item welcome email,
\item new enrollment alert email to staff,
\item payment receipt email,
\item payment waived email.
\end{itemize}

The backend also generates analytics PDF reports through PDFKit. This is separate from the frontend receipt PDF generation, which happens client-side for student-facing receipts.

\subsubsection{Scheduler}
The backend registers a daily cron task at midnight through \path{node-cron}. Its current responsibility is the cleanup of expired community posts, defined in code as posts older than two years.

\subsection{External Integrations}

\subsubsection{Firebase}
Firebase is used in two distinct ways:

\begin{itemize}
\item Frontend web SDK configuration for sign-in and session token issuance.
\item Backend Admin SDK verification for secure server-side identity checks.
\end{itemize}

\subsubsection{Cloudinary}
Cloudinary is the image system of record for:

\begin{itemize}
\item user profile photos,
\item enrollment request photos,
\item site logos and hero slides,
\item course banners,
\item community post/comment images.
\end{itemize}

The backend stores both URL and public ID so it can delete outdated assets when records are updated or removed.

\subsubsection{MongoDB}
MongoDB is the primary persistence layer. The actual deployment endpoint is held in \path{MONGO_URL} or \path{MONGO_URI}. The repository does not pin whether the database is Atlas or self-hosted, but the owner note indicates MongoDB access is managed through the shared email.

\subsubsection{Gmail SMTP / Nodemailer}
SMTP is configured against Gmail on port 465. This is a critical dependency because onboarding, enrollment alerts, and payment communications all depend on the backend mailer configuration.

\subsubsection{bKash}
The codebase integrates bKash tokenized checkout for online payments. However, one important implementation note is that the helper in \path{backend/utils/bkash.js} currently hardcodes sandbox endpoints instead of dynamically consuming the declared base URL environment variable. This should be reviewed before any production payment go-live.

\subsection{Environment and Configuration Guide}

\subsubsection{Backend Configuration Expectations}
For local or hosted backend execution, the new developer should confirm:

\begin{itemize}
\item MongoDB connectivity,
\item Firebase Admin credentials,
\item Cloudinary credentials,
\item SMTP credentials,
\item frontend callback/base URL,
\item bKash credentials and environment mode.
\end{itemize}

The backend entry command is:

\begin{verbatim}
cd backend
npm run dev
\end{verbatim}

For non-development execution:

\begin{verbatim}
cd backend
npm start
\end{verbatim}

\subsubsection{Frontend Configuration Expectations}
For local frontend execution, the new developer should confirm:

\begin{itemize}
\item Firebase client configuration,
\item API base URL,
\item public site URL,
\item optional Cloudinary unsigned upload configuration,
\item search verification tokens if used in production.
\end{itemize}

The frontend entry command is:

\begin{verbatim}
cd frontend
npm run dev
\end{verbatim}

Production build command:

\begin{verbatim}
cd frontend
npm run build
\end{verbatim}

\subsection{Deployment and Operations Runbook}

\subsubsection{Frontend Deployment}
The repository strongly suggests the following Vercel configuration:

\begin{itemize}
\item Project root: \path{frontend/}
\item Framework: Next.js
\item Build command: \texttt{npm run build}
\item Runtime env: all \path{NEXT_PUBLIC_*} keys plus any site verification variables
\end{itemize}

Because there is no deployment manifest in the repo, the exact Vercel project settings must be verified directly in the Vercel dashboard.

\subsubsection{Backend Deployment}
The backend is intended to run as a standard Node application with environment variables and a persistent process manager or panel-managed Node app. Since the repository does not include PM2 config, Webuzo app config, or reverse-proxy config, the exact backend deployment steps are operationally inferred rather than version-controlled.

The new developer should verify the following inside HostSeba:

\begin{enumerate}
\item Node application root points to the \path{backend/} directory.
\item Install dependencies has been run in \path{backend/}.
\item Start command is equivalent to \texttt{npm start} or \texttt{node app.js}.
\item Environment variables mirror the required backend keys listed in this report.
\item The public API URL exposed to the frontend matches the Vercel environment setting \path{NEXT_PUBLIC_API_BASE_URL}.
\item Reverse proxy or panel routing forwards traffic correctly to the backend process port.
\end{enumerate}

\subsubsection{DNS and Domain Coordination}
The owner note says ExonHost is used for domain management, while the HostSeba onboarding email includes authoritative nameserver values for the hosting package. This means DNS responsibility must be validated directly in the registrar and host dashboards. The onboarding developer should explicitly verify:

\begin{itemize}
\item who currently holds the domain registration for \texttt{chtacademiccare.com},
\item whether the domain uses HostSeba nameservers or custom DNS,
\item whether the frontend points to Vercel,
\item whether the backend is exposed through a subdomain or proxy path,
\item SSL/TLS certificate ownership and renewal path.
\end{itemize}

\subsection{Onboarding Checklist for a New Developer}

\begin{enumerate}
\item Confirm access to the shared Gmail account.
\item Confirm access to GitHub and inspect repository collaborators and branch protections.
\item Confirm access to Vercel and identify the active frontend project, production URL, and environment variables.
\item Confirm access to Firebase and document project ID, auth providers, and service account ownership.
\item Confirm access to MongoDB and record the exact cluster/project used by production.
\item Confirm access to Cloudinary and document folder structure, upload presets, and billing owner.
\item Confirm access to HostSeba and identify the live backend application path and process settings.
\item Confirm access to ExonHost and identify active DNS records and renewal owner.
\item Export all runtime secrets into a secure vault.
\item Rotate all shared passwords and enable 2FA.
\end{enumerate}

\subsection{Known Technical Observations and Risks}
The following items were directly observed during the repository audit and should be treated as high-value onboarding notes:

\begin{itemize}
\item The repository has no README, no CI/CD workflow definitions, and no automated test setup.
\item Backend \path{package.json} has no real test script; it is a placeholder that exits with failure.
\item The frontend package also does not define a test script.
\item The backend server registers \path{/health} twice in \path{app.js}; this is not critical but should be cleaned up.
\item CORS is currently enabled with the default open policy in Express; production should restrict allowed origins.
\item The local frontend environment currently sets \path{NEXT_PUBLIC_SITE_URL} to \texttt{https://localhost:3000}, which is likely incorrect and should be reviewed before reuse.
\item The backend bKash helper currently hardcodes sandbox endpoints despite the presence of a declared environment base URL.
\item Sensitive credentials are currently represented in local environment files and handover text; the long-term source of truth should be a secrets manager, not repo-local plaintext.
\item Infrastructure behavior is partly panel-driven and not represented in code, which increases operational risk during personnel transitions.
\end{itemize}

\subsection{Recommended Immediate Stabilization Actions}
To raise this project to a more maintainable industry standard, the next developer should prioritize the following:

\begin{enumerate}
\item Rotate Gmail, HostSeba, and ExonHost passwords immediately.
\item Create a private operational README covering deployment URLs, environment ownership, and recovery contacts.
\item Add automated tests for at least auth sync, enrollment review, payment generation, and public home APIs.
\item Add CI checks for frontend build and backend lint/test execution.
\item Standardize production deployment documentation for Vercel and HostSeba.
\item Restrict backend CORS to approved origins.
\item Fix the bKash environment handling so sandbox/production selection is explicit and centrally controlled.
\item Replace shared-account operations with named operator accounts where supported.
\end{enumerate}

\subsection{Concise Executive Hand-Off}
If a new developer receives this project with no other context, the practical summary is:

\begin{itemize}
\item Secure the Gmail account first; it is the likely root of the whole stack.
\item The codebase is a standard split deployment: Next.js frontend on Vercel, Express API on HostSeba, MongoDB for data, Firebase for auth, Cloudinary for media, Gmail SMTP for mail.
\item The application domain model centers on courses (batches), subjects, chapters, videos, enrollments, payments, community, and site-content CMS settings.
\item Admin capability is broad and includes user roles, course structure, site settings, payment ops, and analytics.
\item Operational risk is elevated because credentials are shared, infrastructure configuration is not version-controlled, and automated tests/documentation are currently minimal.
\end{itemize}

\end{document}
```
