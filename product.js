/* =========================================================
   product.js — صفحة تفاصيل المنتج (PDP)
   يقرأ بيانات المنتج من products.js عبر معرّف id في الرابط
   ويستخدم نفس نظام السلة الموجود في script.js (نفس مفتاح
   التخزين المحلي sukrah_cart ونفس بنية عناصر السلة) حتى تبقى
   السلة متوافقة تمامًا بين الصفحة الرئيسية وصفحة تفاصيل المنتج.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  applyBrand();
  loadCart();
  bindGlobalEvents();

  // 1) عرض فوري: من الكاش المحفوظ محليًا، أو من بيانات احتياطية ثابتة إن لم يوجد كاش بعد
  const { isFresh } = loadProductsInitial();
  let product = findRequestedProduct();
  if (product) {
    showProductDetail(product);
  }

  // 2) تحديث من Firestore في الخلفية إذا كان الكاش غير حديث، أو إذا لم نجد
  //    المنتج المطلوب بعد (قد يكون منتجًا أُضيف حديثًا وليس ضمن الكاش الحالي)
  if (!isFresh || !product) {
    const changed = await refreshProductsFromFirestore();
    const freshProduct = findRequestedProduct();

    if (freshProduct) {
      // نعيد الرسم فقط إذا لم يكن معروضًا من قبل، أو إذا تغيّرت بياناته فعليًا
      if (!product || changed) {
        showProductDetail(freshProduct);
      }
    } else if (!product) {
      showNotFoundMessage();
    }
  }
});

/* ---------------------------------------------------------
   تطبيق هوية المتجر من brand.js (مطابق لما في script.js)
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
}

/* ---------------------------------------------------------
   حالة السلة — مطابقة تمامًا لمنطق script.js لضمان توافق البيانات
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
   عرض السلة الجانبية (نفس الترميز المستخدم في script.js)
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
   نافذة تأكيد الطلب وإرسال واتساب (نفس منطق script.js)
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
   ربط أحداث الواجهة العامة (السلة والنوافذ المشتركة فقط)
--------------------------------------------------------- */
function bindGlobalEvents() {
  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCart);

  document.getElementById("overlay").addEventListener("click", () => {
    closeCart();
    closeOrderModal();
  });

  document.getElementById("confirmOrderBtn").addEventListener("click", openOrderModal);
  document.getElementById("closeOrderModal").addEventListener("click", closeOrderModal);

  document.getElementById("whatsappOrderBtn").addEventListener("click", () => {
    if (cart.length === 0) {
      alert("سلتك فارغة، أضيفي منتجًا أولًا");
      return;
    }
    openOrderModal();
  });

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
}

/* ---------------------------------------------------------
   لون تقريبي لكل اسم لون عربي (نفس القائمة المستخدمة في script.js)
--------------------------------------------------------- */
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
   منطق صفحة تفاصيل المنتج
--------------------------------------------------------- */
let pdpState = { product: null, color: null, size: null, qty: 1 };
let pdpDragHandlers = null; // مرجع لمستمعي السحب الحاليين على window لإزالتهم عند تبديل اللون

function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function findRequestedProduct() {
  const id = getProductIdFromURL();
  return PRODUCTS.find((p) => String(p.id) === String(id));
}

function showNotFoundMessage() {
  document.getElementById("pdpWrapper").style.display = "none";
  document.getElementById("pdpNotFound").style.display = "block";
}

function showProductDetail(product) {
  document.title = `${product.name} | ${BRAND.storeName}`;
  pdpState = { product, color: null, size: null, qty: 1 };
  renderProductDetail(product);
}

function renderProductDetail(product) {
  const wrapper = document.getElementById("pdpWrapper");

  const colorVariants = getColorVariants(product); // مصفوفة [{ name, hex, images }]
  const defaultVariant = colorVariants[0];
  const defaultColor = defaultVariant.name;
  const defaultImages = defaultVariant.images.length > 0 ? defaultVariant.images : product.images || [];

  const colorsHtml = colorVariants
    .map(
      (v, i) =>
        `<button type="button" class="option-chip ${i === 0 ? "selected" : ""}" data-color="${v.name}">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${v.hex};margin-inline-end:6px;vertical-align:middle;"></span>${v.name}
        </button>`
    )
    .join("");

  const sizesHtml = product.sizes
    .map((s) => `<button type="button" class="option-chip" data-size="${s}">${s}</button>`)
    .join("");

  // أقسام اختيارية: description / fabric / care / details
  // لا تسبب غيابها أي خطأ لأن كل قسم يُبنى فقط إذا كان موجودًا فعليًا في المنتج
  let extraHtml = "";

  if (product.description) {
    extraHtml += `
      <div class="pdp-extra-block">
        <h3>الوصف</h3>
        <p>${product.description}</p>
      </div>`;
  }

  if (product.fabric) {
    extraHtml += `
      <div class="pdp-extra-block">
        <h3>الخامة</h3>
        <p>${product.fabric}</p>
      </div>`;
  }

  if (product.care) {
    extraHtml += `
      <div class="pdp-extra-block">
        <h3>العناية بالمنتج</h3>
        <p>${product.care}</p>
      </div>`;
  }

  if (Array.isArray(product.details) && product.details.length > 0) {
    extraHtml += `
      <div class="pdp-extra-block">
        <h3>تفاصيل إضافية</h3>
        <ul>${product.details.map((d) => `<li>${d}</li>`).join("")}</ul>
      </div>`;
  }

  wrapper.innerHTML = `
    <div class="pdp-gallery">
      ${galleryMarkup(defaultImages, product.isNew)}
    </div>

    <div class="pdp-info">
      <h1 class="pdp-name">${product.name}</h1>
      <div class="pdp-price">${product.price} ريال</div>

      <div class="pdp-field">
        <div class="pdp-field-label">اللون <span class="selected-value" id="pdpColorValue">${defaultColor}</span></div>
        <div class="option-group" id="pdpColors">${colorsHtml}</div>
      </div>

      <div class="pdp-field">
        <div class="pdp-field-label">المقاس <span class="selected-value" id="pdpSizeValue"></span></div>
        <div class="option-group" id="pdpSizes">${sizesHtml}</div>
      </div>

      <div class="pdp-field">
        <div class="pdp-field-label">الكمية</div>
        <div class="pdp-qty-row">
          <div class="qty-control">
            <button id="pdpQtyMinus">-</button>
            <span id="pdpQtyValue">1</span>
            <button id="pdpQtyPlus">+</button>
          </div>
        </div>
      </div>

      <p class="pdp-error" id="pdpError"></p>

      <button class="btn btn-dark pdp-add-btn" id="pdpAddBtn">إضافة للسلة</button>
      <p class="pdp-secondary-note">التوصيل متاح لجميع مناطق المملكة عبر التواصل المباشر بعد تأكيد الطلب</p>

      ${extraHtml ? `<div class="pdp-extra">${extraHtml}</div>` : ""}
    </div>
  `;

  // أول لون يكون محددًا تلقائيًا، وصوره تظهر مباشرة عند فتح الصفحة
  pdpState.color = defaultColor;

  initPdpGallery(defaultImages);
  bindPdpSelectors(product, colorVariants);
  setupMobileAddBar(product);
}

/* ---------------------------------------------------------
   يبني بيانات الألوان وصورها وأكوادها (colorVariants) كمصفوفة
   [{ name, hex, images }] — يدعم ثلاثة أشكال بيانات محتملة:
   1) الشكل الحالي: colorVariants كمصفوفة فيها hex حقيقي لكل لون
   2) شكل سابق: colorVariants ككائن { name: [images] } بلا hex
   3) منتج قديم جدًا: بلا colorVariants إطلاقًا (colors[] + images[] مشتركة)
--------------------------------------------------------- */
function getColorVariants(product) {
  if (Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
    return product.colorVariants.map((v) => ({
      name: v.name,
      hex: v.hex || colorToHex(v.name),
      images: Array.isArray(v.images) ? v.images : [],
    }));
  }

  if (
    product.colorVariants &&
    typeof product.colorVariants === "object" &&
    Object.keys(product.colorVariants).length > 0
  ) {
    return Object.entries(product.colorVariants).map(([name, images]) => ({
      name,
      hex: colorToHex(name),
      images: Array.isArray(images) ? images : [],
    }));
  }

  const legacyColors =
    Array.isArray(product.colors) && product.colors.length > 0
      ? product.colors
      : ["اللون الافتراضي"];

  return legacyColors.map((name) => ({
    name,
    hex: colorToHex(name),
    images: Array.isArray(product.images) ? product.images : [],
  }));
}

/* ---------------------------------------------------------
   بناء ترميز المعرض (الصورة الرئيسية + الصور المصغرة) لمجموعة
   صور معيّنة — تُستخدم عند العرض الأول وعند تبديل اللون
--------------------------------------------------------- */
function galleryMarkup(images, isNew) {
  const slidesHtml = images
    .map((src) => `<img src="${src}" alt="صورة المنتج" draggable="false" />`)
    .join("");

  const dotsHtml = images
    .map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`)
    .join("");

  const thumbsHtml = images
    .map(
      (src, i) =>
        `<button type="button" class="pdp-thumb ${i === 0 ? "active" : ""}" data-index="${i}">
          <img src="${src}" alt="صورة ${i + 1}" />
        </button>`
    )
    .join("");

  return `
    <div class="pdp-main-media" id="pdpMainMedia" data-count="${images.length}">
      <div class="pdp-main-track" id="pdpMainTrack">${slidesHtml}</div>
      <div class="slider-arrow prev" id="pdpArrowPrev">‹</div>
      <div class="slider-arrow next" id="pdpArrowNext">›</div>
      <div class="slider-dots" id="pdpDots">${dotsHtml}</div>
      ${isNew ? '<span class="badge-new">جديد</span>' : ""}
    </div>
    ${images.length > 1 ? `<div class="pdp-thumbs" id="pdpThumbs">${thumbsHtml}</div>` : ""}
  `;
}

/* يعيد بناء معرض الصور بالكامل عند تبديل اللون المختار */
function rebuildGallery(images, isNew) {
  const galleryWrap = document.querySelector(".pdp-gallery");
  galleryWrap.innerHTML = galleryMarkup(images, isNew);
  initPdpGallery(images);
}

/* ---------------------------------------------------------
   سلايدر الصورة الرئيسية + الصور المصغرة
--------------------------------------------------------- */
function initPdpGallery(images) {
  // إزالة مستمعي السحب السابقين على window قبل إضافة مستمعين جدد
  // (يحدث هذا عند إعادة بناء المعرض بعد تبديل اللون)
  if (pdpDragHandlers) {
    window.removeEventListener("mousemove", pdpDragHandlers.move);
    window.removeEventListener("mouseup", pdpDragHandlers.up);
    pdpDragHandlers = null;
  }

  const media = document.getElementById("pdpMainMedia");
  const track = document.getElementById("pdpMainTrack");
  const dots = document.querySelectorAll("#pdpDots span");
  const thumbs = document.querySelectorAll(".pdp-thumb");
  const count = images.length;

  let index = 0;
  let startX = 0;
  let currentTranslate = 0;
  let dragging = false;

 function goTo(newIndex) {
  if (count <= 0) return;

  if (newIndex >= count) {
    index = 0;
  } else if (newIndex < 0) {
    index = count - 1;
  } else {
    index = newIndex;
  }

  track.style.transform = `translateX(-${index * 100}%)`;
  dots.forEach((d, i) => d.classList.toggle("active", i === index));
  thumbs.forEach((t, i) => t.classList.toggle("active", i === index));
}
  document.getElementById("pdpArrowPrev").addEventListener("click", () => goTo(index - 1));
  document.getElementById("pdpArrowNext").addEventListener("click", () => goTo(index + 1));

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => goTo(parseInt(thumb.dataset.index, 10)));
  });

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
      goTo(index + 1);
    } else if (currentTranslate > 40) {
      goTo(index - 1);
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

  const moveHandler = (e) => dragMove(e.clientX);
  const upHandler = () => dragEnd();
  window.addEventListener("mousemove", moveHandler);
  window.addEventListener("mouseup", upHandler);
  pdpDragHandlers = { move: moveHandler, up: upHandler };

  goTo(0);
}

/* ---------------------------------------------------------
   اختيار اللون / المقاس / الكمية + التحقق قبل الإضافة للسلة
--------------------------------------------------------- */
function bindPdpSelectors(product, colorVariants) {
  const colorsWrap = document.getElementById("pdpColors");
  const sizesWrap = document.getElementById("pdpSizes");
  const errorEl = document.getElementById("pdpError");

  colorsWrap.querySelectorAll(".option-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const colorName = chip.dataset.color;
      if (pdpState.color === colorName) return; // اللون نفسه محدد بالفعل

      colorsWrap.querySelectorAll(".option-chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      pdpState.color = colorName;
      document.getElementById("pdpColorValue").textContent = colorName;
      errorEl.textContent = "";

      // تبديل معرض الصور بالكامل إلى صور اللون المختار
      const variant = colorVariants.find((v) => v.name === colorName);
      const images = variant && variant.images.length > 0 ? variant.images : product.images || [];
      rebuildGallery(images, product.isNew);
    });
  });

  sizesWrap.querySelectorAll(".option-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      sizesWrap.querySelectorAll(".option-chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      pdpState.size = chip.dataset.size;
      document.getElementById("pdpSizeValue").textContent = pdpState.size;
      errorEl.textContent = "";
    });
  });

  document.getElementById("pdpQtyMinus").addEventListener("click", () => {
    pdpState.qty = Math.max(1, pdpState.qty - 1);
    document.getElementById("pdpQtyValue").textContent = pdpState.qty;
  });
  document.getElementById("pdpQtyPlus").addEventListener("click", () => {
    pdpState.qty += 1;
    document.getElementById("pdpQtyValue").textContent = pdpState.qty;
  });

  document.getElementById("pdpAddBtn").addEventListener("click", () => handleAddToCart(product));
}

function handleAddToCart(product) {
  const errorEl = document.getElementById("pdpError");
  if (!pdpState.color || !pdpState.size) {
    errorEl.textContent = "الرجاء اختيار اللون والمقاس قبل الإضافة للسلة";
    return;
  }
  errorEl.textContent = "";
  addToCart(product, pdpState.color, pdpState.size, pdpState.qty);
}

/* ---------------------------------------------------------
   شريط الإضافة السفلي الثابت على الهاتف
--------------------------------------------------------- */
function setupMobileAddBar(product) {
  const bar = document.getElementById("mobileAddBar");
  const priceEl = document.getElementById("mobileAddPrice");
  const btn = document.getElementById("mobileAddBtn");

  priceEl.textContent = `${product.price} ريال`;
  bar.style.display = "flex";

  btn.addEventListener("click", () => handleAddToCart(product));
}