const Batch = require("../model/batchSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const PaymentRecord = require("../model/paymentRecordSchema");
const User = require("../model/userSchema");
const { streamAnalyticsReportPdf, streamStudentLedgerReportPdf } = require("../utils/analyticsReportPdf");
const {
  USER_ROLES,
  BATCH_STATUSES,
  ENROLLMENT_STATUSES,
  PAYMENT_METHODS,
} = require("../model/constants");

const PAID_STATUSES = ["paid_online", "paid_offline"];
const COLLECTIBLE_STATUSES = ["due", ...PAID_STATUSES];
const REPORT_VARIANTS = ["summary", "student-ledger"];
const PAYMENT_STATUS_LABELS = {
  due: "Due",
  paid_online: "Paid Online",
  paid_offline: "Paid Offline",
  waived: "Waived",
};
const PAYMENT_METHOD_LABELS = {
  bkash: "bKash",
  offline: "Offline",
  manual_adjustment: "Manual Adjustment",
};

const toMonthKey = (year, month) => `${year}-${String(month).padStart(2, "0")}`;

const toMonthLabel = (year, month) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const buildMonthWindow = (count = 6) => {
  const months = [];
  const now = new Date();

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const billingYear = cursor.getUTCFullYear();
    const billingMonth = cursor.getUTCMonth() + 1;

    months.push({
      key: toMonthKey(billingYear, billingMonth),
      billingYear,
      billingMonth,
      label: cursor.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
    });
  }

  return months;
};

const buildTrailingMonthWindow = (billingYear, billingMonth, count = 6) => {
  const months = [];
  const anchor = new Date(Date.UTC(billingYear, billingMonth - 1, 1));

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - offset, 1));
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;

    months.push({
      key: toMonthKey(year, month),
      billingYear: year,
      billingMonth: month,
      label: cursor.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
    });
  }

  return months;
};

const buildYearWindow = (billingYear) =>
  Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const cursor = new Date(Date.UTC(billingYear, index, 1));
    return {
      key: toMonthKey(billingYear, month),
      billingYear,
      billingMonth: month,
      label: cursor.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
    };
  });

const createCountMap = (items = []) =>
  items.reduce((acc, item) => {
    if (item?._id !== undefined && item?._id !== null) {
      acc[String(item._id)] = Number(item.count || 0);
    }
    return acc;
  }, {});

const parseSelectedPeriod = (billingYearParam, billingMonthParam) => {
  const hasYear = billingYearParam !== undefined && billingYearParam !== null && billingYearParam !== "";
  const hasMonth = billingMonthParam !== undefined && billingMonthParam !== null && billingMonthParam !== "";

  if (!hasYear && !hasMonth) {
    return { ok: true, value: null };
  }

  if (!hasYear || !hasMonth) {
    return {
      ok: false,
      message: "billingYear and billingMonth must be provided together.",
    };
  }

  const billingYear = Number.parseInt(billingYearParam, 10);
  const billingMonth = Number.parseInt(billingMonthParam, 10);

  if (!Number.isInteger(billingYear) || billingYear < 2000 || billingYear > 2100) {
    return {
      ok: false,
      message: "billingYear must be between 2000 and 2100.",
    };
  }

  if (!Number.isInteger(billingMonth) || billingMonth < 1 || billingMonth > 12) {
    return {
      ok: false,
      message: "billingMonth must be between 1 and 12.",
    };
  }

  return {
    ok: true,
    value: {
      billingYear,
      billingMonth,
      key: toMonthKey(billingYear, billingMonth),
      label: toMonthLabel(billingYear, billingMonth),
    },
  };
};

const parseBillingYear = (billingYearParam) => {
  const billingYear = Number.parseInt(billingYearParam, 10);

  if (!Number.isInteger(billingYear) || billingYear < 2000 || billingYear > 2100) {
    return {
      ok: false,
      message: "billingYear must be between 2000 and 2100.",
    };
  }

  return {
    ok: true,
    value: billingYear,
  };
};

const parseReportVariant = (reportVariantParam) => {
  const reportVariant = String(reportVariantParam || "summary")
    .trim()
    .toLowerCase();

  if (!REPORT_VARIANTS.includes(reportVariant)) {
    return {
      ok: false,
      message: `reportVariant must be one of: ${REPORT_VARIANTS.join(", ")}.`,
    };
  }

  return {
    ok: true,
    value: reportVariant,
  };
};

const buildPaymentMatch = (period) =>
  period
    ? {
        billingYear: period.billingYear,
        billingMonth: period.billingMonth,
      }
    : {};

const buildPaymentStatusBreakdown = (summary) => [
  {
    key: "due",
    count: summary.dueCount,
    amount: summary.dueAmount,
  },
  {
    key: "paid_online",
    count: summary.paidOnlineCount,
    amount: summary.paidOnlineAmount,
  },
  {
    key: "paid_offline",
    count: summary.paidOfflineCount,
    amount: summary.paidOfflineAmount,
  },
  {
    key: "waived",
    count: summary.waivedCount,
    amount: summary.waivedAmount,
  },
];

const normalizePaymentSummary = (row = {}) => {
  const dueCount = Number(row.dueCount || 0);
  const dueAmount = Number(row.dueAmount || 0);
  const paidOnlineCount = Number(row.paidOnlineCount || 0);
  const paidOnlineAmount = Number(row.paidOnlineAmount || 0);
  const paidOfflineCount = Number(row.paidOfflineCount || 0);
  const paidOfflineAmount = Number(row.paidOfflineAmount || 0);
  const waivedCount = Number(row.waivedCount || 0);
  const waivedAmount = Number(row.waivedAmount || 0);
  const paidCount = paidOnlineCount + paidOfflineCount;
  const collectedAmount = paidOnlineAmount + paidOfflineAmount;
  const collectibleRecords = Number(row.collectibleRecords || dueCount + paidCount);
  const collectibleAmount = Number(row.collectibleAmount || dueAmount + collectedAmount);

  return {
    records: Number(row.records || 0),
    grossAmount: Number(row.grossAmount || 0),
    collectibleRecords,
    collectibleAmount,
    dueCount,
    dueAmount,
    paidCount,
    paidOnlineCount,
    paidOnlineAmount,
    paidOfflineCount,
    paidOfflineAmount,
    collectedAmount,
    waivedCount,
    waivedAmount,
    overdueCount: Number(row.overdueCount || 0),
    overdueAmount: Number(row.overdueAmount || 0),
    collectionRate: collectibleAmount > 0 ? (collectedAmount / collectibleAmount) * 100 : 0,
    collectionRateByCount: collectibleRecords > 0 ? (paidCount / collectibleRecords) * 100 : 0,
    outstandingRate: collectibleAmount > 0 ? (dueAmount / collectibleAmount) * 100 : 0,
  };
};

const getPaymentOverview = async (match, now) => {
  const pipeline = [];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  pipeline.push({
    $group: {
      _id: null,
      records: { $sum: 1 },
      grossAmount: { $sum: "$amount" },
      collectibleRecords: {
        $sum: {
          $cond: [{ $in: ["$status", COLLECTIBLE_STATUSES] }, 1, 0],
        },
      },
      collectibleAmount: {
        $sum: {
          $cond: [{ $in: ["$status", COLLECTIBLE_STATUSES] }, "$amount", 0],
        },
      },
      dueCount: {
        $sum: {
          $cond: [{ $eq: ["$status", "due"] }, 1, 0],
        },
      },
      dueAmount: {
        $sum: {
          $cond: [{ $eq: ["$status", "due"] }, "$amount", 0],
        },
      },
      paidOnlineCount: {
        $sum: {
          $cond: [{ $eq: ["$status", "paid_online"] }, 1, 0],
        },
      },
      paidOnlineAmount: {
        $sum: {
          $cond: [{ $eq: ["$status", "paid_online"] }, "$amount", 0],
        },
      },
      paidOfflineCount: {
        $sum: {
          $cond: [{ $eq: ["$status", "paid_offline"] }, 1, 0],
        },
      },
      paidOfflineAmount: {
        $sum: {
          $cond: [{ $eq: ["$status", "paid_offline"] }, "$amount", 0],
        },
      },
      waivedCount: {
        $sum: {
          $cond: [{ $eq: ["$status", "waived"] }, 1, 0],
        },
      },
      waivedAmount: {
        $sum: {
          $cond: [{ $eq: ["$status", "waived"] }, "$amount", 0],
        },
      },
      overdueCount: {
        $sum: {
          $cond: [
            {
              $and: [{ $eq: ["$status", "due"] }, { $lt: ["$dueDate", now] }],
            },
            1,
            0,
          ],
        },
      },
      overdueAmount: {
        $sum: {
          $cond: [
            {
              $and: [{ $eq: ["$status", "due"] }, { $lt: ["$dueDate", now] }],
            },
            "$amount",
            0,
          ],
        },
      },
    },
  });

  const [row] = await PaymentRecord.aggregate(pipeline);
  return normalizePaymentSummary(row || {});
};

const getPaymentMethodBreakdown = async (match = {}) => {
  const pipeline = [];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  pipeline.push(
    {
      $match: {
        status: { $in: ["paid_online", "paid_offline", "waived"] },
      },
    },
    {
      $group: {
        _id: { $ifNull: ["$paymentMethod", "unassigned"] },
        count: { $sum: 1 },
        amount: { $sum: "$amount" },
      },
    },
    { $sort: { amount: -1, count: -1 } }
  );

  return PaymentRecord.aggregate(pipeline);
};

const getPaymentMonthlyTrend = async (monthWindow) => {
  const monthFilters = monthWindow.map((item) => ({
    billingYear: item.billingYear,
    billingMonth: item.billingMonth,
  }));

  const rows = await PaymentRecord.aggregate([
    {
      $match: {
        $or: monthFilters,
      },
    },
    {
      $group: {
        _id: {
          year: "$billingYear",
          month: "$billingMonth",
        },
        records: { $sum: 1 },
        collectibleAmount: {
          $sum: {
            $cond: [{ $in: ["$status", COLLECTIBLE_STATUSES] }, "$amount", 0],
          },
        },
        dueCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "due"] }, 1, 0],
          },
        },
        dueAmount: {
          $sum: {
            $cond: [{ $eq: ["$status", "due"] }, "$amount", 0],
          },
        },
        paidCount: {
          $sum: {
            $cond: [{ $in: ["$status", PAID_STATUSES] }, 1, 0],
          },
        },
        collectedAmount: {
          $sum: {
            $cond: [{ $in: ["$status", PAID_STATUSES] }, "$amount", 0],
          },
        },
        waivedCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "waived"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const rowMap = rows.reduce((acc, item) => {
    const key = toMonthKey(item._id.year, item._id.month);
    acc[key] = item;
    return acc;
  }, {});

  return monthWindow.map((month) => {
    const row = rowMap[month.key] || {};
    const collectibleAmount = Number(row.collectibleAmount || 0);
    const collectedAmount = Number(row.collectedAmount || 0);

    return {
      key: month.key,
      label: month.label,
      records: Number(row.records || 0),
      dueCount: Number(row.dueCount || 0),
      paidCount: Number(row.paidCount || 0),
      waivedCount: Number(row.waivedCount || 0),
      dueAmount: Number(row.dueAmount || 0),
      collectedAmount,
      collectibleAmount,
      collectionRate: collectibleAmount > 0 ? (collectedAmount / collectibleAmount) * 100 : 0,
    };
  });
};

const getBatchPerformanceRows = async (match, now) => {
  const pipeline = [];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  pipeline.push({
    $group: {
      _id: "$batch",
      records: { $sum: 1 },
      grossAmount: { $sum: "$amount" },
      studentIds: { $addToSet: "$student" },
      collectibleAmount: {
        $sum: {
          $cond: [{ $in: ["$status", COLLECTIBLE_STATUSES] }, "$amount", 0],
        },
      },
      dueCount: {
        $sum: {
          $cond: [{ $eq: ["$status", "due"] }, 1, 0],
        },
      },
      dueAmount: {
        $sum: {
          $cond: [{ $eq: ["$status", "due"] }, "$amount", 0],
        },
      },
      paidCount: {
        $sum: {
          $cond: [{ $in: ["$status", PAID_STATUSES] }, 1, 0],
        },
      },
      collectedAmount: {
        $sum: {
          $cond: [{ $in: ["$status", PAID_STATUSES] }, "$amount", 0],
        },
      },
      waivedCount: {
        $sum: {
          $cond: [{ $eq: ["$status", "waived"] }, 1, 0],
        },
      },
      waivedAmount: {
        $sum: {
          $cond: [{ $eq: ["$status", "waived"] }, "$amount", 0],
        },
      },
      overdueCount: {
        $sum: {
          $cond: [
            {
              $and: [{ $eq: ["$status", "due"] }, { $lt: ["$dueDate", now] }],
            },
            1,
            0,
          ],
        },
      },
      overdueAmount: {
        $sum: {
          $cond: [
            {
              $and: [{ $eq: ["$status", "due"] }, { $lt: ["$dueDate", now] }],
            },
            "$amount",
            0,
          ],
        },
      },
    },
  });

  return PaymentRecord.aggregate(pipeline);
};

const mergeBatchPerformance = (allBatches, rows = []) => {
  const rowMap = rows.reduce((acc, row) => {
    acc[String(row._id)] = row;
    return acc;
  }, {});

  return allBatches
    .map((batch) => {
      const row = rowMap[String(batch._id)] || {};
      const collectedAmount = Number(row.collectedAmount || 0);
      const dueAmount = Number(row.dueAmount || 0);
      const collectibleAmount = Number(row.collectibleAmount || 0);

      return {
        batchId: String(batch._id),
        name: batch.name,
        status: batch.status,
        monthlyFee: Number(batch.monthlyFee || 0),
        currency: batch.currency || "BDT",
        studentCount: Array.isArray(row.studentIds) ? row.studentIds.length : 0,
        records: Number(row.records || 0),
        grossAmount: Number(row.grossAmount || 0),
        collectibleAmount,
        collectedAmount,
        dueCount: Number(row.dueCount || 0),
        dueAmount,
        paidCount: Number(row.paidCount || 0),
        waivedCount: Number(row.waivedCount || 0),
        waivedAmount: Number(row.waivedAmount || 0),
        overdueCount: Number(row.overdueCount || 0),
        overdueAmount: Number(row.overdueAmount || 0),
        collectionRate: collectibleAmount > 0 ? (collectedAmount / collectibleAmount) * 100 : 0,
      };
    })
    .sort((a, b) => {
      if (b.collectedAmount !== a.collectedAmount) return b.collectedAmount - a.collectedAmount;
      if (b.dueAmount !== a.dueAmount) return b.dueAmount - a.dueAmount;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
};

const findBatchLeader = (items, key) =>
  [...items]
    .filter((item) => Number(item[key] || 0) > 0)
    .sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0))[0] || null;

const findStrongestCollectionRate = (items) =>
  [...items]
    .filter((item) => Number(item.collectibleAmount || 0) > 0)
    .sort((a, b) => {
      if (Number(b.collectionRate || 0) !== Number(a.collectionRate || 0)) {
        return Number(b.collectionRate || 0) - Number(a.collectionRate || 0);
      }
      return Number(b.collectedAmount || 0) - Number(a.collectedAmount || 0);
    })[0] || null;

const getPaymentStatusLabel = (status) => PAYMENT_STATUS_LABELS[status] || String(status || "-");

const getPaymentMethodLabel = (payment) => {
  if (payment?.paymentMethod) {
    return PAYMENT_METHOD_LABELS[payment.paymentMethod] || String(payment.paymentMethod);
  }

  if (payment?.status === "paid_online") return "Online";
  if (payment?.status === "paid_offline") return "Offline";
  if (payment?.status === "waived") return "Adjustment";
  return "-";
};

const getHandledByLabel = (payment) => {
  if (payment?.paidBy?.fullName) return payment.paidBy.fullName;
  if (payment?.status === "paid_online") return "Student / Gateway";
  if (payment?.status === "paid_offline") return "Admin / Staff";
  if (payment?.status === "waived") return "Admin Adjustment";
  return "-";
};

const buildDetailedLedgerPayload = async ({ now = new Date(), paymentMatch = {} }) => {
  const records = await PaymentRecord.find(paymentMatch)
    .populate("student", "fullName email phone")
    .populate("batch", "name status monthlyFee currency")
    .populate("paidBy", "fullName role")
    .sort({ batch: 1, billingYear: 1, billingMonth: 1, dueDate: 1, createdAt: 1 })
    .lean();

  const totals = {
    records: 0,
    studentIds: new Set(),
    collectedAmount: 0,
    outstandingAmount: 0,
    overdueAmount: 0,
    paidCount: 0,
    dueCount: 0,
    waivedCount: 0,
  };

  const batchGroups = new Map();

  records.forEach((payment) => {
    const batchId = String(payment.batch?._id || payment.batch || "unassigned");
    const batchName = payment.batch?.name || "Unassigned Batch";
    const group =
      batchGroups.get(batchId) ||
      {
        batchId,
        batchName,
        batchStatus: payment.batch?.status || "active",
        monthlyFee: Number(payment.batch?.monthlyFee || 0),
        currency: payment.batch?.currency || payment.currency || "BDT",
        records: 0,
        studentIds: new Set(),
        collectedAmount: 0,
        outstandingAmount: 0,
        overdueAmount: 0,
        paidCount: 0,
        dueCount: 0,
        waivedCount: 0,
        items: [],
      };

    const amount = Number(payment.amount || 0);
    const studentId = String(payment.student?._id || payment.student || `student-${group.items.length}`);
    const isDue = payment.status === "due";
    const isPaid = PAID_STATUSES.includes(payment.status);
    const isWaived = payment.status === "waived";
    const isOverdue = Boolean(isDue && payment.dueDate && new Date(payment.dueDate) < now);

    group.records += 1;
    group.studentIds.add(studentId);
    totals.records += 1;
    totals.studentIds.add(studentId);

    if (isPaid) {
      group.collectedAmount += amount;
      group.paidCount += 1;
      totals.collectedAmount += amount;
      totals.paidCount += 1;
    }

    if (isDue) {
      group.outstandingAmount += amount;
      group.dueCount += 1;
      totals.outstandingAmount += amount;
      totals.dueCount += 1;
    }

    if (isWaived) {
      group.waivedCount += 1;
      totals.waivedCount += 1;
    }

    if (isOverdue) {
      group.overdueAmount += amount;
      totals.overdueAmount += amount;
    }

    group.items.push({
      recordId: String(payment._id),
      studentName: payment.student?.fullName || "Unknown Student",
      studentEmail: payment.student?.email || "",
      studentPhone: payment.student?.phone || "",
      periodLabel: toMonthLabel(payment.billingYear, payment.billingMonth),
      billingYear: Number(payment.billingYear || 0),
      billingMonth: Number(payment.billingMonth || 0),
      amount,
      currency: payment.currency || payment.batch?.currency || "BDT",
      status: payment.status || "due",
      statusLabel: getPaymentStatusLabel(payment.status),
      paymentMethod: payment.paymentMethod || "",
      paymentMethodLabel: getPaymentMethodLabel(payment),
      dueDate: payment.dueDate || null,
      paidAt: payment.paidAt || null,
      handledBy: getHandledByLabel(payment),
      note: payment.note || "",
      isOverdue,
    });

    batchGroups.set(batchId, group);
  });

  const items = [...batchGroups.values()]
    .map((group) => ({
      ...group,
      studentCount: group.studentIds.size,
      items: [...group.items].sort((a, b) => {
        if (a.billingYear !== b.billingYear) return a.billingYear - b.billingYear;
        if (a.billingMonth !== b.billingMonth) return a.billingMonth - b.billingMonth;
        const nameCompare = String(a.studentName || "").localeCompare(String(b.studentName || ""));
        if (nameCompare !== 0) return nameCompare;
        return String(a.recordId || "").localeCompare(String(b.recordId || ""));
      }),
    }))
    .sort((a, b) => String(a.batchName || "").localeCompare(String(b.batchName || "")));

  return {
    totalRecords: totals.records,
    totalStudents: totals.studentIds.size,
    totalBatches: items.length,
    collectedAmount: totals.collectedAmount,
    outstandingAmount: totals.outstandingAmount,
    overdueAmount: totals.overdueAmount,
    paidCount: totals.paidCount,
    dueCount: totals.dueCount,
    waivedCount: totals.waivedCount,
    items,
  };
};

const buildAdminAnalyticsPayload = async ({
  now = new Date(),
  filters = {
    hasBillingPeriod: false,
    billingYear: null,
    billingMonth: null,
    label: "Overall",
  },
  paymentMatch = {},
  monthWindow = buildMonthWindow(6),
}) => {
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const hasScopedMatch = Object.keys(paymentMatch).length > 0;

  const [
    allBatches,
    totalUsers,
    activeUsers,
    newUsersLast30Days,
    recentLoginsLast7Days,
    userRoleRows,
    batchStatusRows,
    enrollmentStatusRows,
    recentEnrollmentsLast30Days,
    overallPaymentSummary,
    scopedPaymentSummary,
    scopedMethodBreakdownRows,
    monthlyTrend,
    overallBatchRows,
    scopedBatchRows,
  ] = await Promise.all([
    Batch.find({})
      .select("name status monthlyFee currency")
      .sort({ name: 1 })
      .lean(),
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: last30Days } }),
    User.countDocuments({ lastLoginAt: { $gte: last7Days } }),
    User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]),
    Batch.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    EnrollmentRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    EnrollmentRequest.countDocuments({ createdAt: { $gte: last30Days } }),
    getPaymentOverview({}, now),
    hasScopedMatch ? getPaymentOverview(paymentMatch, now) : Promise.resolve(null),
    getPaymentMethodBreakdown(hasScopedMatch ? paymentMatch : {}),
    getPaymentMonthlyTrend(monthWindow),
    getBatchPerformanceRows({}, now),
    hasScopedMatch ? getBatchPerformanceRows(paymentMatch, now) : Promise.resolve(null),
  ]);

  const userRoleMap = createCountMap(userRoleRows);
  const batchStatusMap = createCountMap(batchStatusRows);
  const enrollmentStatusMap = createCountMap(enrollmentStatusRows);

  const currentPaymentSummary = scopedPaymentSummary || overallPaymentSummary;
  const currentStatusBreakdown = buildPaymentStatusBreakdown(currentPaymentSummary);
  const overallBatchItems = mergeBatchPerformance(allBatches, overallBatchRows);
  const scopedBatchItems = hasScopedMatch
    ? mergeBatchPerformance(allBatches, scopedBatchRows || [])
    : overallBatchItems;

  return {
    generatedAt: now.toISOString(),
    currency: "BDT",
    filters: {
      hasBillingPeriod: Boolean(filters.hasBillingPeriod),
      billingYear: filters.billingYear ?? null,
      billingMonth: filters.billingMonth ?? null,
      label: filters.label || "Overall",
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: Math.max(totalUsers - activeUsers, 0),
      newLast30Days: newUsersLast30Days,
      recentLoginsLast7Days: recentLoginsLast7Days,
      roleBreakdown: USER_ROLES.map((role) => ({
        key: role,
        count: userRoleMap[role] || 0,
      })),
    },
    batches: {
      total: BATCH_STATUSES.reduce((sum, key) => sum + (batchStatusMap[key] || 0), 0),
      active: batchStatusMap.active || 0,
      upcoming: batchStatusMap.upcoming || 0,
      archived: batchStatusMap.archived || 0,
      statusBreakdown: BATCH_STATUSES.map((status) => ({
        key: status,
        count: batchStatusMap[status] || 0,
      })),
    },
    enrollments: {
      total: ENROLLMENT_STATUSES.reduce((sum, key) => sum + (enrollmentStatusMap[key] || 0), 0),
      pending: enrollmentStatusMap.pending || 0,
      approved: enrollmentStatusMap.approved || 0,
      rejected: enrollmentStatusMap.rejected || 0,
      recentLast30Days: recentEnrollmentsLast30Days,
      approvalRate:
        (enrollmentStatusMap.approved || 0) + (enrollmentStatusMap.rejected || 0) > 0
          ? ((enrollmentStatusMap.approved || 0) /
              ((enrollmentStatusMap.approved || 0) + (enrollmentStatusMap.rejected || 0))) *
            100
          : 0,
      statusBreakdown: ENROLLMENT_STATUSES.map((status) => ({
        key: status,
        count: enrollmentStatusMap[status] || 0,
      })),
    },
    payments: {
      ...currentPaymentSummary,
      period: {
        isFiltered: Boolean(filters.hasBillingPeriod),
        billingYear: filters.billingYear ?? null,
        billingMonth: filters.billingMonth ?? null,
        label: filters.label || "Overall",
      },
      overall: overallPaymentSummary,
      statusBreakdown: currentStatusBreakdown,
      methodBreakdown: PAYMENT_METHODS.map((method) => {
        const item = scopedMethodBreakdownRows.find((entry) => entry._id === method);
        return {
          key: method,
          count: Number(item?.count || 0),
          amount: Number(item?.amount || 0),
        };
      }),
      monthlyTrend,
      topBatches: scopedBatchItems.slice(0, 5),
      batchPerformance: {
        items: scopedBatchItems,
        overallItems: overallBatchItems,
        highestCollection: findBatchLeader(scopedBatchItems, "collectedAmount"),
        highestOutstanding: findBatchLeader(scopedBatchItems, "dueAmount"),
        strongestCollectionRate: findStrongestCollectionRate(scopedBatchItems),
      },
    },
  };
};

class AnalyticsController {
  static async getAdminOverview(req, res) {
    try {
      const periodResult = parseSelectedPeriod(req.query.billingYear, req.query.billingMonth);
      if (!periodResult.ok) {
        return res.status(400).json({
          success: false,
          message: periodResult.message,
        });
      }

      const now = new Date();
      const selectedPeriod = periodResult.value;
      const data = await buildAdminAnalyticsPayload({
        now,
        filters: {
          hasBillingPeriod: Boolean(selectedPeriod),
          billingYear: selectedPeriod?.billingYear ?? null,
          billingMonth: selectedPeriod?.billingMonth ?? null,
          label: selectedPeriod?.label || "Overall",
        },
        paymentMatch: buildPaymentMatch(selectedPeriod),
        monthWindow: buildMonthWindow(6),
      });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load admin analytics overview.",
        error: error.message,
      });
    }
  }

  static async downloadAdminReport(req, res) {
    try {
      const reportType = String(req.query.reportType || "").trim().toLowerCase();
      const reportVariantResult = parseReportVariant(req.query.reportVariant);
      const now = new Date();

      if (reportType !== "monthly" && reportType !== "yearly") {
        return res.status(400).json({
          success: false,
          message: "reportType must be either monthly or yearly.",
        });
      }

      if (!reportVariantResult.ok) {
        return res.status(400).json({
          success: false,
          message: reportVariantResult.message,
        });
      }

      const reportVariant = reportVariantResult.value;
      let data;
      let ledger;
      let report;
      let paymentMatch = {};

      if (reportType === "monthly") {
        const periodResult = parseSelectedPeriod(req.query.billingYear, req.query.billingMonth);
        if (!periodResult.ok || !periodResult.value) {
          return res.status(400).json({
            success: false,
            message: periodResult.message || "billingYear and billingMonth are required for monthly reports.",
          });
        }

        const period = periodResult.value;
        paymentMatch = buildPaymentMatch(period);
        data = await buildAdminAnalyticsPayload({
          now,
          filters: {
            hasBillingPeriod: true,
            billingYear: period.billingYear,
            billingMonth: period.billingMonth,
            label: period.label,
          },
          paymentMatch,
          monthWindow: buildTrailingMonthWindow(period.billingYear, period.billingMonth, 6),
        });

        if (reportVariant === "student-ledger") {
          ledger = await buildDetailedLedgerPayload({
            now,
            paymentMatch,
          });
        }

        report =
          reportVariant === "student-ledger"
            ? {
                type: "monthly",
                variant: "student-ledger",
                kicker: "Monthly Student Ledger",
                title: `${period.label} Student Payment Ledger`,
                subtitle:
                  "A course-wise monthly ledger covering every student payment record, billing state, settlement channel, and follow-up indicator for the selected billing cycle.",
                scopeLabel: period.label,
                headerLabel: `Monthly student ledger • ${period.label}`,
                footerLabel: `Monthly student ledger • ${period.label}`,
                fileName: `student-payment-ledger-monthly-${period.key}.pdf`,
              }
            : {
                type: "monthly",
                variant: "summary",
                kicker: "Monthly Report",
                title: `${period.label} Analytics Report`,
                subtitle:
                  "A professional monthly operations and finance report covering collections, outstanding dues, channel mix, and batch-level performance for the selected billing cycle.",
                scopeLabel: period.label,
                headerLabel: `Monthly report • ${period.label}`,
                footerLabel: `Monthly analytics • ${period.label}`,
                trendTitle: `Rolling 6-month finance trend ending ${period.label}`,
                trendSubtitle: `Monthly performance comparison leading into ${period.label}.`,
                fileName: `analytics-report-monthly-${period.key}.pdf`,
              };
      } else {
        const yearResult = parseBillingYear(req.query.billingYear);
        if (!yearResult.ok) {
          return res.status(400).json({
            success: false,
            message: yearResult.message,
          });
        }

        const billingYear = yearResult.value;
        paymentMatch = { billingYear };
        data = await buildAdminAnalyticsPayload({
          now,
          filters: {
            hasBillingPeriod: false,
            billingYear,
            billingMonth: null,
            label: `${billingYear} Annual Scope`,
          },
          paymentMatch,
          monthWindow: buildYearWindow(billingYear),
        });

        if (reportVariant === "student-ledger") {
          ledger = await buildDetailedLedgerPayload({
            now,
            paymentMatch,
          });
        }

        report =
          reportVariant === "student-ledger"
            ? {
                type: "yearly",
                variant: "student-ledger",
                kicker: "Yearly Student Ledger",
                title: `${billingYear} Student Payment Ledger`,
                subtitle:
                  "A course-wise annual ledger covering every student payment record, monthly billing period, settlement channel, and payment exception across the selected year.",
                scopeLabel: String(billingYear),
                headerLabel: `Yearly student ledger • ${billingYear}`,
                footerLabel: `Yearly student ledger • ${billingYear}`,
                fileName: `student-payment-ledger-yearly-${billingYear}.pdf`,
              }
            : {
                type: "yearly",
                variant: "summary",
                kicker: "Yearly Report",
                title: `${billingYear} Annual Analytics Report`,
                subtitle:
                  "An annual admin report covering month-by-month finance performance, channel mix, platform operations, and full batch performance for the selected year.",
                scopeLabel: String(billingYear),
                headerLabel: `Yearly report • ${billingYear}`,
                footerLabel: `Annual analytics • ${billingYear}`,
                trendTitle: `${billingYear} monthly collection performance`,
                trendSubtitle: `Month-by-month finance performance for the ${billingYear} reporting year.`,
                fileName: `analytics-report-yearly-${billingYear}.pdf`,
              };
      }

      if (reportVariant === "student-ledger") {
        await streamStudentLedgerReportPdf(res, {
          ...data,
          ledger,
          report,
        });
      } else {
        await streamAnalyticsReportPdf(res, {
          ...data,
          report,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate admin analytics report.",
        error: error.message,
      });
    }
  }
}

module.exports = AnalyticsController;
