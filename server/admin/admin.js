const view = document.getElementById("view");
const naira = n => "₦" + Number(n).toLocaleString("en-NG");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const api = (p, opt = {}) => fetch("/api/admin" + p, { ...opt, headers: { "Content-Type": "application/json" } }).then(r => r.json());

async function showOrders() {
  const orders = await api("/orders");
  view.innerHTML = orders.length ? orders.map(o => `
    <div class="box"><div class="row"><strong>${esc(o.reference)}</strong>
      <span class="tag ${o.status}">${o.status.replace("_", " ")}</span><small>${o.method === "transfer" ? "bank transfer" : "Paystack"}</small><strong>${naira(o.total)}</strong>
      <small>${new Date(o.createdAt).toLocaleString()}</small></div>
      <p>${o.items.map(i => `${esc(i.name)} (${esc(i.label)}) x${i.qty}`).join(", ")}</p>
      <small>${esc(o.customer.name)} · ${esc(o.customer.phone)} · ${esc(o.customer.email)}<br>${esc(o.customer.address)}</small>
      <div class="row" style="margin-top:8px"><select data-ref="${esc(o.reference)}">
        ${["pending", "awaiting_transfer", "transfer_reported", "paid", "processing", "delivered", "cancelled"].map(s => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
      </select></div></div>`).join("") : "<p>No orders yet.</p>";
}
view.addEventListener("change", async e => {
  if (e.target.dataset.ref) { await api("/orders/" + e.target.dataset.ref, { method: "PATCH", body: JSON.stringify({ status: e.target.value }) }); showOrders(); }
});

async function showProducts() {
  const products = await api("/products");
  view.innerHTML = products.map(p => `
    <div class="box" data-id="${p.id}"><div class="row"><strong>${esc(p.name)}</strong>
      <label><input type="checkbox" class="avail" ${p.available !== false ? "checked" : ""}> In stock</label></div>
      <div class="row">${p.variants.map(v => `<label>${esc(v.label)} <input type="number" data-label="${esc(v.label)}" value="${v.price ?? ""}" placeholder="ask"></label>`).join("")}
      <button class="save">Save</button></div></div>`).join("");
}
view.addEventListener("click", async e => {
  if (!e.target.classList.contains("save")) return;
  const box = e.target.closest(".box");
  const variants = [...box.querySelectorAll("input[data-label]")].map(i => ({ label: i.dataset.label, price: i.value === "" ? null : Number(i.value) }));
  await api("/products/" + box.dataset.id, { method: "PUT", body: JSON.stringify({ available: box.querySelector(".avail").checked, variants }) });
  e.target.textContent = "Saved ✓"; setTimeout(() => e.target.textContent = "Save", 1200);
});

const tabs = { tabOrders: showOrders, tabProducts: showProducts };
Object.keys(tabs).forEach(id => document.getElementById(id).onclick = () => {
  Object.keys(tabs).forEach(t => document.getElementById(t).classList.toggle("on", t === id)); tabs[id]();
});
showOrders();
