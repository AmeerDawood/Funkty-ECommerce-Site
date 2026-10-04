// Funkty — shared site script (menu, cart, toast, scroll-to-top, session)

const CART_KEY = "funkty_cart";
const SESSION_KEY = "funkty_session";

function formatPrice(value) {
  return "Rs " + Number(value).toLocaleString("en-PK");
}

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* storage unavailable — cart just won't persist */
  }
}

/* ---------- Mobile menu ---------- */
function toggleMenu() {
  const menu = document.querySelector(".mobile-menu");
  if (menu) menu.classList.toggle("open");
}

/* ---------- Toast ---------- */
let toastTimer;
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = '<i class="fas fa-check-circle"></i><span></span>';
  toast.querySelector("span").textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------- Cart ---------- */
let cart = safeGet(CART_KEY, []);

function saveCart() {
  safeSet(CART_KEY, cart);
  renderCart();
}

function toggleCart(forceOpen) {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("overlay");
  if (!drawer) return;
  const open =
    typeof forceOpen === "boolean"
      ? forceOpen
      : !drawer.classList.contains("open");
  drawer.classList.toggle("open", open);
  overlay.classList.toggle("open", open);
  document.body.style.overflow = open ? "hidden" : "";
}

function addToCart(button) {
  const card = button.closest("[data-id]");
  const item = {
    id: card.dataset.id,
    name: card.dataset.name,
    price: Number(card.dataset.price),
    img: card.dataset.img,
  };
  const existing = cart.find((c) => c.id === item.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...item, qty: 1 });
  saveCart();

  showToast(item.name + " added to cart");
  const label = button.innerHTML;
  button.classList.add("added");
  button.innerHTML = '<i class="fas fa-check"></i> Added';
  button.disabled = true;
  setTimeout(() => {
    button.classList.remove("added");
    button.innerHTML = label;
    button.disabled = false;
  }, 1500);
}

function changeQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((c) => c.id !== id);
  saveCart();
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  saveCart();
}

function renderCart() {
  const count = cart.reduce((sum, c) => sum + c.qty, 0);
  document
    .querySelectorAll(".cart-count")
    .forEach((el) => (el.textContent = count));

  const list = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML =
      '<li class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Your cart is empty.</p></li>';
  } else {
    list.innerHTML = cart
      .map(
        (c) => `
        <li class="cart-item">
          <img src="${c.img}" alt="${c.name}" />
          <div>
            <h4>${c.name}</h4>
            <div class="qty">
              <button onclick="changeQty('${c.id}', -1)" aria-label="Decrease">&minus;</button>
              <span>${c.qty}</span>
              <button onclick="changeQty('${c.id}', 1)" aria-label="Increase">+</button>
            </div>
          </div>
          <div>
            <div class="line-price">${formatPrice(c.price * c.qty)}</div>
            <button class="remove" onclick="removeFromCart('${c.id}')">Remove</button>
          </div>
        </li>`
      )
      .join("");
  }

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  if (totalEl) totalEl.textContent = formatPrice(total);
}

function checkout() {
  if (cart.length === 0) {
    showToast("Your cart is empty");
    return;
  }
  if (!safeGet(SESSION_KEY, null)) {
    window.location.href = "login.html";
    return;
  }
  cart = [];
  saveCart();
  toggleCart(false);
  showToast("Order placed — thank you!");
}

/* ---------- Session-aware navbar ---------- */
function renderAuthNav() {
  const session = safeGet(SESSION_KEY, null);
  if (!session) return;
  document.querySelectorAll(".nav-auth").forEach((el) => {
    el.innerHTML = `
      <span class="btn btn-outline" style="pointer-events:none">
        <i class="fas fa-user"></i> ${session.name.split(" ")[0]}
      </span>
      <button class="btn btn-primary" onclick="logout()">Log out</button>`;
  });
}

function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
  window.location.reload();
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  renderAuthNav();

  const scrollBtn = document.getElementById("scrollTop");
  if (scrollBtn) {
    window.addEventListener("scroll", () => {
      scrollBtn.classList.toggle("show", window.scrollY > 400);
    });
    scrollBtn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleCart(false);
  });
});
