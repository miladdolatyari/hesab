// داده‌های اولیه (در آینده می‌توان از localStorage یا فایل استفاده کرد)
let buyers = [];
let sales = [];
let checks = [];
let employees = [];

// ابزار کمکی برای تولید شناسه یکتا
function generateId(arr) {
  return arr.length ? Math.max(...arr.map(item => item.id)) + 1 : 1;
}

// تابع نمایش بخش
function showSection(sectionName) {
  const navLinks = document.querySelectorAll('.main-nav a');
  const sections = document.querySelectorAll('.content-section');
  
  // حذف کلاس active از همه لینک‌ها
  navLinks.forEach(l => l.parentElement.classList.remove('active'));
  
  // اضافه کردن کلاس active به لینک مربوطه
  const targetLink = document.querySelector(`.main-nav a[href="#${sectionName}"]`);
  if (targetLink) {
    targetLink.parentElement.classList.add('active');
  }
  
  // حذف کلاس active از همه بخش‌ها
  sections.forEach(sec => sec.classList.remove('active'));
  
  // اضافه کردن کلاس active به بخش مورد نظر
  const targetSection = document.getElementById(sectionName);
  if (targetSection) {
    targetSection.classList.add('active');
    document.getElementById('page-title').textContent = targetLink ? targetLink.textContent.trim() : sectionName;
  }
  
  // نمایش یا مخفی کردن دکمه گزارش جامع فقط برای چک‌های ورودی
  const reportBtn = document.getElementById('comprehensiveReportBtn');
  if (reportBtn) {
    if (sectionName === 'checks') {
      reportBtn.style.display = 'flex';
    } else {
      reportBtn.style.display = 'none';
    }
  }
  
  // نمایش یا مخفی کردن دکمه گزارش جامع چک‌های خروجی
  const outgoingReportBtn = document.getElementById('outgoing-comprehensive-report-btn');
  if (outgoingReportBtn) {
    if (sectionName === 'outgoing-checks') {
      outgoingReportBtn.style.display = 'flex';
    } else {
      outgoingReportBtn.style.display = 'none';
    }
  }
  
  // به‌روزرسانی جداول مربوطه
  if(sectionName === 'sales-list') updateSalesTable();
  if(sectionName === 'dashboard') {
    updateDashboard();
    createMonthlyPerformanceChart();
  }
  if(sectionName === 'checks') {
    updateChecksTable();
    updateChecksStatsCardsFromArray();
  }
}

// مدیریت نمایش بخش‌ها با کلیک روی منو
function setupSectionNavigation() {
  const navLinks = document.querySelectorAll('.main-nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('href').replace('#', '');
      showSection(target);
    });
  });
}

// ذخیره داده‌ها در localStorage
function saveAllData() {
  localStorage.setItem('buyers', JSON.stringify(buyers));
  localStorage.setItem('sales', JSON.stringify(sales));
  localStorage.setItem('checks', JSON.stringify(checks));
}

// مهاجرت داده‌های قدیمی - اضافه کردن priceRaw به تراکنش‌های موجود
function migrateOldSalesData() {
  let needsSave = false;
  sales.forEach(sale => {
    if (!sale.priceRaw && sale.price !== undefined && sale.price !== null) {
      sale.priceRaw = sale.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      needsSave = true;
    }
  });
  if (needsSave) {
    saveAllData();
  }
}

// بارگذاری داده‌ها از localStorage
function loadAllData() {
  buyers = JSON.parse(localStorage.getItem('buyers') || '[]');
  sales = JSON.parse(localStorage.getItem('sales') || '[]');
  checks = JSON.parse(localStorage.getItem('checks') || '[]');
  // مهاجرت داده‌های قدیمی
  migrateOldSalesData();
  // اضافه کردن داده‌های نمونه چک‌ها در صورت خالی بودن
  initializeSampleChecksData();
}

// ثبت تراکنش جدید
function saveTransaction() {
  console.log('=== saveTransaction function called ===');
  console.log('isEditingTransaction:', window.isEditingTransaction);
  console.log('editingTransactionIndex:', window.editingTransactionIndex);
  
  try {
    
    if (window.isEditingTransaction && window.editingTransactionIndex !== undefined) {
      console.log('Showing update alert...');
      showCustomAlert('در حال به‌روزرسانی...', 'info');
    }
    
    // دریافت تمام مقادیر فرم
    const customerName = document.getElementById('customer-name').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const customerAddress = document.getElementById('customer-address').value.trim();
    const productName = document.getElementById('product-name').value;
    const salePriceRaw = document.getElementById('sale-price').value;
    const salePrice = parseNumberWithDots(faToEnWithDots(salePriceRaw));
    const saleDate = getJalaliDateValue(document.getElementById('transaction-date'));

    console.log('Validation values:');
    console.log('- customerName:', customerName);
    console.log('- productName:', productName);
    console.log('- salePriceRaw:', salePriceRaw);
    console.log('- salePrice:', salePrice);
    console.log('- saleDate:', saleDate);

    // اعتبارسنجی فیلدهای ضروری
    if (!customerName) {
      console.log('Validation failed: customerName is empty');
      showCustomAlert('لطفاً نام مشتری را وارد کنید.', 'error');
      return;
    }
    
    if (!productName || productName === '') {
      console.log('Validation failed: productName is empty');
      showCustomAlert('لطفاً کالا را انتخاب کنید.', 'error');
      return;
    }
    
    if (!salePrice || salePrice === 0) {
      console.log('Validation failed: salePrice is invalid');
      showCustomAlert('لطفاً مبلغ فروش را وارد کنید.', 'error');
      return;
    }
    
    if (!saleDate) {
      console.log('Validation failed: saleDate is empty');
      showCustomAlert('لطفاً تاریخ را وارد کنید.', 'error');
      return;
    }

    const paymentMethod = document.getElementById('payment-method').value;
    const advancePaymentRaw = document.getElementById('advance-payment').value;
    const advancePayment = parseInt(faToEn(advancePaymentRaw)) || 0;
    const birthDate = getJalaliDateValue(document.getElementById('birth-date'));
    const province = document.getElementById('province').value;
    const city = document.getElementById('city') ? document.getElementById('city').value : '';
    const instrument = document.getElementById('product-type') ? document.getElementById('product-type').value : '';

    // اطلاعات مالی
    const purchasePrice = parseNumberWithDots(faToEnWithDots(document.getElementById('purchase-price').value)) || 0;
    const colorCost = parseNumberWithDots(faToEnWithDots(document.getElementById('color-cost').value)) || 0;
    const regulationCost = parseNumberWithDots(faToEnWithDots(document.getElementById('regulation-cost').value)) || 0;
    const transportCost = parseNumberWithDots(faToEnWithDots(document.getElementById('transport-cost').value)) || 0;
    const grossProfit = salePrice - purchasePrice;
    const netProfit = grossProfit - colorCost - regulationCost - transportCost;

    // اطلاعات معلم و فروشنده
    const teacherName = document.getElementById('teacher-name').value;
    const teacherPercent = parseFloat(faToEn(document.getElementById('teacher-percent').value)) || 0;
    const teacherCommission = Math.round(salePrice * teacherPercent / 100);
    const sellerName = document.getElementById('seller-name').value;
    const sellerPercent = parseFloat(faToEn(document.getElementById('seller-percent').value)) || 0;
    const sellerCommission = Math.round(salePrice * sellerPercent / 100);

    // مشتری را پیدا کن یا بساز
    let buyer = buyers.find(b => b.name === customerName);
    if (!buyer) {
      buyer = {
        id: generateId(buyers),
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        birthDate: birthDate,
        province: province,
        city: city,
        instrument: instrument,
        purchases: 0,
        total: 0,
        lastBuy: saleDate
      };
      buyers.push(buyer);
    } else {
      // به‌روزرسانی اطلاعات مشتری موجود
      buyer.phone = customerPhone;
      buyer.address = customerAddress;
      buyer.birthDate = birthDate;
      buyer.province = province;
      buyer.city = city;
      buyer.instrument = instrument;
    }

    // بررسی اینکه آیا در حالت ویرایش هستیم یا نه
    if (window.isEditingTransaction && window.editingTransactionIndex !== undefined) {
      try {
        // بررسی وجود تراکنش در آرایه
        if (window.editingTransactionIndex >= sales.length) {
          throw new Error('تراکنش مورد نظر یافت نشد');
        }
        
        // حالت ویرایش - تراکنش موجود را به‌روزرسانی کن
        const existingSale = sales[window.editingTransactionIndex];
        if (!existingSale) {
          throw new Error('تراکنش موجود یافت نشد');
        }
        
        const oldBuyer = buyers.find(b => b.id === existingSale.buyerId);
        
        // کاهش آمار خریدار قبلی (اگر خریدار تغییر کرده)
        if (oldBuyer && oldBuyer.id !== buyer.id) {
          oldBuyer.purchases = Math.max(0, oldBuyer.purchases - 1);
          oldBuyer.total = Math.max(0, oldBuyer.total - (existingSale.price || 0));
        }
        
        // حذف چک‌های قبلی این تراکنش
        const existingChecks = checks.filter(c => c.saleId === existingSale.id);
        existingChecks.forEach(check => {
          const checkIndex = checks.findIndex(c => c.id === check.id);
          if (checkIndex !== -1) {
            checks.splice(checkIndex, 1);
          }
        });
        
        // به‌روزرسانی تراکنش موجود
        existingSale.buyerId = buyer.id;
        existingSale.product = productName;
        existingSale.date = saleDate;
        existingSale.price = salePrice;
        existingSale.priceRaw = salePriceRaw;
        existingSale.paymentMethod = paymentMethod;
        existingSale.advancePayment = advancePayment;
        existingSale.advancePaymentRaw = advancePaymentRaw;
        existingSale.purchasePrice = purchasePrice;
        existingSale.colorCost = colorCost;
        existingSale.regulationCost = regulationCost;
        existingSale.transportCost = transportCost;
        existingSale.grossProfit = grossProfit;
        existingSale.netProfit = netProfit;
        existingSale.teacherName = teacherName;
        existingSale.teacherPercent = teacherPercent;
        existingSale.teacherCommission = teacherCommission;
        existingSale.sellerName = sellerName;
        existingSale.sellerPercent = sellerPercent;
        existingSale.sellerCommission = sellerCommission;
        
        // به‌روزرسانی آمار خریدار جدید
        buyer.purchases++;
        buyer.total += salePrice;
        buyer.lastBuy = saleDate;
        
        // ثبت چک‌های جدید (در صورت نیاز)
        if (paymentMethod === 'installment') {
          const checkItems = document.querySelectorAll('.check-item');
          checkItems.forEach(item => {
            const sayadi = item.querySelector('.check-sayadi')?.value || '';
            const series = item.querySelector('.check-series')?.value || '';
            const bank = item.querySelector('.check-bank')?.value || '';
            const branch = item.querySelector('.check-branch')?.value || '';
            const issuer = item.querySelector('.check-issuer')?.value || '';
            const to = item.querySelector('.check-to')?.value || '';
            const national = item.querySelector('.check-national')?.value || '';
            const amount = parseInt(faToEn(item.querySelector('.check-amount')?.value || '0')) || 0;
            const dueDate = getJalaliDateValue(item.querySelector('.check-date'));
            if (amount && dueDate) {
              checks.push({
                id: generateId(checks),
                saleId: existingSale.id,
                buyerId: buyer.id,
                sayadi,
                series,
                bank,
                branch,
                issuer,
                to,
                national,
                amount,
                dueDate,
                status: 'در جریان'
              });
            }
          });
        }
        
        // ذخیره داده‌ها
        saveAllData();
        
        // به‌روزرسانی UI
        updateBuyersTable();
        updateChecksTable();
        updateSalesTable();
        updateDashboard();
        createMonthlyPerformanceChart();
        
        // پاک کردن حالت ویرایش
        window.isEditingTransaction = false;
        window.editingTransactionIndex = undefined;
        window.editingTransactionId = undefined;
        
        // بازگرداندن متن دکمه ذخیره
        const saveButton = document.querySelector('#transactions .btn.primary');
        if (saveButton) {
          saveButton.textContent = 'ثبت تراکنش';
          saveButton.innerHTML = '<i class="fas fa-save"></i> ثبت تراکنش';
        }
        
        // پاک کردن فرم
        clearTransactionForm();
        
        // نمایش پیام موفقیت
        setTimeout(function() {
          showCustomAlert('تراکنش با موفقیت به‌روزرسانی شد!', 'success');
        }, 400);
        
      } catch (error) {
        console.error('خطا در ویرایش تراکنش:', error);
        // فقط در console نمایش دهیم، alert نمایش ندهیم
      }
      
    } else {
      try {
        // حالت جدید - تراکنش جدید بساز
        buyer.purchases++;
        buyer.total += salePrice;
        buyer.lastBuy = saleDate;

        // ثبت فروش جدید
        const sale = {
          id: generateId(sales),
          buyerId: buyer.id,
          product: productName,
          date: saleDate,
          price: salePrice,
          priceRaw: salePriceRaw,
          paymentMethod,
          advancePayment,
          advancePaymentRaw,
          // اطلاعات مالی
          purchasePrice,
          colorCost,
          regulationCost,
          transportCost,
          grossProfit,
          netProfit,
          // اطلاعات معلم و فروشنده
          teacherName,
          teacherPercent,
          teacherCommission,
          sellerName,
          sellerPercent,
          sellerCommission
        };
        sales.push(sale);

        // ثبت چک‌ها (در صورت نیاز)
        if (paymentMethod === 'installment') {
          const checkItems = document.querySelectorAll('.check-item');
          checkItems.forEach(item => {
            const sayadi = item.querySelector('.check-sayadi')?.value || '';
            const series = item.querySelector('.check-series')?.value || '';
            const bank = item.querySelector('.check-bank')?.value || '';
            const branch = item.querySelector('.check-branch')?.value || '';
            const issuer = item.querySelector('.check-issuer')?.value || '';
            const to = item.querySelector('.check-to')?.value || '';
            const national = item.querySelector('.check-national')?.value || '';
            const amount = parseInt(faToEn(item.querySelector('.check-amount')?.value || '0')) || 0;
            const dueDate = getJalaliDateValue(item.querySelector('.check-date'));
            if (amount && dueDate) {
              checks.push({
                id: generateId(checks),
                saleId: sale.id,
                buyerId: buyer.id,
                sayadi,
                series,
                bank,
                branch,
                issuer,
                to,
                national,
                amount,
                dueDate,
                status: 'در جریان'
              });
            }
          });
        }

        // ذخیره داده‌ها
        saveAllData();
        
        // به‌روزرسانی UI
        updateBuyersTable();
        updateChecksTable();
        updateSalesTable();
        updateDashboard();
        createMonthlyPerformanceChart();
        
        // پاک کردن فرم
        clearTransactionForm();
        
        // نمایش پیام موفقیت
        setTimeout(function() {
          showCustomAlert('تراکنش جدید با موفقیت ثبت شد!', 'success');
        }, 100);
        
      } catch (error) {
        console.error('خطا در ثبت تراکنش:', error);
        // فقط در console نمایش دهیم، alert نمایش ندهیم
      }
    }
  } catch (error) {
    console.error('خطای کلی در saveTransaction:', error);
    showCustomAlert(`خطای غیرمنتظره: ${error.message}`, 'error');
  }
}

// به‌روزرسانی جدول مشتریان
function updateBuyersTable() {
  const tbody = document.querySelector('#customers .customers-table tbody');
  tbody.innerHTML = '';
  buyers.forEach((buyer, idx) => {
    // مجموع خریدها را از sales محاسبه کن
    const buyerSales = sales.filter(s => s.buyerId === buyer.id);
    const totalAmount = buyerSales.reduce((sum, s) => sum + (s.price || 0), 0);
    // اگر خرید چکی داشته، تاریخ سررسید چک‌ها را نمایش بده
    const buyerChecks = checks.filter(c => c.buyerId === buyer.id);
    let lastBuyOrDue = buyer.lastBuy || '';
    if (buyerChecks.length > 0) {
      const dueDates = buyerChecks.map(c => c.dueDate).filter(Boolean);
      if (dueDates.length > 0) lastBuyOrDue = dueDates.join('، ');
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${buyer.name || ''}</td>
      <td>${buyer.phone || ''}</td>
      <td>${buyer.birthDate || ''}</td>
      <td>${buyer.province || ''}</td>
      <td>${buyer.city || ''}</td>
      <td>${buyer.instrument || ''}</td>
      <td>${buyer.purchases}</td>
      <td>${totalAmount.toLocaleString()} <span style='font-size:12px;color:#888;'>تومان</span></td>
      <td>${lastBuyOrDue}</td>
      <td>
        <button class="small-btn primary" data-action="edit" data-idx="${idx}"><i class="fas fa-edit"></i></button>
        <button class="small-btn danger" data-action="delete" data-idx="${idx}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  // حذف مشتری
  tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      if(confirm('آیا از حذف این مشتری مطمئن هستید؟')) {
        buyers.splice(idx, 1);
        saveAllData();
        updateBuyersTable();
      }
    });
  });
  // ویرایش مشتری
  tbody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      const buyer = buyers[idx];
      document.getElementById('customer-name').value = buyer.name;
      document.getElementById('customer-phone').value = buyer.phone || '';
      document.getElementById('customer-address').value = buyer.address || '';
      document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
      document.getElementById('transactions').classList.add('active');
      document.getElementById('page-title').textContent = 'ثبت تراکنش';
    });
  });
}

// به‌روزرسانی جدول چک‌ها
function updateChecksTable(openBuyerId) {
  const tbody = document.querySelector('#checks .checks-table tbody');
  tbody.innerHTML = '';
  // گروه‌بندی چک‌ها بر اساس خریدار
  const filteredChecks = filterChecks(checks.map((c, idx) => ({...c, _idx: idx})));
  const checksByBuyer = {};
  filteredChecks.forEach((check) => {
    if (!checksByBuyer[check.buyerId]) checksByBuyer[check.buyerId] = [];
    checksByBuyer[check.buyerId].push(check);
  });
  // وضعیت انتخاب‌شده در فیلتر
  const statusFilter = (document.getElementById('search-status')?.value || '').trim();
  Object.keys(checksByBuyer).forEach((buyerId, groupIdx) => {
    const buyer = buyers.find(b => b.id == buyerId) || {name: 'بدون نام'};
    const buyerChecks = checksByBuyer[buyerId];
    const totalAmount = buyerChecks.reduce((sum, c) => sum + (c.amount || 0), 0);
    // ردیف parent
    const trParent = document.createElement('tr');
    trParent.className = 'check-buyer-parent';
    // حذف تمام style های اینلاین
    trParent.removeAttribute('style');
    trParent.onmouseover = null;
    trParent.onmouseout = null;
    const phone = buyer.phone ? `<span style=\"color:#888;font-size:12px;margin-right:12px;\"><i class='fas fa-phone' style='font-size:13px;'></i> ${toPersianDigits(buyer.phone)}</span>` : '';
    const city = buyer.city ? `<span style=\"color:#888;font-size:12px;margin-right:12px;\"><i class='fas fa-city' style='font-size:13px;'></i> ${buyer.city}</span>` : '';
    trParent.innerHTML = `
      <td colspan=\"7\" style=\"background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-left: 4px solid #3498db; padding: 12px 16px; font-weight: 600; color: #2c3e50; cursor: pointer;\">
        <div style=\"display: flex; align-items: center; justify-content: space-between;\">
          <div style=\"display: flex; align-items: center; gap: 12px;\">
            <i class=\"fas fa-chevron-down group-toggle-icon\" style=\"color: #3498db; font-size: 14px; transition: transform 0.3s ease;\"></i>
            <i class=\"fas fa-user\" style=\"color: #3498db; font-size: 16px;\"></i>
            <span>${buyer.name}</span>
            <span style=\"background: #3498db; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;\">
              ${toPersianDigits(buyerChecks.length)} چک
            </span>
            ${phone ? `<span style=\"background: #e8f5e9; color: #27ae60; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; border: 1px solid #c8e6c9;\"><i class=\"fas fa-phone\" style=\"font-size: 11px;\"></i> ${toPersianDigits(buyer.phone)}</span>` : ''}
            ${city ? `<span style=\"background: #fff3e0; color: #f57c00; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; border: 1px solid #ffcc80;\"><i class=\"fas fa-city\" style=\"font-size: 11px;\"></i> ${buyer.city}</span>` : ''}
          </div>
          <div style=\"display: flex; align-items: center; gap: 8px; font-size: 14px; color: #6c757d;\">
            <span>مجموع: <span style=\"direction: ltr; font-family: 'Courier New', monospace; font-weight: 600; color: #27ae60;\">${toPersianDigits(totalAmount.toLocaleString())} تومان</span></span>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(trParent);
    // ردیف‌های چک (child)
    buyerChecks.forEach((check, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'check-buyer-child';
      tr.style.backgroundColor = idx % 2 === 0 ? '#fafbfc' : '#ffffff';
      tr.innerHTML = `
        <td style=\"padding-left: 32px; border-left: 2px solid #e9ecef;\">
          <div style=\"display: flex; align-items: center; gap: 8px;\">
            <span style=\"color: #6c757d; font-size: 12px;\">#${toPersianDigits(idx + 1)}</span>
            <span style=\"direction: ltr; font-family: 'Courier New', monospace;\">${toPersianDigits(check.sayadi || '-')}</span>
          </div>
        </td>
        <td style=\"padding-left: 16px;\">
          <div style=\"font-weight: 500; color: #2c3e50;\">${check.to || '-'}</div>
        </td>
        <td>
          <div style=\"font-weight: 600; color: #2c3e50; text-align: right; direction: rtl; font-family: 'Courier New', monospace;\">${toPersianDigits((check.amount||0).toLocaleString())} تومان</div>
        </td>
        <td>
          <div style=\"display: flex; flex-direction: column; gap: 2px;\">
            <span style=\"font-weight: 500;\">${toPersianDigits(check.dueDate || '-')}</span>
          </div>
        </td>
        <td>
          <div style=\"display: flex; flex-direction: column; gap: 2px;\">
            <span style=\"font-weight: 500;\">${check.bank || '-'}</span>
            <span style=\"font-size: 12px; color: #6c757d;\">${check.issuer || '-'}</span>
          </div>
        </td>
        <td>${getIncomingCheckStatusBadge(check.status)}</td>
        <td>
          <div class=\"action-buttons\">
            <button class=\"small-btn success incoming-check-action-btn\" data-action=\"edit\" data-idx=\"${check._idx}\" title=\"ویرایش\" style=\"transition: all 0.3s ease; transform: scale(1);\"><i class=\"fas fa-edit\"></i></button>
            <button class=\"small-btn danger incoming-check-action-btn\" data-action=\"delete\" data-idx=\"${check._idx}\" title=\"حذف\" style=\"transition: all 0.3s ease; transform: scale(1);\"><i class=\"fas fa-trash\"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
    // رویداد باز/بستن
    trParent.addEventListener('click', function() {
      const isOpen = trParent.classList.toggle('open');
      let next = trParent.nextSibling;
      while (next && next.className === 'check-buyer-child') {
        next.style.display = isOpen ? '' : 'none';
        next = next.nextSibling;
      }
      const icon = trParent.querySelector('.group-toggle-icon');
      if (icon) {
        icon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        icon.className = isOpen ? 'fas fa-chevron-up group-toggle-icon' : 'fas fa-chevron-down group-toggle-icon';
      }
    });
    // اگر باید این گروه باز بماند یا اگر فیلتر فعال است و چکی با آن شرایط دارد، باز کن
    const filters = getChecksSearchFilters();
    const hasActiveFilters = filters.buyer || filters.sayadi || filters.amount || filters.bank || filters.dateFrom || filters.dateTo || filters.status;
    
    if (
      (openBuyerId && openBuyerId == buyerId) ||
      (statusFilter && buyerChecks.some(c => c.status === statusFilter)) ||
      (hasActiveFilters && buyerChecks.length > 0) // اگر فیلتر فعال است، همه گروه‌ها را باز کن
    ) {
      trParent.classList.add('open');
      let next = trParent.nextSibling;
      while (next && next.className === 'check-buyer-child') {
        next.style.display = '';
        next = next.nextSibling;
      }
      const icon = trParent.querySelector('.group-toggle-icon');
      if (icon) {
        icon.style.transform = 'rotate(180deg)';
        icon.className = 'fas fa-chevron-up group-toggle-icon';
      }
    }
  });
  // اگر هیچ چکی نبود
  if (Object.keys(checksByBuyer).length === 0) {
    const tr = document.createElement('tr');
    const filters = getChecksSearchFilters();
    const hasActiveFilters = filters.buyer || filters.sayadi || filters.amount || filters.bank || filters.dateFrom || filters.dateTo || filters.status;
    
    if (hasActiveFilters) {
      tr.innerHTML = `<td colspan='7' style='text-align:center;padding:40px;color:#666;font-size:16px;font-weight:600;'>
        <i class="fas fa-search" style="font-size:3rem;margin-bottom:16px;display:block;color:#ddd;"></i>
        <div>هیچ چکی با فیلترهای اعمال شده یافت نشد</div>
        <div style="font-size:14px;color:#999;margin-top:8px;">فیلترها را تغییر دهید یا دکمه پاک کردن را بزنید</div>
      </td>`;
    } else {
      tr.innerHTML = `<td colspan='7' style='text-align:center;padding:40px;color:#aaa;font-size:17px;font-weight:600;'>
        <i class="fas fa-inbox" style="font-size:3rem;margin-bottom:16px;display:block;color:#ddd;"></i>
        <div>هیچ چکی ثبت نشده است</div>
      </td>`;
    }
    tbody.appendChild(tr);
  }
  // حذف چک
  tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      if(confirm('آیا از حذف این چک مطمئن هستید؟')) {
        checks.splice(idx, 1);
        saveAllData();
        updateChecksTable();
      }
    });
  });
  // ویرایش چک (inline)
  tbody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      const check = checks[idx];
      // اگر قبلاً ردیف ویرایش باز است، حذف کن
      const oldEditRow = tbody.querySelector('.check-edit-row');
      if (oldEditRow) oldEditRow.remove();
      // ردیف parent برای درج ردیف ویرایش
      const tr = this.closest('tr');
      // ردیف ویرایش
      const editTr = document.createElement('tr');
      editTr.className = 'check-edit-row';
      editTr.innerHTML = `
        <td colspan='7' style='background:#f8fafb;padding:18px 12px;'>
          <div style='display:flex;flex-wrap:wrap;gap:14px;align-items:center;'>
            <input type='text' class='form-control' id='edit-sayadi' value='${toPersianDigits(check.sayadi||'')}' placeholder='شماره صیادی' style='width:140px;'>
            <input type='text' class='form-control' id='edit-to' value='${check.to||''}' placeholder='در وجه' style='width:120px;'>
            <input type='text' class='form-control' id='edit-amount' value='${toPersianDigits((check.amount||0).toLocaleString())}' placeholder='مبلغ' style='width:110px;'>
            <input type='text' class='form-control jalali-date' id='edit-dueDate' value='${toPersianDigits(check.dueDate||'')}' placeholder='تاریخ سررسید' style='width:110px;'>
            <input type='text' class='form-control' id='edit-bank' value='${check.bank||''}' placeholder='بانک' style='width:90px;'>
            <input type='text' class='form-control' id='edit-issuer' value='${check.issuer||''}' placeholder='صادرکننده' style='width:110px;'>
            <select id='edit-status' class='form-control' style='width:120px;'>
              <option value='در جریان' ${check.status==='در جریان'?'selected':''}>در جریان</option>
              <option value='وصول شده' ${check.status==='وصول شده'?'selected':''}>وصول شده</option>
              <option value='برگشتی' ${check.status==='برگشتی'?'selected':''}>برگشتی</option>
            </select>
            <button class='btn primary' id='save-edit-check' style='padding:8px 18px;font-size:14px;'><i class='fas fa-save'></i> ذخیره</button>
            <button class='btn secondary' id='cancel-edit-check' style='padding:8px 14px;font-size:14px;'><i class='fas fa-times'></i> انصراف</button>
          </div>
        </td>
      `;
      tr.parentNode.insertBefore(editTr, tr.nextSibling);
      // فعال‌سازی دیت‌پیکر
      if (window.jalaliDatepicker) {
        jalaliDatepicker.startWatch({selector: '#edit-dueDate'});
      }
      // فرمت مبلغ
      document.getElementById('edit-amount').addEventListener('input', function() {
        let val = faToEn(this.value.replace(/\D/g, ''));
        if (val) val = Number(val).toLocaleString('en-US');
        this.value = val;
      });
      // ذخیره
      document.getElementById('save-edit-check').onclick = function() {
        check.sayadi = faToEn(document.getElementById('edit-sayadi').value.trim());
        check.to = document.getElementById('edit-to').value.trim();
        var amountVal = faToEn(document.getElementById('edit-amount').value.replace(/\D/g, ''));
        if (amountVal !== '') {
          check.amount = parseInt(amountVal);
        }
        // اگر فیلد خالی بود، مقدار قبلی حفظ شود
        check.dueDate = faToEn(document.getElementById('edit-dueDate').value.trim());
        check.bank = document.getElementById('edit-bank').value.trim();
        check.issuer = document.getElementById('edit-issuer').value.trim();
        check.status = document.getElementById('edit-status').value;
        saveAllData();
        updateChecksTable(check.buyerId);
      };
      // انصراف
      document.getElementById('cancel-edit-check').onclick = function() {
        editTr.remove();
      };
    });
  });
  // --- بروزرسانی نمودار وضعیت چک‌ها ---
  renderChecksStatusChart();
  
  // --- بروزرسانی کارت‌های آماری ---
  updateChecksStatsCardsFromArray();

  // اسکرول به سمت نتایج یا پیام "یافت نشد"
  const filters = getChecksSearchFilters();
  const hasActiveFilters = filters.buyer || filters.sayadi || filters.amount || filters.bank || filters.dateFrom || filters.dateTo || filters.status;
  
  if (hasActiveFilters) {
    setTimeout(() => {
      if (filteredChecks.length > 0) {
        // ابتدا سعی کن به اولین ردیف parent که باز شده اسکرول کن
        const firstOpenParent = document.querySelector('#checks .check-buyer-parent.open');
        if (firstOpenParent) {
          // اضافه کردن انیمیشن highlight قبل از اسکرول
          firstOpenParent.style.transition = 'all 0.5s ease';
          firstOpenParent.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.3)';
          firstOpenParent.style.transform = 'scale(1.02)';
          
          setTimeout(() => {
            firstOpenParent.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            // حذف انیمیشن بعد از اسکرول
            setTimeout(() => {
              firstOpenParent.style.boxShadow = '';
              firstOpenParent.style.transform = '';
            }, 1000);
          }, 500);
        } else {
          // اگر ردیف باز پیدا نشد، به کل جدول اسکرول کن
          const tableContainer = document.querySelector('#checks .table-responsive');
          if (tableContainer) {
            tableContainer.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }
      } else {
        // اگر نتیجه‌ای پیدا نشد، به پیام "یافت نشد" اسکرول کن
        const noResultsRow = document.querySelector('#checks .checks-table tbody tr:last-child');
        if (noResultsRow) {
          noResultsRow.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }
    }, 2000); // تأخیر 2 ثانیه‌ای برای تجربه بهتر
  }
}

// متغیرهای سراسری برای نمودار
let monthlyChart = null;

// تابع تبدیل تاریخ شمسی به میلادی
function jalaliToGregorian(jalaliDate) {
  if (!jalaliDate) return new Date();
  
  const parts = jalaliDate.split('/');
  if (parts.length !== 3) return new Date();
  
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  
  // تبدیل دقیق شمسی به میلادی
  let gregorianYear = year + 621;
  let gregorianMonth, gregorianDay;
  
  // تبدیل ماه شمسی به میلادی
  if (month === 1) { // فروردین
    gregorianMonth = 3; // مارس
    gregorianDay = day + 20;
  } else if (month === 2) { // اردیبهشت
    gregorianMonth = 4; // آوریل
    gregorianDay = day + 20;
  } else if (month === 3) { // خرداد
    gregorianMonth = 5; // مه
    gregorianDay = day + 20;
  } else if (month === 4) { // تیر
    gregorianMonth = 6; // ژوئن
    gregorianDay = day + 20;
  } else if (month === 5) { // مرداد
    gregorianMonth = 7; // ژوئیه
    gregorianDay = day + 20;
  } else if (month === 6) { // شهریور
    gregorianMonth = 8; // آگوست
    gregorianDay = day + 20;
  } else if (month === 7) { // مهر
    gregorianMonth = 9; // سپتامبر
    gregorianDay = day + 20;
  } else if (month === 8) { // آبان
    gregorianMonth = 10; // اکتبر
    gregorianDay = day + 20;
  } else if (month === 9) { // آذر
    gregorianMonth = 11; // نوامبر
    gregorianDay = day + 20;
  } else if (month === 10) { // دی
    gregorianMonth = 12; // دسامبر
    gregorianDay = day + 20;
  } else if (month === 11) { // بهمن
    gregorianMonth = 1; // ژانویه
    gregorianDay = day + 20;
    gregorianYear += 1;
  } else if (month === 12) { // اسفند
    gregorianMonth = 2; // فوریه
    gregorianDay = day + 20;
    gregorianYear += 1;
  }
  
  // تنظیم روزهای اضافی
  const daysInMonth = new Date(gregorianYear, gregorianMonth, 0).getDate();
  if (gregorianDay > daysInMonth) {
    gregorianDay -= daysInMonth;
    gregorianMonth += 1;
    if (gregorianMonth > 12) {
      gregorianMonth = 1;
      gregorianYear += 1;
    }
  }
  
  const result = new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
  console.log(`تبدیل تاریخ: ${jalaliDate} (ماه ${month}) -> ${result.toLocaleDateString()} (ماه میلادی ${result.getMonth() + 1})`);
  return result;
}

// تابع ایجاد نمودار عملکرد ماهانه با ApexCharts
function createMonthlyPerformanceChart() {
  const chartDiv = document.getElementById('monthlyPerformanceChart');
  if (!chartDiv) {
    console.log('Monthly performance chart container not found');
    return;
  }
  
  let errorDiv = document.getElementById('chart-error-message');
  if (errorDiv) errorDiv.remove();
  
  try {
    if (window.monthlyApexChart) {
      try {
        window.monthlyApexChart.destroy();
      } catch (e) {
        console.log('Error destroying previous chart:', e);
      }
    }
    
    // --- آماده‌سازی داده‌ها ---
    const periodSelect = document.getElementById('chart-period');
    const periodValue = periodSelect ? periodSelect.value || '12m' : '12m';
    
    let totalPeriods, periodType;
    if (periodValue === '7d') {
      totalPeriods = 7; periodType = 'day';
    } else if (periodValue === '1m') {
      totalPeriods = 1; periodType = 'month';
    } else if (periodValue === '3m') {
      totalPeriods = 3; periodType = 'month';
    } else if (periodValue === '6m') {
      totalPeriods = 6; periodType = 'month';
    } else {
      totalPeriods = 12; periodType = 'month';
    }
    
    const persianMonths = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    const now = new Date();
    const currentJalaliYear = now.getFullYear() - 621;
    const periods = [];
    const monthKeys = [];
    for (let i = 0; i < totalPeriods; i++) {
      const month = i + 1;
      periods.push(persianMonths[i]);
      monthKeys.push(currentJalaliYear + '-' + (month < 10 ? '0' + month : month));
    }
    const salesData = Array(totalPeriods).fill(0);
    const profitData = Array(totalPeriods).fill(0);
    const checkData = Array(totalPeriods).fill(0);
    const checkAmountSums = Array(totalPeriods).fill(0);
    
    if (sales && Array.isArray(sales)) {
      sales.forEach(sale => {
        if (!sale || !sale.date) return;
        const parts = sale.date.split('/');
        if (parts.length !== 3) return;
        const y = parts[0], m = parts[1];
        const key = y + '-' + m.padStart(2, '0');
        const idx = monthKeys.indexOf(key);
        if (idx !== -1) {
          salesData[idx] += (sale.price || 0) / 1000000;
          profitData[idx] += (sale.price || 0) / 1000000;
        }
      });
    }
    
    if (checks && Array.isArray(checks)) {
      checks.forEach(check => {
        if (!check || !check.dueDate) return;
        const parts = check.dueDate.split('/');
        if (parts.length !== 3) return;
        const y = parts[0], m = parts[1];
        const key = y + '-' + m.padStart(2, '0');
        const idx = monthKeys.indexOf(key);
        if (idx !== -1) {
          checkData[idx] += 1;
          checkAmountSums[idx] += (parseInt(check.amount) || 0);
        }
      });
    }
    
    window.checkAmountSums = checkAmountSums;
    window.chartPeriods = periods;
    window.checkData = checkData;
    chartDiv.innerHTML = '';
    const chartContainer = document.createElement('div');
    chartDiv.appendChild(chartContainer);
    
    // --- گزینه‌های نمودار ---
    const options = {
      chart: {
        type: 'line',
        height: 350,
        fontFamily: 'Vazirmatn, Yekan, Tahoma, Arial, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 900 },
        background: 'transparent',
      },
      series: [
        { name: 'فروش', data: salesData, color: '#4285f4', type: 'line' },
        { name: 'سود خالص', data: profitData, color: '#34a853', type: 'line' },
        { name: 'تعداد چک', data: checkData, color: '#ea4335', type: 'column', yAxisIndex: 1 }
      ],
      xaxis: {
        categories: periods,
        labels: { style: { colors: '#6c757d', fontSize: '13px', fontFamily: 'inherit' } },
        axisBorder: { color: '#e9ecef' },
        axisTicks: { color: '#e9ecef' }
      },
      yaxis: [
        {
          title: { text: 'مبلغ (میلیون تومان)', style: { color: '#495057', fontWeight: 700, fontSize: '14px' } },
          labels: {
            style: { colors: '#6c757d', fontSize: '13px', fontFamily: 'inherit' },
            formatter: val => toPersianDigits(val.toFixed(1)) + 'M'
          },
          min: 0, show: true
        },
        {
          opposite: true,
          title: { text: 'تعداد چک‌ها', style: { color: '#495057', fontWeight: 700, fontSize: '14px' } },
          labels: {
            style: { colors: '#ea4335', fontSize: '13px', fontFamily: 'inherit' },
            formatter: val => toPersianDigits(val)
          },
          min: 0, show: true, forceNiceScale: true
        }
      ],
      stroke: { width: [3, 3, 0], curve: 'smooth' },
      markers: { size: 6, hover: { size: 8 } },
      dataLabels: { enabled: false },
      legend: { show: false }, // legend سفارشی داریم
      tooltip: {
        shared: true,
        intersect: false,
        custom: function({series, seriesIndex, dataPointIndex, w}) {
          let html = `<div style='direction:rtl;text-align:right;font-family:inherit;background:#fff;box-shadow:0 4px 24px rgba(52,152,219,0.10);border-radius:16px;padding:18px 22px 14px 18px;min-width:220px;max-width:320px;border:1.5px solid #e3f2fd;'>`;
          html += `<div style='font-weight:800;font-size:16px;margin-bottom:10px;color:#3498db;letter-spacing:0.5px;'>${periods[dataPointIndex]}</div>`;
          html += `<div style='display:flex;align-items:center;gap:9px;margin-bottom:7px;'><span style='display:inline-block;width:13px;height:13px;border-radius:50%;background:#4285f4;box-shadow:0 0 0 2px #e3f2fd;'></span> <span style='font-weight:600;color:#4285f4;'>فروش</span> <span style='flex:1;'></span> <b style='font-size:15px;color:#222;'>${toPersianDigits((series[0][dataPointIndex]||0).toLocaleString())}</b> <span style='font-size:12px;color:#888;'>میلیون تومان</span></div>`;
          html += `<div style='display:flex;align-items:center;gap:9px;margin-bottom:7px;'><span style='display:inline-block;width:13px;height:13px;border-radius:50%;background:#34a853;box-shadow:0 0 0 2px #e3f2fd;'></span> <span style='font-weight:600;color:#34a853;'>سود خالص</span> <span style='flex:1;'></span> <b style='font-size:15px;color:#222;'>${toPersianDigits((series[1][dataPointIndex]||0).toLocaleString())}</b> <span style='font-size:12px;color:#888;'>میلیون تومان</span></div>`;
          html += `<div style='display:flex;align-items:center;gap:9px;'><span style='display:inline-block;width:13px;height:13px;border-radius:50%;background:#ea4335;box-shadow:0 0 0 2px #ffeaea;'></span> <span style='font-weight:600;color:#ea4335;'>تعداد چک</span> <span style='flex:1;'></span> <b style='font-size:15px;color:#222;'>${toPersianDigits(series[2][dataPointIndex]||0)}</b></div>`;
          html += `</div>`;
          return html;
        }
      },
      grid: { borderColor: '#e9ecef', row: { colors: ['#f8f9fa', 'transparent'], opacity: 0.5 } },
      plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 4 } },
    };
    window.monthlyApexChart = new ApexCharts(chartContainer, options);
    window.monthlyApexChart.render();
    if (chartContainer) setupCustomLegendEvents();
  } catch (err) {
    console.error('خطا در رسم نمودار:', err);
    let errorDiv = document.createElement('div');
    errorDiv.id = 'chart-error-message';
    errorDiv.style.background = '#fff0f0';
    errorDiv.style.color = '#c0392b';
    errorDiv.style.border = '1px solid #e9ecef';
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.padding = '18px';
    errorDiv.style.margin = '20px auto';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.fontSize = '16px';
    errorDiv.innerHTML = 'خطا در رسم نمودار: ' + (err.message || err);
    chartDiv.appendChild(errorDiv);
  }
}

// به‌روزرسانی جدول آخرین تراکنش‌ها
function updateRecentTransactionsTable() {
  const tbody = document.getElementById('recent-transactions-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  // گرفتن ۵ تراکنش آخر
  const recentSales = sales.slice(-5).reverse();
  recentSales.forEach(sale => {
    const buyer = buyers.find(b => b.id === sale.buyerId);
    const tr = document.createElement('tr');
    // تعیین وضعیت بر اساس روش پرداخت
    let status = 'تکمیل شده';
    let statusClass = 'success';
    if (sale.paymentMethod === 'installment') {
      status = 'اقساط';
      statusClass = 'warning';
    }
    // تبدیل اعداد به فارسی
    const persianPrice = toPersianDigits((sale.price || 0).toLocaleString());
    // تبدیل تاریخ به فارسی
    const persianDate = sale.date ? toPersianDigits(sale.date) : '-';
    tr.innerHTML = `
      <td data-label="تاریخ">${persianDate}</td>
      <td data-label="نام خریدار">${buyer ? buyer.name : '-'}</td>
      <td data-label="کالا">${sale.product || '-'}</td>
      <td data-label="مبلغ فروش">${persianPrice} تومان</td>
      <td data-label="روش پرداخت">${sale.paymentMethod === 'cash' ? 'نقدی' : 'اقساط'}</td>
      <td data-label="وضعیت"><span class="status-badge ${statusClass}">${status}</span></td>
    `;
    tbody.appendChild(tr);
  });
  // اگر تراکنشی وجود ندارد
  if (recentSales.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="6" style="text-align: center; color: #999; padding: 20px;">هنوز تراکنشی ثبت نشده است</td>';
    tbody.appendChild(tr);
  }
}

// به‌روزرسانی داشبورد
function updateDashboard() {
  console.log('Updating dashboard...');
  
  // تعداد فروش این ماه
  document.querySelectorAll('.stat-value')[1].textContent = toPersianDigits(sales.length);
  // سود خالص ماه (جمع قیمت فروش‌ها)
  const totalProfit = sales.reduce((sum, s) => sum + s.price, 0);
  document.querySelectorAll('.stat-value')[0].textContent = toPersianDigits(totalProfit.toLocaleString());
  // چک‌های سررسید (تعداد چک‌های در جریان)
  const dueChecks = checks.filter(c => c.status === 'در جریان').length;
  document.querySelectorAll('.stat-value')[2].textContent = toPersianDigits(dueChecks);
  
  // به‌روزرسانی جدول آخرین تراکنش‌ها
  updateRecentTransactionsTable();
  
  // به‌روزرسانی نمودار
  setTimeout(() => {
    console.log('Creating chart after delay...');
    createMonthlyPerformanceChart();
  }, 500);
}

// بروزرسانی جدول تراکنش‌ها
function updateSalesTable() {
  const tbody = document.getElementById('sales-list-tbody');
  if (!tbody) return;

  // فیلترها
  const buyerFilter = document.getElementById('sales-filter-buyer')?.value.trim() || '';
  const productFilter = document.getElementById('sales-filter-product')?.value.trim() || '';
  const dateFrom = document.getElementById('sales-filter-date-from')?.value.trim() || '';
  const dateTo = document.getElementById('sales-filter-date-to')?.value.trim() || '';
  const amountFilter = document.getElementById('sales-filter-amount')?.value.trim() || '';
  const statusFilter = document.getElementById('sales-filter-status')?.value || '';

  // فیلتر داده‌ها (پیشرفته)
  let filtered = sales.filter(sale => {
    const buyer = buyers.find(b => b.id === sale.buyerId) || {};
    // فیلتر خریدار و کالا با چند کلیدواژه
    const buyerFilterWords = buyerFilter.split(/[\s,،]+/).filter(Boolean);
    const productFilterWords = productFilter.split(/[\s,،]+/).filter(Boolean);
    const buyerMatch = buyerFilterWords.every(word => (buyer.name || '').includes(word));
    const productMatch = productFilterWords.every(word => (sale.product || '').includes(word));
    // فیلتر بازه مبلغ
    let minAmount = 0, maxAmount = Infinity;
    if (amountFilter.includes('-')) {
      const parts = amountFilter.split('-').map(s => parseInt(s.replace(/\D/g, '')));
      minAmount = parts[0] || 0;
      maxAmount = parts[1] || Infinity;
    } else if (amountFilter) {
      minAmount = parseInt(amountFilter.replace(/\D/g, '')) || 0;
      maxAmount = minAmount;
    }
    const amountMatch = (sale.price || 0) >= minAmount && (sale.price || 0) <= maxAmount;
    // فیلتر بازه تاریخ جدید
    let dateMatch = true;
    if (dateFrom && dateTo) {
      dateMatch = (sale.date >= dateFrom) && (sale.date <= dateTo);
    } else if (dateFrom) {
      dateMatch = (sale.date >= dateFrom);
    } else if (dateTo) {
      dateMatch = (sale.date <= dateTo);
    }
    // فیلتر وضعیت (انگلیسی یا فارسی)
    let statusMatch = true;
    if (statusFilter) {
      statusMatch = (sale.status === statusFilter) ||
        (statusFilter === 'paid' && sale.status === 'پرداخت شده') ||
        (statusFilter === 'pending' && sale.status === 'در انتظار') ||
        (statusFilter === 'cancelled' && sale.status === 'لغو شده');
    }
    return buyerMatch && productMatch && amountMatch && dateMatch && statusMatch;
  });

  tbody.innerHTML = '';
  filtered.forEach((sale, idx) => {
    const buyer = buyers.find(b => b.id === sale.buyerId) || {};
    let paymentText = sale.paymentMethod;
    if (sale.paymentMethod === 'cash') paymentText = 'نقدی';
    else if (sale.paymentMethod === 'installment') paymentText = 'اقساط';
    let priceText = sale.price !== undefined && sale.price !== null
      ? toPersianDigits(sale.price.toLocaleString('fa-IR')) + ' <span style="font-size:12px;color:#888;">تومان</span>'
      : '-';
    let statusBadge = '';
    if (sale.status === 'paid' || sale.status === 'پرداخت شده') statusBadge = '<span class="status-badge status-paid"><i class="fas fa-check-circle"></i> پرداخت شده</span>';
    else if (sale.status === 'pending' || sale.status === 'در انتظار') statusBadge = '<span class="status-badge status-pending"><i class="fas fa-clock"></i> در انتظار</span>';
    else if (sale.status === 'cancelled' || sale.status === 'لغو شده') statusBadge = '<span class="status-badge status-cancelled"><i class="fas fa-times-circle"></i> لغو شده</span>';
    else statusBadge = '<span class="status-badge"><i class="fas fa-question-circle"></i> نامشخص</span>';
    const persianDate = sale.date ? toPersianDigits(sale.date) : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="row-index">${toPersianDigits(idx+1)}</td>
      <td>${persianDate}</td>
      <td>${buyer.name || '-'}</td>
      <td>${sale.product || '-'}</td>
      <td>${priceText}</td>
      <td>${paymentText}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn" data-action="quickview" data-idx="${idx}" title="مشاهده"><i class="fas fa-eye"></i></button>
          <button class="action-btn" data-action="edit" data-idx="${idx}" data-id="${sale.id}" title="ویرایش"><i class="fas fa-edit"></i></button>
          <button class="action-btn" data-action="delete" data-idx="${idx}" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // کارت‌های آماری
  const totalCount = filtered.length;
  const totalAmount = filtered.reduce((sum, s) => sum + (s.price || 0), 0);
  const avgAmount = totalCount ? Math.round(totalAmount / totalCount) : 0;
  document.getElementById('sales-total-count').textContent = toPersianDigits(totalCount);
  document.getElementById('sales-total-amount').textContent = toPersianDigits(totalAmount.toLocaleString('fa-IR')) + ' تومان';
  document.getElementById('sales-avg-amount').textContent = toPersianDigits(avgAmount.toLocaleString('fa-IR')) + ' تومان';

  // حذف تراکنش
  tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      if(confirm('آیا از حذف این تراکنش مطمئن هستید؟')) {
        const realIdx = sales.findIndex((s, i) => filtered[idx] && s.id === filtered[idx].id);
        if (realIdx !== -1) {
          sales.splice(realIdx, 1);
          saveAllData();
          updateSalesTable();
          updateDashboard && updateDashboard();
        }
      }
    });
  });

  // ویرایش تراکنش
  tbody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      const sale = filtered[idx];
      const realIdx = sales.findIndex((s, i) => sale && s.id === sale.id);
      if (realIdx !== -1) {
        window.isEditingTransaction = true;
        window.editingTransactionIndex = realIdx;
        window.editingTransactionId = sale.id;
        // مقداردهی فرم و مقدار وضعیت
        const statusInput = document.getElementById('sales-status-input');
        if (statusInput) {
          if (sale.status === 'paid' || sale.status === 'پرداخت شده') statusInput.value = 'paid';
          else if (sale.status === 'pending' || sale.status === 'در انتظار') statusInput.value = 'pending';
          else if (sale.status === 'cancelled' || sale.status === 'لغو شده') statusInput.value = 'cancelled';
          else statusInput.value = '';
        }
        // ... پر کردن فرم ...
      }
    });
  });

  // مشاهده سریع (در صورت نیاز)
  tbody.querySelectorAll('button[data-action="quickview"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      const sale = filtered[idx];
      const realIdx = sales.findIndex((s, i) => sale && s.id === sale.id);
      if (realIdx !== -1) {
        showTransactionQuickView(realIdx);
      }
    });
  });
}

// اتصال فیلترها به جدول
['sales-filter-buyer', 'sales-filter-product', 'sales-filter-date-from', 'sales-filter-date-to', 'sales-filter-amount', 'sales-filter-status'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', updateSalesTable);
    el.addEventListener('change', updateSalesTable);
  }
});
const filterBtn = document.getElementById('sales-filter-btn');
if (filterBtn) filterBtn.onclick = updateSalesTable;

// تبدیل اعداد به فارسی و جداکننده سه‌رقمی
function toPersianDigits(num) {
  return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// تبدیل اعداد فارسی و کامادار به انگلیسی ساده (با حفظ نقطه‌ها)
function faToEnWithDots(str) {
  return str.replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]).replace(/,/g, '');
}

// تبدیل اعداد فارسی و کامادار به انگلیسی ساده
function faToEn(str) {
  return str.replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]).replace(/,/g, '').replace(/\./g, '');
}

// تبدیل رشته عددی با نقطه به عدد
function parseNumberWithDots(str) {
  if (!str) return 0;
  // حذف همه کاراکترهای غیر عددی به جز نقطه
  const cleanStr = str.replace(/[^\d.]/g, '');
  // تبدیل به عدد
  return parseInt(cleanStr.replace(/\./g, '')) || 0;
}

// تبدیل عدد به حروف فارسی (تومان)
function numberToPersianWords(num) {
  // کتابخانه ساده برای تبدیل عدد به حروف فارسی (فقط تا میلیارد)
  const yekan = ['','یک','دو','سه','چهار','پنج','شش','هفت','هشت','نه'];
  const dahgan = ['','ده','بیست','سی','چهل','پنجاه','شصت','هفتاد','هشتاد','نود'];
  const sadgan = ['','صد','دویست','سیصد','چهارصد','پانصد','ششصد','هفتصد','هشتصد','نهصد'];
  const basex = ['','هزار','میلیون','میلیارد'];
  if(num === 0) return 'صفر';
  let s = num.toString();
  let out = [];
  let i = 0;
  while(s.length > 0) {
    let part = parseInt(s.slice(-3));
    s = s.slice(0, -3);
    if(part) {
      let str = '';
      let h = Math.floor(part/100);
      let d = Math.floor((part%100)/10);
      let y = part%10;
      if(h) str += sadgan[h] + ' و ';
      if(d > 1) str += dahgan[d] + (y ? ' و ' + yekan[y] : '');
      else if(d === 1) {
        if(y === 0) str += 'ده';
        else if(y === 1) str += 'یازده';
        else if(y === 2) str += 'دوازده';
        else if(y === 3) str += 'سیزده';
        else if(y === 4) str += 'چهارده';
        else if(y === 5) str += 'پانزده';
        else if(y === 6) str += 'شانزده';
        else if(y === 7) str += 'هفده';
        else if(y === 8) str += 'هجده';
        else if(y === 9) str += 'نوزده';
      } else if(y) str += yekan[y];
      out.unshift(str.replace(/ و $/, '') + (basex[i] ? ' ' + basex[i] : ''));
    }
    i++;
  }
  return out.join(' و ');
}

function calculateProfits() {
  const purchasePriceField = document.getElementById('purchase-price');
  const salePriceField = document.getElementById('sale-price');
  const colorCostField = document.getElementById('color-cost');
  const regulationCostField = document.getElementById('regulation-cost');
  const transportCostField = document.getElementById('transport-cost');
  const teacherPercentField = document.getElementById('teacher-percent');
  const sellerPercentField = document.getElementById('seller-percent');
  const grossProfitField = document.getElementById('gross-profit');
  const teacherCommissionField = document.getElementById('teacher-commission');
  const sellerCommissionField = document.getElementById('seller-commission');
  const netProfitField = document.getElementById('net-profit');
  const netProfitDisplayField = document.getElementById('net-profit-display');
  const netProfitWordsField = document.getElementById('net-profit-words');
  
  // اگر فیلدهای ضروری وجود ندارند، از تابع خارج شو
  if (!purchasePriceField || !salePriceField) return;
  
  const purchase = parseInt(faToEn(purchasePriceField.value)) || 0;
  const sale = parseNumberWithDots(faToEnWithDots(salePriceField.value));
  const color = parseInt(faToEn(colorCostField?.value || '0')) || 0;
  const regulation = parseInt(faToEn(regulationCostField?.value || '0')) || 0;
  const transport = parseInt(faToEn(transportCostField?.value || '0')) || 0;
  const teacherPercent = parseFloat(faToEn(teacherPercentField?.value || '0')) || 0;
  const sellerPercent = parseFloat(faToEn(sellerPercentField?.value || '0')) || 0;

  // سود ناخالص
  const grossProfit = sale - purchase;
  if (grossProfitField) {
    grossProfitField.value = toPersianDigits(grossProfit.toLocaleString('en-US'));
  }

  // پورسانت‌ها
  const teacherCommission = Math.round(sale * teacherPercent / 100);
  const sellerCommission = Math.round(sale * sellerPercent / 100);
  
  if (teacherCommissionField) {
    teacherCommissionField.value = toPersianDigits(teacherCommission.toLocaleString('en-US'));
  }
  if (sellerCommissionField) {
    sellerCommissionField.value = toPersianDigits(sellerCommission.toLocaleString('en-US'));
  }

  // سود خالص
  const netProfit = grossProfit - color - regulation - transport - teacherCommission - sellerCommission;
  
  if (netProfitField) {
    netProfitField.value = toPersianDigits(netProfit.toLocaleString('en-US'));
  }
  
  if (netProfitDisplayField) {
    netProfitDisplayField.textContent = toPersianDigits(netProfit.toLocaleString('en-US'));
  }
  
  // نمایش سود خالص به حروف
  if (netProfitWordsField) {
    let words = numberToPersianWords(netProfit);
    netProfitWordsField.textContent = words && netProfit !== 0 ? `(${words} تومان)` : '';
  }
}

// فرمت ورودی اعداد به فارسی و سه‌رقمی
function formatInputNumber(e) {
  // تبدیل اعداد فارسی به انگلیسی در لحظه ورود
  let val = faToEn(e.target.value.replace(/[^\d]/g, ''));
  if (val) val = parseInt(val).toLocaleString('en-US');
  e.target.value = val || '0';
}

// فرمت ورودی پیش پرداخت با حفظ نقطه‌ها
function formatAdvancePaymentInput(e) {
  // تبدیل اعداد فارسی به انگلیسی در لحظه ورود
  let val = faToEn(e.target.value.replace(/[^\d.]/g, ''));
  if (val) {
    // اگر نقطه دارد، همان را حفظ کن
    if (val.includes('.')) {
      val = val.replace(/\./g, '');
      val = parseInt(val).toLocaleString('en-US');
    } else {
      val = parseInt(val).toLocaleString('en-US');
    }
  }
  e.target.value = val || '0';
}

// محاسبه مبلغ باقی‌مانده پس از پیش‌پرداخت و نمایش فرم چک‌ها
function calculateInstallmentInfo() {
  const salePriceField = document.getElementById('sale-price');
  const advancePaymentField = document.getElementById('advance-payment');
  const checkDetailsField = document.getElementById('check-details');
  const paymentMethodField = document.getElementById('payment-method');
  const advancePaymentGroupField = document.getElementById('advance-payment-group');
  const checkCountField = document.getElementById('check-count');
  
  if (!salePriceField || !advancePaymentField) return;
  
  const sale = parseNumberWithDots(faToEnWithDots(salePriceField.value));
  const advanceRaw = advancePaymentField.value;
  const advance = parseNumberWithDots(faToEnWithDots(advanceRaw)) || 0;
  const remain = sale - advance;
  const paymentMethod = paymentMethodField?.value || 'cash';
  
  advancePaymentField.setAttribute('max', sale);
  
  // نمایش/مخفی کردن فرم چک‌ها بر اساس روش پرداخت
  if (paymentMethod === 'installment') {
    if (checkDetailsField) checkDetailsField.style.display = 'block';
    if (advancePaymentGroupField) advancePaymentGroupField.style.display = 'block';
    if (advancePaymentField) advancePaymentField.disabled = false;
    if (checkCountField) checkCountField.disabled = false;
    
    // به‌روزرسانی تعداد چک‌ها
    updateCheckItems();
  } else {
    if (checkDetailsField) checkDetailsField.style.display = 'none';
    if (advancePaymentGroupField) advancePaymentGroupField.style.display = 'none';
    if (advancePaymentField) advancePaymentField.disabled = true;
    if (checkCountField) checkCountField.disabled = true;
  }
  
  // نمایش مبلغ باقی‌مانده (در صورت نیاز می‌توان یک فیلد جدید اضافه کرد)
  let remainField = document.getElementById('installment-remain');
  if (!remainField && checkDetailsField && checkDetailsField.parentElement) {
    remainField = document.createElement('div');
    remainField.id = 'installment-remain';
    remainField.style.margin = '10px 0';
    checkDetailsField.parentElement.insertBefore(remainField, checkDetailsField);
  }
  
  if (remainField && paymentMethod === 'installment') {
    remainField.innerHTML = `<b>مبلغ قابل پرداخت با چک/اقساط:</b> <span style='color:#2eaa72'>${remain.toLocaleString()} تومان</span>`;
    remainField.style.display = 'block';
  } else if (remainField) {
    remainField.style.display = 'none';
  }
}

// نمایش فرم چک‌ها به تعداد اقساط
function updateCheckItems() {
  const checkCountField = document.getElementById('check-count');
  const container = document.querySelector('.check-items');
  
  if (!checkCountField || !container) return;
  
  const count = parseInt(checkCountField.value) || 1;
  
  // مقادیر پیش‌فرض از اولین چک قبلی (اگر وجود دارد)
  let prev = container.querySelector('.check-item');
  let prevVals = { bank: '', branch: '', amount: '', issuer: '', national: '', to: '' };
  if (prev) {
    prevVals.bank = prev.querySelector('.check-bank')?.value || '';
    prevVals.branch = prev.querySelector('.check-branch')?.value || '';
    prevVals.amount = prev.querySelector('.check-amount')?.value || '';
    prevVals.issuer = prev.querySelector('.check-issuer')?.value || '';
    prevVals.national = prev.querySelector('.check-national')?.value || '';
    prevVals.to = prev.querySelector('.check-to')?.value || '';
  }
  
  container.innerHTML = '';
  
  for (let i = 0; i < count; i++) {
    const checkItem = document.createElement('div');
    checkItem.className = 'check-item';
    checkItem.innerHTML = `
      <div class="form-group"><label><i class='fas fa-barcode'></i> شماره صیادی</label><input type="text" class="form-control check-sayadi"></div>
      <div class="form-group"><label><i class='fas fa-list-ol'></i> سری چک</label><input type="text" class="form-control check-series"></div>
      <div class="form-group"><label><i class='fas fa-university'></i> بانک</label>
        <select class="form-control check-bank">
          <option value="">انتخاب بانک</option>
          <option value="بانک ملی" ${i==0 && prevVals.bank=='بانک ملی'?'selected':''}>بانک ملی</option>
          <option value="بانک ملت" ${i==0 && prevVals.bank=='بانک ملت'?'selected':''}>بانک ملت</option>
          <option value="بانک سپه" ${i==0 && prevVals.bank=='بانک سپه'?'selected':''}>بانک سپه</option>
          <option value="بانک صادرات" ${i==0 && prevVals.bank=='بانک صادرات'?'selected':''}>بانک صادرات</option>
          <option value="بانک پارسیان" ${i==0 && prevVals.bank=='بانک پارسیان'?'selected':''}>بانک پارسیان</option>
          <option value="بانک تجارت" ${i==0 && prevVals.bank=='بانک تجارت'?'selected':''}>بانک تجارت</option>
          <option value="بانک رفاه" ${i==0 && prevVals.bank=='بانک رفاه'?'selected':''}>بانک رفاه</option>
          <option value="بانک کشاورزی" ${i==0 && prevVals.bank=='بانک کشاورزی'?'selected':''}>بانک کشاورزی</option>
          <option value="بانک مسکن" ${i==0 && prevVals.bank=='بانک مسکن'?'selected':''}>بانک مسکن</option>
          <option value="بانک توسعه صادرات" ${i==0 && prevVals.bank=='بانک توسعه صادرات'?'selected':''}>بانک توسعه صادرات</option>
          <option value="بانک صنعت و معدن" ${i==0 && prevVals.bank=='بانک صنعت و معدن'?'selected':''}>بانک صنعت و معدن</option>
          <option value="بانک توسعه تعاون" ${i==0 && prevVals.bank=='بانک توسعه تعاون'?'selected':''}>بانک توسعه تعاون</option>
          <option value="بانک آینده" ${i==0 && prevVals.bank=='بانک آینده'?'selected':''}>بانک آینده</option>
          <option value="بانک شهر" ${i==0 && prevVals.bank=='بانک شهر'?'selected':''}>بانک شهر</option>
          <option value="بانک دی" ${i==0 && prevVals.bank=='بانک دی'?'selected':''}>بانک دی</option>
          <option value="بانک تات" ${i==0 && prevVals.bank=='بانک تات'?'selected':''}>بانک تات</option>
          <option value="بانک سینا" ${i==0 && prevVals.bank=='بانک سینا'?'selected':''}>بانک سینا</option>
          <option value="بانک قرض‌الحسنه مهر" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه مهر'?'selected':''}>بانک قرض‌الحسنه مهر</option>
          <option value="بانک قرض‌الحسنه رسالت" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه رسالت'?'selected':''}>بانک قرض‌الحسنه رسالت</option>
          <option value="بانک قرض‌الحسنه کوثر" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه کوثر'?'selected':''}>بانک قرض‌الحسنه کوثر</option>
          <option value="بانک قرض‌الحسنه انصار" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه انصار'?'selected':''}>بانک قرض‌الحسنه انصار</option>
          <option value="بانک قرض‌الحسنه مهر ایران" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه مهر ایران'?'selected':''}>بانک قرض‌الحسنه مهر ایران</option>
          <option value="بانک قرض‌الحسنه کارآفرین" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه کارآفرین'?'selected':''}>بانک قرض‌الحسنه کارآفرین</option>
          <option value="بانک قرض‌الحسنه ایران‌زمین" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه ایران‌زمین'?'selected':''}>بانک قرض‌الحسنه ایران‌زمین</option>
          <option value="بانک قرض‌الحسنه عسکریه" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه عسکریه'?'selected':''}>بانک قرض‌الحسنه عسکریه</option>
          <option value="بانک قرض‌الحسنه امام رضا" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه امام رضا'?'selected':''}>بانک قرض‌الحسنه امام رضا</option>
          <option value="بانک قرض‌الحسنه ولیعصر" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه ولیعصر'?'selected':''}>بانک قرض‌الحسنه ولیعصر</option>
          <option value="بانک قرض‌الحسنه نور" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه نور'?'selected':''}>بانک قرض‌الحسنه نور</option>
          <option value="بانک قرض‌الحسنه قوامین" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه قوامین'?'selected':''}>بانک قرض‌الحسنه قوامین</option>
          <option value="بانک قرض‌الحسنه مهر اقتصاد" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه مهر اقتصاد'?'selected':''}>بانک قرض‌الحسنه مهر اقتصاد</option>
          <option value="بانک قرض‌الحسنه کارگشا" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه کارگشا'?'selected':''}>بانک قرض‌الحسنه کارگشا</option>
          <option value="بانک قرض‌الحسنه سامان" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه سامان'?'selected':''}>بانک قرض‌الحسنه سامان</option>
          <option value="بانک قرض‌الحسنه نوین" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه نوین'?'selected':''}>بانک قرض‌الحسنه نوین</option>
          <option value="بانک قرض‌الحسنه آینده" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه آینده'?'selected':''}>بانک قرض‌الحسنه آینده</option>
          <option value="بانک قرض‌الحسنه شهر" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه شهر'?'selected':''}>بانک قرض‌الحسنه شهر</option>
          <option value="بانک قرض‌الحسنه تات" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه تات'?'selected':''}>بانک قرض‌الحسنه تات</option>
          <option value="بانک قرض‌الحسنه دی" ${i==0 && prevVals.bank=='بانک قرض‌الحسنه دی'?'selected':''}>بانک قرض‌الحسنه دی</option>
        </select>
      </div>
      <div class="form-group"><label><i class='fas fa-map-marker-alt'></i> شعبه</label><input type="text" class="form-control check-branch" value="${i==0?prevVals.branch:''}"></div>
      <div class="form-group"><label><i class='fas fa-user-edit'></i> نام صادرکننده</label><input type="text" class="form-control check-issuer" value="${i==0?prevVals.issuer:''}"></div>
      <div class="form-group"><label><i class='fas fa-user-tag'></i> در وجه</label><input type="text" class="form-control check-to" value="${i==0?prevVals.to:''}"></div>
      <div class="form-group"><label><i class='fas fa-id-card'></i> کدملی</label><input type="text" class="form-control check-national" value="${i==0?prevVals.national:''}"></div>
      <div class="form-group"><label><i class='fas fa-money-bill-wave'></i> مبلغ چک</label><div style='display:flex;align-items:center;gap:4px;'><input type="text" class="form-control check-amount" value="${i==0?prevVals.amount:''}"><span style='font-size:13px;color:#888;margin-right:4px;'>تومان</span></div></div>
      <div class="form-group"><label><i class='fas fa-calendar-alt'></i> تاریخ سررسید</label><div class="jalali-date-wrapper"><input type="text" class="form-control check-date jalali-date"></div></div>
      <button type="button" class="btn btn-danger remove-check-btn" title="حذف چک"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(checkItem);
  }
  
  // رویداد حذف چک
  container.querySelectorAll('.remove-check-btn').forEach(btn => {
    btn.onclick = function() {
      this.closest('.check-item').remove();
    };
  });
  
  // فعال‌سازی مجدد دیت‌پیکر برای چک‌های جدید
  if (window.jalaliDatepicker) {
    jalaliDatepicker.startWatch({selector: '.jalali-date'});
  }
}

function updateTransactionSummary() {
  const customerNameField = document.getElementById('customer-name');
  const productNameField = document.getElementById('product-name');
  const purchasePriceField = document.getElementById('purchase-price');
  const salePriceField = document.getElementById('sale-price');
  const colorCostField = document.getElementById('color-cost');
  const regulationCostField = document.getElementById('regulation-cost');
  const transportCostField = document.getElementById('transport-cost');
  const teacherPercentField = document.getElementById('teacher-percent');
  const sellerPercentField = document.getElementById('seller-percent');
  const advancePaymentField = document.getElementById('advance-payment');
  const paymentMethodField = document.getElementById('payment-method');
  const transactionSummaryField = document.getElementById('transaction-summary');
  
  // اگر فیلدهای ضروری وجود ندارند، از تابع خارج شو
  if (!customerNameField || !productNameField || !salePriceField || !transactionSummaryField) return;
  
  const customerName = customerNameField.value.trim();
  const productName = productNameField.options[productNameField.selectedIndex]?.text || '';
  const purchase = parseInt(faToEn(purchasePriceField?.value || '0')) || 0;
  const sale = parseInt(faToEn(salePriceField.value)) || 0;
  const grossProfit = sale - purchase;
  const color = parseInt(faToEn(colorCostField?.value || '0')) || 0;
  const regulation = parseInt(faToEn(regulationCostField?.value || '0')) || 0;
  const transport = parseInt(faToEn(transportCostField?.value || '0')) || 0;
  const teacherPercent = parseFloat(faToEn(teacherPercentField?.value || '0')) || 0;
  const sellerPercent = parseFloat(faToEn(sellerPercentField?.value || '0')) || 0;
  const teacherCommission = Math.round(sale * teacherPercent / 100);
  const sellerCommission = Math.round(sale * sellerPercent / 100);
  const netProfit = grossProfit - color - regulation - transport - teacherCommission - sellerCommission;
  const advanceRaw = advancePaymentField?.value || '0';
  const advance = parseNumberWithDots(faToEnWithDots(advanceRaw)) || 0;
  const paymentMethod = paymentMethodField?.options[paymentMethodField.selectedIndex]?.text || '';
  const remain = sale - advance;

  let html = '';
  html += `<h3><i class='fas fa-receipt'></i> خلاصه سفارش</h3>`;
  if (customerName) html += `<div class='receipt-row'><span class='receipt-label'>مشتری:</span><span class='receipt-value'>${customerName}</span></div>`;
  if (productName && productName !== 'انتخاب کنید') html += `<div class='receipt-row'><span class='receipt-label'>کالا:</span><span class='receipt-value'>${productName}</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>سود ناخالص:</span><span class='receipt-value'>${toPersianDigits(grossProfit.toLocaleString())} تومان</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>هزینه‌ها:</span><span class='receipt-value'>رنگ: ${toPersianDigits(color.toLocaleString())} | رگلاژ: ${toPersianDigits(regulation.toLocaleString())} | حمل: ${toPersianDigits(transport.toLocaleString())}</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>پورسانت معلم:</span><span class='receipt-value'>${toPersianDigits(teacherCommission.toLocaleString())} تومان</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>پورسانت فروشنده:</span><span class='receipt-value'>${toPersianDigits(sellerCommission.toLocaleString())} تومان</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>سود خالص:</span><span class='receipt-value'>${toPersianDigits(netProfit.toLocaleString())} تومان</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>روش پرداخت:</span><span class='receipt-value'>${paymentMethod}</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>پیش‌پرداخت:</span><span class='receipt-value'>${toPersianDigits(advance.toLocaleString())} تومان</span></div>`;
  if (paymentMethod !== 'نقدی') html += `<div class='receipt-row'><span class='receipt-label'>مبلغ قابل پرداخت با چک/اقساط:</span><span class='receipt-value'>${toPersianDigits(remain.toLocaleString())} تومان</span></div>`;
  html += `<div class='receipt-total'>${toPersianDigits(sale.toLocaleString())} تومان</div>`;

  transactionSummaryField.innerHTML = html;
  transactionSummaryField.style.display = 'block';
  transactionSummaryField.classList.add('receipt-cut');
}

// تابع پاک کردن فرم
function clearTransactionForm() {
  // پاک کردن فیلدهای اصلی
  document.getElementById('customer-name').value = '';
  document.getElementById('customer-phone').value = '';
  document.getElementById('customer-address').value = '';
  document.getElementById('product-name').value = '';
  document.getElementById('transaction-date').value = '';
  document.getElementById('sale-price').value = '';
  document.getElementById('payment-method').value = 'cash';
  document.getElementById('advance-payment').value = '';
  document.getElementById('purchase-price').value = '';
  document.getElementById('color-cost').value = '';
  document.getElementById('regulation-cost').value = '';
  document.getElementById('transport-cost').value = '';
  document.getElementById('teacher-name').value = '';
  document.getElementById('teacher-percent').value = '';
  document.getElementById('seller-name').value = '';
  document.getElementById('seller-percent').value = '';
  document.getElementById('birth-date').value = '';
  document.getElementById('province').value = '';
  if (document.getElementById('city')) {
    document.getElementById('city').value = '';
  }
  if (document.getElementById('product-type')) {
    document.getElementById('product-type').value = '';
  }
  
  // پاک کردن چک‌ها
  const checkDetails = document.getElementById('check-details');
  if (checkDetails) {
    checkDetails.innerHTML = '';
    checkDetails.style.display = 'none';
  }
  
  // پاک کردن پیش‌پرداخت
  const advanceGroup = document.getElementById('advance-payment-group');
  if (advanceGroup) {
    advanceGroup.style.display = 'none';
  }
  
  // غیرفعال کردن فیلدهای پیش‌پرداخت
  const advancePaymentField = document.getElementById('advance-payment');
  const checkCountField = document.getElementById('check-count');
  
  if (advancePaymentField) advancePaymentField.disabled = true;
  if (checkCountField) checkCountField.disabled = true;
  
  // پاک کردن حالت ویرایش
  window.isEditingTransaction = false;
  window.editingTransactionIndex = undefined;
  window.editingTransactionId = undefined;
  
  // بازگرداندن متن دکمه ذخیره
  const saveButton = document.querySelector('#transactions .btn.primary');
  if (saveButton) {
    saveButton.textContent = 'ثبت تراکنش';
    saveButton.innerHTML = '<i class="fas fa-save"></i> ثبت تراکنش';
  }
  
  // تغییر عنوان صفحه
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    pageTitle.textContent = 'ثبت تراکنش';
  }
  
  // به‌روزرسانی محاسبات
  calculateProfits();
  calculateInstallmentInfo();
  updateTransactionSummary();
  updateTransactionReceipt();
}

// راه‌اندازی اولیه
window.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  setupSectionNavigation();
  document.querySelector('#transactions .btn.primary').addEventListener('click', saveTransaction);
  updateBuyersTable();
  updateChecksTable();
  updateDashboard();
  renderChecksStatusChart();
  setupAdvancedFilters();
  enhanceFilterUX();
  
  // فعال کردن صفحه داشبورد در ابتدای بارگذاری
  showSection('dashboard');
  
  // اضافه کردن calculateInstallmentInfo بعد از بارگذاری
  setTimeout(function() {
    calculateInstallmentInfo();
  }, 500);

  // اتصال رویدادها به فیلدهای مالی
  [
    'purchase-price', 'sale-price', 'color-cost', 'regulation-cost', 'transport-cost',
    'teacher-percent', 'seller-percent'
  ].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateProfits);
  });
  document.getElementById('advance-payment').addEventListener('input', calculateInstallmentInfo);
  document.getElementById('net-profit').addEventListener('input', calculateInstallmentInfo);
  document.getElementById('payment-method').addEventListener('change', function() {
    const val = this.value;
    const checkDetails = document.getElementById('check-details');
    const advanceGroup = document.getElementById('advance-payment-group');
    const advancePaymentField = document.getElementById('advance-payment');
    const currentAdvanceValue = advancePaymentField.value; // حفظ مقدار فعلی
    
    // حفظ اطلاعات چک‌های موجود
    const existingChecks = [];
    const checkItems = document.querySelectorAll('.check-item');
    checkItems.forEach(item => {
      const checkData = {
        sayadi: item.querySelector('.check-sayadi')?.value || '',
        series: item.querySelector('.check-series')?.value || '',
        bank: item.querySelector('.check-bank')?.value || '',
        branch: item.querySelector('.check-branch')?.value || '',
        issuer: item.querySelector('.check-issuer')?.value || '',
        to: item.querySelector('.check-to')?.value || '',
        national: item.querySelector('.check-national')?.value || '',
        amount: item.querySelector('.check-amount')?.value || '',
        date: item.querySelector('.check-date')?.value || ''
      };
      existingChecks.push(checkData);
    });
    
    if (val === 'installment') {
      checkDetails.style.display = 'block';
      advanceGroup.style.display = 'block';
      advancePaymentField.disabled = false;
      document.getElementById('check-count').disabled = false;
      
      // اگر چک‌های موجود داریم، تعداد را تنظیم کن
      if (existingChecks.length > 0) {
        document.getElementById('check-count').value = existingChecks.length;
      }
      
      updateCheckItems();
      
      // بازگرداندن اطلاعات چک‌ها
      setTimeout(() => {
        const newCheckItems = document.querySelectorAll('.check-item');
        existingChecks.forEach((checkData, index) => {
          if (newCheckItems[index]) {
            const item = newCheckItems[index];
            if (item.querySelector('.check-sayadi')) {
              item.querySelector('.check-sayadi').value = checkData.sayadi;
            }
            if (item.querySelector('.check-series')) {
              item.querySelector('.check-series').value = checkData.series;
            }
            if (item.querySelector('.check-bank')) {
              item.querySelector('.check-bank').value = checkData.bank;
            }
            if (item.querySelector('.check-branch')) {
              item.querySelector('.check-branch').value = checkData.branch;
            }
            if (item.querySelector('.check-issuer')) {
              item.querySelector('.check-issuer').value = checkData.issuer;
            }
            if (item.querySelector('.check-to')) {
              item.querySelector('.check-to').value = checkData.to;
            }
            if (item.querySelector('.check-national')) {
              item.querySelector('.check-national').value = checkData.national;
            }
            if (item.querySelector('.check-amount')) {
              item.querySelector('.check-amount').value = checkData.amount;
            }
            if (item.querySelector('.check-date')) {
              item.querySelector('.check-date').value = checkData.date;
            }
          }
        });
        
        // فعال‌سازی مجدد دیت‌پیکر و رویدادها
        if (window.jalaliDatepicker) {
          jalaliDatepicker.startWatch({selector: '.jalali-date'});
        }
        attachCheckAmountFormatEvents();
        attachNationalCodeValidationEvents();
        attachSayadiAndSeriesValidationEvents();
      }, 100);
    } else {
      checkDetails.style.display = 'none';
      advanceGroup.style.display = 'none';
      advancePaymentField.disabled = true;
      document.getElementById('check-count').disabled = true;
    }
    
    // بازگرداندن مقدار پیش پرداخت
    if (currentAdvanceValue) {
      advancePaymentField.value = currentAdvanceValue;
    }
    
    calculateInstallmentInfo();
    updateTransactionSummary();
  });
  document.getElementById('check-count').addEventListener('input', updateCheckItems);
  // مقدار اولیه
  calculateInstallmentInfo();
  updateCheckItems();

  // اتصال رویداد به ورودی‌های عددی برای فرمت فارسی و سه‌رقمی
  [
    'purchase-price', 'sale-price', 'color-cost', 'regulation-cost', 'transport-cost',
    'teacher-percent', 'seller-percent'
  ].forEach(id => {
    document.getElementById(id).addEventListener('input', formatInputNumber);
  });
  
  // اتصال رویداد پیش پرداخت به تابع مخصوص
  document.getElementById('advance-payment').addEventListener('input', formatAdvancePaymentInput);

  // دکمه افزودن چک
  document.getElementById('add-check-btn').addEventListener('click', function() {
    const container = document.querySelector('.check-items');
    const checkItems = container.querySelectorAll('.check-item');
    let issuer = '', national = '', to = '', bank = '', branch = '', amount = '';
    if (checkItems.length > 0) {
      issuer = checkItems[0].querySelector('.check-issuer')?.value || '';
      national = checkItems[0].querySelector('.check-national')?.value || '';
      to = checkItems[0].querySelector('.check-to')?.value || '';
      bank = checkItems[0].querySelector('.check-bank')?.value || '';
      branch = checkItems[0].querySelector('.check-branch')?.value || '';
      amount = checkItems[0].querySelector('.check-amount')?.value || '';
    }
    const checkItem = document.createElement('div');
    checkItem.className = 'check-item';
    checkItem.innerHTML = `
      <div class="form-group"><label><i class='fas fa-barcode'></i> شماره صیادی</label><input type="text" class="form-control check-sayadi"></div>
      <div class="form-group"><label><i class='fas fa-list-ol'></i> سری چک</label><input type="text" class="form-control check-series"></div>
      <div class="form-group"><label><i class='fas fa-university'></i> بانک</label><input type="text" class="form-control check-bank" value="${bank}"></div>
      <div class="form-group"><label><i class='fas fa-map-marker-alt'></i> شعبه</label><input type="text" class="form-control check-branch" value="${branch}"></div>
      <div class="form-group"><label><i class='fas fa-user-edit'></i> نام صادرکننده</label><input type="text" class="form-control check-issuer" value="${issuer}"></div>
      <div class="form-group"><label><i class='fas fa-user-tag'></i> در وجه</label><input type="text" class="form-control check-to" value="${to}"></div>
      <div class="form-group"><label><i class='fas fa-id-card'></i> کدملی</label><input type="text" class="form-control check-national" value="${national}"></div>
      <div class="form-group"><label><i class='fas fa-money-bill-wave'></i> مبلغ چک</label><div style='display:flex;align-items:center;gap:4px;'><input type="text" class="form-control check-amount" value="${amount}"><span style='font-size:13px;color:#888;margin-right:4px;'>تومان</span></div></div>
      <div class="form-group"><label><i class='fas fa-calendar-alt'></i> تاریخ سررسید</label><div class="jalali-date-wrapper"><input type="text" class="form-control check-date jalali-date"></div></div>
      <button type="button" class="btn btn-danger remove-check-btn" title="حذف چک"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(checkItem);
    // فعال‌سازی مجدد دیت‌پیکر برای چک جدید
    if (window.jalaliDatepicker) {
      jalaliDatepicker.startWatch({selector: '.jalali-date'});
    }
    // اتصال رویداد فرمت مبلغ چک
    attachCheckAmountFormatEvents();
    // اتصال رویداد اعتبارسنجی کدملی
    attachNationalCodeValidationEvents();
    attachSayadiAndSeriesValidationEvents();
    // رویداد حذف چک
    checkItem.querySelector('.remove-check-btn').onclick = function() {
      this.closest('.check-item').remove();
    };
  });

  [
    'customer-name', 'product-name', 'purchase-price', 'sale-price', 'color-cost', 'regulation-cost', 'transport-cost',
    'teacher-percent', 'seller-percent', 'advance-payment', 'payment-method'
  ].forEach(id => {
    document.getElementById(id).addEventListener('input', updateTransactionSummary);
    document.getElementById(id).addEventListener('change', updateTransactionSummary);
  });
  updateTransactionSummary();

  // جستجوی REALTIME
  ['search-buyer','search-sayadi','search-amount','search-bank','search-date-from','search-date-to','search-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateChecksTable);
      el.addEventListener('change', updateChecksTable);
    }
  });
  // دکمه جستجو را حذف کن
  if (document.getElementById('search-checks-btn')) {
    document.getElementById('search-checks-btn').style.display = 'none';
  }
  // فرمت سه‌رقمی مبلغ جستجو (حتی هنگام تایپ وسط عدد)
  if (document.getElementById('search-amount')) {
    document.getElementById('search-amount').addEventListener('input', function(e) {
      let val = this.value.replace(/[^\d]/g, '');
      if (val) val = Number(val).toLocaleString('en-US');
      this.value = val;
    });
  }
});

// فعال‌سازی دیت‌پیکر شمسی برای همه فیلدهای تاریخ
window.addEventListener('DOMContentLoaded', function() {
  if (window.jalaliDatepicker) {
    jalaliDatepicker.startWatch({selector: '.jalali-date'});
  }
});

// --- رفع مشکل ست نشدن مقدار تاریخ با JalaliDatePicker ---
// کمکی برای گرفتن مقدار تاریخ شمسی از فیلدهای jalali-date
function getJalaliDateValue(input) {
  // اگر مقدار data-jdp وجود داشت، همان را برگردان
  if (input && input.classList.contains('jalali-date')) {
    return input.value || input.getAttribute('data-jdp') || '';
  }
  return input ? input.value : '';
}

// تابع فرمت مبلغ چک به صورت سه‌رقم سه‌رقم و فارسی
function formatCheckAmountInput(e) {
  let val = faToEn(e.target.value.replace(/[^\d]/g, ''));
  if (val) val = parseInt(val).toLocaleString('en-US');
  e.target.value = val || '';
}

// در راه‌اندازی اولیه، رویداد input را به همه فیلدهای مبلغ چک متصل کن
function attachCheckAmountFormatEvents() {
  document.querySelectorAll('.check-amount').forEach(input => {
    input.removeEventListener('input', formatCheckAmountInput); // جلوگیری از چندبار اتصال
    input.addEventListener('input', formatCheckAmountInput);
  });
}

// تابع اعتبارسنجی کدملی ایران
function isValidIranNationalCode(input) {
  let code = faToEn(input.value.replace(/[^\d]/g, ''));
  if (!/^[0-9]{10}$/.test(code)) return false;
  let check = +code[9];
  let sum = Array.from(code).slice(0, 9).reduce((acc, d, i) => acc + (+d * (10 - i)), 0) % 11;
  return (sum < 2 && check == sum) || (sum >= 2 && check + sum == 11);
}

function validateNationalCodeInput(e) {
  const input = e.target;
  const parent = input.parentElement;
  let error = parent.querySelector('.national-error');
  if (!error) {
    error = document.createElement('div');
    error.className = 'national-error';
    error.style.color = 'red';
    error.style.fontSize = '0.9em';
    error.style.marginTop = '2px';
    parent.appendChild(error);
  }
  if (input.value && !isValidIranNationalCode(input)) {
    input.style.borderColor = 'red';
    error.textContent = 'کدملی نامعتبر است!';
  } else {
    input.style.borderColor = '';
    error.textContent = '';
  }
}

function attachNationalCodeValidationEvents() {
  document.querySelectorAll('.check-national').forEach(input => {
    input.removeEventListener('input', validateNationalCodeInput);
    input.removeEventListener('blur', validateNationalCodeInput);
    input.addEventListener('input', validateNationalCodeInput);
    input.addEventListener('blur', validateNationalCodeInput);
  });
}

// اعتبارسنجی شماره صیادی (۱۶ رقم عددی)
function isValidSayadi(input) {
  let val = faToEn(input.value.replace(/[^\d]/g, ''));
  return /^[0-9]{16}$/.test(val);
}
function validateSayadiInput(e) {
  const input = e.target;
  const parent = input.parentElement;
  let error = parent.querySelector('.sayadi-error');
  if (!error) {
    error = document.createElement('div');
    error.className = 'sayadi-error';
    error.style.color = 'red';
    error.style.fontSize = '0.9em';
    error.style.marginTop = '2px';
    parent.appendChild(error);
  }
  if (input.value && !isValidSayadi(input)) {
    input.style.borderColor = 'red';
    error.textContent = 'شماره صیادی باید ۱۶ رقم باشد!';
  } else {
    input.style.borderColor = '';
    error.textContent = '';
  }
}
// اعتبارسنجی سری چک (حداقل ۸ رقم عددی)
function isValidCheckSeries(input) {
  let val = faToEn(input.value.replace(/[^\d]/g, ''));
  return /^[0-9]{8,}$/.test(val);
}
function validateCheckSeriesInput(e) {
  const input = e.target;
  const parent = input.parentElement;
  let error = parent.querySelector('.series-error');
  if (!error) {
    error = document.createElement('div');
    error.className = 'series-error';
    error.style.color = 'red';
    error.style.fontSize = '0.9em';
    error.style.marginTop = '2px';
    parent.appendChild(error);
  }
  if (input.value && !isValidCheckSeries(input)) {
    input.style.borderColor = 'red';
    error.textContent = 'سری چک باید حداقل ۸ رقم باشد!';
  } else {
    input.style.borderColor = '';
    error.textContent = '';
  }
}
function attachSayadiAndSeriesValidationEvents() {
  document.querySelectorAll('.check-sayadi').forEach(input => {
    input.removeEventListener('input', validateSayadiInput);
    input.removeEventListener('blur', validateSayadiInput);
    input.addEventListener('input', validateSayadiInput);
    input.addEventListener('blur', validateSayadiInput);
  });
  document.querySelectorAll('.check-series').forEach(input => {
    input.removeEventListener('input', validateCheckSeriesInput);
    input.removeEventListener('blur', validateCheckSeriesInput);
    input.addEventListener('input', validateCheckSeriesInput);
    input.addEventListener('blur', validateCheckSeriesInput);
  });
} 

// تابع تنظیم event listeners برای آپشن‌های سفارشی نمودار
function setupCustomLegendEvents() {
  const legendItems = document.querySelectorAll('.legend-item');
  if (!legendItems || legendItems.length === 0) {
    console.log('Legend items not found, skipping setup');
    return;
  }
  
  // مدال جمع مبلغ چک‌ها
  let checkSumDiv = document.getElementById('check-sum-amount');
  if (!checkSumDiv) {
    checkSumDiv = document.createElement('div');
    checkSumDiv.id = 'check-sum-amount';
    checkSumDiv.style.position = 'absolute';
    checkSumDiv.style.top = '60px';
    checkSumDiv.style.left = '50%';
    checkSumDiv.style.transform = 'translateX(-50%)';
    checkSumDiv.style.background = '#f9fafc';
    checkSumDiv.style.border = '2px solid #ea4335';
    checkSumDiv.style.borderRadius = '16px';
    checkSumDiv.style.boxShadow = '0 8px 32px rgba(234,67,53,0.13)';
    checkSumDiv.style.padding = '22px 32px 18px 32px';
    checkSumDiv.style.fontSize = '15px';
    checkSumDiv.style.fontWeight = 'bold';
    checkSumDiv.style.color = '#ea4335';
    checkSumDiv.style.zIndex = '20';
    checkSumDiv.style.display = 'none';
    checkSumDiv.style.minWidth = '340px';
    checkSumDiv.style.maxWidth = '480px';
    checkSumDiv.style.transition = 'all 0.3s';
    checkSumDiv.style.textAlign = 'center';
    checkSumDiv.style.lineHeight = '2.1';
    checkSumDiv.style.fontFamily = 'Vazirmatn, Yekan, Tahoma, Arial, sans-serif';
    checkSumDiv.innerHTML = '';
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) chartContainer.appendChild(checkSumDiv);
  }
  // دکمه بستن
  let closeBtn = document.getElementById('check-sum-close-btn');
  if (!closeBtn) {
    closeBtn = document.createElement('button');
    closeBtn.id = 'check-sum-close-btn';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '8px';
    closeBtn.style.left = '8px';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#ea4335';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.zIndex = '30';
    closeBtn.onclick = () => { 
      if (checkSumDiv) checkSumDiv.style.display = 'none'; 
    };
    if (checkSumDiv) checkSumDiv.appendChild(closeBtn);
  }
  
  legendItems.forEach((item, index) => {
    if (!item) return;
    
    item.addEventListener('click', function() {
      // تغییر وضعیت active
      const isActive = this.classList.contains('active');
      if (isActive) {
        this.classList.remove('active');
      } else {
        this.classList.add('active');
      }
      // همگام‌سازی وضعیت سری‌ها با legend
      if (window.monthlyApexChart) {
        const seriesNames = ['فروش', 'سود خالص', 'تعداد چک'];
        legendItems.forEach((legend, idx) => {
          if (!legend) return;
          const name = seriesNames[idx];
          if (legend && legend.classList && legend.classList.contains('active')) {
            window.monthlyApexChart.showSeries(name);
          } else {
            window.monthlyApexChart.hideSeries(name);
          }
        });
        // منطق محور y داینامیک
        const isProfitActive = legendItems[1] && legendItems[1].classList.contains('active');
        const isCheckActive = legendItems[2] && legendItems[2].classList.contains('active');
        if (isProfitActive && !legendItems[0]?.classList.contains('active') && !isCheckActive) {
          // فقط سود خالص فعال است
          window.monthlyApexChart.updateOptions({
            yaxis: [
              {
                title: { text: 'سود خالص (میلیون تومان)', style: { color: '#495057', fontWeight: 700, fontSize: '14px' } },
                labels: { style: { colors: '#6c757d', fontSize: '12px' }, formatter: val => val + 'M' },
                min: 0,
                show: true
              }
            ]
          }, false, false, true);
        } else {
          // حالت عادی (محور چک هم فعال باشد)
          window.monthlyApexChart.updateOptions({
            yaxis: [
              {
                title: { text: 'مبلغ (میلیون تومان)', style: { color: '#495057', fontWeight: 700, fontSize: '14px' } },
                labels: { style: { colors: '#6c757d', fontSize: '12px' }, formatter: val => val + 'M' },
                min: 0,
                show: true
              },
              {
                opposite: true,
                title: { text: 'تعداد چک‌ها', style: { color: '#495057', fontWeight: 700, fontSize: '14px' } },
                labels: { style: { colors: '#ea4335', fontSize: '12px' } },
                min: 0,
                show: true,
                forceNiceScale: true
              }
            ]
          }, false, false, true);
        }
      }
      // اگر تعداد چک کلیک شد
      if (index === 2) {
        const isActive = this.classList.contains('active');
        if (isActive) {
          if (window.checkAmountSums && window.chartPeriods && window.checkData) {
            let total = window.checkAmountSums.reduce((a, b) => a + (b || 0), 0);
            let totalCount = window.checkData ? window.checkData.reduce((a, b) => a + (b || 0), 0) : 0;
            let html = `<div style='font-size:17px;font-weight:700;margin-bottom:8px;'><i class='fas fa-money-bill-wave' style='color:#ea4335;margin-left:6px;'></i>جدول چک‌های هر ماه</div>`;
            html += `<table style='width:100%;border-collapse:separate;border-spacing:0 2px;margin:0 auto 10px auto;font-size:15px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(234,67,53,0.07);'>`;
            html += `<thead><tr style='background:#ffeaea;'><th style='padding:10px 14px;border-radius:10px 0 0 0;font-weight:900;color:#d32f2f;'>ماه</th><th style='padding:10px 14px;font-weight:900;color:#d32f2f;'>تعداد چک</th><th style='padding:10px 14px;border-radius:0 10px 0 0;font-weight:900;color:#d32f2f;'>جمع مبلغ</th></tr></thead><tbody>`;
            for (let i = 0; i < window.checkAmountSums.length; i++) {
              html += `<tr style='background:${i%2===0 ? "#fff" : "#f9f9f9"};transition:background 0.2s;' onmouseover='this.style.background="#ffeaea"' onmouseout='this.style.background="${i%2===0 ? '#fff' : '#f9f9f9'}";'>`;
              html += `<td style='padding:8px 14px;'>${window.chartPeriods[i]}</td>`;
              html += `<td style='padding:8px 14px;text-align:center;'>${window.checkData ? window.checkData[i] : '-'}</td>`;
              html += `<td style='padding:8px 14px;text-align:left;'><b>${(window.checkAmountSums[i]||0).toLocaleString()}</b> <span style='font-size:12px;color:#888;'>تومان</span></td>`;
              html += `</tr>`;
            }
            html += `</tbody><tfoot><tr style='background:#ffeaea;font-weight:900;'>`;
            html += `<td style='padding:10px 14px;'>جمع کل</td>`;
            html += `<td style='padding:10px 14px;text-align:center;'>${totalCount}</td>`;
            html += `<td style='padding:10px 14px;text-align:left;'><span style='color:#ea4335;'>${total.toLocaleString()}</span> <span style='font-size:12px;color:#888;'>تومان</span></td>`;
            html += `</tr></tfoot></table>`;
            checkSumDiv.innerHTML = html;
            checkSumDiv.appendChild(closeBtn);
            checkSumDiv.style.display = 'block';
          }
        } else {
          checkSumDiv.style.display = 'none';
        }
      }
    });
    item.classList.add('active');
  });
  // همیشه همه سری‌ها و legendها را فعال کن هنگام بارگذاری
  if (window.monthlyApexChart) {
    const seriesNames = ['فروش', 'سود خالص', 'تعداد چک'];
    legendItems.forEach((item, idx) => {
      item.classList.add('active');
      window.monthlyApexChart.showSeries(seriesNames[idx]);
    });
  }
}

// لیست شهرهای ایران بر اساس استان
const iranCities = {
  "آذربایجان شرقی": ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب", "شبستر", "سراب", "هادی‌شهر", "ملکان", "بستان‌آباد", "جلفا", "آذرشهر", "هریس", "کلیبر", "اسکو", "ورزقان", "خدا آفرین", "چاراویماق"],
  "آذربایجان غربی": ["ارومیه", "خوی", "میاندوآب", "مهاباد", "بوکان", "سلماس", "پیرانشهر", "نقده", "شاهین‌دژ", "ماکو", "اشنویه", "تکاب", "چالدران", "شوط", "چایپاره", "پلدشت"],
  "اردبیل": ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال", "گرمی", "بیله‌سوار", "نمین", "نیر", "کوثر", "سرعین"],
  "اصفهان": ["اصفهان", "کاشان", "خمینی‌شهر", "نجف‌آباد", "لنجان", "شاهین‌شهر", "فلاورجان", "مبارکه", "آران و بیدگل", "زرین‌شهر", "شهرضا", "دهاقان", "فریدن", "فریدون‌شهر", "نائین", "تیران و کرون", "سمیرم", "خوانسار", "گلپایگان", "برخوار", "چادگان", "بوئین و میاندشت"],
  "البرز": ["کرج", "فردیس", "نظرآباد", "ساوجبلاغ", "اشتهارد", "طالقان"],
  "ایلام": ["ایلام", "دهلران", "دره‌شهر", "آبدانان", "مهران", "ملکشاهی", "چرداول", "ایوان", "بدره", "سیروان"],
  "بوشهر": ["بوشهر", "دشتستان", "تنگستان", "دشتی", "کنگان", "گناوه", "جم", "دیلم", "عسلویه"],
  "تهران": ["تهران", "شهریار", "اسلامشهر", "ملارد", "بهارستان", "پاکدشت", "ری", "قدس", "قرچک", "ورامین", "دماوند", "پردیس", "رباط‌کریم", "پیشوا", "شمیرانات", "فیروزکوه"],
  "چهارمحال و بختیاری": ["شهرکرد", "بروجن", "فارسان", "لردگان", "کیار", "اردل", "سامان", "کوهرنگ", "بن", "خانمیرزا"],
  "خراسان جنوبی": ["بیرجند", "قائنات", "فردوس", "نهبندان", "سربیشه", "طبس", "درمیان", "بشرویه", "خوسف", "زیرکوه"],
  "خراسان رضوی": ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "قوچان", "کاشمر", "تربت جام", "چناران", "خواف", "درگز", "بردسکن", "طرقبه شاندیز", "سرخس", "گناباد", "فریمان", "رشتخوار", "کلات", "باخرز", "جوین", "جغتای", "مه ولات", "زاوه", "فیروزه", "بجستان"],
  "خراسان شمالی": ["بجنورد", "اسفراین", "شیروان", "جاجرم", "مانه و سملقان", "گرمه", "فاروج", "راز و جرگلان"],
  "خوزستان": ["اهواز", "دزفول", "آبادان", "خرمشهر", "بهبهان", "ماهشهر", "شادگان", "شوشتر", "شوش", "اندیمشک", "ایذه", "امیدیه", "رامهرمز", "رامشیر", "حمیدیه", "باوی", "کارون", "هندیجان", "لالی", "گتوند", "مسجدسلیمان", "هویزه", "اندیکا", "بندر امام خمینی"],
  "زنجان": ["زنجان", "ابهر", "خرمدره", "ایجرود", "طارم", "ماهنشان", "سلطانیه", "دندی", "حلب"],
  "سمنان": ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدی‌شهر", "آرادان", "میامی", "سرخه"],
  "سیستان و بلوچستان": ["زاهدان", "چابهار", "ایرانشهر", "خاش", "سراوان", "راسك", "کنارک", "زهک", "هیرمند", "دلگان", "میرجاوه", "نیک‌شهر", "فنوج", "سیب و سوران", "قصرقند", "مهرستان", "نیمروز", "محمدان"],
  "فارس": ["شیراز", "مرودشت", "جهرم", "کازرون", "لارستان", "فسا", "داراب", "نی‌ریز", "سپیدان", "استهبان", "کوار", "ممسنی", "آباده", "اقلید", "زرین‌دشت", "خرامه", "پاسارگاد", "رستم", "سروستان", "مهر", "بوانات", "خنج", "فراشبند", "ارسنجان", "بیضا", "کوه‌چنار"],
  "قزوین": ["قزوین", "البرز", "آبیک", "تاکستان", "بوئین‌زهرا", "آوج", "سیردان"],
  "قم": ["قم"],
  "کردستان": ["سنندج", "سقز", "بانه", "قروه", "بیجار", "کامیاران", "دیواندره", "مریوان", "دهگلان"],
  "کرمان": ["کرمان", "رفسنجان", "جیرفت", "سیرجان", "بم", "زرند", "کهنوج", "بردسیر", "راور", "عنبرآباد", "شهربابک", "ریگان", "فهرج", "منوجان", "ارزوئیه", "قلعه گنج", "انار"],
  "کرمانشاه": ["کرمانشاه", "اسلام‌آباد غرب", "هرسین", "سنقر", "کنگاور", "سرپل ذهاب", "قصر شیرین", "پاوه", "جوانرود", "صحنه", "گیلانغرب", "روانسر", "دالاهو", "ثلاث باباجانی"],
  "کهگیلویه و بویراحمد": ["یاسوج", "گچساران", "دهدشت", "دوگنبدان", "سی‌سخت", "باشت", "چرام", "لنده", "مارگون"],
  "گلستان": ["گرگان", "گنبد کاووس", "علی‌آباد", "آق‌قلا", "کلاله", "مینودشت", "آزادشهر", "بندر ترکمن", "بندر گز", "رامیان", "گمیشان", "مراوه‌تپه", "گالیکش"],
  "گیلان": ["رشت", "انزلی", "لاهیجان", "لنگرود", "آستارا", "آستانه اشرفیه", "رودسر", "تالش", "صومعه‌سرا", "فومن", "رضوانشهر", "شفت", "ماسال", "املش", "سیاهکل", "رودبار"],
  "لرستان": ["خرم‌آباد", "بروجرد", "دورود", "الیگودرز", "کوهدشت", "ازنا", "پلدختر", "دلفان", "سلسله", "رومشکان"],
  "مازندران": ["ساری", "بابل", "آمل", "قائم‌شهر", "بهشهر", "تنکابن", "نکا", "بابلسر", "محمودآباد", "نور", "جویبار", "رامسر", "فریدون‌کنار", "چالوس", "عباس‌آباد", "کلاردشت", "سوادکوه", "سوادکوه شمالی", "گلوگاه"],
  "مرکزی": ["اراک", "ساوه", "خمین", "محلات", "دلیجان", "شازند", "تفرش", "آشتیان", "زرندیه", "کمیجان"],
  "هرمزگان": ["بندرعباس", "بندر لنگه", "میناب", "قشم", "حاجی‌آباد", "رودان", "پارسیان", "جاسک", "سیریک", "ابوموسی", "بستک", "بشاگرد"],
  "همدان": ["همدان", "ملایر", "نهاوند", "کبودرآهنگ", "تویسرکان", "اسدآباد", "رزن", "فامنین", "بهار"],
  "یزد": ["یزد", "میبد", "اردکان", "بافق", "ابرکوه", "مهریز", "اشکذر", "خاتم", "تفت", "بهاباد"]
};

// رویداد تغییر استان برای پر کردن شهرها
window.addEventListener('DOMContentLoaded', function() {
  const provinceSelect = document.getElementById('province');
  const citySelect = document.getElementById('city');
  if (provinceSelect && citySelect) {
    provinceSelect.addEventListener('change', function() {
      const val = this.value;
      citySelect.innerHTML = '<option value="">انتخاب شهر</option>';
      if (iranCities[val]) {
        iranCities[val].forEach(city => {
          const opt = document.createElement('option');
          opt.value = city;
          opt.textContent = city;
          citySelect.appendChild(opt);
        });
      }
    });
  }
  
  // Chart period change
  const chartPeriodSelect = document.getElementById('chart-period');
  if (chartPeriodSelect) {
    chartPeriodSelect.addEventListener('change', function() {
      createMonthlyPerformanceChart();
    });
  }
  
  // Setup sidebar toggle
  setupSidebarToggle();
});

// تنظیم عملکرد جمع/باز کردن sidebar
function setupSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  
  if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      
      // ذخیره وضعیت در localStorage
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', isCollapsed);
      
      // تغییر آیکون دکمه
      const icon = this.querySelector('i');
      if (isCollapsed) {
        icon.className = 'fas fa-chevron-left';
      } else {
        icon.className = 'fas fa-chevron-right';
      }
    });
    
    // بازیابی وضعیت از localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      sidebar.classList.add('collapsed');
      const icon = sidebarToggle.querySelector('i');
      icon.className = 'fas fa-chevron-left';
    } else {
      const icon = sidebarToggle.querySelector('i');
      icon.className = 'fas fa-chevron-right';
    }
  }
} 

function updateTransactionReceipt() {
  const receiptDiv = document.getElementById('transaction-receipt');
  if (!receiptDiv) {
    console.log('Transaction receipt element not found, skipping update');
    return;
  }

  const customerName = document.getElementById('customer-name')?.value || '';
  const productName = document.getElementById('product-name')?.options[document.getElementById('product-name')?.selectedIndex]?.text || '';
  const purchase = parseInt(faToEn(document.getElementById('purchase-price')?.value || '0')) || 0;
  const sale = parseInt(faToEn(document.getElementById('sale-price')?.value || '0')) || 0;
  const grossProfit = sale - purchase;
  const color = parseInt(faToEn(document.getElementById('color-cost')?.value || '0')) || 0;
  const regulation = parseInt(faToEn(document.getElementById('regulation-cost')?.value || '0')) || 0;
  const transport = parseInt(faToEn(document.getElementById('transport-cost')?.value || '0')) || 0;
  const teacherPercent = parseFloat(faToEn(document.getElementById('teacher-percent')?.value || '0')) || 0;
  const sellerPercent = parseFloat(faToEn(document.getElementById('seller-percent')?.value || '0')) || 0;
  const teacherCommission = Math.round(sale * teacherPercent / 100);
  const sellerCommission = Math.round(sale * sellerPercent / 100);
  const netProfit = grossProfit - color - regulation - transport - teacherCommission - sellerCommission;
  const advanceRaw = document.getElementById('advance-payment')?.value || '0';
  const advance = parseNumberWithDots(faToEnWithDots(advanceRaw)) || 0;
  const paymentMethod = document.getElementById('payment-method')?.options[document.getElementById('payment-method')?.selectedIndex]?.text || '';
  const remain = sale - advance;

  let html = '';
  html += `<h3><i class='fas fa-receipt'></i> خلاصه سفارش</h3>`;
  if (customerName) html += `<div class='receipt-row'><span class='receipt-label'>مشتری:</span><span class='receipt-value'>${customerName}</span></div>`;
  if (productName && productName !== 'انتخاب کنید') html += `<div class='receipt-row'><span class='receipt-label'>کالا:</span><span class='receipt-value'>${productName}</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>سود ناخالص:</span><span class='receipt-value'>${toPersianDigits(grossProfit.toLocaleString())} تومان</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>هزینه‌ها:</span><span class='receipt-value'>رنگ: ${toPersianDigits(color.toLocaleString())} | رگلاژ: ${toPersianDigits(regulation.toLocaleString())} | حمل: ${toPersianDigits(transport.toLocaleString())}</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>پورسانت معلم:</span><span class='receipt-value'>${toPersianDigits(teacherCommission.toLocaleString())} تومان</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>پورسانت فروشنده:</span><span class='receipt-value'>${toPersianDigits(sellerCommission.toLocaleString())} تومان</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>سود خالص:</span><span class='receipt-value'>${toPersianDigits(netProfit.toLocaleString())} تومان</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>روش پرداخت:</span><span class='receipt-value'>${paymentMethod}</span></div>`;
  html += `<div class='receipt-row'><span class='receipt-label'>پیش‌پرداخت:</span><span class='receipt-value'>${toPersianDigits(advance.toLocaleString())} تومان</span></div>`;
  if (paymentMethod !== 'نقدی') html += `<div class='receipt-row'><span class='receipt-label'>مبلغ قابل پرداخت با چک/اقساط:</span><span class='receipt-value'>${toPersianDigits(remain.toLocaleString())} تومان</span></div>`;
  html += `<div class='receipt-total'>${toPersianDigits(sale.toLocaleString())} تومان</div>`;
  html += `<div class='receipt-footer'>این رسید غیررسمی است و صرفاً جهت مشاهده خلاصه سفارش می‌باشد.</div>`;

  receiptDiv.innerHTML = html;
  receiptDiv.style.display = 'block';
}

// اتصال به رویدادهای فرم
['customer-name', 'product-name', 'transaction-date', 'purchase-price', 'sale-price', 'color-cost', 'regulation-cost', 'transport-cost', 'teacher-percent', 'seller-percent', 'advance-payment', 'payment-method'].forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('input', updateTransactionReceipt);
    element.addEventListener('change', updateTransactionReceipt);
  }
});

// فقط اگر عنصر receipt وجود دارد، آن را به‌روزرسانی کن
if (document.getElementById('transaction-receipt')) {
  updateTransactionReceipt();
}

// --- جستجوی پیشرفته چک‌ها ---
function getChecksSearchFilters() {
  return {
    buyer: (document.getElementById('search-buyer')?.value || '').trim(),
    sayadi: (document.getElementById('search-sayadi')?.value || '').trim(),
    amount: (document.getElementById('search-amount')?.value || '').trim(),
    bank: (document.getElementById('search-bank')?.value || '').trim(),
    dateFrom: (document.getElementById('search-date-from')?.value || '').trim(),
    dateTo: (document.getElementById('search-date-to')?.value || '').trim(),
    status: (document.getElementById('search-status')?.value || '').trim(),
  };
}
function filterChecks(checks) {
  const filters = getChecksSearchFilters();
  return checks.filter(check => {
    // نام خریدار
    if (filters.buyer) {
      const buyer = buyers.find(b => b.id == check.buyerId);
      if (!buyer || !buyer.name.includes(filters.buyer)) return false;
    }
    // شماره صیادی
    if (filters.sayadi && (!check.sayadi || !check.sayadi.includes(filters.sayadi))) return false;
    // مبلغ
    if (filters.amount) {
      const amountVal = parseInt(filters.amount.replace(/\D/g, ''));
      if (!check.amount || check.amount != amountVal) return false;
    }
    // بانک صادرکننده
    if (filters.bank) {
      // جستجو در نام بانک
      if (!check.bank || !check.bank.includes(filters.bank)) {
        // اگر در بانک پیدا نشد، در صادرکننده جستجو کن
        if (!check.issuer || !check.issuer.includes(filters.bank)) {
          return false;
        }
      }
    }
    // تاریخ سررسید (از/تا)
    if (filters.dateFrom && check.dueDate < filters.dateFrom) return false;
    if (filters.dateTo && check.dueDate > filters.dateTo) return false;
    // وضعیت
    if (filters.status && check.status !== filters.status) return false;
    return true;
  });
}

// --- رویدادهای جستجو ---
window.addEventListener('DOMContentLoaded', () => {
  // ... existing code ...
  if (document.getElementById('search-checks-btn')) {
    document.getElementById('search-checks-btn').onclick = () => updateChecksTable();
  }
  
  // به‌روزرسانی کارت‌های آماری هنگام بارگذاری صفحه
  setTimeout(() => {
    updateChecksStatsCardsFromArray();
  }, 100);
  if (document.getElementById('reset-checks-btn')) {
    document.getElementById('reset-checks-btn').onclick = () => {
      document.getElementById('search-buyer').value = '';
      document.getElementById('search-sayadi').value = '';
      document.getElementById('search-amount').value = '';
      document.getElementById('search-bank').value = '';
      document.getElementById('search-date-from').value = '';
      document.getElementById('search-date-to').value = '';
      document.getElementById('search-status').value = '';
      updateChecksTable();
    };
  }
});
// ... existing code ...

function renderChecksStatusChart() {
  if (!window.ApexCharts || !document.getElementById('checksStatusChart')) return;
  // داده‌های ماهانه
  const persianMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const statusList = ['در جریان', 'وصول شده', 'برگشتی'];
  const statusColors = ['url(#modernYellow)', 'url(#modernGreen)', 'url(#modernRed)'];
  // آرایه‌ای از 12 ماه، هر ماه یک آبجکت با تعداد هر وضعیت و جمع مبلغ
  const monthlyStatusCounts = Array.from({length: 12}, (_, i) => ({
    month: persianMonths[i],
    'در جریان': 0,
    'وصول شده': 0,
    'برگشتی': 0,
    totalAmount: 0
  }));
  checks.forEach(c => {
    if (!c.dueDate) return;
    const parts = c.dueDate.split('/');
    if (parts.length !== 3) return;
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12 && statusList.includes(c.status)) {
      monthlyStatusCounts[monthIdx][c.status]++;
      monthlyStatusCounts[monthIdx].totalAmount += parseInt(c.amount) || 0;
    }
  });
  const series = [
    ...statusList.map((status, idx) => ({
      name: status,
      type: 'column',
      data: monthlyStatusCounts.map(m => m[status])
    })),
    {
      name: 'جمع مبلغ چک‌ها',
      type: 'line',
      data: monthlyStatusCounts.map(m => m.totalAmount),
      color: '#1976d2',
      stroke: { width: 4 },
      marker: { size: 6, strokeWidth: 3, fillColor: '#fff', strokeColor: '#1976d2' }
    }
  ];
  // حذف نمودار قبلی
  if (window.checksStatusApexChart) {
    window.checksStatusApexChart.destroy();
    window.checksStatusApexChart = null;
  }
  const options = {
    chart: {
      height: 340,
      width: '100%',
      type: 'line',
      fontFamily: 'Vazirmatn, Yekan, Tahoma, Arial, sans-serif',
      toolbar: { show: false },
      foreColor: '#222',
      dropShadow: {
        enabled: true,
        top: 4,
        left: 0,
        blur: 8,
        opacity: 0.12
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '32%',
        borderRadius: 10,
        endingShape: 'rounded'
      }
    },
    fill: {
      type: ['solid', 'solid', 'solid', 'gradient'],
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.4,
        gradientToColors: ['#fffde4', '#e0ffe4', '#ffe4e4', '#90caf9'],
        inverseColors: false,
        opacityFrom: 0.95,
        opacityTo: 0.85,
        stops: [0, 100]
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: [0, 0, 0, 4], curve: 'smooth', colors: ['transparent', 'transparent', 'transparent', '#1976d2'] },
    series: series,
    xaxis: {
      categories: persianMonths,
      labels: { style: { fontFamily: 'Vazirmatn, Yekan, Tahoma', fontSize: '15px' } }
    },
    yaxis: [
      {
        title: { text: 'تعداد چک', style: { fontFamily: 'Vazirmatn, Yekan, Tahoma', fontSize: '15px' } },
        labels: {
          style: { fontFamily: 'Vazirmatn, Yekan, Tahoma', fontSize: '15px' },
          formatter: val => toPersianDigits(val)
        }
      },
      {
        opposite: true,
        title: { text: 'جمع مبلغ (تومان)', style: { fontFamily: 'Vazirmatn, Yekan, Tahoma', fontSize: '15px' } },
        labels: {
          style: { fontFamily: 'Vazirmatn, Yekan, Tahoma', fontSize: '15px' },
          formatter: val => toPersianDigits((val||0).toLocaleString())
        }
      }
    ],
    colors: statusColors.concat(['#1976d2']),
    legend: {
      position: 'top',
      fontFamily: 'Vazirmatn, Yekan, Tahoma',
      fontSize: '15px'
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: [
        {
          formatter: val => toPersianDigits(val) + ' چک'
        },
        {
          formatter: val => toPersianDigits(val) + ' چک'
        },
        {
          formatter: val => toPersianDigits(val) + ' چک'
        },
        {
          formatter: val => toPersianDigits((val||0).toLocaleString()) + ' تومان'
        }
      ]
    },
    grid: { borderColor: '#f1f1f1', strokeDashArray: 4 },
    noData: { text: 'داده‌ای برای نمایش وجود ندارد', align: 'center', style: { fontFamily: 'Vazirmatn, Yekan, Tahoma', fontSize: '16px' } },
    responsive: [
      {
        breakpoint: 900,
        options: {
          chart: { height: 320 },
          legend: { fontSize: '13px' },
          xaxis: { labels: { fontSize: '13px' } },
          yaxis: [{ labels: { fontSize: '13px' } }, { labels: { fontSize: '13px' } }]
        }
      },
      {
        breakpoint: 600,
        options: {
          chart: { height: 260 },
          legend: { fontSize: '11px' },
          xaxis: { labels: { fontSize: '11px' } },
          yaxis: [{ labels: { fontSize: '11px' } }, { labels: { fontSize: '11px' } }]
        }
      }
    ]
  };
  window.checksStatusApexChart = new ApexCharts(document.getElementById('checksStatusChart'), options);
  window.checksStatusApexChart.render();
}

// تابع محاسبه آمار چک‌ها
function calculateChecksStats() {
  const totalChecks = checks.length;
  const totalAmount = checks.reduce((sum, check) => sum + (check.amount || 0), 0);
  const inProgressChecks = checks.filter(check => check.status === 'در جریان');
  const inProgressAmount = inProgressChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
  const collectedChecks = checks.filter(check => check.status === 'وصول شده');
  const collectedAmount = collectedChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
  const returnedChecks = checks.filter(check => check.status === 'برگشتی');
  const returnedAmount = returnedChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
  
  return {
    total: totalChecks,
    totalAmount: totalAmount,
    inProgress: inProgressChecks.length,
    inProgressAmount: inProgressAmount,
    collected: collectedChecks.length,
    collectedAmount: collectedAmount,
    returned: returnedChecks.length,
    returnedAmount: returnedAmount
  };
}

// تابع به‌روزرسانی کارت‌های آماری
function updateChecksStatsCards() {
  const stats = calculateChecksStats();
  
  // به‌روزرسانی کارت تعداد کل چک‌ها
  const totalCard = document.querySelector('.stat-card:nth-child(1) .stat-value');
  if (totalCard) totalCard.textContent = toPersianDigits(stats.total);
  
  // به‌روزرسانی کارت جمع مبالغ
  const amountCard = document.querySelector('.stat-card:nth-child(2) .stat-value');
  if (amountCard) amountCard.textContent = toPersianDigits(stats.totalAmount.toLocaleString()) + ' تومان';
  
  // به‌روزرسانی کارت در جریان
  const inProgressCard = document.querySelector('.stat-card:nth-child(3) .stat-value');
  const inProgressLabel = document.querySelector('.stat-card:nth-child(3) .stat-label');
  if (inProgressCard) inProgressCard.textContent = toPersianDigits(stats.inProgress);
  if (inProgressLabel) inProgressLabel.textContent = `در جریان (${toPersianDigits(stats.inProgressAmount.toLocaleString())} تومان)`;
  
  // به‌روزرسانی کارت وصول شده
  const collectedCard = document.querySelector('.stat-card:nth-child(4) .stat-value');
  const collectedLabel = document.querySelector('.stat-card:nth-child(4) .stat-label');
  if (collectedCard) collectedCard.textContent = toPersianDigits(stats.collected);
  if (collectedLabel) collectedLabel.textContent = `وصول شده (${toPersianDigits(stats.collectedAmount.toLocaleString())} تومان)`;
}

// تابع استخراج اطلاعات چک‌ها از HTML جدول
function extractChecksFromHTML() {
  const checksTable = document.querySelector('#checks .checks-table tbody');
  if (!checksTable) return [];
  
  const rows = checksTable.querySelectorAll('tr');
  const extractedChecks = [];
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 6) {
      const sayadi = cells[0].textContent.trim();
      const to = cells[1].textContent.trim();
      const amountText = cells[2].textContent.trim();
      const dueDate = cells[3].textContent.trim();
      const issuer = cells[4].textContent.trim();
      const statusElement = cells[5].querySelector('.status-badge');
      const status = statusElement ? statusElement.textContent.trim() : '';
      
      // تبدیل مبلغ از فارسی به عدد
      const amount = parseInt(faToEn(amountText.replace(/\D/g, ''))) || 0;
      
      if (sayadi && amount > 0) {
        extractedChecks.push({
          sayadi: sayadi,
          to: to,
          amount: amount,
          dueDate: dueDate,
          issuer: issuer,
          status: status
        });
      }
    }
  });
  
  return extractedChecks;
}

// تابع محاسبه آمار چک‌ها از HTML
function calculateChecksStatsFromHTML() {
  const htmlChecks = extractChecksFromHTML();
  
  const totalChecks = htmlChecks.length;
  const totalAmount = htmlChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
  const inProgressChecks = htmlChecks.filter(check => check.status === 'در جریان');
  const inProgressAmount = inProgressChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
  const collectedChecks = htmlChecks.filter(check => check.status === 'وصول شده');
  const collectedAmount = collectedChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
  const returnedChecks = htmlChecks.filter(check => check.status === 'برگشتی');
  const returnedAmount = returnedChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
  
  return {
    total: totalChecks,
    totalAmount: totalAmount,
    inProgress: inProgressChecks.length,
    inProgressAmount: inProgressAmount,
    collected: collectedChecks.length,
    collectedAmount: collectedAmount,
    returned: returnedChecks.length,
    returnedAmount: returnedAmount
  };
}

// تابع به‌روزرسانی کارت‌های آماری از HTML
function updateChecksStatsCardsFromHTML() {
  const stats = calculateChecksStatsFromHTML();
  
  // به‌روزرسانی کارت تعداد کل چک‌ها
  const totalCard = document.querySelector('#checks .stat-card:nth-child(1) .stat-value');
  if (totalCard) totalCard.textContent = toPersianDigits(stats.total);
  
  // به‌روزرسانی کارت جمع مبالغ
  const amountCard = document.querySelector('#checks .stat-card:nth-child(2) .stat-value');
  if (amountCard) amountCard.textContent = toPersianDigits(stats.totalAmount.toLocaleString()) + ' تومان';
  
  // به‌روزرسانی کارت در جریان
  const inProgressCard = document.querySelector('#checks .stat-card:nth-child(3) .stat-value');
  const inProgressLabel = document.querySelector('#checks .stat-card:nth-child(3) .stat-label');
  if (inProgressCard) inProgressCard.textContent = toPersianDigits(stats.inProgress);
  if (inProgressLabel) inProgressLabel.textContent = `در جریان (${toPersianDigits(stats.inProgressAmount.toLocaleString())} تومان)`;
  
  // به‌روزرسانی کارت وصول شده
  const collectedCard = document.querySelector('#checks .stat-card:nth-child(4) .stat-value');
  const collectedLabel = document.querySelector('#checks .stat-card:nth-child(4) .stat-label');
  if (collectedCard) collectedCard.textContent = toPersianDigits(stats.collected);
  if (collectedLabel) collectedLabel.textContent = `وصول شده (${toPersianDigits(stats.collectedAmount.toLocaleString())} تومان)`;
  
  console.log('Stats from HTML:', stats);
}

// تابع بررسی و اضافه کردن داده‌های نمونه چک‌ها
function initializeSampleChecksData() {
  if (checks.length === 0) {
    console.log('Adding sample checks data...');
    
    // اضافه کردن داده‌های نمونه چک‌ها
    const sampleChecks = [
      {
        id: 1,
        saleId: 1,
        buyerId: 1,
        sayadi: '1234567890123456',
        series: 'A123',
        bank: 'بانک ملی',
        branch: 'شعبه مرکزی',
        issuer: 'بانک ملی',
        to: 'شرکت پیانو حساب',
        national: '1234567890',
        amount: 50000000,
        dueDate: '1402/05/20',
        status: 'در جریان'
      },
      {
        id: 2,
        saleId: 1,
        buyerId: 1,
        sayadi: '9876543210987654',
        series: 'B456',
        bank: 'بانک ملت',
        branch: 'شعبه تهران',
        issuer: 'بانک ملت',
        to: 'شرکت پیانو حساب',
        national: '1234567890',
        amount: 30000000,
        dueDate: '1402/05/22',
        status: 'در جریان'
      },
      {
        id: 3,
        saleId: 1,
        buyerId: 1,
        sayadi: '1112223334445556',
        series: 'C789',
        bank: 'بانک سپه',
        branch: 'شعبه اصفهان',
        issuer: 'بانک سپه',
        to: 'شرکت پیانو حساب',
        national: '1234567890',
        amount: 45000000,
        dueDate: '1402/04/15',
        status: 'وصول شده'
      }
    ];
    
    checks.push(...sampleChecks);
    saveAllData();
    console.log('Sample checks data added:', checks);
  }
}

// تابع محاسبه آمار چک‌ها از آرایه checks
function calculateChecksStatsFromArray() {
  const totalChecks = checks.length;
  const totalAmount = checks.reduce((sum, check) => sum + (check.amount || 0), 0);
  const inProgressChecks = checks.filter(check => check.status === 'در جریان');
  const inProgressAmount = inProgressChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
  const collectedChecks = checks.filter(check => check.status === 'وصول شده');
  const collectedAmount = collectedChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
  const returnedChecks = checks.filter(check => check.status === 'برگشتی');
  const returnedAmount = returnedChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
  
  return {
    total: totalChecks,
    totalAmount: totalAmount,
    inProgress: inProgressChecks.length,
    inProgressAmount: inProgressAmount,
    collected: collectedChecks.length,
    collectedAmount: collectedAmount,
    returned: returnedChecks.length,
    returnedAmount: returnedAmount
  };
}

// تابع به‌روزرسانی کارت‌های آماری از آرایه checks
function updateChecksStatsCardsFromArray() {
  const stats = calculateChecksStatsFromArray();
  
  // به‌روزرسانی کارت تعداد کل چک‌ها
  const totalCard = document.querySelector('#checks .stat-card:nth-child(1) .stat-value');
  if (totalCard) totalCard.textContent = toPersianDigits(stats.total);
  
  // به‌روزرسانی کارت جمع مبالغ
  const amountCard = document.querySelector('#checks .stat-card:nth-child(2) .stat-value');
  if (amountCard) amountCard.textContent = toPersianDigits(stats.totalAmount.toLocaleString()) + ' تومان';
  
  // به‌روزرسانی کارت در جریان
  const inProgressCard = document.querySelector('#checks .stat-card:nth-child(3) .stat-value');
  const inProgressLabel = document.querySelector('#checks .stat-card:nth-child(3) .stat-label');
  if (inProgressCard) inProgressCard.textContent = toPersianDigits(stats.inProgress);
  if (inProgressLabel) inProgressLabel.textContent = `در جریان (${toPersianDigits(stats.inProgressAmount.toLocaleString())} تومان)`;
  
  // به‌روزرسانی کارت وصول شده
  const collectedCard = document.querySelector('#checks .stat-card:nth-child(4) .stat-value');
  const collectedLabel = document.querySelector('#checks .stat-card:nth-child(4) .stat-label');
  if (collectedCard) collectedCard.textContent = toPersianDigits(stats.collected);
  if (collectedLabel) collectedLabel.textContent = `وصول شده (${toPersianDigits(stats.collectedAmount.toLocaleString())} تومان)`;
  
  console.log('Stats from Array:', stats);
}

// رویدادهای فیلترهای پیشرفته
function setupAdvancedFilters(prefix) {
  const expandBtn = document.getElementById('expand-filters-btn-' + prefix);
  const advancedFilters = document.getElementById('advanced-filters-' + prefix);
  if (expandBtn && advancedFilters) {
    expandBtn.addEventListener('click', function() {
      const isOpen = advancedFilters.classList.contains('open');
      if (isOpen) {
        advancedFilters.classList.remove('open');
        expandBtn.classList.remove('expanded');
        expandBtn.querySelector('i').className = 'fas fa-filter';
        expandBtn.querySelector('span').textContent = 'فیلتر پیشرفته';
      } else {
        advancedFilters.classList.add('open');
        expandBtn.classList.add('expanded');
        expandBtn.querySelector('i').className = 'fas fa-times';
        expandBtn.querySelector('span').textContent = 'بستن فیلتر';
        if (window.jalaliDatepicker) {
          setTimeout(() => {
            jalaliDatepicker.startWatch({selector: '#' + advancedFilters.id + ' .jalali-date'});
          }, 100);
        }
      }
    });
    // شمارنده فیلتر فعال (برای هر بخش)
    function updateActiveFiltersCount() {
      let ids = [];
      if (prefix === 'checks') {
        ids = ['search-buyer','search-sayadi','search-amount','search-bank','search-date-from','search-date-to','search-status'];
      } else if (prefix === 'sales') {
        ids = ['sales-filter-buyer','sales-filter-product','sales-filter-date-from','sales-filter-date-to','sales-filter-amount','sales-filter-status'];
      }
      const active = ids.map(id => document.getElementById(id)?.value.trim()).filter(Boolean).length;
      let badge = expandBtn.querySelector('.filter-badge');
      if (active > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'filter-badge';
          badge.style.cssText = 'position:absolute;top:-8px;right:-8px;background:#e74c3c;color:white;border-radius:50%;width:20px;height:20px;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:bold;';
          expandBtn.appendChild(badge);
        }
        badge.textContent = active;
      } else if (badge) {
        badge.remove();
      }
    }
    let ids = [];
    if (prefix === 'checks') {
      ids = ['search-buyer','search-sayadi','search-amount','search-bank','search-date-from','search-date-to','search-status'];
    } else if (prefix === 'sales') {
      ids = ['sales-filter-buyer','sales-filter-product','sales-filter-date-from','sales-filter-date-to','sales-filter-amount','sales-filter-status'];
    }
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateActiveFiltersCount);
        el.addEventListener('change', updateActiveFiltersCount);
      }
    });
    updateActiveFiltersCount();
  }
}
// ... existing code ...
window.addEventListener('DOMContentLoaded', function() {
  // ... سایر کدها ...
  if (window.jalaliDatepicker) {
    jalaliDatepicker.startWatch({selector: '.jalali-date'});
  }
  setupAdvancedFilters('checks');
  setupAdvancedFilters('sales');
  // اتصال فیلترهای جدید تاریخ به جدول
  ['sales-filter-buyer','sales-filter-product','sales-filter-date-from','sales-filter-date-to','sales-filter-amount','sales-filter-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateSalesTable);
      el.addEventListener('change', updateSalesTable);
    }
  });
});
// ... existing code ...

// تابع به‌روزرسانی اطلاعات نتایج جستجو
function updateSearchResultsInfo() {
  const resultsCount = document.getElementById('results-count');
  
  // محاسبه چک‌های فیلتر شده
  const filteredChecks = filterChecks(checks.map((c, idx) => ({...c, _idx: idx})));
  const totalCount = filteredChecks.length;
  const totalAmount = filteredChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
  
  if (resultsCount) {
    resultsCount.textContent = toPersianDigits(totalCount);
  }
  
  // به‌روزرسانی مجموع مبالغ
  const totalAmountElement = document.querySelector('.search-results-info strong');
  if (totalAmountElement) {
    totalAmountElement.textContent = toPersianDigits(totalAmount.toLocaleString()) + ' تومان';
  }
}



// تابع نمایش اعلان
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  if (type === 'success') {
    notification.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
  } else if (type === 'error') {
    notification.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
  } else {
    notification.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // نمایش اعلان
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // حذف اعلان
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// تابع بهبود تجربه کاربری فیلترها
function enhanceFilterUX() {
  // اضافه کردن کلاس‌های وضعیت به فیلترها
  const filterInputs = document.querySelectorAll('.filter-group input, .filter-group select');
  
  filterInputs.forEach(input => {
    const filterGroup = input.closest('.filter-group');
    
    // بررسی وضعیت فیلتر
    function updateFilterState() {
      const hasValue = input.value.trim() !== '';
      const isFocused = document.activeElement === input;
      
      filterGroup.classList.remove('active', 'filled', 'empty');
      
      if (isFocused) {
        filterGroup.classList.add('active');
      } else if (hasValue) {
        filterGroup.classList.add('filled');
      } else {
        filterGroup.classList.add('empty');
      }
    }
    
    // رویدادهای تغییر وضعیت
    input.addEventListener('focus', updateFilterState);
    input.addEventListener('blur', updateFilterState);
    input.addEventListener('input', updateFilterState);
    input.addEventListener('change', updateFilterState);
    
    // تنظیم وضعیت اولیه
    updateFilterState();
  });
  
  // انیمیشن لودینگ برای دکمه جستجو
  const searchBtn = document.getElementById('search-checks-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      this.classList.add('loading');
      this.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-left: 8px;"></i>در حال جستجو...';
      
      // شبیه‌سازی زمان جستجو
      setTimeout(() => {
        this.classList.remove('loading');
        this.innerHTML = '<i class="fas fa-search" style="margin-left: 8px;"></i>جستجو';
      }, 1000);
    });
  }
  
  // جستجوی خودکار با تاخیر
  let searchTimeout;
  const searchInputs = document.querySelectorAll('#search-buyer, #search-sayadi, #search-amount, #search-bank, #search-status, #search-date-from, #search-date-to, #search-sort, #search-limit');
  
  searchInputs.forEach(input => {
    input.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        updateChecksTable();
        updateSearchResultsInfo();
      }, 500);
    });
  });
  
  // نمایش تعداد فیلترهای فعال
  function updateActiveFiltersCount() {
    const activeFilters = document.querySelectorAll('.filter-group.filled').length;
    const expandBtn = document.getElementById('expand-filters-btn');
    
    if (expandBtn && activeFilters > 0) {
      const badge = expandBtn.querySelector('.filter-badge') || document.createElement('span');
      badge.className = 'filter-badge';
      badge.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background: #e74c3c;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      `;
      badge.textContent = activeFilters;
      
      if (!expandBtn.querySelector('.filter-badge')) {
        expandBtn.style.position = 'relative';
        expandBtn.appendChild(badge);
      }
    } else if (expandBtn) {
      const badge = expandBtn.querySelector('.filter-badge');
      if (badge) badge.remove();
    }
  }
  
  // به‌روزرسانی تعداد فیلترهای فعال
  searchInputs.forEach(input => {
    input.addEventListener('input', updateActiveFiltersCount);
    input.addEventListener('change', updateActiveFiltersCount);
  });
  
  // تنظیم اولیه
  updateActiveFiltersCount();
}

// --- گزارش جامع چک‌ها ---
function showComprehensiveReportModal() {
  // آرایه ماه‌های فارسی
  const persianMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  // جمع‌آوری داده‌ها
  const checksArr = (typeof checks !== 'undefined') ? checks : [];
  const monthlyStats = Array.from({length: 12}, (_, i) => ({
    month: persianMonths[i],
    count: 0,
    total: 0
  }));
  checksArr.forEach(c => {
    if (!c.dueDate) return;
    const parts = c.dueDate.split('/');
    if (parts.length !== 3) return;
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      monthlyStats[monthIdx].count++;
      monthlyStats[monthIdx].total += parseInt(c.amount) || 0;
    }
  });
  // پر کردن جدول
  const tbody = document.getElementById('reportTableBody');
  tbody.innerHTML = '';
  monthlyStats.forEach(stat => {
    if (stat.count > 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${stat.month}</td><td>${stat.count}</td><td>${stat.total.toLocaleString('fa-IR')}</td>`;
      tbody.appendChild(tr);
    }
  });
  // نمایش مودال
  document.getElementById('comprehensiveReportModal').style.display = 'flex';
}
function hideComprehensiveReportModal() {
  document.getElementById('comprehensiveReportModal').style.display = 'none';
}
// رویداد دکمه‌ها
window.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('comprehensiveReportBtn');
  if (btn) btn.onclick = showComprehensiveReportModal;
  const closeBtn = document.getElementById('closeComprehensiveReportModal');
  if (closeBtn) closeBtn.onclick = hideComprehensiveReportModal;
  // بستن با کلیک روی پس‌زمینه مودال
  const overlay = document.getElementById('comprehensiveReportModal');
  if (overlay) overlay.addEventListener('click', function(e) {
    if (e.target === overlay) hideComprehensiveReportModal();
  });
});

// ... existing code ...
function showCustomAlert(message, type = 'info') {
  try {
    console.log(`Attempting to show alert: ${type} - ${message}`);
    
    // Remove any existing alert
    let oldAlert = document.querySelector('.custom-alert-internal');
    if (oldAlert && oldAlert.parentNode) {
      console.log('Removing old alert');
      oldAlert.remove();
    }

    // Check if document.body exists
    if (!document.body) {
      console.error('Document body not available');
      return;
    }

    // Create alert wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-alert-internal ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : 'info');

    // Choose icon based on type
    let icon = '';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'info') icon = 'ℹ️';

    // Create alert HTML
    wrapper.innerHTML = `
      ${icon ? `<span class="alert-icon">${icon}</span>` : ''}
      <span class="alert-message">${message}</span>
      <button class="alert-close" aria-label="بستن">×</button>
    `;
    
    console.log('Alert HTML created:', wrapper.outerHTML);
    
    // Add to body
    document.body.appendChild(wrapper);
    console.log('Alert added to body');

    // Force reflow to ensure proper positioning
    if (wrapper.offsetHeight) {
      wrapper.offsetHeight;
    }

    // Show with animation
    setTimeout(() => {
      if (wrapper && wrapper.parentNode) {
        wrapper.classList.add('show');
        console.log('Alert show class added');
      }
    }, 10);

    // Close on button click
    const closeBtn = wrapper.querySelector('.alert-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        console.log('Alert close button clicked');
        if (wrapper && wrapper.parentNode) {
          wrapper.classList.remove('show');
          setTimeout(() => { 
            if (wrapper && wrapper.parentNode) {
              wrapper.remove(); 
              console.log('Alert removed from DOM');
            }
          }, 400);
        }
      };
    }

    // Auto-dismiss after different times based on type
    const dismissTime = type === 'success' ? 5000 : type === 'error' ? 6000 : 4000;
    setTimeout(() => {
      if (wrapper && wrapper.parentNode && wrapper.classList.contains('show')) {
        console.log('Auto-dismissing alert');
        wrapper.classList.remove('show');
        setTimeout(() => { 
          if (wrapper && wrapper.parentNode) {
            wrapper.remove(); 
            console.log('Alert auto-removed from DOM');
          }
        }, 400);
      }
    }, dismissTime);

    // Log for debugging
    console.log(`Alert shown successfully: ${type} - ${message}`);
    
    // Additional check - verify the alert is visible
    setTimeout(() => {
      const visibleAlert = document.querySelector('.custom-alert-internal.show');
      if (visibleAlert) {
        console.log('Alert is visible in DOM');
        console.log('Alert computed styles:', {
          opacity: getComputedStyle(visibleAlert).opacity,
          display: getComputedStyle(visibleAlert).display,
          visibility: getComputedStyle(visibleAlert).visibility,
          zIndex: getComputedStyle(visibleAlert).zIndex
        });
      } else {
        console.warn('Alert not found in DOM after show');
      }
    }, 100);
    
  } catch (error) {
    console.error('Error showing custom alert:', error);
    // Fallback to simple alert if custom alert fails
    alert(message);
  }
}
// ... existing code ...
// Example usage (replace with real transaction events):
// showCustomAlert('تراکنش جدید با موفقیت ثبت شد!', 'success');
// showCustomAlert('تراکنش بروزرسانی شد.', 'info');
// showCustomAlert('خطا در ثبت تراکنش!', 'error');

// ... existing code ...
function updateCheckCountField() {
  const count = document.querySelectorAll('.check-item').length;
  const checkCountInput = document.getElementById('check-count');
  if (checkCountInput) checkCountInput.value = count;
}
// ... existing code ...
// Patch in updateCheckItems (after adding all check items and after remove)
const originalUpdateCheckItems = updateCheckItems;
updateCheckItems = function() {
  originalUpdateCheckItems.apply(this, arguments);
  updateCheckCountField();
  // Patch remove-check-btns to update count after remove
  document.querySelectorAll('.remove-check-btn').forEach(btn => {
    btn.onclick = function() {
      this.closest('.check-item').remove();
      updateCheckCountField();
    };
  });
};
// Patch add-check-btn to update count after add
const addCheckBtn = document.getElementById('add-check-btn');
if (addCheckBtn) {
  const originalAddCheckHandler = addCheckBtn.onclick;
  addCheckBtn.onclick = function(e) {
    if (originalAddCheckHandler) originalAddCheckHandler.call(this, e);
    updateCheckCountField();
  };
}

// ... existing code ...
function showTransactionQuickView(idx) {
  const sale = sales[idx];
  if (!sale) return;
  const buyer = buyers.find(b => b.id === sale.buyerId) || {};
  // ساخت خلاصه سفارش
  let html = '';
  html += `<h3><i class='fas fa-receipt'></i> خلاصه سفارش</h3>`;
  if (buyer.name) html += `<div class='receipt-row'><span class='receipt-label'>مشتری:</span><span class='receipt-value'>${buyer.name}</span></div>`;
  if (sale.product) html += `<div class='receipt-row'><span class='receipt-label'>کالا:</span><span class='receipt-value'>${sale.product}</span></div>`;
  if (sale.date) html += `<div class='receipt-row'><span class='receipt-label'>تاریخ:</span><span class='receipt-value'>${toPersianDigits(sale.date)}</span></div>`;
  if (sale.price) html += `<div class='receipt-row'><span class='receipt-label'>مبلغ فروش:</span><span class='receipt-value'>${toPersianDigits(sale.price.toLocaleString())} تومان</span></div>`;
  if (sale.grossProfit !== undefined) html += `<div class='receipt-row'><span class='receipt-label'>سود ناخالص:</span><span class='receipt-value'>${toPersianDigits(sale.grossProfit.toLocaleString())} تومان</span></div>`;
  if (sale.colorCost !== undefined || sale.regulationCost !== undefined || sale.transportCost !== undefined) html += `<div class='receipt-row'><span class='receipt-label'>هزینه‌ها:</span><span class='receipt-value'>رنگ: ${toPersianDigits((sale.colorCost||0).toLocaleString())} | رگلاژ: ${toPersianDigits((sale.regulationCost||0).toLocaleString())} | حمل: ${toPersianDigits((sale.transportCost||0).toLocaleString())}</span></div>`;
  if (sale.teacherCommission !== undefined) html += `<div class='receipt-row'><span class='receipt-label'>پورسانت معلم:</span><span class='receipt-value'>${toPersianDigits((sale.teacherCommission||0).toLocaleString())} تومان</span></div>`;
  if (sale.sellerCommission !== undefined) html += `<div class='receipt-row'><span class='receipt-label'>پورسانت فروشنده:</span><span class='receipt-value'>${toPersianDigits((sale.sellerCommission||0).toLocaleString())} تومان</span></div>`;
  if (sale.netProfit !== undefined) html += `<div class='receipt-row'><span class='receipt-label'>سود خالص:</span><span class='receipt-value'>${toPersianDigits((sale.netProfit||0).toLocaleString())} تومان</span></div>`;
  if (sale.paymentMethod) html += `<div class='receipt-row'><span class='receipt-label'>روش پرداخت:</span><span class='receipt-value'>${sale.paymentMethod === 'cash' ? 'نقدی' : 'اقساط'}</span></div>`;
  if (sale.advancePayment !== undefined) html += `<div class='receipt-row'><span class='receipt-label'>پیش‌پرداخت:</span><span class='receipt-value'>${toPersianDigits((sale.advancePayment||0).toLocaleString())} تومان</span></div>`;
  if (sale.paymentMethod !== 'cash' && sale.price && sale.advancePayment !== undefined) {
    const remain = sale.price - (sale.advancePayment||0);
    html += `<div class='receipt-row'><span class='receipt-label'>مبلغ قابل پرداخت با چک/اقساط:</span><span class='receipt-value'>${toPersianDigits(remain.toLocaleString())} تومان</span></div>`;
  }
  html += `<div class='receipt-total'>${toPersianDigits((sale.price||0).toLocaleString())} تومان</div>`;
  html += `<div class='receipt-footer'>این رسید غیررسمی است و صرفاً جهت مشاهده خلاصه سفارش می‌باشد.</div>`;
  document.getElementById('transaction-quickview-content').innerHTML = html;
  const modal = document.getElementById('transaction-quickview-modal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);
  // بستن با کلیک روی بک‌دراپ
  modal.onclick = function(e) {
    if (e.target === modal) hideTransactionQuickView();
  };
  // بستن با دکمه ضربدر
  const closeBtn = modal.querySelector('.quickview-close');
  if (closeBtn) closeBtn.onclick = hideTransactionQuickView;
}
function hideTransactionQuickView() {
  const modal = document.getElementById('transaction-quickview-modal');
  modal.classList.remove('show');
  setTimeout(() => { modal.style.display = 'none'; }, 450);
}

// ... existing code ...

// ... موجود ...
window.addEventListener('DOMContentLoaded', function() {
  // ... موجود ...
  // منوی همبرگری موبایل
  const sidebar = document.getElementById('sidebar');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileBackdrop = document.getElementById('mobile-sidebar-backdrop');
  if (mobileToggle && sidebar && mobileBackdrop) {
    mobileToggle.onclick = function(e) {
      e.stopPropagation();
      sidebar.classList.toggle('open');
      mobileBackdrop.classList.toggle('active', sidebar.classList.contains('open'));
    };
    mobileBackdrop.onclick = function() {
      sidebar.classList.remove('open');
      mobileBackdrop.classList.remove('active');
    };
    // بستن منو با لمس لینک یا دکمه خروج
    sidebar.querySelectorAll('a, .logout-btn').forEach(el => {
      el.addEventListener('click', function() {
        sidebar.classList.remove('open');
        mobileBackdrop.classList.remove('active');
      });
    });
  }
  // ... موجود ...
});
// ... موجود ...

// تابع تست برای بررسی عملکرد alert
function testAlert() {
  console.log('Testing alert function...');
  console.log('Document body exists:', !!document.body);
  console.log('Current z-index of alerts:', getComputedStyle(document.querySelector('.custom-alert-internal') || document.body).zIndex);
  
  // تست alert ساده
  showCustomAlert('تست مودال موفقیت!', 'success');
  
  // تست alert خطا
  setTimeout(() => {
    showCustomAlert('تست مودال خطا!', 'error');
  }, 2000);
  
  // تست alert اطلاعات
  setTimeout(() => {
    showCustomAlert('تست مودال اطلاعات!', 'info');
  }, 4000);
}

// تابع تست برای بررسی alert ثبت تراکنش
function testTransactionAlert() {
  console.log('Testing transaction alert...');
  showCustomAlert('تراکنش جدید با موفقیت ثبت شد!', 'success');
}

// اضافه کردن تابع‌های تست به window برای دسترسی از console
window.testAlert = testAlert;
window.testTransactionAlert = testTransactionAlert;
window.testSaveTransaction = testSaveTransaction;



// تابع تست برای بررسی تابع saveTransaction
function testSaveTransaction() {
  console.log('=== Testing saveTransaction function ===');
  
  // پر کردن فرم با داده‌های تست
  document.getElementById('customer-name').value = 'تست مشتری';
  document.getElementById('customer-phone').value = '09123456789';
  document.getElementById('customer-address').value = 'آدرس تست';
  document.getElementById('product-name').value = 'yamaha-u1';
  document.getElementById('sale-price').value = '1000000';
  document.getElementById('purchase-price').value = '800000';
  
  // تنظیم تاریخ به صورت صحیح
  const transactionDateField = document.getElementById('transaction-date');
  transactionDateField.value = '1402/01/01';
  transactionDateField.setAttribute('data-jdp', '1402/01/01');
  
  console.log('Form filled with test data');
  console.log('Customer name:', document.getElementById('customer-name').value);
  console.log('Product name:', document.getElementById('product-name').value);
  console.log('Sale price:', document.getElementById('sale-price').value);
  console.log('Transaction date:', document.getElementById('transaction-date').value);
  console.log('Transaction date data-jdp:', document.getElementById('transaction-date').getAttribute('data-jdp'));
  
  // بررسی validation قبل از فراخوانی
  const customerName = document.getElementById('customer-name').value.trim();
  const productName = document.getElementById('product-name').value;
  const salePriceRaw = document.getElementById('sale-price').value;
  const salePrice = parseNumberWithDots(faToEnWithDots(salePriceRaw));
  const saleDate = getJalaliDateValue(document.getElementById('transaction-date'));
  
  console.log('Validation check:');
  console.log('- customerName:', customerName, '| valid:', !!customerName);
  console.log('- productName:', productName, '| valid:', !!(productName && productName !== ''));
  console.log('- salePrice:', salePrice, '| valid:', !!(salePrice && salePrice !== 0));
  console.log('- saleDate:', saleDate, '| valid:', !!saleDate);
  
  // فراخوانی تابع saveTransaction
  saveTransaction();
}

// تابع نمایش دکمه گزارش جامع
function showComprehensiveReportButton() {
  const reportBtn = document.getElementById('comprehensiveReportBtn');
  if (reportBtn) {
    reportBtn.style.display = 'flex';
    console.log('دکمه گزارش جامع نمایش داده شد');
  } else {
    console.log('دکمه گزارش جامع پیدا نشد');
  }
}

// تابع مخفی کردن دکمه گزارش جامع
function hideComprehensiveReportButton() {
  const reportBtn = document.getElementById('comprehensiveReportBtn');
  if (reportBtn) {
    reportBtn.style.display = 'none';
    console.log('دکمه گزارش جامع مخفی شد');
  }
}
// تابع ایجاد status badge برای چک‌های ورودی
function getIncomingCheckStatusBadge(status) {
  const statusConfig = {
    'در جریان': { 
      background: '#fff3e0', 
      color: '#f39c12', 
      border: '#f39c12',
      hoverBg: '#ffe0b2',
      icon: 'clock',
      text: 'در جریان'
    },
    'وصول شده': { 
      background: '#e8f5e9', 
      color: '#2ecc71', 
      border: '#2ecc71',
      hoverBg: '#c8e6c9',
      icon: 'check-circle',
      text: 'وصول شده'
    },
    'برگشتی': { 
      background: '#ffebee', 
      color: '#e74c3c', 
      border: '#e74c3c',
      hoverBg: '#ffcdd2',
      icon: 'times-circle',
      text: 'برگشتی'
    }
  };

  const config = statusConfig[status] || statusConfig['در جریان'];
  return `<span style="background: ${config.background}; color: ${config.color}; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; transition: all 0.3s ease; cursor: pointer; min-width: 90px; justify-content: center; white-space: nowrap;" onmouseover="this.style.background='${config.hoverBg}'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='${config.background}'; this.style.transform='scale(1)'">
    <i class="fas fa-${config.icon}" style="font-size: 10px;"></i>
    ${config.text}
  </span>`;
}

// ... existing code ...
window.addEventListener('DOMContentLoaded', function() {
  // ... سایر کدها ...
  const filterToggle = document.getElementById('sales-filter-toggle');
  const advFilters = document.getElementById('sales-advanced-filters');
  if (filterToggle && advFilters) {
    filterToggle.onclick = function() {
      advFilters.style.display = advFilters.style.display === 'none' ? 'block' : 'none';
    };
  }
  // اتصال فیلترها به جدول
  ['sales-filter-buyer', 'sales-filter-product', 'sales-filter-date-from', 'sales-filter-date-to', 'sales-filter-amount', 'sales-filter-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateSalesTable);
      el.addEventListener('change', updateSalesTable);
    }
  });
  const filterBtn = document.getElementById('sales-filter-btn');
  if (filterBtn) filterBtn.onclick = updateSalesTable;
});
// ... existing code ...

// ... existing code ...
window.addEventListener('DOMContentLoaded', function() {
  // ... سایر کدها ...
  // فعال‌سازی دیتاپیکر جلالی برای همه فیلدهای تاریخ فیلتر
  if (window.jalaliDatepicker) {
    jalaliDatepicker.startWatch({selector: '.jalali-date'});
  }
  // راه‌اندازی فیلتر پیشرفته برای تراکنش‌ها و چک‌ها
  if (typeof setupAdvancedFilters === 'function') {
    setupAdvancedFilters();
  }
});
// ... existing code ...