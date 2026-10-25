const router = require("express").Router();
const db = require("../db");

router.get("/", (_req, res) => {
  const d = db.read();
  res.json({ categories: d.meta.categories, notes: d.meta.notes, products: d.products.filter((p) => p.available !== false) });
});
module.exports = router;
