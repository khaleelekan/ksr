/* UI rendering and events. */
const $ = id => document.getElementById(id);
let activeCat = "All", query = "";

function renderCategories() {
  $("categories").innerHTML = CATEGORIES.map(c =>
    `<button class="chip ${c === activeCat ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
}

function renderProducts() {
  const list = PRODUCTS.filter(p =>
    (activeCat === "All" || p.category === activeCat) && p.name.toLowerCase().includes(query));
  $("products").innerHTML = list.length ? list.map(productCard).join("") : `<p class="empty">No products found.</p>`;
}

function priceText(p, i) {
  const v = p.variants[i];
  return v.price ? formatNaira(v.price) : "Price on request";
}

function productCard(p) {
  const pic = p.image ? `<img src="${IMG}${p.image}" alt="${p.name}" loading="lazy">` : "🛍️";
  const opts = p.variants.map((v, i) =>
    `<option value="${i}">${v.label}${v.price ? " - " + formatNaira(v.price) : ""}</option>`).join("");
  const single = p.variants.length === 1;
  const askOnly = single && p.variants[0].price === null;
  return `<article class="card" data-id="${p.id}">
    <div class="pic">${pic}</div>
    <div class="body">
      <h3>${p.name}</h3>
      ${p.desc ? `<p class="desc">${p.desc}</p>` : ""}
      ${single ? `<p class="desc">${p.variants[0].label}</p>` : `<select aria-label="Choose size">${opts}</select>`}
      <div class="price">${priceText(p, 0)}</div>
      <button class="btn" data-add>${askOnly ? "Ask for price" : "Add to cart"}</button>
    </div></article>`;
}

function renderCart() {
  $("cartCount").textContent = Cart.count();
  $("cartTotal").textContent = formatNaira(Cart.total());
  $("cartItems").innerHTML = Cart.items.length ? Cart.items.map(i => `
    <div class="line" data-key="${i.key}">
      <div><strong>${i.name}</strong><div class="meta">${i.label} · ${formatNaira(i.price)}</div></div>
      <strong>${formatNaira(i.price * i.qty)}</strong>
      <div class="qty"><button data-dec>−</button><span>${i.qty}</span><button data-inc>+</button><button class="rm" data-rm>Remove</button></div>
    </div>`).join("") : `<p class="empty">Your cart is empty.</p>`;
}

function toggleCart(open) {
  $("drawer").classList.toggle("open", open);
  $("overlay").classList.toggle("show", open);
}

function askForPrice(p, v) {
  const msg = `Hello KSR Foods, what is the price of ${p.name} (${v.label})?`;
  window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
}

/* Events */
$("categories").addEventListener("click", e => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  activeCat = b.dataset.cat; renderCategories(); renderProducts();
});
$("search").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); renderProducts(); });

$("products").addEventListener("change", e => {
  if (e.target.tagName !== "SELECT") return;
  const card = e.target.closest(".card");
  const p = PRODUCTS.find(x => x.id === card.dataset.id);
  card.querySelector(".price").textContent = priceText(p, +e.target.value);
});
$("products").addEventListener("click", e => {
  if (!e.target.matches("[data-add]")) return;
  const card = e.target.closest(".card");
  const p = PRODUCTS.find(x => x.id === card.dataset.id);
  const sel = card.querySelector("select");
  const v = p.variants[sel ? +sel.value : 0];
  if (v.price === null) return askForPrice(p, v);
  Cart.add(p, v); renderCart(); toggleCart(true);
});

$("cartItems").addEventListener("click", e => {
  const line = e.target.closest(".line"); if (!line) return;
  const key = line.dataset.key;
  if (e.target.matches("[data-inc]")) Cart.change(key, 1);
  else if (e.target.matches("[data-dec]")) Cart.change(key, -1);
  else if (e.target.matches("[data-rm]")) Cart.remove(key);
  renderCart();
});

$("openCart").onclick = () => toggleCart(true);
$("closeCart").onclick = $("overlay").onclick = () => toggleCart(false);
$("whatsappBtn").onclick = () => {
  if (!Cart.items.length) return alert("Your cart is empty.");
  window.open(Cart.whatsappUrl($("custName").value.trim(), $("custAddress").value.trim()), "_blank");
};

async function checkout(method, btn, label) {
  if (!Cart.items.length) return alert("Your cart is empty.");
  const customer = {
    name: $("custName").value.trim(), phone: $("custPhone").value.trim(),
    email: $("custEmail").value.trim(), address: $("custAddress").value.trim(),
  };
  if (Object.values(customer).some(v => !v)) return alert("Please fill in your name, phone, email and address.");
  btn.disabled = true; btn.textContent = "Please wait...";
  try {
    const res = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, customer, items: Cart.items.map(i => ({ id: i.id || i.key.split("|")[0], label: i.label, qty: i.qty })) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not place order");
    if (method === "transfer") {
      try { localStorage.removeItem("ksr-cart-v1"); } catch (e) {}
      location.href = "transfer.html?reference=" + encodeURIComponent(data.reference);
    } else location.href = data.authorization_url;
  } catch (e) { alert(e.message); btn.disabled = false; btn.textContent = label; }
}
$("payBtn").onclick = () => checkout("paystack", $("payBtn"), "Pay online (Paystack)");
$("transferBtn").onclick = () => checkout("transfer", $("transferBtn"), "Pay by bank transfer");

/* Init */
loadCatalog().then(() => {
  $("notes").innerHTML = STORE_NOTES.map(n => `<li>${n}</li>`).join("");
  renderCategories(); renderProducts(); renderCart();
}).catch(() => { $("products").innerHTML = '<p class="empty">Could not load products. Please refresh.</p>'; renderCart(); });
