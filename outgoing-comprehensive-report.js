// --- گزارش جامع چک‌های خروجی ---

class OutgoingComprehensiveReport {
    constructor() {
        this.currentTab = 'monthly-stats';
        this.currentFilter = 'all';
        this.checks = [];
        this.init();
    }

    init() {
        console.log('Initializing OutgoingComprehensiveReport...');
        this.setupEventListeners();
        // حذف ساخت داینامیک دکمه
        // this.createReportButton();
        
        // تست دکمه بعد از 2 ثانیه
        setTimeout(() => {
            const btn = document.getElementById('outgoing-comprehensive-report-btn');
            if (btn) {
                console.log('✅ Outgoing report button found and ready');
                console.log('Button HTML:', btn.outerHTML);
                
                // تست کلیک دستی
                btn.onclick = (e) => {
                    console.log('🎯 Manual click test successful!');
                    e.preventDefault();
                    this.showReportModal();
                };
                
                // تست خودکار بعد از 3 ثانیه
                setTimeout(() => {
                    console.log('🧪 Auto-testing modal...');
                    this.showReportModal();
                }, 3000);
            } else {
                console.log('❌ Outgoing report button not found');
            }
        }, 2000);
    }

    // حذف کامل متد createReportButton

    setupEventListeners() {
        console.log('Setting up event listeners for outgoing comprehensive report...');
        
        // فقط رویداد کلیک را به دکمه موجود در HTML وصل کن
        const reportBtn = document.getElementById('outgoing-comprehensive-report-btn');
        if (reportBtn) {
            reportBtn.onclick = (e) => {
                console.log('🎯 Outgoing report button clicked!');
                e.preventDefault();
                this.showReportModal();
            };
        }

        // Event listener برای مودال (delegation)
        document.addEventListener('click', (e) => {
            // بستن مودال
            if (e.target.closest('#outgoingComprehensiveReportModal .modal-close') || e.target.id === 'closeOutgoingComprehensiveReportModal') {
                console.log('Close button clicked');
                this.hideReportModal();
            }
            
            // کلیک روی تب‌ها
            if (e.target.closest('#outgoingComprehensiveReportModal .report-tabs .tab-btn')) {
                const tab = e.target.closest('.tab-btn');
                const tabId = tab.getAttribute('data-tab');
                console.log('Tab clicked:', tabId);
                this.switchTab(tabId);
            }
            
            // کلیک روی دکمه‌های مرتب‌سازی
            if (e.target.closest('#outgoingComprehensiveReportModal .sort-btn')) {
                const sortBtn = e.target.closest('.sort-btn');
                const sortOrder = sortBtn.getAttribute('data-sort');
                console.log('Sort button clicked:', sortOrder);
                this.handleSort(sortOrder);
            }
            
            // بستن با کلیک روی پس‌زمینه مودال
            if (e.target.id === 'outgoingComprehensiveReportModal') {
                console.log('Background clicked, closing modal');
                this.hideReportModal();
            }
        });
    }

    async showReportModal() {
        console.log('🚀 Opening comprehensive report modal...');
        
        // نمایش مودال موجود در HTML
        const modal = document.getElementById('outgoingComprehensiveReportModal');
        if (modal) {
            modal.style.display = 'flex';
            console.log('✅ Modal displayed');
            
            // پر کردن داده‌ها
            this.fillReportData();
            console.log('✅ Data filled');
        } else {
            console.error('❌ Modal not found in HTML');
        }
    }
            
            // تست event listener ها
            setTimeout(() => {
                const tabButtons = document.querySelectorAll('#outgoingComprehensiveReportModal .tab-btn');
                const sortButtons = document.querySelectorAll('#outgoingComprehensiveReportModal .sort-btn');
                console.log('Found tab buttons:', tabButtons.length);
                console.log('Found sort buttons:', sortButtons.length);
                
                // نمایش جزئیات تب‌ها
                tabButtons.forEach((btn, index) => {
                    console.log(`Tab ${index}:`, {
                        text: btn.textContent.trim(),
                        dataTab: btn.getAttribute('data-tab'),
                        isActive: btn.classList.contains('active')
                    });
                });
                
                // نمایش جزئیات دکمه‌های مرتب‌سازی
                sortButtons.forEach((btn, index) => {
                    console.log(`Sort button ${index}:`, {
                        text: btn.textContent.trim(),
                        dataSort: btn.getAttribute('data-sort'),
                        isActive: btn.classList.contains('active')
                    });
                });
                
                // تست کلیک روی تب
                if (tabButtons.length > 0) {
                    console.log('Testing tab click...');
                    tabButtons[0].click();
                }
                
                // تست کلیک روی دکمه مرتب‌سازی
                if (sortButtons.length > 0) {
                    console.log('Testing sort button click...');
                    sortButtons[0].click();
                }
                
                // تست دستی event listener
                console.log('Testing manual event listener...');
                const testEvent = new Event('click', { bubbles: true });
                if (tabButtons.length > 0) {
                    tabButtons[0].dispatchEvent(testEvent);
                }
            }, 100);
        }, 10);

        // پر کردن داده‌ها
        await this.fillReportData();
        console.log('Report data filled');
        
        // تست نهایی عملکرد
        console.log('=== FINAL TEST ===');
        console.log('Current tab:', this.currentTab);
        console.log('Current filter:', this.currentFilter);
        console.log('Total checks loaded:', this.checks.length);
        
        // تست دسترسی به عناصر
        const modal = document.getElementById('outgoingComprehensiveReportModal');
        const tabContent = document.getElementById('monthly-stats');
        const tbody = document.getElementById('monthlyStatsTableBody');
        
        console.log('Modal exists:', !!modal);
        console.log('Tab content exists:', !!tabContent);
        console.log('Table body exists:', !!tbody);
        console.log('Tab content display:', tabContent ? tabContent.style.display : 'N/A');
        console.log('Table body rows:', tbody ? tbody.children.length : 'N/A');
    }

    hideReportModal() {
        console.log('Hiding comprehensive report modal...');
        const modal = document.getElementById('outgoingComprehensiveReportModal');
        if (modal) {
            modal.style.display = 'none';
            console.log('Modal hidden');
        }
    }

    async fillReportData() {
        try {
            this.checks = await this.getAllOutgoingChecks();
            console.log('Loaded checks:', this.checks);
            
            // برای تست، همیشه داده‌های نمونه اضافه کن
            console.log('Adding sample data for testing');
            this.addSampleData();
            
            // اطمینان از اینکه تب آمار ماهانه فعال است
            this.currentTab = 'outgoing-monthly-stats';
            this.fillMonthlyStats('none');
            console.log('Monthly stats filled');
        } catch (error) {
            console.error('خطا در بارگذاری داده‌های گزارش:', error);
        }
    }

    addSampleData() {
        // اضافه کردن چک‌های نمونه برای تست با تاریخ‌های مختلف
        const sampleChecks = [
            {
                id: 1,
                payee_name: 'شرکت الف',
                amount: 74000000,
                due_date: '2024/05/15', // مرداد
                status: 'در جریان'
            },
            {
                id: 2,
                payee_name: 'شرکت ب',
                amount: 74000000,
                due_date: '2024/05/20', // مرداد
                status: 'پرداخت شده'
            },
            {
                id: 3,
                payee_name: 'شرکت الف',
                amount: 74000000,
                due_date: '2024/05/25', // مرداد
                status: 'در جریان'
            },
            {
                id: 4,
                payee_name: 'شرکت ج',
                amount: 74000000,
                due_date: '2024/05/30', // مرداد
                status: 'باطل شده'
            },
            {
                id: 5,
                payee_name: 'شرکت د',
                amount: 74000000,
                due_date: '2024/06/10', // شهریور
                status: 'در جریان'
            }
        ];
        
        // ذخیره در localStorage
        localStorage.setItem('outgoing_checks', JSON.stringify(sampleChecks));
        this.checks = sampleChecks;
        console.log('Sample data added to localStorage with proper dates');
    }

    async getAllOutgoingChecks() {
        try {
            // خواندن مستقیم از localStorage مثل جدول اصلی
            const allChecks = JSON.parse(localStorage.getItem('outgoing_checks') || '[]');
            console.log('All outgoing checks from localStorage:', allChecks);
            return allChecks;
        } catch (error) {
            console.error('Error getting all outgoing checks:', error);
            return [];
        }
    }

    switchTab(tabId) {
        console.log('Switching to tab:', tabId);
        
        // به‌روزرسانی تب‌ها
        document.querySelectorAll('#outgoingComprehensiveReportModal .report-tabs .tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
                console.log('Activated tab button:', btn.textContent);
            } else {
                btn.classList.remove('active');
            }
        });
        
        // به‌روزرسانی محتوای تب‌ها
        document.querySelectorAll('#outgoingComprehensiveReportModal .modal-body .tab-content').forEach(tab => {
            if (tab.id === tabId) {
                tab.classList.add('active');
                tab.style.display = '';
                console.log('Activated tab content:', tab.id);
            } else {
                tab.classList.remove('active');
                tab.style.display = 'none';
            }
        });
        
        this.currentTab = tabId;
        this.renderCurrentTab();
    }

    switchFilter(filterName) {
        this.currentFilter = filterName;
        
        // به‌روزرسانی فیلترها
        document.querySelectorAll('#outgoingComprehensiveReportModal .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`#outgoingComprehensiveReportModal [data-filter="${filterName}"]`).classList.add('active');
        
        this.renderCurrentTab();
    }

    handleSort(sortOrder) {
        console.log('Handling sort:', sortOrder);
        
        // به‌روزرسانی دکمه‌های مرتب‌سازی
        document.querySelectorAll('#outgoingComprehensiveReportModal .sort-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`#outgoingComprehensiveReportModal [data-sort="${sortOrder}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            console.log('Activated sort button:', sortOrder);
        } else {
            console.error('Sort button not found for:', sortOrder);
        }
        
        this.fillMonthlyStats(sortOrder);
    }

    renderCurrentTab() {
        console.log('Rendering current tab:', this.currentTab);
        switch (this.currentTab) {
            case 'outgoing-monthly-stats':
                this.fillMonthlyStats('none');
                break;
            case 'outgoing-payee-ranking':
                this.fillPayeeStats();
                break;
            case 'outgoing-status-ranking':
                this.fillStatusStats();
                break;
        }
    }

    fillMonthlyStats(sortOrder = 'none') {
        const persianMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
        let filteredChecks = this.applyAmountFilter(this.checks);
        
        const monthlyStats = Array.from({length: 12}, (_, i) => ({
            month: persianMonths[i],
            count: 0,
            total: 0
        }));
        
        let totalCount = 0;
        let totalAmount = 0;
        
        console.log('Filtered checks:', filteredChecks); // برای دیباگ
        
        filteredChecks.forEach(check => {
            console.log('Processing check:', check); // برای دیباگ
            
            // بررسی فیلدهای مختلف تاریخ
            const dueDate = check.due_date || check.dueDate;
            console.log('Due date:', dueDate, 'Type:', typeof dueDate);
            
            if (dueDate) {
                let date;
                // بررسی فرمت تاریخ
                if (typeof dueDate === 'string') {
                    if (dueDate.includes('/')) {
                        // فرمت شمسی: YYYY/MM/DD
                        const parts = dueDate.split('/');
                        console.log('Shamsi date parts:', parts);
                        if (parts.length === 3) {
                            const monthIdx = parseInt(parts[1], 10) - 1;
                            console.log('Month index from Shamsi:', monthIdx);
                            if (monthIdx >= 0 && monthIdx < 12) {
                                monthlyStats[monthIdx].count++;
                                monthlyStats[monthIdx].total += parseInt(check.amount) || 0;
                                totalCount++;
                                totalAmount += parseInt(check.amount) || 0;
                                console.log(`Added to month ${monthIdx} (${persianMonths[monthIdx]}): count=${monthlyStats[monthIdx].count}, total=${monthlyStats[monthIdx].total}`);
                            }
                        }
                    } else {
                        // فرمت میلادی: ISO string
                        date = new Date(dueDate);
                        const monthIdx = date.getMonth();
                        console.log('Gregorian date:', date, 'Month index:', monthIdx);
                        if (monthIdx >= 0 && monthIdx < 12) {
                            monthlyStats[monthIdx].count++;
                            monthlyStats[monthIdx].total += parseInt(check.amount) || 0;
                            totalCount++;
                            totalAmount += parseInt(check.amount) || 0;
                            console.log(`Added to month ${monthIdx} (${persianMonths[monthIdx]}): count=${monthlyStats[monthIdx].count}, total=${monthlyStats[monthIdx].total}`);
                        }
                    }
                }
            } else {
                console.log('No due date found for check:', check);
            }
        });
        
        console.log('Monthly stats:', monthlyStats);
        console.log('Total count:', totalCount);
        console.log('Total amount:', totalAmount);
        
        // مرتب‌سازی بر اساس تعداد چک
        let sortedStats = [...monthlyStats];
        if (sortOrder === 'desc') {
            sortedStats.sort((a, b) => b.count - a.count);
        } else if (sortOrder === 'asc') {
            sortedStats.sort((a, b) => a.count - b.count);
        }
        
        // پیدا کردن ماه با بیشترین چک
        const nonZeroStats = sortedStats.filter(s => s.count > 0);
        const byCount = [...nonZeroStats].sort((a, b) => b.count - a.count);
        const maxCount = byCount[0]?.count || 0;
        console.log('Max count:', maxCount);
        
        const tbody = document.getElementById('outgoingMonthlyStatsTableBody');
        if (!tbody) {
            console.error('outgoingMonthlyStatsTableBody not found!');
            return;
        }
        
        console.log('Found tbody, clearing and filling...');
        tbody.innerHTML = '';
        
        // نمایش همه ماه‌ها حتی اگر چک‌ای نداشته باشند
        sortedStats.forEach((stat) => {
            const avg = stat.count > 0 ? Math.round(stat.total/stat.count) : 0;
            const percent = totalCount > 0 ? ((stat.count/totalCount)*100).toFixed(1) : '0.0';
            const percentFa = Number(percent).toLocaleString('fa-IR');
            
            // آیکون سمت راست نام ماه
            let icon = '';
            let trClass = '';
            if (stat.count > 0 && stat.count === maxCount) {
                icon = '<span class="medal-icon">🏆</span> ';
                trClass = 'gold-row';
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${icon}${stat.month}</td><td>${stat.count}</td><td>${avg.toLocaleString('fa-IR')}</td><td>${stat.total.toLocaleString('fa-IR')}</td><td><span class='percent-sign'>% </span>${percentFa}</td>`;
            if (trClass) tr.classList.add(trClass);
            tbody.appendChild(tr);
        });
        
        console.log('Table filled with', sortedStats.length, 'rows');
    }

    fillPayeeStats() {
        let filteredChecks = this.applyAmountFilter(this.checks);
        const payeeMap = {};
        let totalCount = 0;
        let totalAmount = 0;
        
        filteredChecks.forEach(check => {
            const payee = check.payee_name || check.payee || 'نامشخص';
            if (!payeeMap[payee]) {
                payeeMap[payee] = { count: 0, total: 0 };
            }
            payeeMap[payee].count++;
            payeeMap[payee].total += parseInt(check.amount) || 0;
            totalCount++;
            totalAmount += parseInt(check.amount) || 0;
        });
        
        const payeeStats = Object.entries(payeeMap).map(([payee, stats]) => ({
            payee,
            count: stats.count,
            total: stats.total
        })).sort((a, b) => b.count - a.count);
        
        const tbody = document.getElementById('outgoingPayeeStatsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        payeeStats.forEach((stat) => {
            const avg = stat.count > 0 ? Math.round(stat.total/stat.count) : 0;
            const percent = totalCount > 0 ? ((stat.count/totalCount)*100).toFixed(1) : '0.0';
            const percentFa = Number(percent).toLocaleString('fa-IR');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${stat.payee}</td><td>${stat.count}</td><td>${avg.toLocaleString('fa-IR')}</td><td>${stat.total.toLocaleString('fa-IR')}</td><td><span class='percent-sign'>% </span>${percentFa}</td>`;
            tbody.appendChild(tr);
        });
    }

    fillStatusStats() {
        let filteredChecks = this.applyAmountFilter(this.checks);
        const statusMap = {};
        let totalCount = 0;
        let totalAmount = 0;
        
        filteredChecks.forEach(check => {
            const status = check.status || 'نامشخص';
            if (!statusMap[status]) {
                statusMap[status] = { count: 0, total: 0 };
            }
            statusMap[status].count++;
            statusMap[status].total += parseInt(check.amount) || 0;
            totalCount++;
            totalAmount += parseInt(check.amount) || 0;
        });
        
        const statusStats = Object.entries(statusMap).map(([status, stats]) => ({
            status,
            count: stats.count,
            total: stats.total
        })).sort((a, b) => b.count - a.count);
        
        const tbody = document.getElementById('outgoingStatusStatsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        statusStats.forEach((stat) => {
            const avg = stat.count > 0 ? Math.round(stat.total/stat.count) : 0;
            const percent = totalCount > 0 ? ((stat.count/totalCount)*100).toFixed(1) : '0.0';
            const percentFa = Number(percent).toLocaleString('fa-IR');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${stat.status}</td><td>${stat.count}</td><td>${avg.toLocaleString('fa-IR')}</td><td>${stat.total.toLocaleString('fa-IR')}</td><td><span class='percent-sign'>% </span>${percentFa}</td>`;
            tbody.appendChild(tr);
        });
    }

    applyAmountFilter(checks) {
        if (this.currentFilter === 'all') {
            return checks;
        }
        
        const amounts = checks.map(check => parseInt(check.amount || 0)).filter(amount => amount > 0);
        if (amounts.length === 0) return checks;
        
        const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        
        return checks.filter(check => {
            const amount = parseInt(check.amount || 0);
            if (this.currentFilter === 'high') {
                return amount > avgAmount;
            } else if (this.currentFilter === 'low') {
                return amount <= avgAmount;
            }
            return true;
        });
    }

    convertToPersianNumbers(num) {
        const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, x => persianNumbers[x]);
    }
}

// راه‌اندازی گزارش جامع چک‌های خروجی
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing OutgoingComprehensiveReport...');
    const report = new OutgoingComprehensiveReport();
    
    // تست دستی دکمه
    setTimeout(() => {
        const btn = document.getElementById('outgoing-comprehensive-report-btn');
        if (btn) {
            console.log('✅ Report button found:', btn);
            console.log('Button HTML:', btn.outerHTML);
            
            // تست کلیک مستقیم
            btn.onclick = (e) => {
                console.log('🎯 Direct click detected!');
                e.preventDefault();
                report.showReportModal();
            };
        } else {
            console.log('❌ Report button not found');
        }
    }, 1000);
}); 