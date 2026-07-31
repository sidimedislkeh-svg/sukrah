/* =========================================================
   admin.js — لوحة إدارة متجر سُكرة
   تسجيل الدخول (Firebase Authentication) + إدارة المنتجات
   (Firestore).

   ملاحظة مؤقتة: تم إيقاف كل استخدام لـ Firebase Storage.
   الصور توضع يدويًا داخل مجلد images/ في المشروع، وصاحبة
   المتجر تكتب مسارات هذه الصور في نموذج المنتج (كل مسار في
   سطر منفصل)، ويتم حفظها كمصفوفة نصية في حقل images داخل
   Firestore.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  applyAdminBrand();
  bindLoginForm();
  bindPanelEvents();
  bindProductForm();

  // مراقبة حالة تسجيل الدخول: تُظهر شاشة الدخول أو لوحة الإدارة تلقائيًا
  auth.onAuthStateChanged((user) => {
    if (user) {
      document.getElementById("adminLoginScreen").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      loadAdminProducts();
    } else {
      document.getElementById("adminPanel").style.display = "none";
      document.getElementById("adminLoginScreen").style.display = "flex";
    }
  });
});

/* ---------------------------------------------------------
   تطبيق اسم المتجر من brand.js على شاشة الدخول (بدون التأثير
   على أي ألوان أخرى — الألوان تُطبَّق تلقائيًا عبر style.css)
--------------------------------------------------------- */
function applyAdminBrand() {
  const root = document.documentElement;
  Object.entries(BRAND.colors).forEach(([key, value]) => {
    const cssVarName =
      "--color-" + key.replace(/([A-Z])/g, "-$1").toLowerCase();
    root.style.setProperty(cssVarName, value);
  });
}

/* ---------------------------------------------------------
   تسجيل الدخول / الخروج
--------------------------------------------------------- */
function bindLoginForm() {
  document.getElementById("adminLoginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const errorEl = document.getElementById("loginError");
    errorEl.textContent = "";

    auth.signInWithEmailAndPassword(email, password).catch((error) => {
      errorEl.textContent = "بيانات الدخول غير صحيحة. تأكدي من البريد وكلمة المرور.";
      console.error("خطأ تسجيل الدخول:", error);
    });
  });
}

function bindPanelEvents() {
  document.getElementById("logoutBtn").addEventListener("click", () => {
    auth.signOut();
  });

  document.getElementById("addProductBtn").addEventListener("click", () => {
    openProductModal("add", null);
  });

  document.getElementById("closeProductModal").addEventListener("click", closeProductModal);
  document.getElementById("cancelProductBtn").addEventListener("click", closeProductModal);
}

/* ---------------------------------------------------------
   جلب كل المنتجات (المتاحة والمخفية معًا) لعرضها في لوحة الإدارة
--------------------------------------------------------- */
let adminProducts = [];

async function loadAdminProducts() {
  try {
    const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
    adminProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("تعذر تحميل المنتجات:", error);
    adminProducts = [];
  }
  renderAdminTable();
}

function renderAdminTable() {
  const table = document.getElementById("adminProductsTable");
  const body = document.getElementById("adminProductsBody");
  const emptyState = document.getElementById("adminEmptyState");

  body.innerHTML = "";

  if (adminProducts.length === 0) {
    table.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  const categoryLabels = { new: "وصل حديثًا", luxury: "فاخرة", prayer: "للصلاة" };

  adminProducts.forEach((product) => {
    const isAvailable = product.available !== false;
    const thumb = (product.images && product.images[0]) || "";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${thumb ? `<img class="admin-thumb" src="${thumb}" alt="${product.name}" />` : "—"}</td>
      <td>${product.name || "—"}</td>
      <td>${product.price != null ? product.price + " ريال" : "—"}</td>
      <td>${categoryLabels[product.category] || product.category || "—"}</td>
      <td>
        <span class="admin-status ${isAvailable ? "available" : "hidden"}">
          ${isAvailable ? "متاح" : "مخفي"}
        </span>
      </td>
      <td>
        <div class="admin-row-actions">
          <button type="button" class="admin-action-btn" data-action="edit" data-id="${product.id}">تعديل</button>
          <button type="button" class="admin-action-btn" data-action="toggle" data-id="${product.id}">
            ${isAvailable ? "إخفاء" : "إظهار"}
          </button>
          <button type="button" class="admin-action-btn danger" data-action="delete" data-id="${product.id}">حذف</button>
        </div>
      </td>
    `;
    body.appendChild(row);
  });

  body.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = adminProducts.find((p) => p.id === btn.dataset.id);
      if (product) openProductModal("edit", product);
    });
  });

  body.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
    btn.addEventListener("click", () => toggleAvailability(btn.dataset.id));
  });

  body.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
  });
}

/* إظهار / إخفاء منتج للزوّار دون حذفه */
async function toggleAvailability(productId) {
  const product = adminProducts.find((p) => p.id === productId);
  if (!product) return;

  const newValue = !(product.available !== false);
  try {
    await db.collection("products").doc(productId).update({ available: newValue });
    await loadAdminProducts();
  } catch (error) {
    alert("تعذر تحديث حالة المنتج. حاولي مرة أخرى.");
    console.error(error);
  }
}

/* حذف منتج نهائيًا من Firestore
   (لا يوجد حذف من Storage حاليًا لأن الصور تُدار يدويًا داخل مجلد images/) */
async function deleteProduct(productId) {
  const confirmed = confirm("هل أنتِ متأكدة من حذف هذا المنتج نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.");
  if (!confirmed) return;

  try {
    await db.collection("products").doc(productId).delete();
    await loadAdminProducts();
  } catch (error) {
    alert("تعذر حذف المنتج. حاولي مرة أخرى.");
    console.error(error);
  }
}

/* ---------------------------------------------------------
   نافذة إضافة / تعديل منتج
--------------------------------------------------------- */
let currentEditId = null; // null = وضع الإضافة، وإلا معرّف المنتج قيد التعديل

/* ---------------------------------------------------------
   صفوف الألوان الديناميكية (لون + صوره الخاصة)
   لا توجد أسماء ألوان ثابتة في الكود؛ صاحبة المتجر تضيف أي
   عدد من الألوان وتكتب اسم كل لون ومسارات صوره بنفسها.
--------------------------------------------------------- */

function colorVariantRowMarkup() {
  return `
    <div class="admin-color-variant-row">
      <div class="admin-color-variant-header">
        <input type="text" class="color-variant-name" placeholder="اسم اللون (مثال: أسود)" />
        <input type="color" class="color-variant-hex" value="#000000" title="اختيار كود اللون (Hex)" />
        <button type="button" class="admin-action-btn danger remove-color-variant-btn">حذف اللون</button>
      </div>
      <textarea class="color-variant-images" rows="3" placeholder="images/abaya-10-black-front.webp&#10;images/abaya-10-black-side.webp&#10;images/abaya-10-black-back.webp"></textarea>
    </div>
  `;
}

function addColorVariantRow(name, hex, imagesText) {
  const container = document.getElementById("colorVariantsContainer");
  const wrapper = document.createElement("div");
  wrapper.innerHTML = colorVariantRowMarkup().trim();
  const row = wrapper.firstElementChild;

  row.querySelector(".color-variant-name").value = name || "";
  row.querySelector(".color-variant-hex").value = hex || "#000000";
  row.querySelector(".color-variant-images").value = imagesText || "";

  row.querySelector(".remove-color-variant-btn").addEventListener("click", () => {
    row.remove();
  });

  container.appendChild(row);
}

function clearColorVariantRows() {
  document.getElementById("colorVariantsContainer").innerHTML = "";
}

function bindColorVariantEvents() {
  document.getElementById("addColorVariantBtn").addEventListener("click", () => {
    addColorVariantRow("", "#000000", "");
  });
}

/* يقرأ كل صفوف الألوان الحالية من النموذج ويبنى منها colorVariants (مصفوفة) + colors */
function getColorVariantsFromForm() {
  const rows = document.querySelectorAll("#colorVariantsContainer .admin-color-variant-row");
  const colorVariants = [];

  rows.forEach((row) => {
    const name = row.querySelector(".color-variant-name").value.trim();
    if (!name) return; // تجاهل أي صف بلا اسم لون

    const hex = row.querySelector(".color-variant-hex").value || "#000000";

    const images = row
      .querySelector(".color-variant-images")
      .value.split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    colorVariants.push({ name, hex, images });
  });

  const colors = colorVariants.map((v) => v.name);
  return { colorVariants, colors };
}

/* تخمين تقريبي لكود Hex عند ترحيل بيانات قديمة كانت محفوظة بدون hex
   (لا يُستخدم إطلاقًا للمنتجات الجديدة التي تُدخل فيها صاحبة المتجر
   كود اللون بنفسها عبر منتقي اللون) */
function colorToHexGuess(name) {
  const map = {
    "أسود": "#232022",
    "بيج": "#e8dcc4",
    "رمادي": "#9a9a9a",
    "بني": "#5b3a29",
    "كحلي": "#1c2438",
    "بنفسجي": "#6b3d64",
    "بنفسجي داكن": "#3a1c37",
  };
  return map[name] || "#000000";
}

/* ---------------------------------------------------------
   نافذة إضافة / تعديل منتج
--------------------------------------------------------- */
function openProductModal(mode, product) {
  currentEditId = mode === "edit" ? product.id : null;

  document.getElementById("productModalTitle").textContent =
    mode === "edit" ? "تعديل المنتج" : "إضافة منتج جديد";
  document.getElementById("productFormError").textContent = "";

  document.getElementById("fieldName").value = mode === "edit" ? product.name || "" : "";
  document.getElementById("fieldPrice").value = mode === "edit" ? product.price ?? "" : "";
  document.getElementById("fieldCategory").value = mode === "edit" ? product.category || "new" : "new";
  document.getElementById("fieldDescription").value = mode === "edit" ? product.description || "" : "";
  document.getElementById("fieldFabric").value = mode === "edit" ? product.fabric || "" : "";
  document.getElementById("fieldCare").value = mode === "edit" ? product.care || "" : "";
  document.getElementById("fieldDetails").value =
    mode === "edit" && Array.isArray(product.details) ? product.details.join("\n") : "";
  document.getElementById("fieldIsNew").checked = mode === "edit" ? !!product.isNew : false;
  document.getElementById("fieldAvailable").checked = mode === "edit" ? product.available !== false : true;

  const sizesGroup = document.getElementById("fieldSizes");
  const selectedSizes = mode === "edit" && Array.isArray(product.sizes) ? product.sizes : [];
  sizesGroup.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.checked = selectedSizes.includes(cb.value);
  });

  // بناء صفوف الألوان: يدعم ثلاثة أشكال بيانات محتملة للمنتج القادم من Firestore
  // 1) الشكل الحالي: colorVariants كمصفوفة [{ name, hex, images }]
  // 2) شكل سابق: colorVariants ككائن { name: [images] } بلا hex
  // 3) منتج قديم جدًا: بلا colorVariants إطلاقًا، فقط colors[] + images[] مشتركة
  clearColorVariantRows();

  if (mode === "edit") {
    if (Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
      product.colorVariants.forEach((variant) => {
        addColorVariantRow(
          variant.name,
          variant.hex || "#000000",
          Array.isArray(variant.images) ? variant.images.join("\n") : ""
        );
      });
    } else if (product.colorVariants && typeof product.colorVariants === "object" && Object.keys(product.colorVariants).length > 0) {
      Object.entries(product.colorVariants).forEach(([colorName, images]) => {
        addColorVariantRow(
          colorName,
          colorToHexGuess(colorName),
          Array.isArray(images) ? images.join("\n") : ""
        );
      });
    } else if (Array.isArray(product.colors) && product.colors.length > 0) {
      const sharedImages = Array.isArray(product.images) ? product.images.join("\n") : "";
      product.colors.forEach((colorName) => {
        addColorVariantRow(colorName, colorToHexGuess(colorName), sharedImages);
      });
    } else {
      addColorVariantRow("", "#000000", "");
    }
  } else {
    addColorVariantRow("", "#000000", ""); // صف فارغ واحد جاهز عند إضافة منتج جديد
  }

  document.getElementById("productModal").classList.add("open");
}

function closeProductModal() {
  document.getElementById("productModal").classList.remove("open");
  currentEditId = null;
}

function bindProductForm() {
  bindColorVariantEvents();

  document.getElementById("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveProduct();
  });
}

async function saveProduct() {
  const errorEl = document.getElementById("productFormError");
  errorEl.textContent = "";

  const name = document.getElementById("fieldName").value.trim();
  const price = Number(document.getElementById("fieldPrice").value);
  const category = document.getElementById("fieldCategory").value;
  const sizes = Array.from(
    document.querySelectorAll('#fieldSizes input[type="checkbox"]:checked')
  ).map((cb) => cb.value);
  const description = document.getElementById("fieldDescription").value.trim();
  const fabric = document.getElementById("fieldFabric").value.trim();
  const care = document.getElementById("fieldCare").value.trim();
  const details = document
    .getElementById("fieldDetails")
    .value.split("\n")
    .map((d) => d.trim())
    .filter((d) => d.length > 0);
  const isNew = document.getElementById("fieldIsNew").checked;
  const available = document.getElementById("fieldAvailable").checked;

  const { colorVariants, colors } = getColorVariantsFromForm();

  if (!name || !price || sizes.length === 0) {
    errorEl.textContent = "الرجاء تعبئة الاسم والسعر ومقاس واحد على الأقل.";
    return;
  }

  if (colors.length === 0) {
    errorEl.textContent = "الرجاء إضافة لون واحد على الأقل مع اسمه.";
    return;
  }

  const colorWithNoImages = colorVariants.find((v) => v.images.length === 0);
  if (colorWithNoImages) {
    errorEl.textContent = `الرجاء إدخال صورة واحدة على الأقل للون "${colorWithNoImages.name}".`;
    return;
  }

  const saveBtn = document.getElementById("saveProductBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "جارٍ الحفظ...";

  try {
    const docRef = currentEditId
      ? db.collection("products").doc(currentEditId)
      : db.collection("products").doc();

    // صور اللون الأول تُستخدم كمجموعة الصور الافتراضية (images) الظاهرة في
    // بطاقة المنتج بالصفحة الرئيسية، وتبقى صور كل لون (واسمه وكود Hex الخاص به) كاملة داخل colorVariants
    const defaultImages = colorVariants[0].images;

    const productData = {
      name,
      price,
      category,
      colors,
      colorVariants,
      images: defaultImages,
      sizes,
      isNew,
      available,
      description,
      fabric,
      care,
      details,
    };

    if (currentEditId) {
      await docRef.update(productData);
    } else {
      productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await docRef.set(productData);
    }

    closeProductModal();
    await loadAdminProducts();
  } catch (error) {
    errorEl.textContent = "حدث خطأ أثناء حفظ المنتج. حاولي مرة أخرى.";
    console.error("خطأ حفظ المنتج:", error);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "حفظ المنتج";
  }
}