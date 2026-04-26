const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/authenticate");
const { validateRequest } = require("../middleware/validate");
const { getMe, getDashboard, updateMe, changePassword, submitKyc } = require("./user.controller");

const router = express.Router();

router.use(authenticate);

router.get("/me", getMe);
router.get("/dashboard", getDashboard);

router.patch(
  "/me",
  [
    body("firstName").optional().isString().trim().notEmpty(),
    body("lastName").optional().isString().trim().notEmpty(),
    body("phone").optional({ nullable: true }).isMobilePhone(),
    body("country").optional({ nullable: true }).isString().trim(),
    validateRequest,
  ],
  updateMe,
);

router.post(
  "/change-password",
  [
    body("currentPassword").isString().notEmpty(),
    body("newPassword").isLength({ min: 8 }),
    validateRequest,
  ],
  changePassword,
);

router.post(
  "/kyc",
  [
    body("documents").isArray({ min: 1 }),
    body("documents.*.type").isIn(["passport", "national_id", "drivers_license", "utility_bill", "bank_statement"]),
    body("documents.*.fileUrl").isURL(),
    validateRequest,
  ],
  submitKyc,
);

module.exports = { userRoutes: router };
