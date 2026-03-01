const Batch = require("../model/batchSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const PaymentRecord = require("../model/paymentRecordSchema");
const { canAccessBatch, isAdmin, isValidObjectId } = require("../utils/batchAccess");

const buildDueDateUTC = (year, month, day) => {
  const safeDay = Math.max(1, Math.min(28, Number(day) || 1));
  return new Date(Date.UTC(year, month - 1, safeDay));
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
      const { status, billingYear, billingMonth } = req.query;

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
      if (billingYear) {
        query.billingYear = Number(billingYear);
      }
      if (billingMonth) {
        query.billingMonth = Number(billingMonth);
      }

      const payments = await PaymentRecord.find(query)
        .populate("student", "fullName email phone")
        .populate("paidBy", "fullName role")
        .sort({ billingYear: -1, billingMonth: -1, createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: payments.length,
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
      const { status, billingYear, billingMonth } = req.query;
      const query = {};

      if (status) {
        query.status = status;
      }
      if (billingYear) {
        query.billingYear = Number(billingYear);
      }
      if (billingMonth) {
        query.billingMonth = Number(billingMonth);
      }

      const payments = await PaymentRecord.find(query)
        .populate("student", "fullName email")
        .populate("batch", "name slug")
        .populate("paidBy", "fullName role")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: payments.length,
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

      if (batchId) {
        if (!isValidObjectId(batchId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid batchId.",
          });
        }

        const batch = await Batch.findById(batchId).select(
          "_id monthlyFee currency paymentDueDay status autoGenerateMonthlyDues"
        );

        if (!batch) {
          return res.status(404).json({
            success: false,
            message: "Batch not found.",
          });
        }

        targetBatchIds = [batch._id];
        batchMap.set(String(batch._id), batch);
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
      }).select("_id student batch");

      if (approvedEnrollments.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No approved students found for due generation.",
          generated: 0,
        });
      }

      const operations = approvedEnrollments.map((enrollment) => {
        const batch = batchMap.get(String(enrollment.batch));
        const dueDate = buildDueDateUTC(year, month, batch?.paymentDueDay || 1);

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

      const payment = await PaymentRecord.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment record not found.",
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
}

module.exports = PaymentController;
