const router = require("express").Router();
const paystack = require("../paystack");
const { markPaidIfValid } = require("../orderService");

/* Set this URL in Paystack dashboard > Settings > API Keys & Webhooks:
   https://YOUR-DOMAIN/api/paystack/webhook */
router.post("/webhook", (req, res) => {
  if (!paystack.validSignature(req.rawBody, req.headers["x-paystack-signature"])) return res.sendStatus(401);
  if (req.body.event === "charge.success") markPaidIfValid(req.body.data);
  res.sendStatus(200);
});
module.exports = router;
