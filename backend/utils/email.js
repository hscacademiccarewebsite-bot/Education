const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const sharp = require("sharp");

// Logo path for CID embedding (local file)
const logoPath = path.join(__dirname, "../../frontend/public/logo.png");

// Initialize transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper for standard mail envelope
const sendMail = async ({ to, subject, html, attachments = [] }) => {
  console.log(`[Email Service]: Triggered sendMail to ${to} | Subject: ${subject}`);

  // If SMTP is not configured, just log to console to prevent crashing
  if (!process.env.SMTP_HOST) {
    console.log(`[Email System Triggered] To: ${to} | Subject: ${subject}`);
    console.log(`Note: SMTP not configured in .env. Email skipped.`);
    return;
  }

  // Attachments handle (including the inline logo)
  const finalAttachments = [...attachments];

  if (fs.existsSync(logoPath)) {
    finalAttachments.push({
      filename: "logo.jpg", // Using .jpg to match the real content type of the compressed file
      path: logoPath,
      cid: "hsc-logo-v12", // Unique CID referenced in template
      contentType: "image/jpeg",
      contentDisposition: "inline",
    });
  }

  // Create a plain-text alternative by stripping all HTML tags to satisfy strict spam filters
  const plainTextFallback = html
    .replace(/<style[^>]*>.*<\/style>/gms, '') // Remove CSS blocks
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    replyTo: process.env.SMTP_FROM_EMAIL, // Helps prevent spam filters by providing a valid reply path
    to: to,
    subject: subject,
    html: html,
    text: plainTextFallback,
    attachments: finalAttachments,
    headers: {
      'X-Entity-Ref-ID': Date.now().toString(), // Helps Gmail groups emails correctly
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const BRAND_NAME = "HSC Academic & Admission Care";
const FALLBACK_FRONTEND_URL = "http://localhost:3000";
const SHORT_MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getFrontendUrl = () => process.env.FRONTEND_URL || FALLBACK_FRONTEND_URL;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMoney = (amount, currency = "BDT") => {
  const numericAmount = Number(amount);
  const amountLabel = Number.isFinite(numericAmount)
    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(numericAmount)
    : amount;

  return `${escapeHtml(amountLabel)} ${escapeHtml(currency)}`;
};

const formatBillingMonth = (billingMonth, billingYear, format = "short") => {
  const monthNames = format === "long" ? LONG_MONTH_NAMES : SHORT_MONTH_NAMES;
  const monthLabel = monthNames[Number(billingMonth)] || billingMonth;
  return `${escapeHtml(monthLabel)} ${escapeHtml(billingYear)}`;
};

const formatCoversMonth = (billingYear, billingMonth, format = "short") => {
  const coversDate = new Date(Date.UTC(Number(billingYear), Number(billingMonth) - 2, 1));
  return escapeHtml(
    coversDate.toLocaleDateString("en-US", {
      month: format === "long" ? "long" : "short",
      year: "numeric",
    })
  );
};

const sumAmounts = (items = []) =>
  items.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

const renderCard = (
  innerHtml,
  {
    marginTop = "20px",
    padding = "22px",
    backgroundColor = "#ffffff",
    borderColor = "#e2e8f0",
  } = {}
) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: ${marginTop};">
    <tr>
      <td style="padding: ${padding}; border: 1px solid ${borderColor}; border-radius: 20px; background-color: ${backgroundColor};">
        ${innerHtml}
      </td>
    </tr>
  </table>
`;

const renderButton = (label, href, color) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="button-wrapper" style="margin-top: 28px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="button-table">
          <tr>
            <td align="center" bgcolor="${color}" style="border-radius: 14px; background-color: ${color};">
              <a
                href="${escapeHtml(href)}"
                target="_blank"
                rel="noopener noreferrer"
                class="button-link"
                style="display: inline-block; padding: 15px 28px; border-radius: 14px; color: #ffffff; font-size: 14px; font-weight: 800; letter-spacing: 0.01em; text-decoration: none;"
              >
                ${escapeHtml(label)}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const renderDetailListCard = (title, rows, options = {}) =>
  renderCard(
    `
      <p style="margin: 0 0 16px; color: #0f172a; font-size: 14px; font-weight: 800; letter-spacing: -0.01em;">
        ${escapeHtml(title)}
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${rows
          .map(
            (row, index) => `
              <tr>
                <td style="padding: ${index === 0 ? "0" : "14px 0 0"}; border-top: ${index === 0 ? "0" : "1px solid #e2e8f0"};">
                  <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;">
                    ${escapeHtml(row.label)}
                  </p>
                  <p style="margin: 6px 0 0; color: #0f172a; font-size: 15px; line-height: 1.6; font-weight: 700;">
                    ${row.value}
                  </p>
                </td>
              </tr>
            `
          )
          .join("")}
      </table>
    `,
    options
  );

const renderChecklistCard = (title, items, options = {}) =>
  renderCard(
    `
      <p style="margin: 0 0 14px; color: #0f172a; font-size: 14px; font-weight: 800; letter-spacing: -0.01em;">
        ${escapeHtml(title)}
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${items
          .map(
            (item, index) => `
              <tr>
                <td valign="top" style="padding: ${index === 0 ? "0" : "12px 0 0"};">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="top" style="padding: 6px 12px 0 0;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 999px; background-color: ${options.dotColor || "#2563eb"};"></span>
                      </td>
                      <td valign="top">
                        <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.7;">
                          ${escapeHtml(item)}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            `
          )
          .join("")}
      </table>
    `,
    options
  );

const renderMetricGrid = (items, accentColor) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
    <tr>
      ${items
        .map(
          (item, index) => `
            <td class="stack-column-cell" width="${Math.floor(100 / items.length)}%" valign="top" style="padding: 0 ${index === items.length - 1 ? "0" : "12px"} 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 18px; border: 1px solid #dbe7f3; border-radius: 18px; background-color: #f8fbff;">
                    <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;">
                      ${escapeHtml(item.label)}
                    </p>
                    <p style="margin: 10px 0 0; color: ${accentColor}; font-size: 22px; line-height: 1.2; font-weight: 800; letter-spacing: -0.03em;">
                      ${item.value}
                    </p>
                    ${item.hint ? `<p style="margin: 8px 0 0; color: #64748b; font-size: 13px; line-height: 1.6;">${escapeHtml(item.hint)}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          `
        )
        .join("")}
    </tr>
  </table>
`;

/**
 * Common HTML wrapper for emails
 */
/**
 * Common HTML wrapper for emails
 * @param {string} content HTML content for the body
 * @param {string} title Large header title
 * @param {string} type Theme selector: 'info' | 'success' | 'warning' | 'danger'
 * @param {string} subtitle Optional small text above the title
 */
const getEmailTemplate = (content, title, type = 'info', subtitle = '', preheader = '') => {
  const themes = {
    info: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", soft: "#dbeafe" },
    success: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", soft: "#d1fae5" },
    warning: { color: "#d97706", bg: "#fff7ed", border: "#fdba74", soft: "#fed7aa" },
    danger: { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", soft: "#fecaca" },
  };
  const theme = themes[type] || themes.info;
  const headerLabel = subtitle || BRAND_NAME;
  const previewText = escapeHtml(preheader || title);
  const logoMarkup = fs.existsSync(logoPath)
    ? `<img src="cid:hsc-logo-v12" alt="${BRAND_NAME}" width="64" height="64" style="display: block; width: 64px; height: 64px; border-radius: 18px; border: 6px solid #ffffff; background-color: #ffffff;" />`
    : `<div style="width: 64px; height: 64px; border-radius: 18px; background-color: #ffffff; color: ${theme.color}; font-size: 24px; font-weight: 900; line-height: 64px; text-align: center;">HA</div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #eef2ff; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse !important; mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    .body-content p { margin: 0 0 16px; }
    .body-content p:last-child { margin-bottom: 0; }
    @media only screen and (max-width: 620px) {
      .outer-wrapper { padding: 14px 0 24px !important; }
      .container { width: 100% !important; border-radius: 24px !important; }
      .hero-pad { padding: 30px 20px 24px !important; }
      .body-content { padding: 28px 20px 8px !important; }
      .footer-pad { padding: 20px 20px 28px !important; }
      .h1 { font-size: 26px !important; line-height: 1.2 !important; }
      .hero-copy { font-size: 14px !important; }
      .stack-column-cell { display: block !important; width: 100% !important; padding: 0 0 12px !important; }
      .button-table, .button-link { width: 100% !important; }
      .button-link { box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #eef2ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    ${previewText}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #eef2ff;">
    <tr>
      <td align="center" class="outer-wrapper" style="padding: 24px 12px 40px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="640">
        <tr>
        <td align="center" valign="top" width="640">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" class="container" style="max-width: 640px; width: 100%; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #dbe5f1; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);">
          <tr>
            <td class="hero-pad" style="padding: 36px 40px 30px; background-color: ${theme.bg}; border-bottom: 1px solid ${theme.border};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="width: 64px;">
                    ${logoMarkup}
                  </td>
                  <td valign="middle" style="padding-left: 16px;">
                    <p style="margin: 0; color: ${theme.color}; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em;">
                      ${escapeHtml(headerLabel)}
                    </p>
                    <p style="margin: 8px 0 0; color: #475569; font-size: 13px; line-height: 1.6;">
                      Email update from ${BRAND_NAME}
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td style="height: 6px; border-radius: 999px; background-color: ${theme.soft};"></td>
                </tr>
              </table>
              <h1 class="h1" style="margin: 22px 0 0; color: #0f172a; font-size: 32px; line-height: 1.15; font-weight: 900; letter-spacing: -0.03em;">
                ${escapeHtml(title)}
              </h1>
              <p class="hero-copy" style="margin: 14px 0 0; max-width: 480px; color: #475569; font-size: 15px; line-height: 1.8;">
                Keep track of your academic activity, billing updates, and enrollment actions in one clear place.
              </p>
            </td>
          </tr>
          <tr>
            <td class="body-content" style="padding: 34px 40px 8px; color: #334155; font-size: 15px; line-height: 1.75;">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer-pad" style="padding: 24px 40px 34px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0; color: #0f172a; font-size: 14px; font-weight: 800; letter-spacing: 0.02em;">
                      ${BRAND_NAME}
                    </p>
                    <p style="margin: 10px 0 0; color: #64748b; font-size: 12px; line-height: 1.7;">
                      You received this email because you are an active student, applicant, or staff member associated with our platform.
                    </p>
                    <p style="margin: 10px 0 0; color: #94a3b8; font-size: 11px; line-height: 1.6;">
                      &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

/**
 * 1. Welcome Email
 */
const sendWelcomeEmail = async (user) => {
  const studentName = escapeHtml(user.fullName || "Student");
  const dashboardUrl = getFrontendUrl();
  const content = `
    <p>Hello <strong>${studentName}</strong>,</p>
    <p>Welcome to <strong>${BRAND_NAME}</strong>. Your account is ready, and your student workspace is now open for courses, payments, and community updates.</p>
    ${renderMetricGrid(
      [
        { label: "Account Status", value: "Ready", hint: "You can sign in immediately." },
        { label: "Portal Access", value: "Active", hint: "Courses, payments, and updates are available." },
      ],
      "#2563eb"
    )}
    ${renderChecklistCard("What you can do next", [
      "Open your dashboard and review available courses.",
      "Track payment activity and due months from one place.",
      "Join community discussions and stay updated with faculty notices.",
    ])}
    ${renderButton("Go to Dashboard", dashboardUrl, "#2563eb")}
    <p style="margin-top: 18px; color: #64748b; font-size: 13px; line-height: 1.7;">
      If you need any help getting started, simply reply to this email and our support team will guide you.
    </p>
  `;

  await sendMail({
    to: user.email,
    subject: "Welcome to HSC Academic & Admission Care! 🎉",
    html: getEmailTemplate(
      content,
      "Welcome Aboard!",
      "info",
      "Account Created",
      "Your account is ready. Sign in to access courses, payments, and community updates."
    ),
  });
};

/**
 * 2. Due Billing Notification
 */
const sendDueReminderEmail = async (user, duePayments) => {
  if (!duePayments || duePayments.length === 0) return;

  const recipientName = escapeHtml(user.fullName || "Student");
  const totalDue = formatMoney(sumAmounts(duePayments), duePayments[0]?.currency || "BDT");
  const dueCards = duePayments
    .map((payment, index) => {
      const courseName = escapeHtml(payment.batch?.name || "Course");
      const billingMonth = formatBillingMonth(payment.billingMonth, payment.billingYear, "short");
      const coversMonth = formatCoversMonth(payment.billingYear, payment.billingMonth, "short");
      const amount = formatMoney(payment.amount, payment.currency || "BDT");

      return renderCard(
        `
          <p style="margin: 0; color: #9a3412; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em;">
            Outstanding Payment
          </p>
          <p style="margin: 10px 0 0; color: #0f172a; font-size: 20px; line-height: 1.3; font-weight: 800; letter-spacing: -0.02em;">
            ${courseName}
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
            <tr>
              <td class="stack-column-cell" width="50%" valign="top" style="padding: 0 10px 0 0;">
                <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;">Billing Month</p>
                <p style="margin: 7px 0 0; color: #0f172a; font-size: 15px; line-height: 1.6; font-weight: 700;">${billingMonth}</p>
              </td>
              <td class="stack-column-cell" width="50%" valign="top" style="padding: 0;">
                <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;">Covers</p>
                <p style="margin: 7px 0 0; color: #0f172a; font-size: 15px; line-height: 1.6; font-weight: 700;">${coversMonth}</p>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 14px;">
            <tr>
              <td style="padding-top: 14px; border-top: 1px solid #fdba74;">
                <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;">Amount Due</p>
                <p style="margin: 8px 0 0; color: #b45309; font-size: 24px; line-height: 1.2; font-weight: 900; letter-spacing: -0.03em;">${amount}</p>
              </td>
            </tr>
          </table>
        `,
        {
          marginTop: index === 0 ? "20px" : "14px",
          backgroundColor: "#fff7ed",
          borderColor: "#fdba74",
        }
      );
    })
    .join("");

  const content = `
    <p>Dear <strong>${recipientName}</strong>,</p>
    <p>This is a friendly reminder that your current tuition cycle still has pending dues. We recommend clearing them soon to keep your academic access and billing record up to date.</p>
    ${renderMetricGrid(
      [
        { label: "Pending Items", value: escapeHtml(duePayments.length), hint: "Outstanding payment records in this email." },
        { label: "Total Due", value: totalDue, hint: "Combined amount across the listed billing cycles." },
      ],
      "#b45309"
    )}
    ${dueCards}
    ${renderChecklistCard(
      "How to complete this",
      [
        "Pay online from your portal using bKash.",
        "If needed, contact the office for offline cash support.",
        "Recheck your payment page after completion to confirm the status change.",
      ],
      { backgroundColor: "#fffbeb", borderColor: "#fde68a", dotColor: "#d97706" }
    )}
    ${renderButton("View & Pay Dues", `${getFrontendUrl()}/payments`, "#d97706")}
  `;

  await sendMail({
    to: user.email,
    subject: "Reminder: Outstanding Payment Dues",
    html: getEmailTemplate(
      content,
      "Payment Reminder",
      "warning",
      "Pending Action",
      `You have ${duePayments.length} outstanding payment item${duePayments.length > 1 ? "s" : ""} waiting in your portal.`
    ),
  });
};

/**
 * Buffer Generator for receipt PDF using pdfkit
 */
const generatePDFBuffer = async (payment, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', (err) => {
        console.error("[Email Service]: PDFKit Error:", err);
        reject(err);
      });

      const textDark = "#1f2937";
      const textMuted = "#6b7280";
      const borderLight = "#e5e7eb";

      const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const billMonth = monthNames[payment.billingMonth] || payment.billingMonth;

      // Covers month
      const coversDate = new Date(Date.UTC(Number(payment.billingYear), Number(payment.billingMonth) - 2, 1));
      const coversStr = coversDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      // Logo embedding logic (Top Left)
      const logoPath = path.join(__dirname, "../../frontend/public/logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 45 });
      }

      // Header: RECEIPT (Top Right)
      doc
        .fillColor("#9ca3af") // Gray 400
        .fontSize(22)
        .text("RECEIPT", 50, 45, { align: "right" });

      // Details below RECEIPT
      doc
        .fontSize(9)
        .fillColor(textMuted)
        .text(`Date: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, { align: "right" })
        .text(`Transaction ID: ${payment.transactionId || payment._id}`, { align: "right" });

      // Institute Name (below logo)
      doc
        .fillColor(textDark)
        .fontSize(14)
        .text("HSC Academic & Admission Care", 50, 100);

      // Divider Line
      doc
        .moveTo(50, 125)
        .lineTo(550, 125)
        .stroke(borderLight);

      // Billed To & Payment Details (Side-by-side)
      doc.fontSize(9).fillColor(textMuted).text("Billed To", 50, 145);
      doc.fontSize(11).fillColor(textDark).text(user.fullName || "Student", 50, 160);
      doc.fontSize(9).fillColor(textMuted).text(user.email, 50, 175);

      const methodLabel = payment.status === "paid_online" ? "bKash (Online)" : "Cash (Offline)";
      const datePaid = payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";

      doc.fontSize(9).fillColor(textMuted).text("Payment Details", 350, 145);
      doc.fontSize(10).fillColor(textDark).text(`Method: ${methodLabel}`, 350, 160);
      doc.text(`Date Paid: ${datePaid}`, 350, 175);

      // Table Header
      doc.moveTo(50, 210).lineTo(550, 210).stroke(borderLight);
      doc.rect(50, 210, 500, 25).fill("#f9fafb"); // Header background

      doc.fontSize(9).fillColor(textMuted).text("Course Details", 55, 220);
      doc.text("Billing Month", 210, 220);
      doc.text("Covers Month", 330, 220);
      doc.text("Amount", 450, 220, { width: 100, align: "right" });

      doc.moveTo(50, 235).lineTo(550, 235).stroke(borderLight);

      // Table Row
      const courseName = payment.batch?.name || "Enrolled Course";
      doc.fontSize(10).fillColor(textDark).text(courseName, 55, 250);
      doc.text(`${billMonth} ${payment.billingYear}`, 210, 250);
      doc.text(coversStr, 330, 250);
      doc.text(`${payment.amount} ${payment.currency || 'BDT'}`, 450, 250, { width: 100, align: "right" });

      doc.moveTo(50, 275).lineTo(550, 275).stroke(borderLight);

      // Total
      doc.fontSize(10).fillColor(textMuted).text("Total Paid:", 350, 300);
      doc.fontSize(14).fillColor(textDark).text(`${payment.amount} ${payment.currency || 'BDT'}`, 450, 300, { width: 100, align: "right" });

      // Footer
      doc.fontSize(9).fillColor("#9ca3af").text("Thank you for choosing HSC Academic & Admission Care.", 50, 700, { align: "center" });

      doc.end();
    } catch (err) {
      console.error("[Email Service]: Exception during PDF Generation:", err);
      reject(err);
    }
  });
};

/**
 * 3. Payment Completed Email (with PDF Attachment)
 */
const sendPaymentReceiptEmail = async (user, payment) => {
  const isOnline = payment.status === "paid_online";
  const methodStr = isOnline ? "bKash" : "offline cash";
  const amountStr = formatMoney(payment.amount, payment.currency || "BDT");
  const courseStr = escapeHtml(payment.batch?.name || "your course");
  const paymentDate = payment.paidAt
    ? escapeHtml(
        new Date(payment.paidAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      )
    : "N/A";
  const transactionRef = escapeHtml(payment.transactionId || payment._id);

  const content = `
    <p>Dear <strong>${escapeHtml(user.fullName || "Student")}</strong>,</p>
    <p>Your payment has been received successfully and your account has already been updated.</p>
    ${renderCard(
      `
        <p style="margin: 0; color: #047857; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em;">
          Payment Confirmed
        </p>
        <p style="margin: 10px 0 0; color: #065f46; font-size: 30px; line-height: 1.1; font-weight: 900; letter-spacing: -0.04em;">
          ${amountStr}
        </p>
        <p style="margin: 10px 0 0; color: #334155; font-size: 15px; line-height: 1.7;">
          Applied to <strong>${courseStr}</strong> via ${escapeHtml(methodStr)}.
        </p>
      `,
      { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }
    )}
    ${renderDetailListCard("Transaction details", [
      { label: "Course", value: courseStr },
      { label: "Payment Method", value: escapeHtml(methodStr) },
      { label: "Paid On", value: paymentDate },
      { label: "Reference", value: transactionRef },
    ])}
    <p>Please keep the attached PDF receipt for your records.</p>
    ${renderButton("View Transaction History", `${getFrontendUrl()}/payments`, "#059669")}
  `;

  let attachments = [];
  try {
    const pdfBuffer = await generatePDFBuffer(payment, user);
    attachments.push({
      filename: `Receipt_${payment.transactionId || payment._id}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf"
    });
  } catch (err) {
    console.error("Failed to generate PDF attachement:", err);
  }

  await sendMail({
    to: user.email,
    subject: `Payment Successful - Receipt #${payment.transactionId || payment._id}`,
    html: getEmailTemplate(
      content,
      "Payment Received",
      "success",
      "Payment Invoice",
      "Your payment is confirmed and the PDF receipt is attached."
    ),
    attachments,
  });
};

const sendNewEnrollmentAlertEmail = async (staffList, student, batch) => {
  const reviewLink = `${getFrontendUrl()}/enrollments?batchId=${batch._id}`;
  const studentName = escapeHtml(student.fullName || student.applicantName || "Student");
  const studentPhone = escapeHtml(student.phone || student.applicantPhone || "N/A");
  const batchName = escapeHtml(batch.name || "a course");

  const content = `
    <p>A new student has requested to join <strong>${batchName}</strong>. This request is ready for staff review.</p>
    ${renderCard(
      `
        <p style="margin: 0; color: #b91c1c; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em;">
          Student Information
        </p>
        <p style="margin: 10px 0 0; color: #0f172a; font-size: 22px; line-height: 1.25; font-weight: 800;">
          ${studentName}
        </p>
        <p style="margin: 8px 0 0; color: #475569; font-size: 15px; line-height: 1.7;">
          ${studentPhone}
        </p>
      `,
      { backgroundColor: "#fef2f2", borderColor: "#fca5a5" }
    )}
    ${renderChecklistCard(
      "Review checklist",
      [
        "Open the enrollment queue and verify the submitted request details.",
        "Confirm the student's Facebook group join status and prerequisites.",
        "Approve or reject the request so onboarding can move forward.",
      ],
      { backgroundColor: "#fff7f7", borderColor: "#fecaca", dotColor: "#dc2626" }
    )}
    ${renderButton("Review Enrollment Request", reviewLink, "#dc2626")}
  `;

  const html = getEmailTemplate(content, "Action Required", "danger", "Staff Notification");

  // Send to all staff in parallel
  const sendPromises = staffList.map(staff => {
    if (!staff.email) return Promise.resolve();
    return sendMail({
      to: staff.email,
      subject: `[Action Required] New Enrollment Request for ${batch.name || "Course"}`,
      html,
    }).catch(err => console.error(`[EmailService] Failed Alert to ${staff.email}:`, err));
  });

  await Promise.all(sendPromises);
};

const sendEnrollmentApprovedEmail = async (student, batch) => {
  if (!student.email) return;

  const courseLink = `${getFrontendUrl()}/courses/${batch._id}`;
  const studentName = escapeHtml(student.fullName || "Student");
  const batchName = escapeHtml(batch.name || "the course");

  const content = `
    <p>Hello <strong>${studentName}</strong>,</p>
    <p>Great news. Your enrollment request for <strong>${batchName}</strong> has been approved by our team.</p>
    ${renderCard(
      `
        <p style="margin: 0; color: #047857; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em;">
          Access Unlocked
        </p>
        <p style="margin: 10px 0 0; color: #065f46; font-size: 22px; line-height: 1.25; font-weight: 800;">
          ${batchName}
        </p>
        <p style="margin: 10px 0 0; color: #334155; font-size: 15px; line-height: 1.7;">
          You can now enter the course space and continue with your academic materials.
        </p>
      `,
      { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }
    )}
    ${renderChecklistCard(
      "You now have access to",
      [
        "Course materials and approved content updates.",
        "Video lessons and faculty-led progress resources.",
        "Live class activity shared through the platform.",
      ],
      { backgroundColor: "#f8fffb", borderColor: "#d1fae5", dotColor: "#059669" }
    )}
    ${renderButton("Go to My Course", courseLink, "#059669")}
    <p style="margin-top: 18px; color: #64748b; font-size: 13px; line-height: 1.7;">
      We are glad to have you with us. If you need any help, reply to this email and our support team will assist.
    </p>
  `;

  await sendMail({
    to: student.email,
    subject: `Enrollment Approved - ${batch.name || "Course"}`,
    html: getEmailTemplate(
      content,
      "Enrollment Approved! 🎉",
      "success",
      "Course Update",
      "Your enrollment is approved and course access is now available."
    ),
  });
};

const sendEnrollmentRejectedEmail = async (student, batch, reason) => {
  if (!student.email) return;

  const batchesLink = `${getFrontendUrl()}/courses`;
  const studentName = escapeHtml(student.fullName || "Student");
  const batchName = escapeHtml(batch.name || "the course");
  const hasReason = reason && reason !== "Not provided";

  const content = `
    <p>Hello <strong>${studentName}</strong>,</p>
    <p>Your enrollment request for <strong>${batchName}</strong> was not approved at this time.</p>
    ${hasReason
      ? renderDetailListCard(
          "Reason shared by staff",
          [{ label: "Review Note", value: escapeHtml(reason) }],
          { backgroundColor: "#fef2f2", borderColor: "#fca5a5" }
        )
      : ""}
    ${renderChecklistCard(
      "Recommended next steps",
      [
        "Review any missing requirements or eligibility points.",
        "Reapply after the required updates are completed.",
        "Contact the coaching support team if you need clarification.",
      ],
      { backgroundColor: "#fff7f7", borderColor: "#fecaca", dotColor: "#dc2626" }
    )}
    ${renderButton("Browse Other Courses", batchesLink, "#dc2626")}
  `;

  await sendMail({
    to: student.email,
    subject: `Update on Enrollment - ${batch.name || "Course"}`,
    html: getEmailTemplate(
      content,
      "Enrollment Status",
      "danger",
      "Course Update",
      "Your enrollment request has an update. Review the next steps inside this email."
    ),
  });
};

/**
 * 4. Payment Waived Email
 */
const sendPaymentWaivedEmail = async (user, payment) => {
  if (!user.email) return;
  const monthStr = formatBillingMonth(payment.billingMonth, payment.billingYear, "long");
  const courseStr = escapeHtml(payment.batch?.name || "your course");
  const staffNote = escapeHtml(payment.note || "Standard administrative adjustment.");

  const content = `
    <p>Dear <strong>${escapeHtml(user.fullName || "Student")}</strong>,</p>
    <p>Your monthly fee for <strong>${courseStr}</strong> has been waived for the current billing cycle.</p>
    ${renderCard(
      `
        <p style="margin: 0; color: #1d4ed8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em;">
          Waiver Confirmed
        </p>
        <p style="margin: 10px 0 0; color: #1e3a8a; font-size: 22px; line-height: 1.25; font-weight: 800;">
          ${courseStr}
        </p>
        <p style="margin: 10px 0 0; color: #334155; font-size: 15px; line-height: 1.7;">
          Billing cycle: <strong>${monthStr}</strong>
        </p>
      `,
      { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }
    )}
    ${renderDetailListCard("Waiver details", [
      { label: "Billing Cycle", value: monthStr },
      { label: "Course", value: courseStr },
      { label: "Staff Note", value: staffNote },
    ])}
    <p>You do not need to make a payment for this specific period. Your enrollment remains active and unaffected.</p>
    ${renderButton("View My Dashboard", `${getFrontendUrl()}/payments`, "#2563eb")}
  `;

  await sendMail({
    to: user.email,
    subject: `Monthly Fee Waived - ${monthStr}`,
    html: getEmailTemplate(
      content,
      "Payment Waived",
      "info",
      "Account Update",
      "Your monthly fee was waived for this billing cycle."
    ),
  });
};

/**
 * Sends a list of dues in chunks of 10 with a 20-second delay between chunks.
 * This is triggered manually by the admin from controllers.
 * @param {Array} studentDueList Array of { studentUser, duesArray }
 */
const sendDuesBulk = async (studentDueList) => {
  if (!studentDueList || studentDueList.length === 0) return;

  console.log(`[EmailService]: Starting bulk due dispatch for ${studentDueList.length} students...`);

  const CHUNK_SIZE = 10;
  let sentCount = 0;

  for (let i = 0; i < studentDueList.length; i += CHUNK_SIZE) {
    const chunk = studentDueList.slice(i, i + CHUNK_SIZE);

    console.log(`[EmailService]: Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} students)`);

    // Send this chunk in parallel
    const sendPromises = chunk.map(item => {
      const { student, dues } = item;
      if (!student.email) return Promise.resolve();

      console.log(`[EmailService]: Dispatching due email to ${student.email}`);
      return sendDueReminderEmail(student, dues).then(() => {
        sentCount++;
      }).catch(err => {
        console.error(`[EmailService Error]: Failed sending to ${student.email}`, err);
      });
    });

    await Promise.all(sendPromises);

    // If there are more students left, wait 20 seconds before next chunk
    if (i + CHUNK_SIZE < studentDueList.length) {
      console.log(`[EmailService]: Chunk finished. Waiting 20s before next batch...`);
      await new Promise(res => setTimeout(res, 20000));
    }
  }

  console.log(`[EmailService]: Bulk due dispatch finished. Total students notified: ${sentCount}`);
};

module.exports = {
  sendWelcomeEmail,
  sendDueReminderEmail,
  sendPaymentReceiptEmail,
  sendPaymentWaivedEmail,
  sendDuesBulk,
  sendNewEnrollmentAlertEmail,
  sendEnrollmentApprovedEmail,
  sendEnrollmentRejectedEmail
};
