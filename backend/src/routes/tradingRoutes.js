 * Trading Routes - API endpoints for real-time trading
 */
const express = require('express');
const router = express.Router();
const { placeOrder, closeTrade, getPositions, getOrderHistory } = require('../controllers/orderController');

// Place market order (BUY/SELL)
router.post('/orders', placeOrder);

// Close an open position
router.post('/positions/:positionId/close', closeTrade);

// Get all open positions
router.get('/positions', getPositions);

// Get order history
router.get('/orders/history', getOrderHistory);

module.exports = router;

