// core.js
window.buyers = window.buyers || [];
window.sales = window.sales || [];
window.checks = window.checks || [];
window.employees = window.employees || [];

function toPersianDigits(num) {
  return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
// ... سایر توابع کمکی و ابزارهای مشترک را اینجا اضافه کن ... 