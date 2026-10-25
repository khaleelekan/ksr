/* Cart state + persistence + WhatsApp message builder. No DOM code here. */
const Cart = (() => {
  const KEY = "ksr-cart-v1";
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { items = []; }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} };

  return {
    get items() { return items; },
    count: () => items.reduce((n, i) => n + i.qty, 0),
    total: () => items.reduce((s, i) => s + i.price * i.qty, 0),
    add(product, variant) {
      const k = product.id + "|" + variant.label;
      const found = items.find(i => i.key === k);
      if (found) found.qty++;
      else items.push({ key: k, id: product.id, name: product.name, label: variant.label, price: variant.price, qty: 1 });
      save();
    },
    change(k, delta) {
      const it = items.find(i => i.key === k);
      if (!it) return;
      it.qty += delta;
      if (it.qty <= 0) items = items.filter(i => i.key !== k);
      save();
    },
    remove(k) { items = items.filter(i => i.key !== k); save(); },
    whatsappUrl(name, address) {
      const lines = items.map(i => `• ${i.name} (${i.label}) x${i.qty} = ${formatNaira(i.price * i.qty)}`);
      const msg = `Hello KSR Foods, I'd like to order:\n\n${lines.join("\n")}\n\nTotal: ${formatNaira(this.total())}\n\nName: ${name || "-"}\nDelivery address: ${address || "-"}`;
      return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;
    },
  };
})();

function formatNaira(n) { return "₦" + n.toLocaleString("en-NG"); }
