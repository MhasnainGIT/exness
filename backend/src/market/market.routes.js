const express = require("express");
const { authenticate, requireRole } = require("../middleware/authenticate");
const {
  listInstrumentsController,
  getInstrumentController,
  getTicksController,
  refreshTicksController,
  getCandlesController,
} = require("./market.controller");

const router = express.Router();

// Public
router.get("/instruments", listInstrumentsController);
router.get("/instruments/:symbol", getInstrumentController);
router.get("/ticks", getTicksController);
router.get("/candles/:symbol", getCandlesController);

// Admin only
router.post("/ticks/refresh", authenticate, requireRole("ADMIN"), refreshTicksController);

module.exports = { marketRoutes: router };
