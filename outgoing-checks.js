// مدیریت چک‌های خروجی
class OutgoingChecksManager {
    constructor() {
        this.currentCheckId = null;
        this.init();
    }

    init() {
        this.loadOutgoingChecks();
        this.loadStats();
        this.setupEventListeners();
        this.initChart();
    }

    setupEventListeners() {
        // دکمه‌های فیلترهای پیشرفته
        document.addEventListener('click', (e) => {
            if (e.target.matches('#expand-outgoing-filters-btn')) {
                this.toggleAdvancedFilters();
            }
            if (e.target.matches('#reset-outgoing-checks-btn')) {
                this.resetFilters();
            }
        });

        // دکمه‌های عملیات در جدول
        document.addEventListener('click', (e) => {
            if (e.target.closest('.outgoing-check-action-btn')) {
                const btn = e.target.closest('.outgoing-check-action-btn');
                const action = btn.dataset.action;
                const checkId = btn.dataset.id;

                switch (action) {
                    case 'edit':
                        this.editOutgoingCheck(checkId);
                        break;
                    case 'delete':
                        this.deleteOutgoingCheck(checkId);
                        break;
                    case 'mark-paid':
                        this.markOutgoingCheckAsPaid(checkId);
                        break;
                    case 'mark-cancelled':
                        this.markOutgoingCheckAsCancelled(checkId);
                        break;
                    case 'mark-pending':
                        this.markOutgoingCheckAsPending(checkId);
                        break;
                }
            }
        });

        // فرمت کردن اعداد در فرم
        this.setupNumberFormatting();
    }

    setupNumberFormatting() {
        // فرمت کردن مبلغ
        const amountInput = document.getElementById('outgoing-amount');
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                // حذف همه کاراکترهای غیر عددی (شامل کاما و فاصله)
                let value = e.target.value.replace(/[^\d]/g, '');
                if (value) {
                    // استفاده از اعداد انگلیسی برای محاسبه
                    const numericValue = parseInt(value);
                    // فرمت کردن با اعداد انگلیسی
                    value = numericValue.toLocaleString('en-US');
                    e.target.value = value;
                } else {
                    e.target.value = '';
                }
            });
        }

        // فرمت کردن شماره صیادی (16 رقم)
        const sayadiInput = document.getElementById('outgoing-sayadi');
        if (sayadiInput) {
            sayadiInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^\d]/g, '');
                if (value.length > 16) {
                    value = value.substring(0, 16);
                }
                e.target.value = value;
            });
        }

        // فرمت کردن سری چک (6 رقم)
        const seriesInput = document.getElementById('outgoing-series');
        if (seriesInput) {
            seriesInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^\d]/g, '');
                if (value.length > 6) {
                    value = value.substring(0, 6);
                }
                e.target.value = value;
            });
        }

        // فرمت کردن کد ملی (10 رقم)
        const nationalInput = document.getElementById('outgoing-national');
        if (nationalInput) {
            nationalInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^\d]/g, '');
                if (value.length > 10) {
                    value = value.substring(0, 10);
                }
                e.target.value = value;
            });
        }
    }

    async loadOutgoingChecks() {
        try {
            // خواندن مستقیم از localStorage بدون cache
            const allChecks = JSON.parse(localStorage.getItem('outgoing_checks') || '[]');
            const checks = allChecks.slice(0, 50); // فقط 50 مورد اول
            this.renderOutgoingChecksTable(checks);
        } catch (error) {
            console.error('Error loading outgoing checks:', error);
        }
    }

    async loadStats() {
        try {
            // خواندن مستقیم از localStorage بدون cache
            const allChecks = JSON.parse(localStorage.getItem('outgoing_checks') || '[]');
            
            const totalCount = allChecks.length;
            const totalAmount = allChecks.reduce((sum, check) => sum + parseFloat(check.amount || 0), 0);
            
            const pendingChecks = allChecks.filter(check => check.status === 'در جریان');
            const pendingCount = pendingChecks.length;
            const pendingAmount = pendingChecks.reduce((sum, check) => sum + parseFloat(check.amount || 0), 0);
            
            const paidChecks = allChecks.filter(check => check.status === 'پرداخت شده');
            const paidCount = paidChecks.length;
            const paidAmount = paidChecks.reduce((sum, check) => sum + parseFloat(check.amount || 0), 0);

            const stats = {
                totalCount: totalCount,
                totalAmount: totalAmount,
                pendingCount: pendingCount,
                pendingAmount: pendingAmount,
                paidCount: paidCount,
                paidAmount: paidAmount
            };
            
            this.updateStatsDisplay(stats);
            this.renderChart(stats);
        } catch (error) {
            console.error('Error loading outgoing check stats:', error);
        }
    }

    refreshUI() {
        // فوراً UI را بروزرسانی کن
        this.loadOutgoingChecks();
        this.loadStats();
    }

    updateStatsDisplay(stats) {
        const elements = {
            totalCount: document.getElementById('outgoing-total-count'),
            totalAmount: document.getElementById('outgoing-total-amount'),
            pendingCount: document.getElementById('outgoing-pending-count'),
            paidCount: document.getElementById('outgoing-paid-count')
        };

        if (elements.totalCount) {
            elements.totalCount.textContent = this.convertToPersianNumbers(stats.totalCount);
        }
        if (elements.totalAmount) {
            elements.totalAmount.textContent = this.formatCurrency(stats.totalAmount);
        }
        if (elements.pendingCount) {
            elements.pendingCount.textContent = this.convertToPersianNumbers(stats.pendingCount);
        }
        if (elements.paidCount) {
            elements.paidCount.textContent = this.convertToPersianNumbers(stats.paidCount);
        }
    }

    renderOutgoingChecksTable(checks) {
        const tbody = document.getElementById('outgoing-checks-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (checks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 16px; display: block; color: #ddd;"></i>
                        <div>هیچ چک خروجی‌ای یافت نشد</div>
                    </td>
                </tr>
            `;
            return;
        }

        // گروه‌بندی چک‌ها بر اساس نام ذینفع
        const groupedChecks = this.groupChecksByPayee(checks);
        
        // نمایش چک‌ها به صورت گروه‌بندی شده
        Object.keys(groupedChecks).forEach(payeeName => {
            const payeeChecks = groupedChecks[payeeName];
            
            // اضافه کردن ردیف گروه
            const groupRow = document.createElement('tr');
            groupRow.className = 'payee-group-header';
            groupRow.setAttribute('data-payee', payeeName);
            groupRow.innerHTML = `
                <td colspan="8" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-left: 4px solid #e74c3c; padding: 12px 16px; font-weight: 600; color: #2c3e50; cursor: pointer;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-chevron-down group-toggle-icon" style="color: #e74c3c; font-size: 14px; transition: transform 0.3s ease;"></i>
                            <i class="fas fa-user" style="color: #e74c3c; font-size: 16px;"></i>
                            <span>${payeeName}</span>
                            <span style="background: #e74c3c; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                                ${this.convertToPersianNumbers(payeeChecks.length)} چک
                            </span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #6c757d;">
                            <span>مجموع: <span style="direction: ltr; font-family: 'Courier New', monospace;">${this.formatCurrency(this.calculateTotalAmount(payeeChecks))}</span></span>
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(groupRow);
            
            // اضافه کردن event listener برای جمع/باز کردن گروه
            groupRow.addEventListener('click', () => {
                this.togglePayeeGroup(payeeName);
            });
            
            // اضافه کردن چک‌های هر گروه
            payeeChecks.forEach((check, index) => {
                const row = document.createElement('tr');
                row.className = 'payee-check-row';
                row.style.backgroundColor = index % 2 === 0 ? '#fafbfc' : '#ffffff';
                row.innerHTML = `
                    <td style="padding-left: 32px; border-left: 2px solid #e9ecef;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #6c757d; font-size: 12px;">#${this.convertToPersianNumbers(index + 1)}</span>
                            <span style="direction: ltr; font-family: 'Courier New', monospace;">${check.sayadi_number || '-'}</span>
                        </div>
                    </td>
                    <td style="padding-left: 16px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #6c757d; font-size: 12px;">کد ملی:</span>
                            <span style="direction: ltr; font-family: 'Courier New', monospace;">${check.national_code || '-'}</span>
                        </div>
                    </td>
                    <td>
                        <div style="font-weight: 600; color: #2c3e50; text-align: right; direction: rtl; font-family: 'Courier New', monospace;">${this.formatCurrency(check.amount)}</div>
                    </td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            <span style="font-weight: 500;">${this.formatDate(check.due_date)}</span>
                            <span style="font-size: 12px; color: #6c757d; direction: ltr; font-family: 'Courier New', monospace;">${check.series_number || '-'}</span>
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            <span style="font-weight: 500;">${check.bank_name || '-'}</span>
                            <span style="font-size: 12px; color: #6c757d;">${check.branch_name || '-'}</span>
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            <span style="font-weight: 500;">${check.reason || '-'}</span>
                            <span style="font-size: 12px; color: #6c757d;">${check.description || '-'}</span>
                        </div>
                    </td>
                    <td>${this.getStatusBadge(check.status)}</td>
                    <td>
                        ${this.getActionButtons(check)}
                    </td>
                `;
                tbody.appendChild(row);
            });
        });
    }

    groupChecksByPayee(checks) {
        const grouped = {};
        
        checks.forEach(check => {
            const payeeName = check.payee_name || 'نامشخص';
            if (!grouped[payeeName]) {
                grouped[payeeName] = [];
            }
            grouped[payeeName].push(check);
        });
        
        // مرتب‌سازی گروه‌ها بر اساس تعداد چک (نزولی)
        const sortedGroups = {};
        Object.keys(grouped)
            .sort((a, b) => grouped[b].length - grouped[a].length)
            .forEach(key => {
                sortedGroups[key] = grouped[key];
            });
        
        return sortedGroups;
    }

    calculateTotalAmount(checks) {
        return checks.reduce((total, check) => total + parseFloat(check.amount || 0), 0);
    }

    togglePayeeGroup(payeeName) {
        const tbody = document.getElementById('outgoing-checks-tbody');
        if (!tbody) return;

        const groupHeader = tbody.querySelector(`[data-payee="${payeeName}"]`);
        if (!groupHeader) return;

        const toggleIcon = groupHeader.querySelector('.group-toggle-icon');
        const isCollapsed = groupHeader.classList.contains('collapsed');

        // تغییر آیکون
        if (isCollapsed) {
            toggleIcon.className = 'fas fa-chevron-down group-toggle-icon';
            groupHeader.classList.remove('collapsed');
        } else {
            toggleIcon.className = 'fas fa-chevron-right group-toggle-icon';
            groupHeader.classList.add('collapsed');
        }

        // جمع/باز کردن چک‌های گروه
        let nextRow = groupHeader.nextElementSibling;
        while (nextRow && nextRow.classList.contains('payee-check-row')) {
            if (isCollapsed) {
                nextRow.style.display = 'table-row';
                nextRow.style.opacity = '1';
            } else {
                nextRow.style.display = 'none';
                nextRow.style.opacity = '0';
            }
            nextRow = nextRow.nextElementSibling;
        }
    }

    getStatusBadge(status) {
        const statusConfig = {
            'در جریان': { class: 'warning', icon: 'clock' },
            'پرداخت شده': { class: 'success', icon: 'check-circle' },
            'باطل شده': { class: 'danger', icon: 'times-circle' }
        };

        const config = statusConfig[status] || statusConfig['در جریان'];
        return `<span class="status-badge ${config.class}">
            <i class="fas fa-${config.icon}"></i>
            ${status}
        </span>`;
    }

    getActionButtons(check) {
        let buttons = '';

        // دکمه‌های تغییر وضعیت برای همه چک‌ها
        if (check.status === 'در جریان') {
            buttons += `
                <button class="small-btn success outgoing-check-action-btn" 
                        data-action="mark-paid" data-id="${check.id}" 
                        title="علامت‌گذاری به عنوان پرداخت شده">
                    <i class="fas fa-check"></i>
                </button>
                <button class="small-btn danger outgoing-check-action-btn" 
                        data-action="mark-cancelled" data-id="${check.id}" 
                        title="علامت‌گذاری به عنوان باطل شده">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else if (check.status === 'پرداخت شده') {
            buttons += `
                <button class="small-btn warning outgoing-check-action-btn" 
                        data-action="mark-pending" data-id="${check.id}" 
                        title="بازگشت به وضعیت در جریان">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="small-btn danger outgoing-check-action-btn" 
                        data-action="mark-cancelled" data-id="${check.id}" 
                        title="علامت‌گذاری به عنوان باطل شده">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else if (check.status === 'باطل شده') {
            buttons += `
                <button class="small-btn success outgoing-check-action-btn" 
                        data-action="mark-paid" data-id="${check.id}" 
                        title="علامت‌گذاری به عنوان پرداخت شده">
                    <i class="fas fa-check"></i>
                </button>
                <button class="small-btn warning outgoing-check-action-btn" 
                        data-action="mark-pending" data-id="${check.id}" 
                        title="بازگشت به وضعیت در جریان">
                    <i class="fas fa-undo"></i>
                </button>
            `;
        }

        buttons += `
            <button class="small-btn info outgoing-check-action-btn" 
                    data-action="edit" data-id="${check.id}" 
                    title="ویرایش">
                <i class="fas fa-edit"></i>
            </button>
            <button class="small-btn danger outgoing-check-action-btn" 
                    data-action="delete" data-id="${check.id}" 
                    title="حذف">
                <i class="fas fa-trash"></i>
            </button>
        `;

        return buttons;
    }

    async saveOutgoingCheck() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        try {
            if (this.currentCheckId) {
                console.log('Updating check with ID:', this.currentCheckId);
                console.log('Form data:', formData);
                // Update existing check
                await window.dbManager.updateOutgoingCheck(this.currentCheckId, formData);
                window.dbManager.showNotification('چک خروجی با موفقیت بروزرسانی شد', 'success');
            } else {
                console.log('Adding new check');
                console.log('Form data:', formData);
                // Add new check
                await window.dbManager.addOutgoingCheck(formData);
                window.dbManager.showNotification('چک خروجی با موفقیت ثبت شد', 'success');
            }

            // فوراً UI را بروزرسانی کن
            this.refreshUI();
            
            // نمایش دکمه چک بعدی برای چک‌های جدید
            if (!this.currentCheckId) {
                const nextCheckBtn = document.getElementById('next-check-btn');
                if (nextCheckBtn) {
                    nextCheckBtn.style.display = 'inline-block';
                }
                
                // پرسیدن از کاربر برای ثبت چک بعدی
                const shouldAddNext = confirm('آیا می‌خواهید چک دیگری برای همین شخص ثبت کنید؟\n\nاگر بله را انتخاب کنید، اطلاعات تکراری (بانک، شعبه، در وجه، کد ملی، دلیل) حفظ می‌شود و فقط فیلدهای متغیر پاک می‌شود.');
                
                if (shouldAddNext) {
                    this.clearOutgoingCheckFormForNext();
                } else {
                    this.clearOutgoingCheckForm();
                }
            } else {
                this.clearOutgoingCheckForm();
            }
        } catch (error) {
            console.error('خطا در ذخیره چک:', error);
            window.dbManager.showNotification('خطا در ذخیره چک', 'error');
        }
    }

    getFormData() {
        const amountInput = document.getElementById('outgoing-amount').value;
        // حذف کاما و فاصله از مبلغ انگلیسی
        const amount = parseFloat(amountInput.replace(/[^\d]/g, '')) || 0;
        
        const dueDateInput = document.getElementById('outgoing-date').value;
        
        // تبدیل تاریخ شمسی به میلادی اگر نیاز باشد
        let processedDate = dueDateInput;
        if (dueDateInput && dueDateInput.includes('/')) {
            // اگر تاریخ شمسی است، آن را به میلادی تبدیل کن
            try {
                const jalaliDate = new Date(dueDateInput);
                processedDate = jalaliDate.toISOString().split('T')[0];
            } catch (e) {
                processedDate = dueDateInput;
            }
        }
        
        const formData = {
            sayadiNumber: document.getElementById('outgoing-sayadi').value.replace(/\D/g, ''),
            seriesNumber: document.getElementById('outgoing-series').value.replace(/\D/g, ''),
            bankName: document.getElementById('outgoing-bank').value,
            branchName: document.getElementById('outgoing-branch').value,
            payeeName: document.getElementById('outgoing-payee').value,
            nationalCode: document.getElementById('outgoing-national').value.replace(/\D/g, ''),
            amount: amount,
            dueDate: processedDate,
            reason: document.getElementById('outgoing-reason').value,
            description: document.getElementById('outgoing-description').value
        };
        
        return formData;
    }

    convertPersianToEnglish(str) {
        if (!str) return '';
        
        const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        
        for (let i = 0; i < 10; i++) {
            str = str.replace(new RegExp(persianNumbers[i], 'g'), englishNumbers[i]);
        }
        return str;
    }

    convertToPersianNumbers(num) {
        if (num === null || num === undefined) return '';
        
        const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, (d) => persianNumbers[d]);
    }

    validateForm(data) {
        const requiredFields = ['sayadiNumber', 'bankName', 'payeeName', 'amount', 'dueDate'];
        
        for (const field of requiredFields) {
            if (!data[field] || data[field].toString().trim() === '') {
                const fieldName = this.getFieldDisplayName(field);
                window.dbManager.showNotification(`فیلد ${fieldName} الزامی است`, 'error');
                return false;
            }
        }

        // بررسی شماره صیادی (16 رقم)
        if (data.sayadiNumber && data.sayadiNumber.replace(/\D/g, '').length !== 16) {
            window.dbManager.showNotification('شماره صیادی باید 16 رقم باشد', 'error');
            return false;
        }

        // بررسی سری چک (6 رقم)
        if (data.seriesNumber && data.seriesNumber.replace(/\D/g, '').length !== 6) {
            window.dbManager.showNotification('شماره سری چک باید 6 رقم باشد', 'error');
            return false;
        }

        // بررسی کد ملی (10 رقم)
        if (data.nationalCode && data.nationalCode.replace(/\D/g, '').length !== 10) {
            window.dbManager.showNotification('کد ملی باید 10 رقم باشد', 'error');
            return false;
        }

        // بررسی مبلغ
        const amount = parseFloat(data.amount.toString().replace(/[^\d]/g, ''));
        if (isNaN(amount) || amount <= 0) {
            window.dbManager.showNotification('مبلغ باید عدد مثبت باشد', 'error');
            return false;
        }

        return true;
    }

    getFieldDisplayName(field) {
        const names = {
            sayadiNumber: 'شماره صیادی',
            bankName: 'بانک',
            payeeName: 'در وجه',
            amount: 'مبلغ',
            dueDate: 'تاریخ سررسید'
        };
        return names[field] || field;
    }

    clearOutgoingCheckForm() {
        // پاک کردن تمام فیلدهای فرم
        const formFields = [
            'outgoing-sayadi',
            'outgoing-series',
            'outgoing-bank',
            'outgoing-branch',
            'outgoing-payee',
            'outgoing-national',
            'outgoing-amount',
            'outgoing-date',
            'outgoing-reason',
            'outgoing-description'
        ];

        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });

        // ریست کردن select ها
        const bankSelect = document.getElementById('outgoing-bank');
        if (bankSelect) {
            bankSelect.selectedIndex = 0;
        }

        const reasonSelect = document.getElementById('outgoing-reason');
        if (reasonSelect) {
            reasonSelect.selectedIndex = 0;
        }

        this.currentCheckId = null;
        
        // تغییر عنوان فرم
        const formTitle = document.querySelector('.outgoing-check-form h3');
        if (formTitle) {
            formTitle.innerHTML = '<i class="fas fa-file-invoice-dollar" style="color: #e74c3c;"></i> ثبت چک خروجی جدید';
        }
        
        // بازگرداندن متن دکمه ذخیره
        const saveButton = document.querySelector('button[onclick="saveOutgoingCheck()"]');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save"></i> ذخیره چک';
        }

        // مخفی کردن دکمه چک بعدی
        const nextCheckBtn = document.getElementById('next-check-btn');
        if (nextCheckBtn) {
            nextCheckBtn.style.display = 'none';
        }
    }

    clearOutgoingCheckFormForNext() {
        // پاک کردن فقط فیلدهای متغیر (حفظ اطلاعات تکراری)
        const variableFields = [
            'outgoing-sayadi',
            'outgoing-series',
            'outgoing-amount',
            'outgoing-date',
            'outgoing-description'
        ];

        variableFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });

        this.currentCheckId = null;
        
        // تغییر عنوان فرم
        const formTitle = document.querySelector('.outgoing-check-form h3');
        if (formTitle) {
            formTitle.innerHTML = '<i class="fas fa-file-invoice-dollar" style="color: #e74c3c;"></i> ثبت چک خروجی بعدی';
        }
        
        // بازگرداندن متن دکمه ذخیره
        const saveButton = document.querySelector('button[onclick="saveOutgoingCheck()"]');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save"></i> ذخیره چک';
        }
    }

    prepareForNextCheck() {
        // پاک کردن فقط فیلدهای متغیر (حفظ اطلاعات تکراری)
        this.clearOutgoingCheckFormForNext();
        
        // نمایش دکمه چک بعدی
        const nextCheckBtn = document.getElementById('next-check-btn');
        if (nextCheckBtn) {
            nextCheckBtn.style.display = 'inline-block';
        }
        
        // اسکرول به بالای فرم
        const form = document.getElementById('outgoing-check-form');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    toggleOutgoingCheckForm() {
        const form = document.getElementById('outgoing-check-form');
        if (form) {
            const isVisible = form.style.display !== 'none';
            form.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                // اگر فرم باز شد، آن را به بالای صفحه اسکرول کن
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    toggleAdvancedFilters() {
        const advancedFilters = document.getElementById('advanced-outgoing-filters');
        const expandBtn = document.getElementById('expand-outgoing-filters-btn');
        
        if (advancedFilters && expandBtn) {
            const isExpanded = advancedFilters.style.display !== 'none';
            
            if (isExpanded) {
                advancedFilters.style.display = 'none';
                advancedFilters.style.maxHeight = '0';
                expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i> فیلترهای بیشتر';
                expandBtn.classList.remove('expanded');
            } else {
                advancedFilters.style.display = 'block';
                advancedFilters.style.maxHeight = '500px';
                expandBtn.innerHTML = '<i class="fas fa-chevron-up"></i> فیلترهای کمتر';
                expandBtn.classList.add('expanded');
            }
        }
    }

    resetFilters() {
        // پاک کردن تمام فیلترها
        const filterInputs = [
            'search-outgoing-payee',
            'search-outgoing-sayadi', 
            'search-outgoing-amount',
            'search-outgoing-status',
            'search-outgoing-date-from',
            'search-outgoing-date-to',
            'search-outgoing-bank',
            'search-outgoing-limit'
        ];

        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        // بستن فیلترهای پیشرفته
        const advancedFilters = document.getElementById('advanced-outgoing-filters');
        const expandBtn = document.getElementById('expand-outgoing-filters-btn');
        
        if (advancedFilters) {
            advancedFilters.style.display = 'none';
            advancedFilters.style.maxHeight = '0';
        }
        
        if (expandBtn) {
            expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i> فیلترهای بیشتر';
            expandBtn.classList.remove('expanded');
        }

        // بارگذاری مجدد داده‌ها
        this.loadOutgoingChecks();
    }

    async editOutgoingCheck(checkId) {
        try {
            // خواندن مستقیم از localStorage
            const allChecks = JSON.parse(localStorage.getItem('outgoing_checks') || '[]');
            const check = allChecks.find(c => c.id == checkId);
            
            if (!check) {
                window.dbManager.showNotification('چک مورد نظر یافت نشد', 'error');
                return;
            }

            this.populateForm(check);
            this.currentCheckId = parseInt(checkId);
            
            // نمایش فرم
            const form = document.getElementById('outgoing-check-form');
            if (form) {
                form.style.display = 'block';
            }
            
            // تغییر عنوان فرم
            const formTitle = document.querySelector('.outgoing-check-form h3');
            if (formTitle) {
                formTitle.innerHTML = '<i class="fas fa-edit" style="color: #e74c3c;"></i> ویرایش چک خروجی';
            }
            
            // تغییر متن دکمه ذخیره
            const saveButton = document.querySelector('button[onclick="saveOutgoingCheck()"]');
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-save"></i> بروزرسانی چک';
            }
        } catch (error) {
            console.error('Error editing outgoing check:', error);
        }
    }

    populateForm(check) {
        document.getElementById('outgoing-sayadi').value = check.sayadi_number || '';
        document.getElementById('outgoing-series').value = check.series_number || '';
        document.getElementById('outgoing-bank').value = check.bank_name || '';
        document.getElementById('outgoing-branch').value = check.branch_name || '';
        document.getElementById('outgoing-payee').value = check.payee_name || '';
        document.getElementById('outgoing-national').value = check.national_code || '';
        
        // فرمت کردن مبلغ با کاما
        const amount = parseFloat(check.amount) || 0;
        document.getElementById('outgoing-amount').value = amount.toLocaleString('en-US');
        
        document.getElementById('outgoing-date').value = check.due_date || '';
        document.getElementById('outgoing-reason').value = check.reason || '';
        document.getElementById('outgoing-description').value = check.description || '';
    }

    async deleteOutgoingCheck(checkId) {
        if (!confirm('آیا از حذف این چک اطمینان دارید؟')) {
            return;
        }

        try {
            await window.dbManager.deleteOutgoingCheck(parseInt(checkId));
            window.dbManager.showNotification('چک خروجی با موفقیت حذف شد', 'success');
            // فوراً UI را بروزرسانی کن
            this.refreshUI();
        } catch (error) {
            console.error('Error deleting outgoing check:', error);
            window.dbManager.showNotification('خطا در حذف چک', 'error');
        }
    }

    async markOutgoingCheckAsPaid(checkId) {
        try {
            await window.dbManager.updateOutgoingCheckStatus(parseInt(checkId), 'پرداخت شده');
            window.dbManager.showNotification('وضعیت چک به "پرداخت شده" تغییر یافت', 'success');
            // فوراً UI را بروزرسانی کن
            this.refreshUI();
        } catch (error) {
            console.error('Error marking check as paid:', error);
            window.dbManager.showNotification('خطا در تغییر وضعیت چک', 'error');
        }
    }

    async markOutgoingCheckAsCancelled(checkId) {
        try {
            await window.dbManager.updateOutgoingCheckStatus(parseInt(checkId), 'باطل شده');
            window.dbManager.showNotification('وضعیت چک به "باطل شده" تغییر یافت', 'success');
            // فوراً UI را بروزرسانی کن
            this.refreshUI();
        } catch (error) {
            console.error('Error marking check as cancelled:', error);
            window.dbManager.showNotification('خطا در تغییر وضعیت چک', 'error');
        }
    }

    async markOutgoingCheckAsPending(checkId) {
        try {
            await window.dbManager.updateOutgoingCheckStatus(parseInt(checkId), 'در جریان');
            window.dbManager.showNotification('وضعیت چک به "در جریان" تغییر یافت', 'success');
            // فوراً UI را بروزرسانی کن
            this.refreshUI();
        } catch (error) {
            console.error('Error marking check as pending:', error);
            window.dbManager.showNotification('خطا در تغییر وضعیت چک', 'error');
        }
    }

    async searchOutgoingChecks() {
        const filters = {
            payeeName: document.getElementById('search-outgoing-payee')?.value || '',
            sayadiNumber: document.getElementById('search-outgoing-sayadi')?.value || '',
            amount: document.getElementById('search-outgoing-amount')?.value || '',
            dateFrom: document.getElementById('search-outgoing-date-from')?.value || '',
            dateTo: document.getElementById('search-outgoing-date-to')?.value || '',
            status: document.getElementById('search-outgoing-status')?.value || '',
            bank: document.getElementById('search-outgoing-bank')?.value || '',
            limit: document.getElementById('search-outgoing-limit')?.value || 'all'
        };

        try {
            // Get all checks from localStorage
            const allChecks = JSON.parse(localStorage.getItem('outgoing_checks') || '[]');
            
            // Apply filters
            let filteredChecks = allChecks.filter(check => {
                // Filter by payee name
                if (filters.payeeName && !check.payee_name?.toLowerCase().includes(filters.payeeName.toLowerCase())) {
                    return false;
                }
                
                // Filter by sayadi number
                if (filters.sayadiNumber && !check.sayadi_number?.includes(filters.sayadiNumber)) {
                    return false;
                }
                
                // Filter by amount
                if (filters.amount && parseFloat(check.amount) !== parseFloat(filters.amount)) {
                    return false;
                }
                
                // Filter by date range
                if (filters.dateFrom && new Date(check.due_date) < new Date(filters.dateFrom)) {
                    return false;
                }
                if (filters.dateTo && new Date(check.due_date) > new Date(filters.dateTo)) {
                    return false;
                }
                
                // Filter by status
                if (filters.status && check.status !== filters.status) {
                    return false;
                }
                
                // Filter by bank
                if (filters.bank && check.bank_name !== filters.bank) {
                    return false;
                }
                
                return true;
            });

            // Apply limit
            if (filters.limit && filters.limit !== 'all') {
                filteredChecks = filteredChecks.slice(0, parseInt(filters.limit));
            }

            // Sort by created_at descending
            filteredChecks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            this.renderOutgoingChecksTable(filteredChecks);
            this.updateSearchResults(filteredChecks);
        } catch (error) {
            console.error('Error searching outgoing checks:', error);
            window.dbManager.showNotification('خطا در جستجو', 'error');
        }
    }

    updateSearchResults(checks) {
        const resultsCount = document.getElementById('outgoing-results-count');
        const resultsTotal = document.getElementById('outgoing-results-total');
        
        if (resultsCount) {
            resultsCount.textContent = this.convertToPersianNumbers(checks.length);
        }
        
        if (resultsTotal) {
            const totalAmount = checks.reduce((sum, check) => sum + parseFloat(check.amount || 0), 0);
            resultsTotal.textContent = this.formatCurrency(totalAmount);
        }
    }

    async initChart() {
        try {
            const stats = await window.dbManager.getOutgoingCheckStats();
            this.renderChart(stats);
        } catch (error) {
            console.error('Error initializing chart:', error);
        }
    }

    renderChart(stats) {
        const chartContainer = document.getElementById('outgoingChecksStatusChart');
        if (!chartContainer) {
            return;
        }

        const data = [
            {
                name: 'در جریان',
                value: stats.pendingCount || 0,
                color: '#f39c12',
                icon: 'clock',
                bgColor: '#fff3cd',
                borderColor: '#ffeaa7'
            },
            {
                name: 'پرداخت شده',
                value: stats.paidCount || 0,
                color: '#27ae60',
                icon: 'check-circle',
                bgColor: '#d4edda',
                borderColor: '#c3e6cb'
            },
            {
                name: 'باطل شده',
                value: Math.max(0, (stats.totalCount || 0) - (stats.pendingCount || 0) - (stats.paidCount || 0)),
                color: '#e74c3c',
                icon: 'times-circle',
                bgColor: '#f8d7da',
                borderColor: '#f5c6cb'
            }
        ].filter(item => item.value > 0);

        if (data.length === 0) {
            chartContainer.innerHTML = `
                <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e9ecef;">
                    <div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 12px; border: 2px dashed #dee2e6;">
                        <i class="fas fa-chart-pie" style="font-size: 4rem; margin-bottom: 16px; display: block; color: #adb5bd;"></i>
                        <div style="font-size: 16px; font-weight: 500;">داده‌ای برای نمایش نمودار وجود ندارد</div>
                        <div style="font-size: 14px; color: #6c757d; margin-top: 8px;">چک‌های خروجی خود را ثبت کنید</div>
                    </div>
                </div>
            `;
            return;
        }

        const total = data.reduce((sum, item) => sum + item.value, 0);
        const radius = 100;
        const centerX = 120;
        const centerY = 120;

        let currentAngle = -90;
        const svgElements = [];

        data.forEach((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const endAngle = currentAngle + angle;

            const startRad = (currentAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
            ].join(' ');

            svgElements.push(`
                <path d="${pathData}" fill="${item.color}" stroke="#fff" stroke-width="3" 
                      data-name="${item.name}" data-value="${item.value}" data-percentage="${percentage.toFixed(1)}"
                      style="cursor: pointer; transition: all 0.3s ease; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));"
                      onmouseover="this.style.opacity='0.8'; this.style.transform='scale(1.02)'; this.style.filter='drop-shadow(0 4px 8px rgba(0,0,0,0.2))'"
                      onmouseout="this.style.opacity='1'; this.style.transform='scale(1)'; this.style.filter='drop-shadow(0 2px 4px rgba(0,0,0,0.1))'">
                    <title>${item.name}: ${item.value} چک (${percentage.toFixed(1)}%)</title>
                </path>
            `);

            currentAngle = endAngle;
        });

        const legend = data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px; background: ${item.bgColor}; border-radius: 8px; border: 1px solid ${item.borderColor}; transition: all 0.3s ease;" 
                     onmouseover="this.style.transform='translateX(5px)'" 
                     onmouseout="this.style.transform='translateX(0)'">
                    <div style="width: 20px; height: 20px; background: ${item.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-${item.icon}" style="color: white; font-size: 10px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #2c3e50; font-size: 14px;">${item.name}</div>
                        <div style="color: #6c757d; font-size: 12px;">${this.convertToPersianNumbers(item.value)} چک (${this.convertToPersianNumbers(percentage)}%)</div>
                    </div>
                </div>
            `;
        }).join('');

        chartContainer.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e9ecef;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #2c3e50; font-size: 18px; font-weight: 600;">وضعیت چک‌های خروجی</h3>
                    <div style="color: #6c757d; font-size: 14px; margin-top: 4px;">توزیع چک‌ها بر اساس وضعیت</div>
                </div>
                
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 40px; flex-wrap: wrap;">
                    <div>
                        <svg width="240" height="240" viewBox="0 0 240 240" style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1));">
                            <defs>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                    <feMerge> 
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            ${svgElements.join('')}
                            <circle cx="${centerX}" cy="${centerY}" r="35" fill="#fff" stroke="#e9ecef" stroke-width="3" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));"/>
                            <text x="${centerX}" y="${centerY - 8}" text-anchor="middle" font-size="16" font-weight="bold" fill="#2c3e50">${this.convertToPersianNumbers(total)}</text>
                            <text x="${centerX}" y="${centerY + 8}" text-anchor="middle" font-size="12" fill="#6c757d">چک</text>
                        </svg>
                    </div>
                    
                    <div style="flex: 1; min-width: 200px;">
                        <div style="margin-bottom: 16px;">
                            <h4 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 16px; font-weight: 600;">
                                <i class="fas fa-list" style="margin-left: 8px; color: #6c757d;"></i>
                                جزئیات وضعیت
                            </h4>
                        </div>
                        ${legend}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e9ecef;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: #f8f9fa; border-radius: 20px; color: #6c757d; font-size: 14px;">
                        <i class="fas fa-info-circle"></i>
                        <span>مجموع: ${this.convertToPersianNumbers(total)} چک خروجی</span>
                    </div>
                </div>
            </div>
        `;
    }

    formatCurrency(amount) {
        if (!amount || isNaN(amount)) return '۰ ریال';
        
        const num = parseFloat(amount);
        const persianNum = this.convertToPersianNumbers(num.toLocaleString('en-US'));
        return `${persianNum} ریال`;
    }

    formatDate(date) {
        if (!date) return '-';
        // Replace - with /
        const formatted = date.toString().replace(/-/g, '/');
        return this.convertToPersianNumbers(formatted);
    }
}

// Global functions for HTML onclick handlers
window.clearOutgoingCheckForm = function() {
    if (window.outgoingChecksManager) {
        window.outgoingChecksManager.clearOutgoingCheckForm();
    }
};

window.saveOutgoingCheck = function() {
    if (window.outgoingChecksManager) {
        window.outgoingChecksManager.saveOutgoingCheck();
    }
};

window.searchOutgoingChecks = function() {
    if (window.outgoingChecksManager) {
        window.outgoingChecksManager.searchOutgoingChecks();
    }
};

window.toggleOutgoingCheckForm = function() {
    if (window.outgoingChecksManager) {
        window.outgoingChecksManager.toggleOutgoingCheckForm();
    }
};

window.prepareForNextCheck = function() {
    if (window.outgoingChecksManager) {
        window.outgoingChecksManager.prepareForNextCheck();
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.outgoingChecksManager = new OutgoingChecksManager();
}); 