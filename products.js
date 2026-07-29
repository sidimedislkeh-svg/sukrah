/* =========================================================
   products.js
   طبقة بيانات المنتجات — تجمع بين ثلاثة مصادر بالترتيب التالي:

   1) Cache محلي (localStorage) — يُعرض فورًا إن وُجد.
   2) بيانات احتياطية ثابتة (Fallback) — تُستخدم فقط إن لم يوجد
      أي Cache بعد (أول زيارة على الإطلاق، أو بعد مسح بيانات المتصفح).
   3) Firestore — يُقرأ في الخلفية لتحديث الواجهة والـ Cache،
      وفقط عند الحاجة (إن لم يكن الـ Cache حديثًا) لتقليل القراءات.

   يبقى الاسم العام PRODUCTS كما هو، وتبقى طريقة استخدامه في
   script.js وproduct.js كما هي (مصفوفة منتجات جاهزة للعرض).

   لوحة الإدارة (admin.js) لا تستخدم أيًا من هذه الدوال؛ لديها
   قراءة Firestore مباشرة ومستقلة تمامًا كما كانت دائمًا.
   ========================================================= */

// تُملأ فورًا من Cache أو من البيانات الاحتياطية عند استدعاء loadProductsInitial()
let PRODUCTS = [];

/* ---------------------------------------------------------
   إعدادات قابلة للتعديل
--------------------------------------------------------- */

// ⚠️ مدة صلاحية الكاش بالمللي ثانية — عدّلي هذا الرقم فقط للتحكم
// في عدد مرات الاتصال بـ Firestore. طالما الكاش أحدث من هذه المدة،
// لن يتصل الموقع بـ Firestore عند فتح الصفحة الرئيسية أو صفحة المنتج.
// المثال الحالي: 5 دقائق.
const PRODUCTS_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

const PRODUCTS_CACHE_KEY = "sukrah_products_cache_v1";

/* ---------------------------------------------------------
   بيانات احتياطية ثابتة (Static Fallback)
   تُستخدم فقط في حال عدم وجود أي Cache محفوظ بعد. تُحدَّث
   تلقائيًا بأول اتصال ناجح بـ Firestore ولا تُستخدم بعدها.
   يمكن لصاحبة المتجر تحديث هذه القائمة يدويًا بين حين وآخر
   لتعكس أبرز منتجاتها الحالية (اختياري، وليس ضروريًا).
--------------------------------------------------------- */
const FALLBACK_PRODUCTS = [
  {
    id: "fallback-1",
    name: "عباية سُكرة السوداء",
    price: 650,
    category: "new",
    colors: ["أسود"],
    colorVariants: [
      {
        name: "أسود",
        hex: "#232022",
        images: [
          "images/abaya-9-front.webp",
          "images/abaya-9-back.webp",
          "images/abaya-9-side.webp",
        ],
      },
    ],
    images: [
      "images/abaya-9-front.webp",
      "images/abaya-9-back.webp",
      "images/abaya-9-side.webp",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    isNew: true,
    available: true,
    description:
      "عباية سُكرة السوداء بقصة كلاسيكية أنيقة، مصممة من قماش فاخر ناعم الملمس يمنحك إطلالة راقية ومريحة طوال اليوم.",
    fabric: "كريب فاخر عالي الجودة، غير شفاف وسهل الحركة",
    care: "يُغسل غسيلاً جافًا أو بماء بارد، ويُكوى على حرارة منخفضة",
    details: [
      "قصة واسعة مريحة",
      "أكمام طويلة كلاسيكية",
      "إغلاق أمامي بسحاب مخفي",
      "تطريز خفيف عند الأكمام",
    ],
  },
];

/* ---------------------------------------------------------
   قراءة / كتابة الكاش المحلي (localStorage)
   يُخزَّن فيه بيانات المنتجات النصية فقط (مسارات الصور كنص،
   وليست الصور نفسها) — لا يوجد أي تخزين لملفات ثنائية هنا.
--------------------------------------------------------- */
function readProductsCache() {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.products) || typeof parsed.timestamp !== "number") {
      return null; // شكل غير متوقع (كاش تالف) — يُتجاهل بأمان
    }

    return parsed;
  } catch (error) {
    // JSON غير صالح أو أي خطأ قراءة آخر — نتجاهل الكاش بأمان دون أي تعطل
    return null;
  }
}

function writeProductsCache(products) {
  try {
    localStorage.setItem(
      PRODUCTS_CACHE_KEY,
      JSON.stringify({ products, timestamp: Date.now() })
    );
  } catch (error) {
    // فشل الحفظ (مثلاً المساحة ممتلئة) لا يوقف عمل المتجر، فقط لن يُستفاد من الكاش لاحقًا
    console.warn("تعذر حفظ كاش المنتجات:", error);
  }
}

function isProductsCacheFresh(cacheEntry) {
  return !!cacheEntry && Date.now() - cacheEntry.timestamp < PRODUCTS_CACHE_MAX_AGE_MS;
}

/* ---------------------------------------------------------
   التحميل الأولي (متزامن تمامًا، بدون انتظار الشبكة إطلاقًا)
   يُستدعى أول شيء عند فتح الصفحة الرئيسية أو صفحة المنتج، ويملأ
   PRODUCTS فورًا من الكاش إن وُجد، وإلا من البيانات الاحتياطية.
--------------------------------------------------------- */
function loadProductsInitial() {
  const cacheEntry = readProductsCache();

  if (cacheEntry) {
    PRODUCTS = cacheEntry.products;
  } else {
    PRODUCTS = FALLBACK_PRODUCTS;
  }

  return { isFresh: isProductsCacheFresh(cacheEntry) };
}

/* ---------------------------------------------------------
   تحديث في الخلفية من Firestore (غير متزامن)
   يُستدعى فقط عند الحاجة (كاش غير حديث، أو منتج مطلوب غير موجود
   ضمن البيانات الحالية). لا يحذف أو يُفرغ المنتجات المعروضة عند
   الفشل؛ تبقى PRODUCTS كما كانت قبل محاولة التحديث.
   يُعيد true إذا اختلفت البيانات فعليًا عمّا كان معروضًا، حتى
   تُقرر الصفحة إن كانت بحاجة لإعادة الرسم أم لا.
--------------------------------------------------------- */
async function refreshProductsFromFirestore() {
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
    const available = all.filter((p) => p.available !== false);

    const changed = JSON.stringify(available) !== JSON.stringify(PRODUCTS);

    PRODUCTS = available;
    writeProductsCache(available);

    return changed;
  } catch (error) {
    console.error("تعذر تحديث المنتجات من Firestore:", error);
    return false; // فشل التحديث: تبقى المنتجات المعروضة حاليًا كما هي دون أي تغيير
  }
}