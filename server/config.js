require("dotenv").config();
const cfg = {
  port: process.env.PORT || 3000,
  baseUrl: (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, ""),
  paystackSecret: process.env.PAYSTACK_SECRET_KEY || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  bank: {
    name: process.env.BANK_NAME || "",
    number: process.env.BANK_ACCOUNT_NUMBER || "",
    accountName: process.env.BANK_ACCOUNT_NAME || "",
  },
};
if (!cfg.paystackSecret) console.warn("[warn] PAYSTACK_SECRET_KEY not set: online payment will fail.");
if (!cfg.adminPassword) console.warn("[warn] ADMIN_PASSWORD not set: /admin is disabled.");
if (!cfg.bank.number) console.warn("[warn] BANK_* not set: bank transfer option will be unavailable.");
module.exports = cfg;
