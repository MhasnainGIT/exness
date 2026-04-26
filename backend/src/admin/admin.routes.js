const express = require("express");
const { body } = require("express-validator");
const { authenticate, requireRole } = require("../middleware/authenticate");
const { validateRequest } = require("../middleware/validate");
const {
  adminSummaryController,
  listUsersController,
  getUserDetailController,
  updateKycController,
  toggleUserController,
  listWithdrawalsController,
  processWithdrawalController,
  listPositionsController,
  auditLogsController,
} = require("./admin.controller");

const router = express.Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/summary", adminSummaryController);

// Users
router.get("/users", listUsersController);
router.get("/users/:userId", getUserDetailController);
router.patch(
  "/users/:userId/kyc",
  [
    body("status").isIn(["PENDING", "VERIFIED", "REJECTED"]),
    body("reviewNote").optional().isString().trim(),
    validateRequest,
  ],
  updateKycController,
);
router.patch("/users/:userId/toggle", toggleUserController);

// Withdrawals
router.get("/withdrawals", listWithdrawalsController);
router.get("/withdrawals/pending", listWithdrawalsController);
router.patch(
  "/withdrawals/:txId/process",
  [body("action").isIn(["APPROVE", "REJECT"]), validateRequest],
  processWithdrawalController,
);
router.patch(
  "/withdrawals/:txId",
  [body("action").isIn(["APPROVE", "REJECT"]), validateRequest],
  processWithdrawalController,
);

// Positions
router.get("/positions", listPositionsController);

// Audit logs
router.get("/audit-logs", auditLogsController);

module.exports = { adminRoutes: router };
