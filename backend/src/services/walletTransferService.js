/**
 * Wallet Transfer Service - Handles internal transfers between Wallet and Trading accounts
 */
const { prisma } = require('../config/prisma');
const positionService = require('./positionService');

class WalletTransferService {
  async transferWalletToTradingAccount(userId, walletId, tradingAccountId, amount) {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) throw new Error('Invalid transfer amount');

    return await prisma.$transaction(async (tx) => {
      // 1. Get and lock wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId, userId }
      });
      if (!wallet) throw new Error('Main wallet not found');
      if (Number(wallet.balance) < amt) throw new Error('Insufficient funds in main wallet');

      // 2. Get and lock trading account
      const account = await tx.tradingAccount.findUnique({
        where: { id: tradingAccountId, userId }
      });
      if (!account) throw new Error('Trading account not found');

      // 3. Update balances
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amt } }
      });

      const updatedAccount = await tx.tradingAccount.update({
        where: { id: account.id },
        data: {
          balance: { increment: amt },
          equity: { increment: amt },
          freeMargin: { increment: amt }
        }
      });

      // 4. Create transaction records
      const ref = `TRANS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          tradingAccountId: account.id,
          type: 'INTERNAL_TRANSFER',
          status: 'COMPLETED',
          amount: amt,
          reference: ref,
          description: `Transfer from Main Wallet to Account ${account.accountNumber}`
        }
      });

      return { wallet: updatedWallet, account: updatedAccount };
    });
  }

  async transferTradingAccountToWallet(userId, tradingAccountId, walletId, amount) {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) throw new Error('Invalid transfer amount');

    return await prisma.$transaction(async (tx) => {
      // 1. Get and lock trading account
      const account = await tx.tradingAccount.findUnique({
        where: { id: tradingAccountId, userId }
      });
      if (!account) throw new Error('Trading account not found');

      // 2. Safety Check: Cannot transfer more than free margin
      // We must calculate current free margin considering unrealized PnL
      const { totalPnl } = await positionService.calcUnrealizedPnL(userId);
      const currentEquity = Number(account.balance) + totalPnl;
      const currentFreeMargin = currentEquity - Number(account.margin);

      if (currentFreeMargin < amt) {
        throw new Error(`Insufficient free margin to transfer. Available: ${currentFreeMargin.toFixed(2)} USD`);
      }

      // 3. Get and lock wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId, userId }
      });
      if (!wallet) throw new Error('Main wallet not found');

      // 4. Update balances
      const updatedAccount = await tx.tradingAccount.update({
        where: { id: account.id },
        data: {
          balance: { decrement: amt },
          equity: { decrement: amt },
          freeMargin: { decrement: amt }
        }
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amt } }
      });

      // 5. Create transaction records
      const ref = `TRANS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          tradingAccountId: account.id,
          type: 'INTERNAL_TRANSFER',
          status: 'COMPLETED',
          amount: -amt, // Negative for wallet transaction if we track it this way, or just store absolute
          reference: ref,
          description: `Transfer from Account ${account.accountNumber} to Main Wallet`
        }
      });

      return { wallet: updatedWallet, account: updatedAccount };
    });
  }
}

module.exports = new WalletTransferService();
