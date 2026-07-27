/* =========================================================
   products.js
   يجلب بيانات المنتجات من Firebase Firestore بدلاً من مصفوفة
   ثابتة، مع الإبقاء على نفس المتغير العام PRODUCTS الذي تعتمد
   عليه script.js وproduct.js دون أي تغيير في طريقة استخدامه.

   كل منتج يُعاد بمعرّف Firestore الحقيقي (product.id = doc.id)
   بدلاً من رقم ثابت، وهذا ما يسمح لصاحبة المتجر بإضافة/تعديل/
   حذف المنتجات من لوحة الإدارة (admin.html) دون كتابة كود.
   ========================================================= */

// تبقى فارغة حتى تكتمل عملية الجلب من Firestore عبر loadProducts()
let PRODUCTS = [];

/**
 * يجلب كل المنتجات من مجموعة "products" في Firestore،
 * ثم يُبقي في PRODUCTS المنتجات "المتاحة" فقط (available !== false)
 * لتظهر تلقائيًا في الصفحة الرئيسية وصفحة تفاصيل المنتج.
 *
 * لوحة الإدارة (admin.js) لا تستخدم هذه الدالة، بل تجلب كل
 * المنتجات (المتاحة والمخفية معًا) بشكل منفصل لتتمكن صاحبة
 * المتجر من إدارتها جميعًا.
 */
async function loadProducts() {
  try {
    const snapshot = await db
      .collection("products")
      .orderBy("createdAt", "desc")
      .get();

    const all = snapshot.docs.map((doc) => ({
      id: doc.id, // معرّف مستند Firestore بدلاً من رقم ثابت
      ...doc.data(),
    }));

    // نعرض للزوّار المنتجات المتاحة فقط (صاحبة المتجر تتحكم بهذا من لوحة الإدارة)
    PRODUCTS = all.filter((p) => p.available !== false);
  } catch (error) {
    console.error("تعذر تحميل المنتجات من Firestore:", error);
    PRODUCTS = [];
  }

  return PRODUCTS;
}