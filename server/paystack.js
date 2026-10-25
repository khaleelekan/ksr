const crypto = require("crypto");
const cfg = require("./config");
const BASE = "https://api.paystack.co";

async function call(p, opts = {}) {
  const res = await fetch(BASE + p, {
    ...opts,
    headers: { Authorization: "Bearer " + cfg.paystackSecret, "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.status) throw new Error(json.message || "Paystack error");
  return json.data;
}

exports.initialize = ({ email, amountNaira, reference, metadata }) =>
  call("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email, reference, metadata,
      amount: Math.round(amountNaira * 100), // Paystack uses kobo
      callback_url: cfg.baseUrl + "/order-complete.html",
    }),
  });

exports.verify = (reference) => call("/transaction/verify/" + encodeURIComponent(reference));

exports.validSignature = (rawBody, signature) => {
  if (!cfg.paystackSecret || !signature || !rawBody) return false;
  const expected = crypto.createHmac("sha512", cfg.paystackSecret).update(rawBody).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
