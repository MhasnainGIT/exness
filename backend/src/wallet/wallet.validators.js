const { body } = require("express-validator");

const amountRule = body("amount").isFloat({ gt: 0 }).toFloat();

const depositValidator = [
  amountRule,
  body("paymentMethod").isIn([
    "BANK_TRANSFER",
    "CREDIT_CARD",
    "CRYPTO",
    "SKRILL",
    "NETELLER",
    "PERFECT_MONEY",
  ]),
  body("metadata").optional().isObject(),
];

const withdrawalValidator = [
  amountRule,
  body("paymentMethod").isIn([
    "BANK_TRANSFER",
    "CREDIT_CARD",
    "CRYPTO",
    "SKRILL",
    "NETELLER",
    "PERFECT_MONEY",
  ]),
  body("metadata").optional().isObject(),
];

const transferValidator = [
  body("toAccountId").isString().notEmpty(),
  body("amount").isFloat({ gt: 0 }).toFloat(),
];

module.exports = {
  depositValidator,
  withdrawalValidator,
  transferValidator,
};
