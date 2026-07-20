/* =========================================================
   products.js
   بيانات المنتجات — عبايات سُكرة
   ========================================================= */

const PRODUCTS = [
 
{
  id: 1,

  name: "عباية سُكرة السوداء",

  price: 650,

  category: "new",

  colors: ["أسود"],

  sizes: ["S", "M", "L", "XL", "XXL"],

  images: [
    "images/abaya-9-front.webp",
    "images/abaya-9-back.webp",
    "images/abaya-9-side.webp"
  ],

  isNew: true,

  available: true,
},
];

if (typeof module !== "undefined") {
  module.exports = PRODUCTS;
}