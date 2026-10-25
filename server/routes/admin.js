const router = require("express").Router();
const db = require("../db");

const STATUSES = ["pending", "awaiting_transfer", "transfer_reported", "paid", "processing", "delivered", "cancelled"];

router.get("/orders", (_req, res) => res.json(db.read().orders.slice().reverse()));

router.patch("/orders/:reference", (req, res) => {
  if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: "Invalid status" });
  const order = db.update((d) => {
    const o = d.orders.find((x) => x.reference === req.params.reference);
    if (o) o.status = req.body.status;
    return o;
  });
  order ? res.json(order) : res.status(404).json({ error: "Not found" });
});

router.get("/products", (_req, res) => res.json(db.read().products));

/* body: { available: bool, variants: [{label, price|null}] } (labels must match) */
router.put("/products/:id", (req, res) => {
  const p = db.update((d) => {
    const prod = d.products.find((x) => x.id === req.params.id);
    if (!prod) return null;
    if (typeof req.body.available === "boolean") prod.available = req.body.available;
    (req.body.variants || []).forEach((nv) => {
      const v = prod.variants.find((x) => x.label === nv.label);
      const price = nv.price === null || nv.price === "" ? null : Number(nv.price);
      if (v && (price === null || (Number.isFinite(price) && price >= 0))) v.price = price;
    });
    return prod;
  });
  p ? res.json(p) : res.status(404).json({ error: "Not found" });
});

module.exports = router;
