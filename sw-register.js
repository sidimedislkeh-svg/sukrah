/* =========================================================
   sw-register.js — تسجيل الـ Service Worker
   يُحمَّل فقط في الصفحة الرئيسية وصفحة تفاصيل المنتج (وليس في
   لوحة الإدارة)، ولا علاقة له ببيانات Firestore أو السلة إطلاقًا؛
   وظيفته الوحيدة تسريع تحميل الملفات الثابتة في الزيارات التالية.
   ========================================================= */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("تعذر تسجيل Service Worker:", error);
    });
  });
}