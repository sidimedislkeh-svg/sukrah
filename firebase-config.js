/* =========================================================
   firebase-config.js
   إعداد الاتصال بمشروع Firebase الخاص بمتجر سُكرة

   مهم جدًا: استبدلي القيم التالية بالقيم الحقيقية لمشروعك.
   تجدينها في Firebase Console:
   Project Settings (⚙) > عام (General) > Your apps > SDK setup and configuration

   هذا الملف يجب أن يُحمَّل بعد مكتبات Firebase (compat)
   وقبل ملفات products.js / script.js / product.js / admin.js
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyC78EJmmEHTJUyanEUN5ESDQLFhOI3mDdo",
  authDomain: "sukrah-b1563.firebaseapp.com",
  projectId: "sukrah-b1563",
  storageBucket: "sukrah-b1563.firebasestorage.app",
  messagingSenderId: "56097118509",
  appId: "1:56097118509:web:e6e6862cc69b2b92405ba4",
};

firebase.initializeApp(firebaseConfig);

/* عناصر Firebase يُعاد استخدامها في باقي ملفات المشروع
   (products.js, script.js, product.js, admin.js) */
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();