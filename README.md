# KSR Foods Store (v2: payments + backend)

## Run it
1. Install Node.js 18+
2. `npm install`
3. Copy `.env.example` to `.env`, add your Paystack key, admin password and bank account details
4. `npm start`, open http://localhost:3000 (admin: http://localhost:3000/admin)

## Go live with Paystack
1. Create an account at paystack.com and complete business verification
2. Test with your secret key sk_test_..., then switch to sk_live_...
3. Paystack > Settings > API Keys & Webhooks: set Webhook URL to https://YOUR-DOMAIN/api/paystack/webhook
4. Set BASE_URL in .env to your real https domain

## Structure
- public/ storefront; public/order-complete.html payment result page
- server/server.js entry; server/config.js settings
- server/routes/ products, orders (checkout + verify), webhook, admin
- server/paystack.js Paystack API + webhook signature check
- server/orderService.js marks orders paid (amount must match)
- server/db.js JSON-file database (server/data/db.json, auto-created)
- server/admin/ dashboard: orders, status, prices, stock
- server/data/products.seed.json starting catalog (used once; then edit in /admin)

## Hosting
Use a host that runs Node (Render, Railway, VPS, cPanel Node app) with a persistent disk for server/data/.

## Bank transfer
Customers see your account details + a unique reference, tap "I've made the transfer", and the order shows as **transfer reported** in /admin. Check your bank, then set the status to **paid**.
# ksr
