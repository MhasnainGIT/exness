const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const { validateRequest } = require("../middleware/validate");
const {
  getWallet,
  deposit,
  withdraw,
  transfer,
  getTransactions,
} = require("./wallet.controller");
const {
  depositValidator,
  withdrawalValidator,
  transferValidator,
} = require("./wallet.validators");

router.use(authenticate);

router.get("/", getWallet);
router.get("/history", getTransactions);
router.get("/transactions", getTransactions);

router.post("/deposit", depositValidator, validateRequest, deposit);
router.post("/deposit-requests", depositValidator, validateRequest, deposit);
router.post("/withdraw", withdrawalValidator, validateRequest, withdraw);
router.post("/withdrawal-requests", withdrawalValidator, validateRequest, withdraw);
router.post("/transfer", transferValidator, validateRequest, transfer);

module.exports = { walletRoutes: router };
