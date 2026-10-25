const crypto = require("crypto");
const cfg = require("./config");

/* HTTP Basic auth: browser shows a login prompt. Username is ignored. */
module.exports = (req, res, next) => {
  const fail = () => { res.set("WWW-Authenticate", 'Basic realm="KSR Admin"'); res.status(401).send("Login required"); };
  if (!cfg.adminPassword) return res.status(503).send("Admin disabled: set ADMIN_PASSWORD");
  const h = req.headers.authorization || "";
  if (!h.startsWith("Basic ")) return fail();
  const pass = Buffer.from(h.slice(6), "base64").toString().split(":").slice(1).join(":");
  const a = Buffer.from(pass), b = Buffer.from(cfg.adminPassword);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return fail();
  next();
};
