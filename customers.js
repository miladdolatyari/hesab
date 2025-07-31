// customers.js
// مدیریت مشتریان و سوابق خرید

// اطمینان از وجود داده‌های سراسری
window.buyers = window.buyers || [];
window.sales = window.sales || [];
window.checks = window.checks || [];

// تابع تبدیل اعداد به فارسی
function toPersianDigits(num) {
  return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// نمایش جدول مشتریان
function updateBuyersTable() {
  const buyers = window.buyers;
  const sales = window.sales;
  const checks = window.checks;
  const tbody = document.getElementById('customers-list-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  let filteredBuyers = buyers;
  // ... (در صورت نیاز فیلترها را اضافه کنید) ...
  filteredBuyers.forEach((buyer, idx) => {
    const buyerSales = sales.filter(s => s.buyerId === buyer.id);
    const purchasesCount = buyerSales.length;
    const totalAmount = buyerSales.reduce((sum, s) => sum + (s.price || 0), 0);
    const cells = [
      toPersianDigits(idx+1),
      buyer.name || '',
      buyer.phone ? toPersianDigits(buyer.phone) : '',
      buyer.birthDate ? toPersianDigits(buyer.birthDate) : '',
      buyer.province || '',
      buyer.city || '',
      buyer.instrument || '',
      purchasesCount ? toPersianDigits(purchasesCount) : '۰',
      toPersianDigits(totalAmount.toLocaleString()) + " <span style='font-size:12px;color:#888;'>تومان</span>",
      '',
      `<div class="action-btns"><button class="action-btn" data-action="orders" data-idx="${idx}" title="سوابق خرید"><i class="fas fa-history"></i></button></div>`
    ];
    const tr = document.createElement('tr');
    tr.innerHTML = cells.map((cell, i) => `<td${i === 0 ? " class='row-index'" : ''}>${cell}</td>`).join('');
    tbody.appendChild(tr);
  });
  // رویداد دکمه سوابق خرید
  tbody.querySelectorAll('button[data-action="orders"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      const buyer = filteredBuyers[idx];
      showCustomerOrdersModal(buyer);
    });
  });
}

// تابع نمایش مودال لیست سوابق خرید مشتری
function showCustomerOrdersModal(buyer) {
  const sales = window.sales;
  const customerSales = sales.filter(s => s.buyerId === buyer.id);
  let oldModal = document.getElementById('customer-orders-modal');
  if (oldModal) oldModal.remove();
  const modal = document.createElement('div');
  modal.id = 'customer-orders-modal';
  modal.className = 'custom-modal-overlay';
  modal.innerHTML = `<div class="custom-modal-box">
    <button id="close-customer-orders-modal" class="custom-modal-close"><i class='fas fa-times'></i></button>
    <div id="customer-orders-modal-content"></div>
  </div>`;
  document.body.appendChild(modal);
  document.getElementById('close-customer-orders-modal').onclick = function() {
    modal.remove();
  };
  modal.onclick = function(e) {
    if (e.target === modal) modal.remove();
  };
  let html = '';
  html += `<h3 class='custom-modal-title'><i class='fas fa-user'></i> سوابق خرید مشتری: <span style='color:#1976d2'>${buyer.name}</span></h3>`;
  html += `<div style='overflow-x:auto;'><table class='report-table custom-modal-table' style='width:100%;margin-bottom:10px;'>
    <thead><tr><th>ردیف</th><th>تاریخ</th><th>کالا</th><th>مبلغ</th></tr></thead><tbody>`;
  if (customerSales.length === 0) {
    html += `<tr><td colspan='4' style='text-align:center;color:#888;padding:24px;'>هیچ سفارشی یافت نشد</td></tr>`;
  } else {
    customerSales.forEach((s, i) => {
      html += `<tr>
        <td>${toPersianDigits(i+1)}</td>
        <td>${toPersianDigits(s.date||'-')}</td>
        <td>${s.product||'-'}</td>
        <td>${toPersianDigits((s.price||0).toLocaleString())} تومان</td>
      </tr>`;
    });
  }
  html += `</tbody></table></div>`;
  document.getElementById('customer-orders-modal-content').innerHTML = html;
  modal.style.display = 'flex';
  if (!document.getElementById('custom-modal-style')) {
    const style = document.createElement('style');
    style.id = 'custom-modal-style';
    style.innerHTML = `
.custom-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.custom-modal-box {
  background: #fff; padding: 32px 24px 18px 24px; border-radius: 18px; max-width: 700px; width: 98vw;
  box-shadow: 0 8px 32px rgba(52,152,219,0.13); position: relative;
}
.custom-modal-close {
  position: absolute; top: 12px; left: 12px; background: none; border: none; font-size: 22px; color: #888; cursor: pointer;
}
.custom-modal-title { margin-bottom: 12px; font-size: 1.2rem; font-weight: bold; }
.custom-modal-table th, .custom-modal-table td { font-size: 14px; }
`;
    document.head.appendChild(style);
  }
}

// اگر صفحه مشتریان فعال شد جدول را به‌روزرسانی کن
window.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('customers-list-tbody')) {
    updateBuyersTable();
  }
}); 