/**
 * Order Controller - Handles trading API endpoints
 */
const orderService = require('../services/orderService');

exports.placeOrder = async (req, res) => {
  try {
    const { tradingAccountId, instrumentSymbol, side, type, volumeLots, stopLoss, takeProfit } = req.body;
    
    if (!tradingAccountId || !instrumentSymbol || !side || !volumeLots) {
      return res.status(400).json({ error: 'Missing required trading fields' });
    }

    const result = await orderService.executeOrder({ 
      tradingAccountId, 
      instrumentSymbol, 
      side, 
      type: type || 'MARKET', 
      volumeLots: parseFloat(volumeLots), 
      stopLoss: stopLoss ? parseFloat(stopLoss) : null, 
      takeProfit: takeProfit ? parseFloat(takeProfit) : null 
    });

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.closeTrade = async (req, res) => {
  try {
    const { positionId } = req.params;
    if (!positionId) return res.status(400).json({ error: 'positionId required' });

    const position = await orderService.closePosition(positionId);
    res.json({ success: true, position });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPositions = async (req, res) => {
  try {
    const { tradingAccountId } = req.query;
    if (!tradingAccountId) return res.status(400).json({ error: 'tradingAccountId required' });

    const positions = await orderService.getOpenPositions(tradingAccountId);
    res.json({ success: true, positions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    const { tradingAccountId } = req.query;
    if (!tradingAccountId) return res.status(400).json({ error: 'tradingAccountId required' });

    const history = await orderService.getOrderHistory(tradingAccountId);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

