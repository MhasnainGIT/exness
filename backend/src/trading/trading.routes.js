const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/authenticate");
const { validateRequest } = require("../middleware/validate");
const {
  placeOrderController,
  listPositionsController,
  closePositionController,
  modifyPositionController,
  orderHistoryController,
  tradingOverviewController,
  listPositionHistoryController,
  cancelOrderController,
  createAccountController,
} = require("./trading.controller");

const router = express.Router();

router.use(authenticate);

router.get("/overview", tradingOverviewController);
router.get("/positions", listPositionsController);
router.get("/positions/history", listPositionHistoryController);
router.get("/orders/history", orderHistoryController);
router.delete("/orders/:orderId", cancelOrderController);

router.post(
  "/orders",
  [
    body("tradingAccountId").isString().notEmpty(),
    body("instrumentSymbol").isString().notEmpty(),
    body("side").isIn(["BUY", "SELL"]),
    body("type").optional().isIn(["MARKET", "LIMIT", "STOP"]),
    body("volumeLots").isFloat({ gt: 0 }),
    body("stopLoss").optional().isFloat({ gt: 0 }),
    body("takeProfit").optional().isFloat({ gt: 0 }),
    validateRequest,
  ],
  placeOrderController,
);

router.post("/positions/:positionId/close", closePositionController);

router.patch(
  "/positions/:positionId",
  [
    body("stopLoss").optional({ nullable: true }).isFloat({ gt: 0 }),
    body("takeProfit").optional({ nullable: true }).isFloat({ gt: 0 }),
    validateRequest,
  ],
  modifyPositionController,
);

router.post(
  "/accounts",
  [
    body("accountType").isIn(["REAL", "DEMO", "LIVE"]).optional(),
    body("platform").optional().isString(),
    body("leverage").optional().isInt({ gt: 0 }),
    body("initialBalance").optional().isFloat({ min: 0 }),
    validateRequest,
  ],
  createAccountController
);

module.exports = { tradingRoutes: router };
