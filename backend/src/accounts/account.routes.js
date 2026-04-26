const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/authenticate");
const { validateRequest } = require("../middleware/validate");
const { create, list, getOne, updateLeverage, renameAccount, archiveAccount, restoreAccount } = require("./account.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", list);
router.get("/:accountId", getOne);

router.post(
  "/",
  [
    body("accountType").optional().isIn(["DEMO", "LIVE"]),
    body("leverage").optional().isInt({ min: 1, max: 2000 }),
    body("baseCurrency").optional().isIn(["USD", "EUR", "GBP", "BTC", "ETH"]),
    body("platform").optional().isIn(["webtrader", "mt4", "mt5"]),
    validateRequest,
  ],
  create,
);

router.patch(
  "/:accountId/leverage",
  [body("leverage").isInt({ min: 1, max: 2000 }), validateRequest],
  updateLeverage,
);

router.patch(
  "/:accountId/rename",
  [body("name").isString().trim().isLength({ min: 1, max: 50 }), validateRequest],
  renameAccount,
);

router.patch("/:accountId/archive", archiveAccount);
router.patch("/:accountId/restore", restoreAccount);

module.exports = { accountRoutes: router };
