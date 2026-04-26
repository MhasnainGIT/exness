const { validationResult } = require("express-validator");

function validateRequest(req, _res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const error = new Error(`Validation failed: ${result.array().map(e => `${e.path}: ${e.msg}`).join(', ')}`);
  error.statusCode = 422;
  error.details = result.array();
  return next(error);
}

module.exports = { validateRequest };
