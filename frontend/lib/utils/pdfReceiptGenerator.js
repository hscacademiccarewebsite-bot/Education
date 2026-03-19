import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePaymentReceipt = async ({
  payment,
  studentName,
  t,
  language,
  getMonthName,
  formatAmount,
}) => {
  const doc = new jsPDF();
  
  // Clean Professional Colors
  const textDark = [31, 41, 55];    // #1F2937 (Slate 800)
  const textMuted = [107, 114, 128]; // #6B7280 (Gray 500)
  const borderLight = [229, 231, 235]; // #E5E7EB (Gray 200)

  // 1. Load Logo Asynchronously
  const logoUrl = "/logo.png";
  const img = new Image();
  img.src = logoUrl;
  
  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve; // Continue even if logo fails
  });

  // 2. Header: Logo and Institute Details
  if (img.complete && img.naturalWidth !== 0) {
    // Compress image to drastically reduce PDF file size
    const canvas = document.createElement("canvas");
    const aspect = img.naturalWidth / img.naturalHeight;
    canvas.height = 100; // Small height is enough for a 16mm render
    canvas.width = canvas.height * aspect;
    const ctx = canvas.getContext("2d");
    
    // Fill white background to safely convert transparent PNGs to JPEG
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Export as highly compressed JPEG
    const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);

    const renderHeight = 16;
    const renderWidth = renderHeight * aspect;
    doc.addImage(compressedDataUrl, "JPEG", 14, 14, renderWidth, renderHeight);
    
    // Institute name slightly below the logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...textDark);
    doc.text("HSC academic & admission care", 14, 38);
  } else {
    // Fallback if image fails to load
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...textDark);
    doc.text("HSC academic & admission care", 14, 22);
  }

  // 3. Header: Receipt Details (Right Aligned)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(156, 163, 175); // #9CA3AF (Gray 400)
  doc.text("RECEIPT", 196, 26, { align: "right" });

  const generationDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text(`Receipt Date: ${generationDate}`, 196, 32, { align: "right" });
  doc.text(`Transaction ID: ${payment.transactionId || payment._id}`, 196, 37, { align: "right" });

  // 4. Divider Line
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.2);
  doc.line(14, 46, 196, 46);

  // 5. Billing Details Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text("Billed To", 14, 56);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text(studentName || "Student", 14, 62);
  
  const methodLabel = payment.status === "paid_online" ? "Online (bKash)"
                    : payment.status === "paid_offline" ? "Offline (Cash)"
                    : payment.status === "waived" ? "Waived" : "Processing";

  const datePaid = payment.paidAt
    ? new Date(payment.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "N/A";

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Payment Details", 120, 56);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text(`Method: ${methodLabel}`, 120, 62);
  doc.text(`Date Paid: ${datePaid}`, 120, 67);

  // 6. Table Section (Clean Professional UI)
  const courseName = payment.batch?.name || "Target Course";
  const billingCycle = `${getMonthName(payment.billingMonth, "en")} ${payment.billingYear}`;
  const amountStr = formatAmount(payment.amount, payment.currency || "BDT", "en");

  let coversStr = "N/A";
  if (payment.billingYear && payment.billingMonth) {
    const coversDate = new Date(Date.UTC(Number(payment.billingYear), Number(payment.billingMonth) - 2, 1));
    coversStr = coversDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  const tableBody = [
    [
      courseName,
      billingCycle,
      coversStr,
      amountStr
    ]
  ];

  autoTable(doc, {
    startY: 80,
    head: [["Course / Details", "Billing Month", "Covers Month", "Amount"]],
    body: tableBody,
    theme: "plain", // Removes heavy grids, mimics professional stripe-like invoice
    headStyles: { 
      fillColor: [249, 250, 251], // #F9FAFB 
      textColor: textMuted, 
      fontStyle: 'bold', 
      lineWidth: 0.1,
      lineColor: borderLight
    },
    styles: { 
      font: "helvetica", 
      fontSize: 10, 
      cellPadding: 5,
      textColor: textDark, 
    },
    bodyStyles: {
      lineWidth: { bottom: 0.1 },
      lineColor: borderLight
    },
  });

  const finalY = doc.lastAutoTable?.finalY || 110;

  // 7. Total Block
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text("Total Amount Paid", 140, finalY + 12);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...textDark);
  doc.text(amountStr, 196, finalY + 12, { align: "right" });

  // 8. Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175); // #9CA3AF
  doc.text("Thank you for choosing HSC academic & admission care.", 105, 275, { align: "center" });

  // Save PDF
  doc.save(`Receipt_${payment.transactionId || payment._id}.pdf`);
};
