/* Tiny JSON-file store (fine for a small shop). Swap for SQLite/Postgres later
   by keeping the same read()/update() interface. */
const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "data", "db.json");
const SEED = path.join(__dirname, "data", "products.seed.json");

function write(data) {
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, FILE); // atomic replace
}
function read() {
  if (!fs.existsSync(FILE)) {
    const seed = JSON.parse(fs.readFileSync(SEED, "utf8"));
    write({ meta: { categories: seed.CATEGORIES, notes: seed.STORE_NOTES }, products: seed.PRODUCTS, orders: [] });
  }
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}
function update(fn) { const d = read(); const out = fn(d); write(d); return out; }

module.exports = { read, update };
