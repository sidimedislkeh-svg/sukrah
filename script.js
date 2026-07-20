/* =========================================================
   script.js — SUKRAH FASHION ABAYAS
   منطق المتجر: العرض، السلة، السلايدر، النوافذ المنبثقة، واتساب
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  applyBrand();
  renderProducts(PRODUCTS);
  loadCart();
  bindGlobalEvents();
});

/* ---------------------------------------------------------
   تطبيق هوية المتجر من brand.js
--------------------------------------------------------- */
function applyBrand() {
  const root = document.documentElement;
  Object.entries(BRAND.colors).forEach(([key, value]) => {
    const cssVarName =
      "--color-" + key.replace(/([A-Z])/g, "-$1").toLowerCase();
    root.style.setProperty(cssVarName, value);
  });

  document.getElementById("storeName").textContent = BRAND.storeName;
  document.getElementById("storeSlogan").textContent = BRAND.storeSlogan;
  document.getElementById("welcomeMsg").textContent = BRAND.welcomeMessage;
  document.title = `${BRAND.storeName} ${BRAND.storeSlogan}`;
}

/* ---------------------------------------------------------
   حالة السلة
--------------------------------------------------------- */
let cart = [];

function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem("sukrah_cart")) || [];
  } catch (e) {
    cart = [];
  }
  renderCart();
}

function saveCart() {
  localStorage.setItem("sukrah_cart", JSON.stringify(cart));
}

function cartLineId(productId, color, size) {
  return `${productId}__${color}__${size}`;
}

function addToCart(product, color, size, qty) {
  const lineId = cartLineId(product.id, color, size);
  const existing = cart.find((item) => item.lineId === lineId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      lineId,
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color,
      size,
      qty,
    });
  }
  saveCart();
  renderCart();
  updateCartCount();
  openCart();
}

function updateQty(lineId, delta) {
  const item = cart.find((i) => i.lineId === lineId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((i) => i.lineId !== lineId);
  }
  saveCart();
  renderCart();
  updateCartCount();
}

function removeFromCart(lineId) {
  cart = cart.filter((i) => i.lineId !== lineId);
  saveCart();
  renderCart();
  updateCartCount();
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartCount() {
  document.getElementById("cartCount").textContent = cartCount();
}

/* ---------------------------------------------------------
   عرض السلة الجانبية
--------------------------------------------------------- */
function renderCart() {
  const container = document.getElementById("cartItems");
  const emptyMsg = document.getElementById("cartEmptyMsg");

  container.innerHTML = "";

  if (cart.length === 0) {
    container.appendChild(emptyMsg);
    emptyMsg.style.display = "block";
  } else {
    cart.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${item.image}" alt="${item.name}" />
        <div class="cart-item-info">
          <div class="cart-item-top">
            <span class="cart-item-name">${item.name}</span>
            <button class="cart-item-remove" data-line="${item.lineId}" aria-label="حذف">🗑</button>
          </div>
          <div class="cart-item-meta">اللون: ${item.color} &nbsp;|&nbsp; المقاس: ${item.size}</div>
          <div class="cart-item-bottom">
            <div class="qty-control">
              <button class="qty-minus" data-line="${item.lineId}">-</button>
              <span>${item.qty}</span>
              <button class="qty-plus" data-line="${item.lineId}">+</button>
            </div>
            <span class="cart-item-price">${item.price * item.qty} ريال</span>
          </div>
        </div>
      `;
      container.appendChild(row);
    });
  }

  document.getElementById("cartSubtotal").textContent = `${cartTotal()} ريال`;
  updateCartCount();

  // ربط أزرار الكمية والحذف بعد إعادة الرسم
  container.querySelectorAll(".qty-plus").forEach((btn) =>
    btn.addEventListener("click", () => updateQty(btn.dataset.line, 1))
  );
  container.querySelectorAll(".qty-minus").forEach((btn) =>
    btn.addEventListener("click", () => updateQty(btn.dataset.line, -1))
  );
  container.querySelectorAll(".cart-item-remove").forEach((btn) =>
    btn.addEventListener("click", () => removeFromCart(btn.dataset.line))
  );
}

/* ---------------------------------------------------------
   فتح / إغلاق السلة الجانبية
--------------------------------------------------------- */
function openCart() {
  document.getElementById("cartSidebar").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}
function closeCart() {
  document.getElementById("cartSidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

/* ---------------------------------------------------------
   عرض بطاقات المنتجات
--------------------------------------------------------- */
function renderProducts(list) {
  const grid = document.getElementById("productsGrid");
  grid.innerHTML = "";

  list.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = product.id;

    const slidesHtml = product.images
      .map((src) => `<img src="${src}" alt="${product.name}" draggable="false" />`)
      .join("");

    const dotsHtml = product.images
      .map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`)
      .join("");

    const colorsHtml = product.colors
      .map((c) => `<span style="background:${colorToHex(c)}" title="${c}"></span>`)
      .join("");

    card.innerHTML = `
      <div class="card-media" data-index="0" data-count="${product.images.length}">
        ${product.isNew ? '<span class="badge-new">جديد</span>' : ""}
        <button class="fav-btn" aria-label="أضيفي للمفضلة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.35-9.5-8.8C.8 7.7 2.4 4.5 5.7 4c2-.3 3.7.7 4.9 2.4C11.7 4.7 13.5 3.7 15.5 4c3.3.5 4.9 3.7 3.2 7.2C19 15.65 12 20 12 20Z"/></svg>
        </button>
        <div class="card-slider-track">${slidesHtml}</div>
        <div class="slider-arrow prev">‹</div>
        <div class="slider-arrow next">›</div>
        <div class="slider-dots">${dotsHtml}</div>
      </div>
      <div class="card-body">
        <div class="card-name">${product.name}</div>
        <div class="card-price">${product.price} ريال</div>
        <div class="color-dots">${colorsHtml}</div>
        <button class="add-cart-btn" data-id="${product.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
          إضافة للسلة
        </button>
      </div>
    `;

    grid.appendChild(card);
    initCardSlider(card);
  });

  // فتح نافذة اختيار اللون/المقاس عند الضغط على "إضافة للسلة"
  grid.querySelectorAll(".add-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = PRODUCTS.find((p) => p.id == btn.dataset.id);
      openSelectionModal(product);
    });
  });

  // تبديل حالة زر المفضلة
  grid.querySelectorAll(".fav-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      btn.classList.toggle("active");
    });
  });
}

/* لون تقريبي لكل اسم لون عربي يُستخدم في دوائر الألوان */
function colorToHex(name) {
  const map = {
    "أسود": "#232022",
    "بيج": "#e8dcc4",
    "رمادي": "#9a9a9a",
    "بني": "#5b3a29",
    "كحلي": "#1c2438",
    "بنفسجي": "#6b3d64",
    "بنفسجي داكن": "#3a1c37",
  };
  return map[name] || "#cccccc";
}

/* ---------------------------------------------------------
   سلايدر صور المنتج داخل البطاقة (سحب باللمس + أزرار)
--------------------------------------------------------- */
function initCardSlider(card) {
  const media = card.querySelector(".card-media");
  const track = card.querySelector(".card-slider-track");
  const dots = card.querySelectorAll(".slider-dots span");
  const count = parseInt(media.dataset.count, 10);
  let index = 0;
  let startX = 0;
  let currentTranslate = 0;
  let dragging = false;

  function goTo(newIndex) {
    index = Math.max(0, Math.min(count - 1, newIndex));
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === index));
    media.dataset.index = index;
  }

  card.querySelector(".slider-arrow.prev").addEventListener("click", (e) => {
    e.stopPropagation();
    goTo(index - 1);
  });
  card.querySelector(".slider-arrow.next").addEventListener("click", (e) => {
    e.stopPropagation();
    goTo(index + 1);
  });

  // سحب باللمس (موبايل) وبالماوس (كمبيوتر)
  function dragStart(x) {
    dragging = true;
    startX = x;
    track.style.transition = "none";
  }
  function dragMove(x) {
    if (!dragging) return;
    currentTranslate = x - startX;
  }
  function dragEnd() {
    if (!dragging) return;
    dragging = false;
    track.style.transition = "transform 0.35s ease";
    if (currentTranslate < -40) {
      goTo(index + 1); // سحب لليسار -> الصورة التالية
    } else if (currentTranslate > 40) {
      goTo(index - 1); // سحب لليمين -> الصورة السابقة
    } else {
      goTo(index);
    }
    currentTranslate = 0;
  }

  media.addEventListener("touchstart", (e) => dragStart(e.touches[0].clientX), { passive: true });
  media.addEventListener("touchmove", (e) => dragMove(e.touches[0].clientX), { passive: true });
  media.addEventListener("touchend", dragEnd);

  media.addEventListener("mousedown", (e) => {
    e.preventDefault();
    dragStart(e.clientX);
  });
  window.addEventListener("mousemove", (e) => dragMove(e.clientX));
  window.addEventListener("mouseup", dragEnd);

  goTo(0);
}

/* ---------------------------------------------------------
   نافذة اختيار اللون / المقاس / الكمية
--------------------------------------------------------- */
let selectionState = { product: null, color: null, size: null, qty: 1 };

function openSelectionModal(product) {
  selectionState = { product, color: null, size: null, qty: 1 };

  document.getElementById("modalProductInfo").innerHTML = `
    <img src="${product.images[0]}" alt="${product.name}" />
    <div>
      <div class="mp-name">${product.name}</div>
      <div class="mp-price">${product.price} ريال</div>
    </div>
  `;

  const colorsWrap = document.getElementById("modalColors");
  colorsWrap.innerHTML = product.colors
    .map((c) => `<button type="button" class="option-chip" data-color="${c}">${c}</button>`)
    .join("");

  const sizesWrap = document.getElementById("modalSizes");
  sizesWrap.innerHTML = product.sizes
    .map((s) => `<button type="button" class="option-chip" data-size="${s}">${s}</button>`)
    .join("");

  document.getElementById("modalQtyValue").textContent = "1";
  document.getElementById("modalError").textContent = "";

  colorsWrap.querySelectorAll(".option-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      colorsWrap.querySelectorAll(".option-chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      selectionState.color = chip.dataset.color;
    });
  });

  sizesWrap.querySelectorAll(".option-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      sizesWrap.querySelectorAll(".option-chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      selectionState.size = chip.dataset.size;
    });
  });

  document.getElementById("selectionModal").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}

function closeSelectionModal() {
  document.getElementById("selectionModal").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

/* ---------------------------------------------------------
   نافذة تأكيد الطلب
--------------------------------------------------------- */
function openOrderModal() {
  if (cart.length === 0) {
    alert("سلتك فارغة، أضيفي منتجًا أولًا");
    return;
  }
  document.getElementById("orderModal").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}

function closeOrderModal() {
  document.getElementById("orderModal").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

/* ---------------------------------------------------------
   بناء رسالة واتساب وإرسالها
--------------------------------------------------------- */
function buildWhatsAppMessage({ name, phone, address, notes }) {
  let msg = `*طلب جديد من متجر ${BRAND.storeName}*\n\n`;
  msg += `👤 الاسم: ${name}\n`;
  msg += `📞 الهاتف: ${phone}\n`;
  msg += `📍 العنوان: ${address}\n\n`;
  msg += `🛍️ *تفاصيل الطلب:*\n`;

  cart.forEach((item, i) => {
    msg += `${i + 1}. ${item.name}\n`;
    msg += `   اللون: ${item.color} | المقاس: ${item.size} | الكمية: ${item.qty}\n`;
    msg += `   السعر: ${item.price * item.qty} ريال\n`;
  });

  msg += `\n💰 *المجموع الكلي: ${cartTotal()} ريال*\n`;

  if (notes && notes.trim() !== "") {
    msg += `\n📝 ملاحظات: ${notes}`;
  }

  return msg;
}

function sendOrderToWhatsApp(details) {
  const message = buildWhatsAppMessage(details);
  const url = `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

/* ---------------------------------------------------------
   ربط أحداث الواجهة العامة
--------------------------------------------------------- */
function bindGlobalEvents() {
  // فتح/إغلاق السلة
  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCart);

  // إغلاق كل شيء عند الضغط على الخلفية المعتمة
  document.getElementById("overlay").addEventListener("click", () => {
    closeCart();
    closeSelectionModal();
    closeOrderModal();
  });

  // زر تسوقي الآن يمرر إلى قسم المنتجات
  document.getElementById("shopNowBtn").addEventListener("click", () => {
    document.getElementById("products").scrollIntoView({ behavior: "smooth" });
  });

  // نافذة اختيار اللون/المقاس
  document.getElementById("closeSelectionModal").addEventListener("click", closeSelectionModal);

  document.getElementById("modalQtyMinus").addEventListener("click", () => {
    selectionState.qty = Math.max(1, selectionState.qty - 1);
    document.getElementById("modalQtyValue").textContent = selectionState.qty;
  });
  document.getElementById("modalQtyPlus").addEventListener("click", () => {
    selectionState.qty += 1;
    document.getElementById("modalQtyValue").textContent = selectionState.qty;
  });

  document.getElementById("modalAddBtn").addEventListener("click", () => {
    const errorEl = document.getElementById("modalError");
    if (!selectionState.color || !selectionState.size) {
      errorEl.textContent = "الرجاء اختيار اللون والمقاس قبل الإضافة للسلة";
      return;
    }
    errorEl.textContent = "";
    addToCart(selectionState.product, selectionState.color, selectionState.size, selectionState.qty);
    closeSelectionModal();
  });

  // فتح نافذة تأكيد الطلب من السلة
  document.getElementById("confirmOrderBtn").addEventListener("click", openOrderModal);
  document.getElementById("closeOrderModal").addEventListener("click", closeOrderModal);

  // إرسال مباشر عبر واتساب من داخل السلة (بدون نموذج، لمن يريد الإرسال السريع)
  document.getElementById("whatsappOrderBtn").addEventListener("click", () => {
    if (cart.length === 0) {
      alert("سلتك فارغة، أضيفي منتجًا أولًا");
      return;
    }
    openOrderModal();
  });

  // نموذج تأكيد الطلب
  document.getElementById("orderForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const address = document.getElementById("customerAddress").value.trim();
    const notes = document.getElementById("customerNotes").value.trim();

    if (!name || !phone || !address) return;

    sendOrderToWhatsApp({ name, phone, address, notes });
    closeOrderModal();
  });

  // فلترة روابط التنقل حسب الفئة
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      const filter = link.dataset.filter;
      if (filter === "all") {
        renderProducts(PRODUCTS);
     } else if (filter === "about") {
  openAboutModal();
  return;

      } else {
        renderProducts(PRODUCTS.filter((p) => p.category === filter));
      }
      document.getElementById("products").scrollIntoView({ behavior: "smooth" });
    });
  });
}

const aboutModal = document.getElementById("aboutModal");
const aboutModalClose = document.getElementById("aboutModalClose");
const aboutModalOverlay = document.getElementById("aboutModalOverlay");

function openAboutModal() {
  aboutModal.classList.add("active");
  aboutModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeAboutModal() {
  aboutModal.classList.remove("active");
  aboutModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

aboutModalClose.addEventListener("click", closeAboutModal);
aboutModalOverlay.addEventListener("click", closeAboutModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAboutModal();
  }
});