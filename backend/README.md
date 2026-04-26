# Exness Clone — Backend API

## Stack
- Node.js + Express, PostgreSQL + Prisma ORM, WebSocket (ws), JWT auth

## Setup
```bash
cp .env.example .env          # fill DATABASE_URL with your postgres credentials
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev                   # starts on port 5000
```

## Default Credentials (after seed)
| Role  | Email                        | Password      |
|-------|------------------------------|---------------|
| ADMIN | admin@trading.local          | Admin@12345   |
| USER  | demo.trader@trading.local    | Trader@12345  |

---

## Auth  `/api/auth`
| Method | Path        | Auth | Body |
|--------|-------------|------|------|
| POST   | /register   | —    | email, password, firstName, lastName, country |
| POST   | /login      | —    | email, password |
| POST   | /refresh    | —    | refreshToken |
| POST   | /logout     | —    | refreshToken |

**Response shape:** `{ success, data: { user, wallet, tokens: { accessToken, refreshToken } } }`

---

## Users  `/api/users`  🔒
| Method | Path              | Body |
|--------|-------------------|------|
| GET    | /me               | — |
| GET    | /dashboard        | — |
| PATCH  | /me               | firstName?, lastName?, phone?, country? |
| POST   | /change-password  | currentPassword, newPassword |
| POST   | /kyc              | documents: [{ type, fileUrl }] |

KYC document types: `passport`, `national_id`, `drivers_license`, `utility_bill`, `bank_statement`

---

## Trading Accounts  `/api/accounts`  🔒
| Method | Path                        | Body |
|--------|-----------------------------|------|
| GET    | /                           | — |
| GET    | /:accountId                 | — |
| POST   | /                           | accountType (DEMO/LIVE), leverage?, baseCurrency?, platform? |
| PATCH  | /:accountId/leverage        | leverage (1/2/5/10/25/50/100/200/400/500/1000/2000) |

---

## Trading  `/api/trading`  🔒
| Method | Path                            | Body |
|--------|---------------------------------|------|
| GET    | /overview                       | — |
| GET    | /positions?accountId=           | — |
| GET    | /orders/history?accountId=&status=&symbol=&page=&limit= | — |
| POST   | /orders                         | tradingAccountId, instrumentSymbol, side (BUY/SELL), type (MARKET/LIMIT/STOP), volumeLots, stopLoss?, takeProfit? |
| POST   | /positions/:positionId/close    | — |
| PATCH  | /positions/:positionId          | stopLoss?, takeProfit? |

---

## Wallet  `/api/wallets`  🔒
| Method | Path                | Body |
|--------|---------------------|------|
| GET    | /                   | — |
| GET    | /history?type=&status=&page=&limit= | — |
| GET    | /transactions       | same as /history |
| POST   | /deposit            | amount, paymentMethod, metadata? |
| POST   | /deposit-requests   | same |
| POST   | /withdraw           | amount, paymentMethod, metadata? |
| POST   | /withdrawal-requests | same |
| POST   | /transfer           | toAccountId, amount |

Payment methods: `BANK_TRANSFER`, `CREDIT_CARD`, `CRYPTO`, `SKRILL`, `NETELLER`, `PERFECT_MONEY`

---

## Market  `/api/market`  (public except refresh)
| Method | Path                                    | Query |
|--------|-----------------------------------------|-------|
| GET    | /instruments                            | type? (FOREX/METAL/CRYPTO/INDEX/ENERGY) |
| GET    | /instruments/:symbol                    | — |
| GET    | /ticks?symbol=EURUSD                    | — |
| GET    | /candles/:symbol?timeframe=1H&limit=200 | timeframes: 1M,5M,15M,30M,1H,4H,1D |
| POST   | /ticks/refresh                          | 🔒 ADMIN only |

---

## Admin  `/api/admin`  🔒 ADMIN only
| Method | Path                        | Body |
|--------|-----------------------------|------|
| GET    | /summary                    | — |
| GET    | /users?search=&role=&kycStatus=&isActive=&page=&limit= | — |
| GET    | /users/:userId              | — |
| PATCH  | /users/:userId/kyc          | status (PENDING/VERIFIED/REJECTED), reviewNote? |
| PATCH  | /users/:userId/toggle       | — (toggles isActive) |
| GET    | /withdrawals?page=&limit=   | — |
| PATCH  | /withdrawals/:txId          | action (APPROVE/REJECT) |
| GET    | /positions?status=&page=&limit= | — |
| GET    | /audit-logs?entityType=&action=&page=&limit= | — |

---

## WebSocket  `ws://localhost:5000/ws`

```json
// Subscribe
{ "type": "subscribe", "symbols": ["EURUSD", "BTCUSD", "XAUUSD"] }

// Unsubscribe
{ "type": "unsubscribe", "symbols": ["EURUSD"] }

// Ping
{ "type": "ping" }

// Server → snapshot on subscribe
{ "type": "snapshot", "data": { "EURUSD": { "symbol": "EURUSD", "bid": 1.08420, "ask": 1.08427, "timestamp": 1234567890 } } }

// Server → live prices every 1s
{ "type": "prices", "data": { "EURUSD": { ... }, "BTCUSD": { ... } } }
```

---

## Background Engines (auto-running)
- **SL/TP Engine** — checks every 2s, auto-closes positions when price hits stop loss or take profit
- **Margin Call Engine** — checks every 5s, closes worst positions when margin level < 50%
- **Swap Engine** — charges overnight swap fees daily at midnight

---

## Instruments (30 total after seed)
- **Forex (12):** EURUSD, GBPUSD, USDJPY, USDCHF, AUDUSD, USDCAD, NZDUSD, EURGBP, EURJPY, GBPJPY, EURCHF, AUDCAD
- **Metals (3):** XAUUSD, XAGUSD, XPTUSD
- **Crypto (6):** BTCUSD, ETHUSD, LTCUSD, XRPUSD, ADAUSD, SOLUSD
- **Indices (7):** US30, US500, NAS100, UK100, GER40, FRA40, JPN225
- **Energy (3):** USOIL, UKOIL, NATGAS
