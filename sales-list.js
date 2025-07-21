// داده‌های نمونه تراکنش
const sales = [
  {
    date: '۱۴۰۳/۰۳/۲۱',
    buyer: 'علی محمدی',
    product: 'پیانو یاماها U1',
    amount: 250000000,
    method: 'نقدی',
    status: 'paid'
  },
  {
    date: '۱۴۰۳/۰۳/۲۰',
    buyer: 'مریم احمدی',
    product: 'پیانو کاوایی K300',
    amount: 180000000,
    method: 'اقساط',
    status: 'pending'
  },
  {
    date: '۱۴۰۳/۰۳/۱۹',
    buyer: 'رضا حسینی',
    product: 'پیانو دیجیتال Roland',
    amount: 120000000,
    method: 'نقدی',
    status: 'cancelled'
  },
  {
    date: '۱۴۰۳/۰۳/۱۸',
    buyer: 'سارا رضایی',
    product: 'پیانو یاماها U3',
    amount: 320000000,
    method: 'اقساط',
    status: 'paid'
  }
];

function toPersianNumber(num) {
  return num.toLocaleString('fa-IR');
}

function getStatusBadge(status) {
  switch (status) {
    case 'paid': return '<span class="status-badge status-paid">پرداخت شده</span>';
    case 'pending': return '<span class="status-badge status-pending">در انتظار</span>';
    case 'cancelled': return '<span class="status-badge status-cancelled">لغو شده</span>';
    default: return '<span class="status-badge">نامشخص</span>';
  }
}

function renderTable(data) {
  const tbody = document.getElementById('sales-list-tbody');
  tbody.innerHTML = '';
  data.forEach((sale, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sale.date}</td>
      <td>${sale.buyer}</td>
      <td>${sale.product}</td>
      <td>${toPersianNumber(sale.amount)} تومان</td>
      <td>${sale.method}</td>
      <td>${getStatusBadge(sale.status)}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn" title="مشاهده"><i class="fas fa-eye"></i></button>
          <button class="action-btn" title="ویرایش"><i class="fas fa-edit"></i></button>
          <button class="action-btn" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('sales-list-count').textContent = `${toPersianNumber(data.length)} تراکنش`;
  document.getElementById('stat-count').textContent = toPersianNumber(data.length);
}

function updateStats(data) {
  const total = data.reduce((sum, s) => sum + s.amount, 0);
  const avg = data.length ? Math.round(total / data.length) : 0;
  document.getElementById('stat-total').textContent = `${toPersianNumber(total)} تومان`;
  document.getElementById('stat-avg').textContent = `${toPersianNumber(avg)} تومان`;
  document.getElementById('sales-list-total').textContent = `مجموع: ${toPersianNumber(total)} تومان`;
}

function filterSales() {
  const buyer = document.getElementById('filter-buyer').value.trim();
  const date = document.getElementById('filter-date').value.trim();
  const amount = document.getElementById('filter-amount').value.trim();
  const status = document.getElementById('filter-status').value;
  let filtered = sales.filter(sale => {
    return (
      (buyer === '' || sale.buyer.includes(buyer)) &&
      (date === '' || sale.date.includes(date)) &&
      (amount === '' || sale.amount.toString().includes(amount.replace(/\D/g, ''))) &&
      (status === '' || sale.status === status)
    );
  });
  renderTable(filtered);
  updateStats(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  renderTable(sales);
  updateStats(sales);
  document.querySelector('.btn.filter').onclick = filterSales;
}); 