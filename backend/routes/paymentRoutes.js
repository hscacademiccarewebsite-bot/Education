const express = require("express");
const PaymentController = require("../controllers/paymentController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(AuthMiddleware.requireAuth);

router.get("/my", AuthMiddleware.requireRoles("student"), PaymentController.listMyPayments);

router.get(
  "/batch/:batchId",
  AuthMiddleware.requireRoles("admin", "moderator"),
  PaymentController.listBatchPayments
);

router.get("/global", AuthMiddleware.requireRoles("admin"), PaymentController.listGlobalPayments);

router.post("/generate-dues", AuthMiddleware.requireRoles("admin"), PaymentController.generateMonthlyDues);

router.patch(
  "/:paymentId/mark-offline-paid",
  AuthMiddleware.requireRoles("admin", "moderator"),
  PaymentController.markPaymentOfflinePaid
);

router.patch(
  "/:paymentId/waive",
  AuthMiddleware.requireRoles("admin", "moderator"),
  PaymentController.waivePayment
);

router.patch(
  "/:paymentId/mark-online-paid",
  AuthMiddleware.requireRoles("admin", "student"),
  PaymentController.markPaymentOnlinePaid
);

router.post(
  "/bkash/create",
  AuthMiddleware.requireRoles("student"),
  PaymentController.createBkashPayment
);

router.post(
  "/bkash/execute",
  AuthMiddleware.requireRoles("student"),
  PaymentController.executeBkashPayment
);

module.exports = router;
