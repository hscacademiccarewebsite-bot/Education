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
    info: { color: '#0866FF', bg: '#EBF5FF' },
    success: { color: '#10B981', bg: '#ECFDF5' },
    warning: { color: '#F59E0B', bg: '#FFFBEB' },
    danger: { color: '#EF4444', bg: '#FEF2F2' }
  };
  const theme = themes[type] || themes.info;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    /* General styles for modern clients */
    body { background-color: #f1f5f9; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { line-height: 100%; text-decoration: none; border: 0; height: auto; outline: none; }
    table { border-collapse: collapse !important; }
    
    /* Responsive overrides */
    @media only screen and (max-width: 620px) {
      .outer-wrapper { padding: 0 !important; }
      .container { width: 100% !important; border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
      .body-content { padding: 30px 20px !important; }
      .header-content { padding: 40px 20px 30px !important; }
      .h1 { font-size: 24px !important; }
      .btn { box-sizing: border-box !important; width: 100% !important; display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    ${preheader || title} - HSC Academic & Admission Care
  </div>
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" class="outer-wrapper" style="padding: 40px 10px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td align="center" class="header-content" style="background-color: ${theme.bg}; padding: 48px 40px 32px; border-bottom: 2px solid #ffffff;">
              <img src="cid:hsc-logo-v12" alt="Logo" width="60" height="60" style="display: block; border-radius: 30px; margin-bottom: 16px; border: 2px solid #ffffff; background-color: #ffffff;" />
              <div style="color: ${theme.color}; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">
                ${subtitle || 'HSC Academic & Admission Care'}
              </div>
              <h1 class="h1" style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2;">
                ${title}
              </h1>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td class="body-content" style="padding: 40px 40px; color: #334155; font-size: 15px; line-height: 1.62;">
              ${content.replace(/class="btn"/g, `style="display: inline-block; padding: 14px 36px; background-color: ${theme.color}; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 10px;"`)}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 32px 40px; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0; font-weight: 800; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
                HSC Academic & Admission Care
              </p>
              <div style="margin-top: 16px; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                <p style="margin: 0 0 8px;">You received this because you are an active student or applicant.</p>
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} All Rights Reserved.</p>
              </div>
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
  const content = `
    <p>Hi <strong>${user.fullName || "Student"}</strong>,</p>
    <p>Welcome to <strong>HSC Academic & Admission Care</strong>! We are thrilled to have you join our premium education platform.</p>
    <p>Your account has been successfully created. You can now log in to explore courses, track your payments, and participate in community discussions.</p>
    <center>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Go to Dashboard</a>
    </center>
  `;

  await sendMail({
    to: user.email,
    subject: "Welcome to HSC Academic & Admission Care! 🎉",
    html: getEmailTemplate(content, "Welcome Aboard!", "info", "Account Created"),
  });
};

/**
 * 2. Due Billing Notification
 */
const sendDueReminderEmail = async (user, duePayments) => {
  if (!duePayments || duePayments.length === 0) return;

  // Build rows for the HTML table
  let rows = "";
  duePayments.forEach((p) => {
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthStr = monthNames[p.billingMonth] || p.billingMonth;
    const courseName = p.batch?.name || "Course";
    // Deduce 'Covers Month'
    const coversDate = new Date(Date.UTC(Number(p.billingYear), Number(p.billingMonth) - 2, 1));
    const coversStr = coversDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    rows += `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 700;">${courseName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px;">${monthStr} ${p.billingYear}</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px;">${coversStr}</td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; text-align: right; color: #b45309; font-weight: 800;">${p.amount} ${p.currency || 'BDT'}</td>
      </tr>
    `;
  });

  const content = `
    <p>Dear <strong>${user.fullName}</strong>,</p>
    <p>This is a polite reminder regarding your pending tuition payments for the current billing cycle.</p>
    <div style="margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #f1f5f9;">Course</th>
            <th style="text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #f1f5f9;">Month</th>
            <th style="text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #f1f5f9;">Covers</th>
            <th style="text-align: right; padding: 12px; font-size: 11px; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #f1f5f9;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    <p style="margin-top: 25px;">Please log into your student portal to clear your dues via bKash online, or contact the office for offline cash payments.</p>
    <center style="margin-top: 32px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments" class="btn">View & Pay Dues</a>
    </center>
  `;

  await sendMail({
    to: user.email,
    subject: "Reminder: Outstanding Payment Dues",
    html: getEmailTemplate(content, "Payment Reminder", "warning", "Pending Action"),
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
  const amountStr = `${payment.amount} ${payment.currency || 'BDT'}`;
  const courseStr = payment.batch?.name || "your course";

  const content = `
    <p>Dear <strong>${user.fullName || "Student"}</strong>,</p>
    <p>Thank you for your payment of <strong style="color: #059669;">${amountStr}</strong>!</p>
    <p>We have successfully processed your payment for <strong>${courseStr}</strong> via ${methodStr}. Your account has been updated accordingly.</p>
    <p>Please find your official payment receipt attached to this email as a PDF document for your records.</p>
    <center style="margin-top: 32px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments" class="btn">View Transaction History</a>
    </center>
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
    html: getEmailTemplate(content, "Payment Received", "success", "Payment Invoice"),
    attachments,
  });
};

const sendNewEnrollmentAlertEmail = async (staffList, student, batch) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
  const reviewLink = `${FRONTEND_URL}/enrollments?batchId=${batch._id}`;

  const content = `
    <h2>New Enrollment Request!</h2>
    <p>A new student has requested to join <strong>${batch.name || "a course"}</strong>.</p>
    <div style="background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; font-weight: 700; text-transform: uppercase;">Student Information</p>
      <p style="margin: 0 0 4px 0; font-size: 16px; color: #0f172a; font-weight: 700;">${student.fullName || student.applicantName}</p>
      <p style="margin: 0; color: #475569;">${student.phone || student.applicantPhone || "N/A"}</p>
    </div>
    <p>Please review their application, verify their Facebook join status, and approve or reject the enrollment.</p>
    <center style="margin-top: 32px;">
      <a href="${reviewLink}" class="btn">Review Enrollment Request</a>
    </center>
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

  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
  const courseLink = `${FRONTEND_URL}/batches/${batch._id}`;

  const content = `
    <p>Hi <strong>${student.fullName}</strong>,</p>
    <p>Great news! Your enrollment request for <strong>${batch.name || "the course"}</strong> has been fully approved by our staff.</p>
    <p>You now have full access to the course materials, video lectures, and live classes.</p>
    <center style="margin-top: 32px;">
      <a href="${courseLink}" class="btn">Go to My Course</a>
    </center>
    <p style="margin-top: 24px; font-size: 13px; color: #64748b;">We are glad to have you with us. If you have any further questions, please reach out to our support group!</p>
  `;

  await sendMail({
    to: student.email,
    subject: `Enrollment Approved - ${batch.name || "Course"}`,
    html: getEmailTemplate(content, "Enrollment Approved! 🎉", "success", "Course Update"),
  });
};

const sendEnrollmentRejectedEmail = async (student, batch, reason) => {
  if (!student.email) return;

  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
  const batchesLink = `${FRONTEND_URL}/batches`;

  const content = `
    <p>Hi <strong>${student.fullName}</strong>,</p>
    <p>We are writing to inform you that your enrollment request for <strong>${batch.name || "the course"}</strong> has unfortunately been rejected by our staff.</p>
    ${reason && reason !== "Not provided" ? `<div style="background-color: #FEF2F2; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px; margin: 24px 0;"><p style="margin: 0; color: #991B1B;"><strong>Reason:</strong> ${reason}</p></div>` : ""}
    <p>If you believe this is a mistake, or if you have since fulfilled the missing requirements (such as joining the private Facebook group), please re-apply or contact the coaching support team.</p>
    <center style="margin-top: 32px;">
      <a href="${batchesLink}" class="btn">Browse Other Courses</a>
    </center>
  `;

  await sendMail({
    to: student.email,
    subject: `Update on Enrollment - ${batch.name || "Course"}`,
    html: getEmailTemplate(content, "Enrollment Status", "danger", "Course Update"),
  });
};

/**
 * 4. Payment Waived Email
 */
const sendPaymentWaivedEmail = async (user, payment) => {
  if (!user.email) return;
  const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthStr = monthNames[payment.billingMonth] || payment.billingMonth;
  const courseStr = payment.batch?.name || "your course";

  const content = `
    <p>Dear <strong>${user.fullName || "Student"}</strong>,</p>
    <p>We are writing to inform you that your monthly fee for <strong>${courseStr}</strong> (${monthStr} ${payment.billingYear}) has been <strong>waived</strong> by our administration.</p>
    <p>This means you do not need to make any payment for this specific billing cycle. Your enrollment status remains active and unaffected.</p>
    <div style="background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Note from Staff:</strong> ${payment.note || "Standard administrative adjustment."}</p>
    </div>
    <center style="margin-top: 32px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments" class="btn">View My Dashboard</a>
    </center>
  `;

  await sendMail({
    to: user.email,
    subject: `Monthly Fee Waived - ${monthStr} ${payment.billingYear}`,
    html: getEmailTemplate(content, "Payment Waived", "info", "Account Update"),
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
