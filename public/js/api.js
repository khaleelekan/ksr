/* Loads the catalog from the server. */
let CATEGORIES = ["All"], PRODUCTS = [], STORE_NOTES = [];
const IMG = "assets/images/";
const STORE = { name: "KSR Foods", whatsapp: "2348077029452" };

async function loadCatalog() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("catalog");
  const d = await res.json();
  CATEGORIES = d.categories; PRODUCTS = d.products; STORE_NOTES = d.notes;
}
