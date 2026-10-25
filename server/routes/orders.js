const router = require("express").Router();
const crypto = require("crypto");
const cfg = require("../config");
const db = require("../db");
const paystack = require("../paystack");
const { markPaidIfValid } = require("../orderService");

const clean = (v, max = 200) => String(v || "").trim().slice(0, max);

/* Validate the request and price the cart from the server catalog. */
function buildOrder(body) {
  const c = body.customer || {};
  const customer = { name: clean(c.name), phone: clean(c.phone, 30), email: clean(c.email), address: clean(c.address, 400) };
  if (Object.values(customer).some((v) => !v) || !/^\S+@\S+\.\S+$/.test(customer.email))
    return { error: "Please provide a valid name, phone, email and address." };
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50) return { error: "Your cart is empty." };

  const catalog = db.read().products;
  const items = [];
  for (const it of body.items) {
    const p = catalog.find((x) => x.id === it.id && x.available !== false);
    const v = p && p.variants.find((x) => x.label === it.label);
    const qty = Number(it.qty);
    if (!v || v.price === null || !Number.isInteger(qty) || qty < 1 || qty > 100)
      return { error: `"${clean(it.id, 60)}" is unavailable. Please refresh and try again.` };
    items.push({ id: p.id, name: p.name, label: v.label, price: v.price, qty });
  }
  return { customer, items, total: items.reduce((s, i) => s + i.price * i.qty, 0) };
}

/* Create order. body.method: "paystack" (default) or "transfer" */
router.post("/", async (req, res) => {
  const method = req.body.method === "transfer" ? "transfer" : "paystack";
  if (method === "transfer" && !cfg.bank.number) return res.status(503).json({ error: "Bank transfer is not available right now." });

  const built = buildOrder(req.body);
  if (built.error) return res.status(400).json({ error: built.error });
  const { customer, items, total } = built;

  const reference = "KSR-" + Date.now() + "-" + crypto.randomBytes(3).toString("hex");
  db.update((d) => d.orders.push({
    reference, items, total, customer, method,
    status: method === "transfer" ? "awaiting_transfer" : "pending",
    createdAt: new Date().toISOString(),
  }));

  if (method === "transfer") return res.json({ reference, total });

  try {
    const tx = await paystack.initialize({ email: customer.email, amountNaira: total, reference, metadata: { name: customer.name, phone: customer.phone } });
    res.json({ reference, authorization_url: tx.authorization_url });
  } catch (e) {
    console.error("Paystack init failed:", e.message);
    res.status(502).json({ error: "Could not start payment. Please try again or choose bank transfer / WhatsApp." });
  }
});

/* Bank details + amount for a transfer order (shown on transfer.html). */
router.get("/transfer/:reference", (req, res) => {
  const o = db.read().orders.find((x) => x.reference === req.params.reference && x.method === "transfer");
  if (!o) return res.status(404).json({ error: "Order not found" });
  res.json({ reference: o.reference, status: o.status, total: o.total, items: o.items, bank: cfg.bank });
});

/* Customer says "I've paid". You still confirm it in /admin. */
router.post("/transfer/:reference/reported", (req, res) => {
  const o = db.update((d) => {
    const x = d.orders.find((y) => y.reference === req.params.reference && y.method === "transfer");
    if (x && x.status === "awaiting_transfer") { x.status = "transfer_reported"; x.reportedAt = new Date().toISOString(); }
    return x;
  });
  o ? res.json({ status: o.status }) : res.status(404).json({ error: "Order not found" });
});

/* Paystack return page. */
router.get("/verify/:reference", async (req, res) => {
  let order = db.read().orders.find((o) => o.reference === req.params.reference);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status === "pending") {
    try { order = markPaidIfValid(await paystack.verify(order.reference)) || order; }
    catch (e) { console.error("Verify failed:", e.message); }
  }
  res.json({ reference: order.reference, status: order.status, total: order.total, items: order.items });
});

module.exports = router;
