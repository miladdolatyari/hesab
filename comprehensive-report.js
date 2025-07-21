// --- گزارش جامع چک‌ها ---

function fillMonthlyStats(sortOrder = 'desc') {
  const persianMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  let checksArr = [];
  if (typeof window.checks !== 'undefined' && Array.isArray(window.checks)) {
    checksArr = window.checks;
  } else if (typeof checks !== 'undefined' && Array.isArray(checks)) {
    checksArr = checks;
  }
  const monthlyStats = Array.from({length: 12}, (_, i) => ({
    month: persianMonths[i],
    count: 0,
    total: 0
  }));
  let totalCount = 0;
  let totalAmount = 0;
  checksArr.forEach(c => {
    if (!c.dueDate) return;
    const parts = c.dueDate.split('/');
    if (parts.length !== 3) return;
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      monthlyStats[monthIdx].count++;
      monthlyStats[monthIdx].total += parseInt(c.amount) || 0;
      totalCount++;
      totalAmount += parseInt(c.amount) || 0;
    }
  });
  // مرتب‌سازی بر اساس تعداد چک
  let sortedStats = [...monthlyStats];
  if (sortOrder === 'desc') {
    sortedStats.sort((a, b) => b.count - a.count);
  } else if (sortOrder === 'asc') {
    sortedStats.sort((a, b) => a.count - b.count);
  }
  // اگر sortOrder === none باشد، ترتیب طبیعی حفظ می‌شود

  // پیدا کردن ماه‌های برتر و کمترین
  const nonZeroStats = sortedStats.filter(s => s.count > 0);
  // بر اساس تعداد چک مرتب کن (برای امتیازدهی)
  const byCount = [...nonZeroStats].sort((a, b) => b.count - a.count);
  const maxCount = byCount[0]?.count || 0;
  const minCount = byCount[byCount.length-1]?.count || 0;
  // پیدا کردن ماه‌های max, 2nd, 3rd, min
  const maxMonth = byCount.find(s => s.count === maxCount);
  const secondMonth = byCount.find(s => s.count < maxCount);
  const thirdMonth = byCount.find(s => s.count < (secondMonth ? secondMonth.count : maxCount));
  const minMonth = byCount.reverse().find(s => s.count === minCount && s.count !== maxCount);

  const tbody = document.getElementById('monthlyStatsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  sortedStats.forEach((stat) => {
    const avg = stat.count > 0 ? Math.round(stat.total/stat.count) : 0;
    const percent = totalCount > 0 ? ((stat.count/totalCount)*100).toFixed(1) : '0.0';
    const percentFa = Number(percent).toLocaleString('fa-IR');
    // آیکون سمت راست نام ماه
    let icon = '';
    if (stat.count > 0 && maxMonth && stat.month === maxMonth.month) icon = '<span class="medal-icon">🏆</span> ';
    let trClass = '';
    if (stat.count > 0 && maxMonth && stat.month === maxMonth.month) trClass = 'gold-row';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${icon}${stat.month}</td><td>${stat.count}</td><td>${avg.toLocaleString('fa-IR')}</td><td>${stat.total.toLocaleString('fa-IR')}</td><td><span class='percent-sign'>% </span>${percentFa}</td>`;
    if (trClass) tr.classList.add(trClass);
    tbody.appendChild(tr);
  });
}

function showComprehensiveReportModal() {
  window.monthlyStatsSortOrder = 'none';
  fillMonthlyStats('none');
  // دکمه فعال
  const sortDescBtn = document.getElementById('sortDescBtn');
  const sortAscBtn = document.getElementById('sortAscBtn');
  const sortNoneBtn = document.getElementById('sortNoneBtn');
  if (sortDescBtn && sortAscBtn && sortNoneBtn) {
    sortNoneBtn.classList.add('active');
    sortDescBtn.classList.remove('active');
    sortAscBtn.classList.remove('active');
  }
  document.getElementById('comprehensiveReportModal').style.display = 'flex';
  switchTab('monthly-stats');
}
function hideComprehensiveReportModal() {
  document.getElementById('comprehensiveReportModal').style.display = 'none';
}
function switchTab(tabId) {
  document.querySelectorAll('.report-tabs .tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  document.querySelectorAll('.modal-body .tab-content').forEach(tab => {
    if (tab.id === tabId) {
      tab.classList.add('active');
      tab.style.display = '';
    } else {
      tab.classList.remove('active');
      tab.style.display = 'none';
    }
  });
}
// رویداد دکمه‌ها و تب‌ها
window.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('comprehensiveReportBtn');
  if (btn) {
    btn.onclick = showComprehensiveReportModal;
    console.log('Event listener برای دکمه گزارش جامع اضافه شد');
  }
  const closeBtn = document.getElementById('closeComprehensiveReportModal');
  if (closeBtn) closeBtn.onclick = hideComprehensiveReportModal;
  // بستن با کلیک روی پس‌زمینه مودال
  const overlay = document.getElementById('comprehensiveReportModal');
  if (overlay) overlay.addEventListener('click', function(e) {
    if (e.target === overlay) hideComprehensiveReportModal();
  });
  // تب‌ها
  document.querySelectorAll('.report-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      switchTab(this.getAttribute('data-tab'));
    });
  });
  // مرتب‌سازی آمار ماهانه
  window.monthlyStatsSortOrder = 'desc';
  const sortDescBtn = document.getElementById('sortDescBtn');
  const sortAscBtn = document.getElementById('sortAscBtn');
  const sortNoneBtn = document.getElementById('sortNoneBtn');
  if (sortDescBtn && sortAscBtn && sortNoneBtn) {
    sortDescBtn.addEventListener('click', function() {
      window.monthlyStatsSortOrder = 'desc';
      sortDescBtn.classList.add('active');
      sortAscBtn.classList.remove('active');
      sortNoneBtn.classList.remove('active');
      fillMonthlyStats('desc');
    });
    sortAscBtn.addEventListener('click', function() {
      window.monthlyStatsSortOrder = 'asc';
      sortAscBtn.classList.add('active');
      sortDescBtn.classList.remove('active');
      sortNoneBtn.classList.remove('active');
      fillMonthlyStats('asc');
    });
    sortNoneBtn.addEventListener('click', function() {
      window.monthlyStatsSortOrder = 'none';
      sortNoneBtn.classList.add('active');
      sortDescBtn.classList.remove('active');
      sortAscBtn.classList.remove('active');
      fillMonthlyStats('none');
    });
  }
}); 