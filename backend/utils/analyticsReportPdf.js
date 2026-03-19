const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const LOGO_PATH = path.join(__dirname, "../../frontend/public/logo.png");
const INSTITUTE_NAME = "HSC Academic & Admission Care";

const COLORS = {
  ink: "#0f172a",
  slate: "#475569",
  mute: "#64748b",
  line: "#e2e8f0",
  panel: "#f8fafc",
  emerald: "#059669",
  emeraldSoft: "#ecfdf5",
  amber: "#d97706",
  amberSoft: "#fffbeb",
  rose: "#e11d48",
  roseSoft: "#fff1f2",
  sky: "#0284c7",
  skySoft: "#eff6ff",
  indigo: "#4f46e5",
  indigoSoft: "#eef2ff",
  white: "#ffffff",
};

const PAGE_MARGIN = 44;
const FOOTER_SPACE = 28;
const HEADER_HEIGHT = 82;

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));
const formatCurrency = (value, currency = "BDT") => `${formatNumber(Math.round(Number(value || 0)))} ${currency}`;
const formatCompactCurrency = (value, currency = "BDT") => {
  const numericValue = Number(value || 0);
  if (Math.abs(numericValue) < 1000) {
    return formatCurrency(numericValue, currency);
  }

  return `${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: Math.abs(numericValue) < 10000 ? 1 : 0,
  }).format(numericValue)} ${currency}`;
};
const formatPercent = (value) => `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value || 0))}%`;
const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
const formatDateOnly = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

const safeText = (value, fallback = "-") => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
};
const truncateText = (value, maxLength = 72) => {
  const text = safeText(value, "");
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
};

const pageWidth = (doc) => doc.page.width - PAGE_MARGIN * 2;
const bottomLimit = (doc) => doc.page.height - PAGE_MARGIN - FOOTER_SPACE;
const getSectionIntroHeight = (description = "") => (description ? 58 : 38);

const drawPageHeader = (doc, reportMeta) => {
  const fullWidth = doc.page.width;
  doc.save();
  doc.rect(0, 0, fullWidth, HEADER_HEIGHT).fill(COLORS.ink);

  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, PAGE_MARGIN, 22, {
        fit: [34, 34],
      });
    } catch (error) {
      // If the asset fails to render, the report should still generate.
    }
  }

  const titleOffset = fs.existsSync(LOGO_PATH) ? 44 : 0;
  doc
    .fillColor(COLORS.white)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(`${INSTITUTE_NAME} Analytics`, PAGE_MARGIN + titleOffset, 24, {
      width: fullWidth - PAGE_MARGIN * 2 - titleOffset,
    });

  doc
    .fillColor("#cbd5e1")
    .font("Helvetica")
    .fontSize(9)
    .text(reportMeta.headerLabel, PAGE_MARGIN + titleOffset, 42, {
      width: fullWidth - PAGE_MARGIN * 2 - titleOffset,
    });

  doc.restore();
  return HEADER_HEIGHT + 18;
};

const addPage = (doc, layout) => {
  doc.addPage();
  layout.cursorY = drawPageHeader(doc, layout.reportMeta);
};

const ensureSpace = (doc, layout, requiredHeight = 40) => {
  if (layout.cursorY + requiredHeight > bottomLimit(doc)) {
    addPage(doc, layout);
  }
};

const ensureSectionSpace = (doc, layout, description = "", contentHeight = 0) => {
  ensureSpace(doc, layout, getSectionIntroHeight(description) + contentHeight);
};

const drawSection = (doc, layout, kicker, title, description = "") => {
  ensureSectionSpace(doc, layout, description, 14);
  doc
    .fillColor(COLORS.sky)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(kicker.toUpperCase(), PAGE_MARGIN, layout.cursorY, {
      characterSpacing: 1.2,
    });

  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(title, PAGE_MARGIN, layout.cursorY + 14, {
      width: pageWidth(doc),
    });

  if (description) {
    doc
      .fillColor(COLORS.mute)
      .font("Helvetica")
      .fontSize(9)
      .text(description, PAGE_MARGIN, layout.cursorY + 34, {
        width: pageWidth(doc),
        lineGap: 2,
      });
    layout.cursorY += 58;
  } else {
    layout.cursorY += 38;
  }
};

const estimateMetricCardsHeight = (count, columns = 3) => {
  if (!count) return 0;
  const gap = 12;
  const cardHeight = 84;
  const rows = Math.ceil(count / columns);
  return rows * cardHeight + Math.max(rows - 1, 0) * gap + 8;
};

const estimateMetricLeadHeight = (count, columns = 3) => {
  if (!count) return 14;
  const gap = 12;
  const cardHeight = 84;
  const firstRowCount = Math.min(count, columns);
  return firstRowCount > 0 ? cardHeight + gap + 8 : 14;
};

const estimateBulletListHeight = (count = 0) => Math.max(count, 0) * 18 + 8;

const drawMetricSection = (doc, layout, config) => {
  const { kicker, title, description = "", cards = [], columns = 3 } = config;
  ensureSectionSpace(doc, layout, description, estimateMetricLeadHeight(cards.length, columns));
  drawSection(doc, layout, kicker, title, description);
  drawMetricCards(doc, layout, cards, columns);
};

const drawMetricCards = (doc, layout, cards, columns = 3) => {
  const gap = 12;
  const totalWidth = pageWidth(doc);
  const cardWidth = (totalWidth - gap * (columns - 1)) / columns;
  const cardHeight = 84;

  for (let index = 0; index < cards.length; index += columns) {
    const rowCards = cards.slice(index, index + columns);
    ensureSpace(doc, layout, cardHeight + 8);

    rowCards.forEach((card, offset) => {
      const x = PAGE_MARGIN + offset * (cardWidth + gap);
      const y = layout.cursorY;
      const tone = card.tone || "slate";
      const backgroundByTone = {
        emerald: COLORS.emeraldSoft,
        amber: COLORS.amberSoft,
        rose: COLORS.roseSoft,
        sky: "#eff8ff",
        indigo: COLORS.indigoSoft,
        slate: COLORS.panel,
      };
      const borderByTone = {
        emerald: "#a7f3d0",
        amber: "#fde68a",
        rose: "#fecdd3",
        sky: "#bae6fd",
        indigo: "#c7d2fe",
        slate: COLORS.line,
      };
      const valueByTone = {
        emerald: COLORS.emerald,
        amber: COLORS.amber,
        rose: COLORS.rose,
        sky: COLORS.sky,
        indigo: COLORS.indigo,
        slate: COLORS.ink,
      };

      doc
        .save()
        .roundedRect(x, y, cardWidth, cardHeight, 12)
        .fillAndStroke(backgroundByTone[tone] || COLORS.panel, borderByTone[tone] || COLORS.line);

      doc
        .fillColor(COLORS.mute)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(safeText(card.label).toUpperCase(), x + 12, y + 12, {
          width: cardWidth - 24,
          characterSpacing: 0.8,
        });

      doc
        .fillColor(valueByTone[tone] || COLORS.ink)
        .font("Helvetica-Bold")
        .fontSize(17)
        .text(safeText(card.value), x + 12, y + 30, {
          width: cardWidth - 24,
        });

      if (card.hint) {
        doc
          .fillColor(COLORS.slate)
          .font("Helvetica")
          .fontSize(8)
          .text(safeText(card.hint), x + 12, y + 55, {
            width: cardWidth - 24,
            lineGap: 1.5,
          });
      }
      doc.restore();
    });

    layout.cursorY += cardHeight + gap;
  }
};

const drawSummaryBand = (doc, layout, items) => {
  const bandHeight = 74;
  ensureSpace(doc, layout, bandHeight + 8);
  doc
    .roundedRect(PAGE_MARGIN, layout.cursorY, pageWidth(doc), bandHeight, 14)
    .fillAndStroke(COLORS.panel, COLORS.line);

  const innerWidth = pageWidth(doc) - 32;
  const itemWidth = innerWidth / items.length;

  items.forEach((item, index) => {
    const x = PAGE_MARGIN + 16 + index * itemWidth;
    if (index > 0) {
      doc
        .moveTo(x - 8, layout.cursorY + 14)
        .lineTo(x - 8, layout.cursorY + bandHeight - 14)
        .strokeColor(COLORS.line)
        .lineWidth(1)
        .stroke();
    }

    doc
      .fillColor(COLORS.mute)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(safeText(item.label).toUpperCase(), x, layout.cursorY + 14, {
        width: itemWidth - 8,
        characterSpacing: 0.8,
      });

    doc
      .fillColor(COLORS.ink)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(safeText(item.value), x, layout.cursorY + 34, {
        width: itemWidth - 8,
      });
  });

  layout.cursorY += bandHeight + 14;
};

const drawTrendChart = (doc, layout, items, currency, title) => {
  if (!items.length) return;
  const chartHeight = 212;
  const chartPadding = 18;
  ensureSpace(doc, layout, chartHeight + 46);

  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(title, PAGE_MARGIN, layout.cursorY, {
      width: pageWidth(doc),
    });

  const y = layout.cursorY + 18;
  const x = PAGE_MARGIN;
  const width = pageWidth(doc);
  doc
    .roundedRect(x, y, width, chartHeight, 16)
    .fillAndStroke(COLORS.white, COLORS.line);

  const legendY = y + 14;
  const legend = [
    { label: "Collected", color: COLORS.emerald },
    { label: "Outstanding", color: COLORS.amber },
  ];
  legend.forEach((item, index) => {
    const legendX = x + 18 + index * 102;
    doc
      .roundedRect(legendX, legendY, 10, 10, 5)
      .fill(item.color);
    doc
      .fillColor(COLORS.slate)
      .font("Helvetica")
      .fontSize(8)
      .text(item.label, legendX + 16, legendY - 1, {
        width: 80,
      });
  });

  const maxValue = Math.max(
    1,
    ...items.flatMap((item) => [Number(item.collectedAmount || 0), Number(item.dueAmount || 0)])
  );
  const chartX = x + chartPadding;
  const chartY = y + 42;
  const plotWidth = width - chartPadding * 2;
  const plotHeight = chartHeight - 76;
  const groupWidth = plotWidth / items.length;
  const barGap = 6;
  const barWidth = Math.max(10, Math.min(18, (groupWidth - 24 - barGap) / 2));

  for (let line = 0; line < 4; line += 1) {
    const gridY = chartY + (plotHeight / 3) * line;
    doc
      .moveTo(chartX, gridY)
      .lineTo(chartX + plotWidth, gridY)
      .strokeColor("#e5edf5")
      .lineWidth(1)
      .stroke();
  }

  items.forEach((item, index) => {
    const groupX = chartX + groupWidth * index + Math.max((groupWidth - barWidth * 2 - barGap) / 2, 6);
    const collectedHeight = (Number(item.collectedAmount || 0) / maxValue) * (plotHeight - 12);
    const dueHeight = (Number(item.dueAmount || 0) / maxValue) * (plotHeight - 12);
    const collectedX = groupX;
    const dueX = groupX + barWidth + barGap;
    const baseY = chartY + plotHeight;

    doc
      .roundedRect(collectedX, baseY - collectedHeight, barWidth, Math.max(collectedHeight, 2), 4)
      .fill(COLORS.emerald);
    doc
      .roundedRect(dueX, baseY - dueHeight, barWidth, Math.max(dueHeight, 2), 4)
      .fill(COLORS.amber);

    doc
      .fillColor(COLORS.mute)
      .font("Helvetica-Bold")
      .fontSize(7)
      .text(safeText(item.label).replace(" 20", " "), chartX + groupWidth * index, baseY + 8, {
        width: groupWidth,
        align: "center",
      });
  });

  doc
    .fillColor(COLORS.mute)
    .font("Helvetica")
    .fontSize(7)
    .text(`Amounts shown in ${currency}.`, x + 18, y + chartHeight - 18);

  layout.cursorY = y + chartHeight + 18;
};

const drawTable = (doc, layout, config) => {
  const {
    title,
    description = "",
    columns,
    rows,
    emptyMessage = "No data available.",
    skipSection = false,
  } = config;
  const tableX = PAGE_MARGIN;
  const tableWidth = pageWidth(doc);
  const totalColumnWeight = columns.reduce((sum, column) => sum + Number(column.width || 1), 0);
  const columnWidths = columns.map((column) => (tableWidth * Number(column.width || 1)) / totalColumnWeight);
  const estimateRowHeight = (row) => {
    const cellHeights = columns.map((column, index) => {
      const rawValue = typeof column.render === "function" ? column.render(row) : row[column.key];
      const text = safeText(rawValue);
      doc.font(column.font || "Helvetica").fontSize(column.fontSize || 8.5);
      return doc.heightOfString(text, {
        width: columnWidths[index] - 12,
        align: column.align || "left",
        lineGap: 1.5,
      });
    });

    return Math.max(24, Math.ceil(Math.max(...cellHeights)) + 12);
  };
  const estimatedFirstDataHeight = rows.length ? 30 + estimateRowHeight(rows[0]) + 4 : 48;

  if (!skipSection) {
    ensureSectionSpace(doc, layout, description, estimatedFirstDataHeight);
    drawSection(doc, layout, config.kicker || "Report Data", title, description);
  } else {
    ensureSpace(doc, layout, estimatedFirstDataHeight);
  }

  const drawHeaderRow = () => {
    ensureSpace(doc, layout, 26);
    doc
      .roundedRect(tableX, layout.cursorY, tableWidth, 24, 8)
      .fillAndStroke(COLORS.ink, COLORS.ink);

    let currentX = tableX;
    columns.forEach((column, index) => {
      doc
        .fillColor(COLORS.white)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(column.label.toUpperCase(), currentX + 6, layout.cursorY + 7, {
          width: columnWidths[index] - 12,
          align: column.align || "left",
          characterSpacing: 0.6,
        });
      currentX += columnWidths[index];
    });
    layout.cursorY += 30;
  };

  if (!rows.length) {
    ensureSpace(doc, layout, 40);
    doc
      .roundedRect(tableX, layout.cursorY, tableWidth, 36, 10)
      .fillAndStroke(COLORS.panel, COLORS.line);
    doc
      .fillColor(COLORS.slate)
      .font("Helvetica")
      .fontSize(9)
      .text(emptyMessage, tableX + 12, layout.cursorY + 12, {
        width: tableWidth - 24,
      });
    layout.cursorY += 48;
    return;
  }

  drawHeaderRow();

  rows.forEach((row, rowIndex) => {
    const rowHeight = estimateRowHeight(row);
    if (layout.cursorY + rowHeight > bottomLimit(doc)) {
      addPage(doc, layout);
      drawHeaderRow();
    }

    doc
      .roundedRect(tableX, layout.cursorY, tableWidth, rowHeight, 8)
      .fillAndStroke(rowIndex % 2 === 0 ? COLORS.white : COLORS.panel, COLORS.line);

    let currentX = tableX;
    columns.forEach((column, index) => {
      const rawValue = typeof column.render === "function" ? column.render(row) : row[column.key];
      const text = safeText(rawValue);

      doc
        .fillColor(column.color || COLORS.ink)
        .font(column.font || "Helvetica")
        .fontSize(column.fontSize || 8.5)
        .text(text, currentX + 6, layout.cursorY + 7, {
          width: columnWidths[index] - 12,
          align: column.align || "left",
          lineGap: 1.5,
        });
      currentX += columnWidths[index];
    });

    layout.cursorY += rowHeight + 4;
  });
};

const drawLedgerGroupHeader = (doc, layout, group, currency) => {
  const cardHeight = 70;
  ensureSpace(doc, layout, cardHeight + 12);

  doc
    .roundedRect(PAGE_MARGIN, layout.cursorY, pageWidth(doc), cardHeight, 16)
    .fillAndStroke(COLORS.panel, COLORS.line);

  doc
    .fillColor(COLORS.sky)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("COURSE / BATCH", PAGE_MARGIN + 16, layout.cursorY + 12, {
      characterSpacing: 1,
    });

  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(safeText(group.batchName), PAGE_MARGIN + 16, layout.cursorY + 25, {
      width: pageWidth(doc) * 0.42,
    });

  doc
    .fillColor(COLORS.slate)
    .font("Helvetica")
    .fontSize(8.5)
    .text(
      `${formatNumber(group.studentCount || 0)} students • ${formatNumber(group.records || 0)} records • Monthly fee ${formatCurrency(
        group.monthlyFee || 0,
        group.currency || currency
      )}`,
      PAGE_MARGIN + 16,
      layout.cursorY + 47,
      {
        width: pageWidth(doc) * 0.42,
      }
    );

  const metricWidth = 106;
  const gap = 10;
  const metrics = [
    { label: "Collected", value: formatCompactCurrency(group.collectedAmount || 0, currency), tone: COLORS.emerald },
    { label: "Outstanding", value: formatCompactCurrency(group.outstandingAmount || 0, currency), tone: COLORS.amber },
    { label: "Overdue", value: formatCompactCurrency(group.overdueAmount || 0, currency), tone: COLORS.rose },
  ];
  const totalMetricsWidth = metrics.length * metricWidth + (metrics.length - 1) * gap;
  const startX = PAGE_MARGIN + pageWidth(doc) - totalMetricsWidth - 16;

  metrics.forEach((metric, index) => {
    const x = startX + index * (metricWidth + gap);
    doc
      .roundedRect(x, layout.cursorY + 12, metricWidth, 46, 12)
      .fillAndStroke(COLORS.white, COLORS.line);
    doc
      .fillColor(COLORS.mute)
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text(metric.label.toUpperCase(), x + 10, layout.cursorY + 20, {
        width: metricWidth - 20,
        characterSpacing: 0.6,
      });
    doc
      .fillColor(metric.tone)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(metric.value, x + 10, layout.cursorY + 34, {
        width: metricWidth - 20,
      });
  });

  layout.cursorY += cardHeight + 10;
};

const finalizeDocument = (doc, layout) => {
  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index);
    doc
      .strokeColor(COLORS.line)
      .moveTo(PAGE_MARGIN, doc.page.height - 30)
      .lineTo(doc.page.width - PAGE_MARGIN, doc.page.height - 30)
      .stroke();
    doc
      .fillColor(COLORS.mute)
      .font("Helvetica")
      .fontSize(8)
      .text(
        `${layout.reportMeta.footerLabel} • Page ${index + 1} of ${range.count}`,
        PAGE_MARGIN,
        doc.page.height - 24,
        {
          width: pageWidth(doc),
          align: "right",
        }
      );
  }
};

const buildChannelRows = (methodBreakdown = [], totalAmount = 0, currency = "BDT") =>
  methodBreakdown.map((item) => ({
    channel: safeText(item.label || item.key),
    records: formatNumber(item.count || 0),
    amount: formatCurrency(item.amount || 0, currency),
    share: formatPercent(totalAmount > 0 ? (Number(item.amount || 0) / totalAmount) * 100 : 0),
  }));

const buildStatusRows = (statusBreakdown = [], currency = "BDT") =>
  statusBreakdown.map((item) => ({
    status: safeText(item.label || item.key),
    records: formatNumber(item.count || 0),
    amount: formatCurrency(item.amount || 0, currency),
  }));

const buildRoleRows = (roleBreakdown = []) =>
  roleBreakdown.map((item) => ({
    role: safeText(item.label || item.key),
    accounts: formatNumber(item.count || 0),
  }));

const buildBatchRows = (items = [], currency = "BDT") =>
  items.map((item) => ({
    batch: safeText(item.name),
    status: safeText(item.status),
    students: formatNumber(item.studentCount || 0),
    records: formatNumber(item.records || 0),
    monthlyFee: formatCurrency(item.monthlyFee || 0, item.currency || currency),
    collected: formatCurrency(item.collectedAmount || 0, currency),
    outstanding: formatCurrency(item.dueAmount || 0, currency),
    overdue: formatCurrency(item.overdueAmount || 0, currency),
    rate: formatPercent(item.collectionRate || 0),
  }));

const drawDefinitions = (doc, layout) => {
  const bullets = [
    "Collected: payment records already settled through online or offline channels.",
    "Outstanding: payment records still marked as due for the selected report scope.",
    "Overdue: the subset of outstanding dues whose due date has already passed.",
    "Collection Rate: collected amount divided by collectible amount for the selected scope.",
  ];

  ensureSectionSpace(
    doc,
    layout,
    "These definitions match the analytics logic used inside the admin panel.",
    36
  );
  drawSection(
    doc,
    layout,
    "Definitions",
    "How to read the financial indicators",
    "These definitions match the analytics logic used inside the admin panel."
  );

  bullets.forEach((line) => {
    ensureSpace(doc, layout, 18);
    doc
      .fillColor(COLORS.slate)
      .font("Helvetica")
      .fontSize(9)
      .text(`- ${line}`, PAGE_MARGIN, layout.cursorY, {
        width: pageWidth(doc),
        lineGap: 2,
      });
    layout.cursorY += 18;
  });
};

const buildLedgerOverviewRows = (items = [], currency = "BDT") =>
  items.map((item) => ({
    batch: safeText(item.batchName),
    students: formatNumber(item.studentCount || 0),
    records: formatNumber(item.records || 0),
    monthlyFee: formatCurrency(item.monthlyFee || 0, item.currency || currency),
    collected: formatCurrency(item.collectedAmount || 0, currency),
    outstanding: formatCurrency(item.outstandingAmount || 0, currency),
    overdue: formatCurrency(item.overdueAmount || 0, currency),
  }));

const drawStudentLedgerReportBody = (doc, layout, reportPayload) => {
  drawMetricSection(doc, layout, {
    kicker: "Ledger Summary",
    title: "Student payment coverage and balances",
    description:
      "This report follows the same billing scope as the analytics filter and lists every student payment record grouped course by course.",
    cards: [
      {
        label: "Payment Records",
        value: formatNumber(reportPayload.ledger.totalRecords || 0),
        hint: `${formatNumber(reportPayload.ledger.totalStudents || 0)} students covered`,
        tone: "indigo",
      },
      {
        label: "Collected",
        value: formatCurrency(reportPayload.ledger.collectedAmount || 0, reportPayload.currency),
        hint: `${formatNumber(reportPayload.ledger.paidCount || 0)} paid records`,
        tone: "emerald",
      },
      {
        label: "Outstanding",
        value: formatCurrency(reportPayload.ledger.outstandingAmount || 0, reportPayload.currency),
        hint: `${formatNumber(reportPayload.ledger.dueCount || 0)} due records`,
        tone: "amber",
      },
      {
        label: "Overdue",
        value: formatCurrency(reportPayload.ledger.overdueAmount || 0, reportPayload.currency),
        hint: `${formatNumber(reportPayload.ledger.totalBatches || 0)} batches represented`,
        tone: "rose",
      },
    ],
    columns: 4,
  });

  drawTable(doc, layout, {
    kicker: "Course Matrix",
    title: "Batch-by-batch ledger overview",
    description: "A compact summary of student payment coverage before the detailed ledger begins.",
    columns: [
      { key: "batch", label: "Batch", width: 1.8 },
      { key: "students", label: "Students", width: 0.8, align: "right" },
      { key: "records", label: "Records", width: 0.8, align: "right" },
      { key: "monthlyFee", label: "Monthly Fee", width: 1, align: "right" },
      { key: "collected", label: "Collected", width: 1, align: "right", color: COLORS.emerald },
      { key: "outstanding", label: "Outstanding", width: 1, align: "right", color: COLORS.amber },
      { key: "overdue", label: "Overdue", width: 1, align: "right", color: COLORS.rose },
    ],
    rows: buildLedgerOverviewRows(reportPayload.ledger.items || [], reportPayload.currency),
    emptyMessage: "No student payment records are available for this reporting scope.",
  });

  const ledgerColumns = [
    {
      key: "studentName",
      label: "Student",
      width: 1.4,
      font: "Helvetica-Bold",
      fontSize: 7.4,
      render: (row) => safeText(row.studentName),
    },
    {
      key: "contact",
      label: "Contact",
      width: 1.55,
      fontSize: 7.2,
      render: (row) => {
        const contactParts = [row.studentEmail, row.studentPhone].filter(Boolean);
        return contactParts.length ? contactParts.join("\n") : "-";
      },
    },
    {
      key: "periodLabel",
      label: "Period",
      width: 0.95,
      fontSize: 7.2,
    },
    {
      key: "amount",
      label: "Amount",
      width: 0.85,
      align: "right",
      fontSize: 7.2,
      render: (row) => formatCurrency(row.amount || 0, row.currency || reportPayload.currency),
    },
    {
      key: "statusLabel",
      label: "Status",
      width: 0.95,
      fontSize: 7.2,
    },
    {
      key: "paymentMethodLabel",
      label: "Channel",
      width: 1,
      fontSize: 7.2,
    },
    {
      key: "dueDate",
      label: "Due Date",
      width: 0.95,
      fontSize: 7.2,
      render: (row) => formatDateOnly(row.dueDate),
    },
    {
      key: "paidAt",
      label: "Paid At",
      width: 0.95,
      fontSize: 7.2,
      render: (row) => (row.paidAt ? formatDateOnly(row.paidAt) : "-"),
    },
    {
      key: "handledBy",
      label: "Handled By",
      width: 1.1,
      fontSize: 7.2,
    },
    {
      key: "note",
      label: "Notes",
      width: 1.3,
      fontSize: 7.2,
      render: (row) => truncateText(row.note || "", 68),
    },
  ];

  const detailDescription =
    "Each section below is grouped by batch so administrators can review every student payment record, its billing period, settlement state, and operator trail.";
  const firstLedgerRow = reportPayload.ledger.items?.[0]?.items?.[0] || null;
  const detailLeadHeight = firstLedgerRow ? 122 : 72;
  ensureSectionSpace(doc, layout, detailDescription, detailLeadHeight);
  drawSection(doc, layout, "Detailed Ledger", "Course-wise student payment details", detailDescription);

  (reportPayload.ledger.items || []).forEach((group) => {
    const firstRow = group.items?.[0] || null;
    const previewHeight = 70 + 30 + (firstRow ? 36 : 0) + 12;
    ensureSpace(doc, layout, previewHeight);
    drawLedgerGroupHeader(doc, layout, group, reportPayload.currency);
    drawTable(doc, layout, {
      columns: ledgerColumns,
      rows: group.items || [],
      skipSection: true,
      emptyMessage: "No payment rows are available for this batch.",
    });
  });

  drawDefinitions(doc, layout);
};

const streamAnalyticsReportPdf = (res, reportPayload) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 0 },
      bufferPages: true,
      info: {
        Title: reportPayload.report.title,
        Author: `${INSTITUTE_NAME} Analytics`,
        Subject: reportPayload.report.headerLabel,
      },
    });

    const chunks = [];
    const layout = {
      reportMeta: reportPayload.report,
      cursorY: 0,
    };

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=\"${reportPayload.report.fileName}\"`);
        res.status(200).send(pdfBuffer);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    layout.cursorY = drawPageHeader(doc, layout.reportMeta);

    doc
      .fillColor(COLORS.sky)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(reportPayload.report.kicker.toUpperCase(), PAGE_MARGIN, layout.cursorY, {
        characterSpacing: 1,
      });

    doc
      .fillColor(COLORS.ink)
      .font("Helvetica-Bold")
      .fontSize(24)
      .text(reportPayload.report.title, PAGE_MARGIN, layout.cursorY + 16, {
        width: pageWidth(doc),
      });

    doc
      .fillColor(COLORS.slate)
      .font("Helvetica")
      .fontSize(10)
      .text(reportPayload.report.subtitle, PAGE_MARGIN, layout.cursorY + 50, {
        width: pageWidth(doc),
        lineGap: 3,
      });

    layout.cursorY += 86;

    drawSummaryBand(doc, layout, [
      { label: "Reporting Scope", value: reportPayload.report.scopeLabel },
      { label: "Generated At", value: formatDateTime(reportPayload.generatedAt) },
      { label: "Prepared For", value: "Admin Control Center" },
    ]);

    drawMetricSection(doc, layout, {
      kicker: "Executive Summary",
      title: "Platform and financial snapshot",
      description:
        "A high-level summary of accounts, batch operations, collections, and dues for the selected report scope.",
      cards: [
        {
          label: "Collected Revenue",
          value: formatCurrency(reportPayload.payments.collectedAmount || 0, reportPayload.currency),
          hint: `${formatPercent(reportPayload.payments.collectionRate || 0)} collection rate`,
          tone: "emerald",
        },
        {
          label: "Outstanding Dues",
          value: formatCurrency(reportPayload.payments.dueAmount || 0, reportPayload.currency),
          hint: `${formatNumber(reportPayload.payments.dueCount || 0)} due records`,
          tone: "amber",
        },
        {
          label: "Overdue Dues",
          value: formatCurrency(reportPayload.payments.overdueAmount || 0, reportPayload.currency),
          hint: `${formatNumber(reportPayload.payments.overdueCount || 0)} records require follow-up`,
          tone: "rose",
        },
        {
          label: "Collectible Amount",
          value: formatCurrency(reportPayload.payments.collectibleAmount || 0, reportPayload.currency),
          hint: reportPayload.report.scopeLabel,
          tone: "sky",
        },
        {
          label: "Total Accounts",
          value: formatNumber(reportPayload.users.total || 0),
          hint: `${formatNumber(reportPayload.users.active || 0)} active accounts`,
          tone: "indigo",
        },
        {
          label: "Active Batches",
          value: formatNumber(reportPayload.batches.active || 0),
          hint: `${formatNumber(reportPayload.batches.total || 0)} total batches`,
          tone: "slate",
        },
      ],
    });

    drawMetricSection(doc, layout, {
      kicker: "Operational Snapshot",
      title: "Accounts, admissions, and leadership signals",
      description:
        "These numbers help leadership understand platform capacity, recent activity, and current workflow pressure.",
      cards: [
        {
          label: "New Accounts",
          value: formatNumber(reportPayload.users.newLast30Days || 0),
          hint: "Created in the last 30 days",
          tone: "sky",
        },
        {
          label: "Recent Logins",
          value: formatNumber(reportPayload.users.recentLoginsLast7Days || 0),
          hint: "Seen in the last 7 days",
          tone: "indigo",
        },
        {
          label: "Pending Reviews",
          value: formatNumber(reportPayload.enrollments.pending || 0),
          hint: `${formatPercent(reportPayload.enrollments.approvalRate || 0)} approval rate`,
          tone: "amber",
        },
        {
          label: "Recent Applications",
          value: formatNumber(reportPayload.enrollments.recentLast30Days || 0),
          hint: "Created in the last 30 days",
          tone: "slate",
        },
      ],
      columns: 4,
    });

    drawTable(doc, layout, {
      kicker: "Accounts",
      title: "User role distribution",
      description: "Current active role mix across the platform.",
      columns: [
        { key: "role", label: "Role", width: 2 },
        { key: "accounts", label: "Accounts", width: 1, align: "right" },
      ],
      rows: buildRoleRows(reportPayload.users.roleBreakdown || []),
      emptyMessage: "No role distribution data is available.",
    });

    drawTable(doc, layout, {
      kicker: "Payments",
      title: "Payment status breakdown",
      description: "Distribution of due, paid, and waived records for the selected report scope.",
      columns: [
        { key: "status", label: "Status", width: 2 },
        { key: "records", label: "Records", width: 1, align: "right" },
        { key: "amount", label: "Amount", width: 1.4, align: "right" },
      ],
      rows: buildStatusRows(reportPayload.payments.statusBreakdown || [], reportPayload.currency),
      emptyMessage: "No payment status data is available.",
    });

    const totalMethodAmount = (reportPayload.payments.methodBreakdown || []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    drawTable(doc, layout, {
      kicker: "Payments",
      title: "Collection channel mix",
      description: "How paid and adjusted collections are distributed across payment channels.",
      columns: [
        { key: "channel", label: "Channel", width: 1.8 },
        { key: "records", label: "Records", width: 1, align: "right" },
        { key: "amount", label: "Amount", width: 1.3, align: "right" },
        { key: "share", label: "Share", width: 0.9, align: "right" },
      ],
      rows: buildChannelRows(reportPayload.payments.methodBreakdown || [], totalMethodAmount, reportPayload.currency),
      emptyMessage: "No payment channel data is available.",
    });

    drawTrendChart(
      doc,
      layout,
      reportPayload.payments.monthlyTrend || [],
      reportPayload.currency,
      reportPayload.report.trendTitle
    );

    drawTable(doc, layout, {
      kicker: "Finance",
      title: "Monthly performance detail",
      description: reportPayload.report.trendSubtitle,
      columns: [
        { key: "label", label: "Period", width: 1.5 },
        { key: "records", label: "Records", width: 0.9, align: "right" },
        { key: "collected", label: "Collected", width: 1.2, align: "right" },
        { key: "outstanding", label: "Outstanding", width: 1.2, align: "right" },
        { key: "rate", label: "Rate", width: 0.8, align: "right" },
      ],
      rows: (reportPayload.payments.monthlyTrend || []).map((item) => ({
        label: safeText(item.label),
        records: formatNumber(item.records || 0),
        collected: formatCurrency(item.collectedAmount || 0, reportPayload.currency),
        outstanding: formatCurrency(item.dueAmount || 0, reportPayload.currency),
        rate: formatPercent(item.collectionRate || 0),
      })),
      emptyMessage: "No monthly trend data is available.",
    });

    const leaders = reportPayload.payments.batchPerformance || {};
    drawMetricSection(doc, layout, {
      kicker: "Batch Leadership",
      title: "Which batches require attention",
      description:
        "Leadership signals make it easier to spot the strongest collections and the batches carrying the largest due balances.",
      cards: [
        {
          label: "Best Collection",
          value: leaders.highestCollection?.name || "N/A",
          hint: leaders.highestCollection
            ? formatCurrency(leaders.highestCollection.collectedAmount || 0, reportPayload.currency)
            : "No collection data available",
          tone: "emerald",
        },
        {
          label: "Highest Outstanding",
          value: leaders.highestOutstanding?.name || "N/A",
          hint: leaders.highestOutstanding
            ? formatCurrency(leaders.highestOutstanding.dueAmount || 0, reportPayload.currency)
            : "No outstanding dues recorded",
          tone: "amber",
        },
        {
          label: "Strongest Rate",
          value: leaders.strongestCollectionRate?.name || "N/A",
          hint: leaders.strongestCollectionRate
            ? formatPercent(leaders.strongestCollectionRate.collectionRate || 0)
            : "No rate data available",
          tone: "sky",
        },
      ],
    });

    drawTable(doc, layout, {
      kicker: "Batches",
      title: "Batch performance matrix",
      description: "Detailed financial performance for every batch in the selected reporting scope.",
      columns: [
        { key: "batch", label: "Batch", width: 1.7 },
        { key: "status", label: "Status", width: 0.8 },
        { key: "students", label: "Students", width: 0.8, align: "right" },
        { key: "records", label: "Records", width: 0.8, align: "right" },
        { key: "monthlyFee", label: "Monthly Fee", width: 1.1, align: "right" },
        { key: "collected", label: "Collected", width: 1.1, align: "right", color: COLORS.emerald },
        { key: "outstanding", label: "Outstanding", width: 1.1, align: "right", color: COLORS.amber },
        { key: "overdue", label: "Overdue", width: 1, align: "right", color: COLORS.rose },
        { key: "rate", label: "Rate", width: 0.7, align: "right" },
      ],
      rows: buildBatchRows(reportPayload.payments.batchPerformance?.items || [], reportPayload.currency),
      emptyMessage: "No batch performance rows are available for this scope.",
    });

    drawDefinitions(doc, layout);
    finalizeDocument(doc, layout);
    doc.end();
  });

const streamStudentLedgerReportPdf = (res, reportPayload) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 0 },
      bufferPages: true,
      info: {
        Title: reportPayload.report.title,
        Author: `${INSTITUTE_NAME} Analytics`,
        Subject: reportPayload.report.headerLabel,
      },
    });

    const chunks = [];
    const layout = {
      reportMeta: reportPayload.report,
      cursorY: 0,
    };

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=\"${reportPayload.report.fileName}\"`);
        res.status(200).send(pdfBuffer);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    layout.cursorY = drawPageHeader(doc, layout.reportMeta);

    doc
      .fillColor(COLORS.sky)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(reportPayload.report.kicker.toUpperCase(), PAGE_MARGIN, layout.cursorY, {
        characterSpacing: 1,
      });

    doc
      .fillColor(COLORS.ink)
      .font("Helvetica-Bold")
      .fontSize(24)
      .text(reportPayload.report.title, PAGE_MARGIN, layout.cursorY + 16, {
        width: pageWidth(doc),
      });

    doc
      .fillColor(COLORS.slate)
      .font("Helvetica")
      .fontSize(10)
      .text(reportPayload.report.subtitle, PAGE_MARGIN, layout.cursorY + 50, {
        width: pageWidth(doc),
        lineGap: 3,
      });

    layout.cursorY += 86;

    drawSummaryBand(doc, layout, [
      { label: "Reporting Scope", value: reportPayload.report.scopeLabel },
      { label: "Generated At", value: formatDateTime(reportPayload.generatedAt) },
      { label: "Courses / Batches", value: formatNumber(reportPayload.ledger.totalBatches || 0) },
      { label: "Students Covered", value: formatNumber(reportPayload.ledger.totalStudents || 0) },
    ]);

    drawStudentLedgerReportBody(doc, layout, reportPayload);
    finalizeDocument(doc, layout);
    doc.end();
  });

module.exports = {
  streamAnalyticsReportPdf,
  streamStudentLedgerReportPdf,
};
