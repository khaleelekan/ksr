const db = require("./db");

/* Mark an order paid only if Paystack says success AND the amount matches
   what WE calculated (never trust the browser). Safe to call twice. */
function markPaidIfValid(tx) {
  return db.update((d) => {
    const order = d.orders.find((o) => o.reference === tx.reference);
    if (!order) return null;
    if (order.status === "pending" && tx.status === "success" && tx.amount === Math.round(order.total * 100)) {
      order.status = "paid";
      order.paidAt = new Date().toISOString();
    }
    return order;
  });
}
module.exports = { markPaidIfValid };
