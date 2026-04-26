const { body } = require("express-validator");

const registerValidator = [
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
  body("firstName").isString().trim().notEmpty(),
  body("lastName").isString().trim().notEmpty(),
];

const loginValidator = [
  body("email").isEmail(),
  body("password").isString().notEmpty(),
];

const refreshValidator = [body("refreshToken").isString().notEmpty()];
const logoutValidator = [body("refreshToken").optional().isString()];

module.exports = {
  registerValidator,
  loginValidator,
  refreshValidator,
  logoutValidator,
};
