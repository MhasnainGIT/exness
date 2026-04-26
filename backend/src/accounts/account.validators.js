const { body } = require("express-validator");

const createAccountValidator = [
  body("accountType").optional().isIn(["DEMO", "LIVE"]),
  body("baseCurrency").optional().isString().trim().notEmpty(),
  body("leverage").optional().isInt({ min: 1, max: 2000 }),
  body("platform").optional().isString().trim().notEmpty(),
];

module.exports = { createAccountValidator };
