const { body } = require("express-validator");

const updateProfileValidator = [
  body("firstName").optional().isString().trim().notEmpty(),
  body("lastName").optional().isString().trim().notEmpty(),
  body("phone").optional({ nullable: true }).isString().trim().notEmpty(),
  body("country").optional({ nullable: true }).isString().trim().notEmpty(),
];

module.exports = { updateProfileValidator };
