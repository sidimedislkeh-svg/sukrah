/* =========================================================
   products.js
   بيانات المنتجات — عبايات سُكرة
   ========================================================= */

const PRODUCTS = [
  {
    id: 1,
    name: "عباية سكينة",
    price: 450,
    category: "new",
    colors: ["أسود", "بيج", "رمادي"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "images/abaya-1-front.svg",
      "images/abaya-1-back.svg",
      "images/abaya-1-side.svg",
      "images/abaya-1-detail.svg",
    ],
    isNew: true,
    available: true,
  },
  {
    id: 2,
    name: "عباية لمى",
    price: 500,
    category: "new",
    colors: ["بني", "أسود", "كحلي"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      "images/abaya-2-front.svg",
      "images/abaya-2-back.svg",
      "images/abaya-2-side.svg",
      "images/abaya-2-detail.svg",
    ],
    isNew: true,
    available: true,
  },
  {
    id: 3,
    name: "عباية توليـن",
    price: 550,
    category: "luxury",
    colors: ["أسود", "كحلي"],
    sizes: ["M", "L", "XL"],
    images: [
      "images/abaya-3-front.svg",
      "images/abaya-3-back.svg",
      "images/abaya-3-side.svg",
      "images/abaya-3-detail.svg",
    ],
    isNew: true,
    available: true,
  },
  {
    id: 4,
    name: "عباية دانة",
    price: 480,
    category: "new",
    colors: ["كحلي", "أسود", "رمادي"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "images/abaya-4-front.svg",
      "images/abaya-4-back.svg",
      "images/abaya-4-side.svg",
      "images/abaya-4-detail.svg",
    ],
    isNew: false,
    available: true,
  },
  {
    id: 5,
    name: "عباية سُكرة الفاخرة",
    price: 690,
    category: "luxury",
    colors: ["بنفسجي", "أسود"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      "images/abaya-5-front.svg",
      "images/abaya-5-back.svg",
      "images/abaya-5-side.svg",
      "images/abaya-5-detail.svg",
    ],
    isNew: true,
    available: true,
  },
  {
    id: 6,
    name: "عباية رهف",
    price: 420,
    category: "prayer",
    colors: ["رمادي", "بيج", "أسود"],
    sizes: ["S", "M", "L"],
    images: [
      "abaya-6-front.svg",
      "abaya-6-back.svg",
      "abaya-6-side.svg",
      "abaya-6-detail.svg",
    ],
    isNew: false,
    available: true,
  },
  {
    id: 7,
    name: "عباية مايا المطرزة",
    price: 620,
    category: "luxury",
    colors: ["أسود", "بني"],
    sizes: ["M", "L", "XL", "XXL"],
    images: [
      "abaya-7-front.svg",
      "abaya-7-back.svg",
      "abaya-7-side.svg",
      "abaya-7-detail.svg",
    ],
    isNew: false,
    available: true,
  },
  {
    id: 8,
    name: "عباية وفاء",
    price: 470,
    category: "prayer",
    colors: ["بنفسجي داكن", "أسود"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "abaya-8-front.svg",
      "abaya-8-back.svg",
      "abaya-8-side.svg",
      "abaya-8-detail.svg",
    ],
    isNew: true,
    available: true,
  },
];

if (typeof module !== "undefined") {
  module.exports = PRODUCTS;
}