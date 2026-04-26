const express = require("express");

const authController = require("./auth.controller");
const {
  registerValidator,
  loginValidator,
  refreshValidator,
  logoutValidator,
} = require("./auth.validators");
const { validateRequest } = require("../middleware/validate");

const router = express.Router();

router.post("/register", registerValidator, validateRequest, authController.register);
router.post("/login", loginValidator, validateRequest, authController.login);
router.post("/refresh", refreshValidator, validateRequest, authController.refresh);
router.post("/logout", logoutValidator, validateRequest, authController.logout);

module.exports = { authRoutes: router };
