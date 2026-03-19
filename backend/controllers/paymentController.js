const Batch = require("../model/batchSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const PaymentRecord = require("../model/paymentRecordSchema");
const User = require("../model/userSchema");
const { canAccessBatch, isAdmin, isValidObjectId } = require("../utils/batchAccess");
const Notification = require("../model/notificationSchema");
const { getBkashToken, createBkashPayment, executeBkashPayment } = require("../utils/bkash");
const { sendPaymentReceiptEmail, sendPaymentWaivedEmail } = require("../utils/email");

const buildDueDateUTC = (year, month, day) => {
  const safeDay = Math.max(1, Math.min(28, Number(day) || 1));
  return new Date(Date.UTC(year, month - 1, safeDay));
};

const parsePagination = (pageParam, limitParam) => {
  const parsedPage = Number.parseInt(pageParam, 10);
  const parsedLimit = Number.parseInt(limitParam, 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, 50)
    : 10;

  return { page, limit };
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const applyStudentSearchFilter = async (query, searchValue) => {
  const trimmed = String(searchValue || "").trim();
  if (!trimmed) return;

  const matchingStudents = await User.find({
    role: "student",
    fullName: { $regex: escapeRegex(trimmed), $options: "i" },
  })
    .select("_id")
    .lean();

  query.student = { $in: matchingStudents.map((item) => item._id) };
};

const getPaymentSummary = async (query) => {
  const groupedSummary = await PaymentRecord.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totals = groupedSummary.reduce(
    (acc, item) => {
      if (item?._id) {
        acc[item._id] = item.count;
      }
      acc.total += item.count || 0;
      return acc;
    },
    { total: 0 }
  );

  const due = totals.due || 0;
  const paidOnline = totals.paid_online || 0;
  const paidOffline = totals.paid_offline || 0;
  const waived = totals.waived || 0;

  return {
    total: totals.total,
    due,
    paidOnline,
    paidOffline,
    waived,
    paid: paidOnline + paidOffline,
  };
};

class PaymentController {
  static async listMyPayments(req, res) {
    try {
      const payments = await PaymentRecord.find({ student: req.user._id })
        .populate("batch", "name slug monthlyFee currency")
        .sort({ billingYear: -1, billingMonth: -1, createdAt: -1 });

      const summary = payments.reduce(
        (acc, item) => {
          if (item.status === "due") {
            acc.totalDue += item.amount;
            acc.dueCount += 1;
          } else if (item.status === "paid_online" || item.status === "paid_offline") {
            acc.totalPaid += item.amount;
            acc.paidCount += 1;
          }
          return acc;
        },
        { totalDue: 0, totalPaid: 0, dueCount: 0, paidCount: 0 }
      );

      return res.status(200).json({
        success: true,
        count: payments.length,
        summary,
        data: payments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load your payments.",
        error: error.message,
      });
    }
  }

  static async listBatchPayments(req, res) {
    try {
      const { batchId } = req.params;
      const { status, billingYear, billingMonth, page, limit, search } = req.query;

      if (!isValidObjectId(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid batchId.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, batchId));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to view payments for this batch.",
        });
      }

      const query = { batch: batchId };
      if (status) {
        query.status = status;
      }
      if (billingYear && Number(billingYear) > 0) {
        query.billingYear = Number(billingYear);
      }
      if (billingMonth && Number(billingMonth) > 0) {
        query.billingMonth = Number(billingMonth);
      }

      await applyStudentSearchFilter(query, search);

      const summary = await getPaymentSummary(query);
      const { page: requestedPage, limit: pageSize } = parsePagination(page, limit);
      const totalPages = Math.max(1, Math.ceil(summary.total / pageSize));
      const currentPage = Math.min(requestedPage, totalPages);
      const skip = (currentPage - 1) * pageSize;

      const payments = await PaymentRecord.find(query)
        .populate("student", "fullName email phone role")
        .populate("paidBy", "fullName role")
        .sort({ billingYear: -1, billingMonth: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

      return res.status(200).json({
        success: true,
        count: summary.total,
        summary,
        pagination: {
          page: currentPage,
          limit: pageSize,
          total: summary.total,
          pages: totalPages,
        },
        data: payments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to list batch payments.",
        error: error.message,
      });
    }
  }

  static async listGlobalPayments(req, res) {
    try {
      const {
        status,
        billingYear,
        billingMonth,
        page,
        limit,
        search,
        summaryOnly,
      } = req.query;
      const query = {};

      if (status) {
        query.status = status;
      }
      if (billingYear && Number(billingYear) > 0) {
        query.billingYear = Number(billingYear);
      }
      if (billingMonth && Number(billingMonth) > 0) {
        query.billingMonth = Number(billingMonth);
      }

      await applyStudentSearchFilter(query, search);
      const summary = await getPaymentSummary(query);

      if (String(summaryOnly) === "true") {
        return res.status(200).json({
          success: true,
          count: summary.total,
          summary,
          data: [],
        });
      }

      const { page: requestedPage, limit: pageSize } = parsePagination(page, limit);
      const totalPages = Math.max(1, Math.ceil(summary.total / pageSize));
      const currentPage = Math.min(requestedPage, totalPages);
      const skip = (currentPage - 1) * pageSize;

      const payments = await PaymentRecord.find(query)
        .populate("student", "fullName email role")
        .populate("batch", "name slug")
        .populate("paidBy", "fullName role")
        .sort({ billingYear: -1, billingMonth: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

      return res.status(200).json({
        success: true,
        count: summary.total,
        summary,
        pagination: {
          page: currentPage,
          limit: pageSize,
          total: summary.total,
          pages: totalPages,
        },
        data: payments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to list global payments.",
        error: error.message,
      });
    }
  }

  static async generateMonthlyDues(req, res) {
    try {
      const now = new Date();
      const year = Number(req.body.billingYear || now.getUTCFullYear());
      const month = Number(req.body.billingMonth || now.getUTCMonth() + 1);
      const batchId = req.body.batchId;
      const batchIds = req.body.batchIds;
      const billingMonthStart = new Date(Date.UTC(year, month - 1, 1));
      const nextMonthStart = new Date(Date.UTC(year, month, 1));

      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return res.status(400).json({
          success: false,
          message: "billingYear must be a valid year.",
        });
      }

      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: "billingMonth must be between 1 and 12.",
        });
      }

      let targetBatchIds = [];
      let batchMap = new Map();

      // Handle multi-select (batchIds array) or single-select (batchId string)
      const hasExplicitBatchIds = Array.isArray(batchIds);
      const requestedBatchIds = hasExplicitBatchIds 
        ? batchIds 
        : (batchId ? [batchId] : []);

      if (hasExplicitBatchIds || batchId) {
        // Validate and fetch all requested batches
        const validBatchIds = requestedBatchIds.filter(id => isValidObjectId(id));
        
        if (validBatchIds.length === 0 && (hasExplicitBatchIds ? requestedBatchIds.length > 0 : true)) {
          return res.status(400).json({
            success: false,
            message: "No valid batch IDs provided.",
          });
        }

        // If explicitly empty multi-select, generated count is 0
        if (hasExplicitBatchIds && requestedBatchIds.length === 0) {
          return res.status(200).json({
            success: true,
            message: "No batches selected for generation.",
            generated: 0,
          });
        }

        const batches = await Batch.find({
          _id: { $in: validBatchIds }
        }).select("_id monthlyFee currency paymentDueDay status autoGenerateMonthlyDues");

        if (batches.length === 0) {
          return res.status(404).json({
            success: false,
            message: "No matching batches found.",
          });
        }

        targetBatchIds = batches.map(b => b._id);
        batchMap = new Map(batches.map(b => [String(b._id), b]));
      } else {
        const batches = await Batch.find({
          status: { $in: ["upcoming", "active"] },
          autoGenerateMonthlyDues: true,
        }).select("_id monthlyFee currency paymentDueDay status autoGenerateMonthlyDues");

        targetBatchIds = batches.map((batch) => batch._id);
        batchMap = new Map(batches.map((batch) => [String(batch._id), batch]));
      }

      if (targetBatchIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No eligible batches found for due generation.",
          generated: 0,
        });
      }

      const approvedEnrollments = await EnrollmentRequest.find({
        batch: { $in: targetBatchIds },
        status: "approved",
      })
        .select("_id student batch approvedAt reviewedAt createdAt")
        .lean();

      if (approvedEnrollments.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No approved students found for due generation.",
          generated: 0,
        });
      }

      const uniqueStudentIds = [...new Set(approvedEnrollments.map((item) => String(item.student)))];
      const studentUsers = await User.find({
        _id: { $in: uniqueStudentIds },
        role: "student",
      })
        .select("_id")
        .lean();
      const allowedStudentIds = new Set(studentUsers.map((item) => String(item._id)));

      const eligibleEnrollments = approvedEnrollments.filter((item) => {
        if (!allowedStudentIds.has(String(item.student))) {
          return false;
        }

        // In post-payment model, students enrolled ANYTIME during the month pay on next month start.
        const approvedAt = item.approvedAt || item.reviewedAt || item.createdAt;
        if (!approvedAt) {
          return false;
        }
        return new Date(approvedAt) < nextMonthStart;
      });

      if (eligibleEnrollments.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No eligible student enrollments found for due generation.",
          generated: 0,
        });
      }

      const studentMap = {};
      const operations = eligibleEnrollments.map((enrollment) => {
        const batch = batchMap.get(String(enrollment.batch));
        // Due date is in the month FOLLOWING the teaching month.
        const dueDate = buildDueDateUTC(year, month + 1, batch?.paymentDueDay || 1);

        // Group by student for the unified email later
        const sid = enrollment.student.toString();
        if (!studentMap[sid]) studentMap[sid] = [];
        studentMap[sid].push({
            ...enrollment,
            batch,
            billingYear: year,
            billingMonth: month,
            amount: batch?.monthlyFee || 0,
            currency: batch?.currency || "BDT"
        });

        return {
          updateOne: {
            filter: {
              student: enrollment.student,
              batch: enrollment.batch,
              billingYear: year,
              billingMonth: month,
            },
            update: {
              $setOnInsert: {
                enrollmentRequest: enrollment._id,
                amount: batch?.monthlyFee || 0,
                currency: batch?.currency || "BDT",
                dueDate,
                status: "due",
                isAutoGenerated: true,
              },
            },
            upsert: true,
          },
        };
      });

      const result = await PaymentRecord.bulkWrite(operations);

      // --- Broadcast "Payment Due" Notifications ---
      if (result.upsertedCount > 0) {
        try {
          const Notification = require("../model/notificationSchema");
          const monthName = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", { month: "long" });

          const dueNotifications = eligibleEnrollments.map((env) => ({
            recipient: env.student,
            title: "New Payment Due",
            message: `Monthly fee for ${monthName} ${year} is now due. Please complete your payment.`,
            type: "payment_due",
            link: "/payments",
          }));

          // Bulk insert notifications
          await Notification.insertMany(dueNotifications, { ordered: false });
          console.log(`Generated ${dueNotifications.length} payment due notifications.`);
        } catch (notifErr) {
          // ignore duplicate errors if some already have it
          console.error("Failed to broadcast monthly due notifications:", notifErr);
        }
      }

      // --- Unified Email Dispatch Trigger ---
      try {
        const { sendDuesBulk } = require("../utils/email");
        
        // Find students with their email addresses
        const billedStudents = await User.find({ _id: { $in: uniqueStudentIds } }).select("fullName email");
        const studentObjMap = new Map(billedStudents.map(s => [s._id.toString(), s]));

        // Prepare the payload for the chunked sender
        const studentDueList = [];
        Object.keys(studentMap).forEach(sid => {
            const student = studentObjMap.get(sid);
            if (student && student.email) {
                studentDueList.push({ student, dues: studentMap[sid] });
            }
        });

        // Trigger the asynchronous chunked sender in the background
        if (studentDueList.length > 0) {
            sendDuesBulk(studentDueList).catch(err => 
              console.error("[Controller Error]: Failed spawning due email bulk sender:", err)
            );
        }
      } catch (err) {
        console.error("[Controller Error]: Failed preparing bulk due emails:", err);
      }

      return res.status(200).json({
        success: true,
        message: "Monthly dues generation completed.",
        generated: result.upsertedCount || 0,
        matched: result.matchedCount || 0,
        modified: result.modifiedCount || 0,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate monthly dues.",
        error: error.message,
      });
    }
  }

  static async markPaymentOfflinePaid(req, res) {
    try {
      const { paymentId } = req.params;
      const { note } = req.body;

      if (!isValidObjectId(paymentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid paymentId.",
        });
      }

      const payment = await PaymentRecord.findById(paymentId).populate("batch", "name");
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment record not found.",
        });
      }

      const paymentStudent = await User.findById(payment.student).select("role fullName email");
      if (!paymentStudent || paymentStudent.role !== "student") {
        return res.status(400).json({
          success: false,
          message: "Payments are only available for student accounts.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, payment.batch));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to update payment for this batch.",
        });
      }

      payment.status = "paid_offline";
      payment.paymentMethod = "offline";
      payment.paidAt = new Date();
      payment.paidBy = req.user._id;
      payment.note = note || payment.note;
      await payment.save();

      // Send Payment Receipt Email (Offline trigger)
      if (paymentStudent.email) {
        sendPaymentReceiptEmail(paymentStudent, payment).catch(err => console.error("Payment email failed:", err));
      }

      try {
        const monthName = new Date(Date.UTC(payment.billingYear, payment.billingMonth - 1, 1)).toLocaleDateString("en-US", { month: "long" });
        await Notification.create({
          recipient: payment.student,
          title: "Offline Payment Verified",
          message: `Your manual payment of ${payment.amount} BDT for ${monthName} ${payment.billingYear} has been approved by an administrator.`,
          type: "offline_payment_verified",
          link: "/payments"
        });
      } catch (notifErr) {
        console.error("Failed to create offline payment notification:", notifErr);
      }

      return res.status(200).json({
        success: true,
        message: "Payment marked as paid offline.",
        data: payment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to mark payment offline.",
        error: error.message,
      });
    }
  }

  static async waivePayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { note } = req.body;

      if (!isValidObjectId(paymentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid paymentId.",
        });
      }

      const payment = await PaymentRecord.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment record not found.",
        });
      }

      if (payment.status !== "due") {
        return res.status(400).json({
          success: false,
          message: "Only due payments can be waived.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, payment.batch));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to waive payment for this batch.",
        });
      }

      payment.status = "waived";
      payment.paymentMethod = "manual_adjustment";
      payment.paidBy = req.user._id;
      payment.note = note || "Payment waived by staff";
      await payment.save();

      // Populate for notification and email
      await payment.populate([
        { path: "student", select: "fullName email" },
        { path: "batch", select: "name" }
      ]);

      try {
        const monthName = new Date(Date.UTC(payment.billingYear, payment.billingMonth - 1, 1)).toLocaleDateString("en-US", { month: "long" });
        
        // 1. In-App Notification
        await Notification.create({
          recipient: payment.student._id,
          title: "Payment Waived",
          message: `Your monthly fee for ${monthName} ${payment.billingYear} has been waived.`,
          type: "payment_waived",
          link: "/payments"
        });

        // 2. Email Notification
        await sendPaymentWaivedEmail(payment.student, payment);
        
      } catch (notifErr) {
        console.error("Failed to deliver waive payment notifications:", notifErr);
      }

      return res.status(200).json({
        success: true,
        message: "Payment marked as waived.",
        data: payment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to waive payment.",
        error: error.message,
      });
    }
  }

  static async markPaymentOnlinePaid(req, res) {
    try {
      const { paymentId } = req.params;
      const { bkashPaymentId, bkashTransactionId, merchantInvoiceNumber, note } = req.body;

      if (!isValidObjectId(paymentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid paymentId.",
        });
      }

      const payment = await PaymentRecord.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment record not found.",
        });
      }

      const paymentStudent = await User.findById(payment.student).select("role");
      if (!paymentStudent || paymentStudent.role !== "student") {
        return res.status(400).json({
          success: false,
          message: "Payments are only available for student accounts.",
        });
      }

      const isOwner = String(payment.student) === String(req.user._id);
      const canForceUpdate = isAdmin(req.user);

      if (!isOwner && !canForceUpdate) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to pay this payment record.",
        });
      }

      payment.status = "paid_online";
      payment.paymentMethod = "bkash";
      payment.bkashPaymentId = bkashPaymentId || payment.bkashPaymentId;
      payment.bkashTransactionId = bkashTransactionId || payment.bkashTransactionId;
      payment.merchantInvoiceNumber = merchantInvoiceNumber || payment.merchantInvoiceNumber;
      payment.paidAt = new Date();
      payment.note = note || payment.note;
      await payment.save();

      return res.status(200).json({
        success: true,
        message: "Payment marked as paid online.",
        data: payment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to mark payment online.",
        error: error.message,
      });
    }
  }

  static async createBkashPayment(req, res) {
    try {
      const { paymentId } = req.body;

      if (!isValidObjectId(paymentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid paymentId.",
        });
      }

      const payment = await PaymentRecord.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment record not found.",
        });
      }

      if (String(payment.student) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "You can only pay for your own dues.",
        });
      }

      if (payment.status !== "due") {
        return res.status(400).json({
          success: false,
          message: "This payment is not due.",
        });
      }

      // Use a timestamp to foil "Duplicate for all transactions"
      const merchantInvoiceNumber = `${payment._id.toString()}_${Math.floor(Date.now() / 1000)}`;

      const bkashResponse = await createBkashPayment({
        amount: payment.amount,
        payerReference: payment._id.toString(), // Internal tracking ID sent back on callback URL
        merchantInvoiceNumber: merchantInvoiceNumber // Strict bKash uniqueness
      });

      if (bkashResponse && bkashResponse.bkashURL) {
        return res.status(200).json({
          success: true,
          bkashURL: bkashResponse.bkashURL,
        });
      }

      throw new Error("bKash gateway did not return a valid redirect URL.");
    } catch (error) {
      console.error("[Controller Create Error]:", error);
      const apiError = error.response?.data?.statusMessage || error.response?.data?.message || error.message;
      return res.status(500).json({
        success: false,
        message: `Failed to create bKash checkout URL: ${apiError}`,
        error: error.message,
        details: error.response?.data
      });
    }
  }

  static async executeBkashPayment(req, res) {
    try {
      const { paymentID, paymentId: ourPaymentId } = req.body;

      if (!paymentID || !isValidObjectId(ourPaymentId)) {
        return res.status(400).json({
          success: false,
          message: "bKash paymentID and existing internal paymentId are required.",
        });
      }

      const paymentRecord = await PaymentRecord.findById(ourPaymentId).populate("batch", "name");
      if (!paymentRecord || String(paymentRecord.student) !== String(req.user._id)) {
        return res.status(404).json({
          success: false,
          message: "Associated payment record not found.",
        });
      }

      if (paymentRecord.status !== "due") {
        return res.status(400).json({
          success: false,
          message: "Payment is already processed.",
        });
      }

      // Execute Bkash Transaction
      let executeResponse;
      try {
        executeResponse = await executeBkashPayment(paymentID);
      } catch (err) {
        // If it's already completed at the gateway but we missed it, treat as success for recovery
        if (err.message.includes("already been completed") || err.message.includes("2062")) {
          // Fallback to minimal data if we can't get the full payload during recovery
          executeResponse = {
            statusCode: "0000",
            transactionStatus: "Completed",
            paymentID: paymentID,
            trxID: "RECOVERED_" + Date.now().toString(),
            merchantInvoiceNumber: paymentRecord.merchantInvoiceNumber
          };
        } else {
          throw err;
        }
      }

      // Verify Status Complete (0000 = Success, 2029 = Duplicate execution, 2062 = Already completed)
      const isSuccess = executeResponse && executeResponse.statusCode === "0000" && executeResponse.transactionStatus === "Completed";
      const isRecovered = executeResponse && (executeResponse.statusCode === "2029" || executeResponse.statusCode === "2062");

      if (isSuccess || isRecovered) {
        paymentRecord.status = "paid_online";
        paymentRecord.paymentMethod = "bkash";
        paymentRecord.bkashPaymentId = executeResponse.paymentID || paymentID;
        paymentRecord.bkashTransactionId = executeResponse.trxID || ("RECOVERED_" + Date.now().toString());
        paymentRecord.merchantInvoiceNumber = executeResponse.merchantInvoiceNumber || paymentRecord.merchantInvoiceNumber;

        // bKash sends non-standard "2026-03-14T20:12:54:406 GMT+0600" where the last colon before ms breaks 'new Date()'.
        // We normalize it to "2026-03-14T20:12:54.406 GMT+0600" first.
        let parsedDate = new Date();
        if (executeResponse.paymentExecuteTime) {
          const rawDateStr = executeResponse.paymentExecuteTime;
          const normalizedDateStr = rawDateStr.replace(/:(\d{3})\sGMT/, '.$1 GMT');
          const attemptedDate = new Date(normalizedDateStr);
          if (!isNaN(attemptedDate.getTime())) {
            parsedDate = attemptedDate;
          }
        }

        paymentRecord.paidAt = parsedDate;
        await paymentRecord.save();

        // Send Payment Receipt Email (bKash online trigger)
        try {
           const studentUser = await User.findById(paymentRecord.student).select("fullName email");
           if (studentUser && studentUser.email) {
             sendPaymentReceiptEmail(studentUser, paymentRecord).catch(err => console.error("Payment email failed:", err));
           }
        } catch (emailErr) {
           console.error("Failed fetching user to send email:", emailErr);
        }

        // --- Notification Triggers ---
        try {
          // 1. Notify Student
          const monthName = new Date(Date.UTC(paymentRecord.billingYear, paymentRecord.billingMonth - 1, 1)).toLocaleDateString("en-US", { month: "long" });
          await Notification.create({
            recipient: paymentRecord.student,
            title: "Payment Successful",
            message: `Your payment of ${paymentRecord.amount} BDT for ${monthName} ${paymentRecord.billingYear} was successful.`,
            type: "payment_success",
            link: "/payments"
          });

          // 2. Notify Global Admins
          await Notification.create({
            isGlobalAdmin: true,
            title: "New Payment Received",
            message: `A payment of ${paymentRecord.amount} BDT was received.`,
            type: "payment_success",
            link: "/payments",
          });
        } catch (notifErr) {
          console.error("Failed to create notifications for bKash success:", notifErr);
        }

        return res.status(200).json({
          success: true,
          message: "Payment successfully verified and executed.",
          data: paymentRecord,
        });
      }

      throw new Error(`bKash declined: ${executeResponse?.statusMessage || "Unknown Gateway Error"} (${executeResponse?.statusCode})`);
    } catch (error) {
      console.error("[Controller Execute Error]:", error);
      return res.status(500).json({
        success: false,
        message: "Execution failed.",
        error: error.message,
      });
    }
  }
}

module.exports = PaymentController;
