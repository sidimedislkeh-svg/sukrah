/* =========================================================
   sw.js — Service Worker لمتجر سُكرة
   يخزّن فقط الملفات الثابتة للمشروع (HTML, CSS, JS) والصور
   المحلية داخل مجلد images/. لا يخزّن أي بيانات من Firestore،
   ولا يتدخل إطلاقًا في أي طلب خارجي (خطوط Google، مكتبات
   Firebase عبر CDN...)، ولا في أي شيء متعلق بلوحة الإدارة.
   ========================================================= */

// ⚠️ عند نشر أي تحديث على ملفات المتجر (HTML/CSS/JS)، غيّري هذا
// الرقم فقط (مثلاً من "v1" إلى "v2") حتى يقوم المتصفح بتفعيل نسخة
// جديدة من الملفات المخزّنة بدل الاعتماد على النسخة القديمة.
const CACHE_VERSION = "v3";

const STATIC_CACHE_NAME = `sukrah-static-${CACHE_VERSION}`;
const IMAGES_CACHE_NAME = `sukrah-images-${CACHE_VERSION}`;

// الملفات الثابتة الأساسية فقط — بدون أي روابط خارجية (Firebase أو خطوط Google)
// وبدون ملفات لوحة الإدارة عمدًا (admin.html / admin.js / admin.css تبقى
// دائمًا تُقرأ من الشبكة مباشرة، انظر شرط التجاوز داخل معالج "fetch" أدناه)
const STATIC_ASSETS = [
  "./",
  "./product.html",
  "./style.css",
  "./product.css",
  "./brand.js",
  "./firebase-config.js",
  "./products.js",
  "./script.js",
  "./product.js",
  "./sw-register.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // تفعيل النسخة الجديدة فورًا دون انتظار إغلاق كل التبويبات
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("sukrah-static-") || key.startsWith("sukrah-images-")
            )
            .filter((key) => key !== STATIC_CACHE_NAME && key !== IMAGES_CACHE_NAME)
            .map((key) => caches.delete(key)) // حذف أي نسخ كاش قديمة من إصدارات سابقة
        )
      )
      .then(() => self.clients.claim()) // السيطرة فورًا على كل الصفحات المفتوحة بعد التحديث
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // لا نتدخل إطلاقًا في أي طلب خارج نطاق المتجر نفسه (Firestore، Firebase
  // Auth، خطوط Google، مكتبات Firebase عبر CDN...) — يمر مباشرة إلى الشبكة
  if (url.origin !== self.location.origin) {
    return;
  }

  // لا نتدخل في طلبات غير GET (لا يوجد أصلاً POST/PUT محلي في هذا المشروع، لكن للأمان)
  if (request.method !== "GET") {
    return;
  }

  // لوحة الإدارة بكل ملفاتها تبقى دائمًا تُقرأ من الشبكة مباشرة ولا تُخزَّن إطلاقًا
  if (url.pathname.includes("admin")) {
    return;
  }
  // صفحات HTML: الشبكة أولًا لتجنب مشكلة التحويلات في Safari
if (request.mode === "navigate") {
  event.respondWith(
    fetch(request).catch(() => caches.match("./"))
  );
  return;
}

  // الصور المحلية داخل مجلد images/: كاش أولاً، ثم الشبكة، ثم نخزّن الناتج
  // لأي صورة جديدة تُضاف مستقبلًا تلقائيًا دون أي تعديل على هذا الملف
  if (url.pathname.includes("/images/")) {
    event.respondWith(
      caches.open(IMAGES_CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // الملفات الثابتة المُخزَّنة مسبقًا: كاش أولاً، مع الرجوع للشبكة كخيار احتياطي
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});