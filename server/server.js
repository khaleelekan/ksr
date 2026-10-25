const express = require("express");
const path = require("path");
const cfg = require("./config");
const auth = require("./auth");

const app = express();
// keep raw body: needed to verify Paystack's webhook signature
app.use(express.json({ limit: "100kb", verify: (req, _res, buf) => { req.rawBody = buf; } }));

app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/paystack", require("./routes/webhook"));
app.use("/api/admin", auth, require("./routes/admin"));

app.use("/admin", auth, express.static(path.join(__dirname, "admin")));
app.use(express.static(path.join(__dirname, "..", "public")));

app.listen(cfg.port, () => console.log(`KSR Foods running on ${cfg.baseUrl} (port ${cfg.port})`));
