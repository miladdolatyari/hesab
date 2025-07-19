// Database Management for Hesab System
class DatabaseManager {
    constructor() {
        this.supabase = window.supabase.createClient(
            'https://mzzthxaycuicrwyhrzih.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16enRoeGF5Y3VpY3J3eWhyemloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NjM2ODYsImV4cCI6MjA2ODUzOTY4Nn0.eCMvlQFxrHSsMIHccMq_znp4Com6ulUJcpnmKoMdfVo'
        );
        
        // Cache for preventing duplicate requests
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Internet connection restored');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('❌ Internet connection lost');
        });
    }

    // Check if we're online
    checkConnection() {
        if (!this.isOnline) {
            throw new Error('No internet connection');
        }
        return true;
    }

    // Prevent duplicate requests
    async executeRequest(key, requestFn) {
        // Check if request is already pending
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
        }

        // Check connection
        this.checkConnection();

        // Create new request
        const promise = requestFn();
        this.pendingRequests.set(key, promise);

        try {
            const result = await promise;
            this.cache.set(key, result);
            return result;
        } finally {
            this.pendingRequests.delete(key);
        }
    }

    // ==================== TRANSACTIONS ====================
    async addTransaction(transactionData) {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .insert([{
                    title: transactionData.title,
                    amount: parseFloat(transactionData.amount),
                    type: transactionData.type,
                    category: transactionData.category,
                    date: transactionData.date,
                    description: transactionData.description || ''
                }])
                .select();

            if (error) throw error;
            
            // Clear cache after adding new data
            this.cache.delete('transactions');
            this.cache.delete('transaction_stats');
            
            this.showNotification('تراکنش با موفقیت ثبت شد', 'success');
            return data[0];
        } catch (error) {
            console.error('Error adding transaction:', error);
            if (error.message === 'No internet connection') {
                this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
            } else {
                this.showNotification('خطا در ثبت تراکنش', 'error');
            }
            throw error;
        }
    }

    async getTransactions(limit = 50, forceRefresh = false) {
        const cacheKey = `transactions_${limit}`;
        
        // Return cached data if available and not forcing refresh
        if (!forceRefresh && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        return this.executeRequest(cacheKey, async () => {
            try {
                const { data, error } = await this.supabase
                    .from('transactions')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error getting transactions:', error);
                if (error.message === 'No internet connection') {
                    this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
                }
                return [];
            }
        });
    }

    async updateTransaction(id, updates) {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) throw error;
            
            // Clear cache after updating
            this.cache.delete('transactions');
            this.cache.delete('transaction_stats');
            
            this.showNotification('تراکنش با موفقیت بروزرسانی شد', 'success');
            return data[0];
        } catch (error) {
            console.error('Error updating transaction:', error);
            if (error.message === 'No internet connection') {
                this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
            } else {
                this.showNotification('خطا در بروزرسانی تراکنش', 'error');
            }
            throw error;
        }
    }

    async deleteTransaction(id) {
        try {
            const { error } = await this.supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            // Clear cache after deleting
            this.cache.delete('transactions');
            this.cache.delete('transaction_stats');
            
            this.showNotification('تراکنش با موفقیت حذف شد', 'success');
            return true;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            if (error.message === 'No internet connection') {
                this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
            } else {
                this.showNotification('خطا در حذف تراکنش', 'error');
            }
            throw error;
        }
    }

    // ==================== CHECKS ====================
    async addCheck(checkData) {
        try {
            const { data, error } = await this.supabase
                .from('checks')
                .insert([{
                    check_number: checkData.checkNumber,
                    amount: parseFloat(checkData.amount),
                    bank_name: checkData.bankName,
                    due_date: checkData.dueDate,
                    status: checkData.status || 'pending'
                }])
                .select();

            if (error) throw error;
            
            // Clear cache
            this.cache.delete('checks');
            this.cache.delete('check_stats');
            
            this.showNotification('چک با موفقیت ثبت شد', 'success');
            return data[0];
        } catch (error) {
            console.error('Error adding check:', error);
            if (error.message === 'No internet connection') {
                this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
            } else {
                this.showNotification('خطا در ثبت چک', 'error');
            }
            throw error;
        }
    }

    async getChecks(limit = 50, forceRefresh = false) {
        const cacheKey = `checks_${limit}`;
        
        if (!forceRefresh && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        return this.executeRequest(cacheKey, async () => {
            try {
                const { data, error } = await this.supabase
                    .from('checks')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error getting checks:', error);
                if (error.message === 'No internet connection') {
                    this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
                }
                return [];
            }
        });
    }

    async updateCheckStatus(id, status) {
        try {
            const { data, error } = await this.supabase
                .from('checks')
                .update({ status })
                .eq('id', id)
                .select();

            if (error) throw error;
            
            // Clear cache
            this.cache.delete('checks');
            this.cache.delete('check_stats');
            
            this.showNotification('وضعیت چک بروزرسانی شد', 'success');
            return data[0];
        } catch (error) {
            console.error('Error updating check status:', error);
            if (error.message === 'No internet connection') {
                this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
            } else {
                this.showNotification('خطا در بروزرسانی وضعیت چک', 'error');
            }
            throw error;
        }
    }

    // ==================== PRODUCTS ====================
    async addProduct(productData) {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .insert([{
                    name: productData.name,
                    price: parseFloat(productData.price),
                    category: productData.category
                }])
                .select();

            if (error) throw error;
            
            // Clear cache
            this.cache.delete('products');
            
            this.showNotification('محصول با موفقیت ثبت شد', 'success');
            return data[0];
        } catch (error) {
            console.error('Error adding product:', error);
            if (error.message === 'No internet connection') {
                this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
            } else {
                this.showNotification('خطا در ثبت محصول', 'error');
            }
            throw error;
        }
    }

    async getProducts(limit = 50, forceRefresh = false) {
        const cacheKey = `products_${limit}`;
        
        if (!forceRefresh && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        return this.executeRequest(cacheKey, async () => {
            try {
                const { data, error } = await this.supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error getting products:', error);
                if (error.message === 'No internet connection') {
                    this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
                }
                return [];
            }
        });
    }

    // ==================== REPORTS & ANALYTICS ====================
    async getTransactionStats(forceRefresh = false) {
        if (!forceRefresh && this.cache.has('transaction_stats')) {
            return this.cache.get('transaction_stats');
        }

        return this.executeRequest('transaction_stats', async () => {
            try {
                const { data, error } = await this.supabase
                    .from('transactions')
                    .select('amount, type, date');

                if (error) throw error;

                const stats = {
                    totalIncome: 0,
                    totalExpense: 0,
                    netAmount: 0,
                    transactionCount: data.length,
                    monthlyData: {}
                };

                data.forEach(transaction => {
                    const amount = parseFloat(transaction.amount);
                    const month = new Date(transaction.date).toISOString().slice(0, 7);
                    
                    if (transaction.type === 'income') {
                        stats.totalIncome += amount;
                    } else {
                        stats.totalExpense += amount;
                    }

                    if (!stats.monthlyData[month]) {
                        stats.monthlyData[month] = { income: 0, expense: 0 };
                    }

                    if (transaction.type === 'income') {
                        stats.monthlyData[month].income += amount;
                    } else {
                        stats.monthlyData[month].expense += amount;
                    }
                });

                stats.netAmount = stats.totalIncome - stats.totalExpense;
                return stats;
            } catch (error) {
                console.error('Error getting transaction stats:', error);
                if (error.message === 'No internet connection') {
                    this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
                }
                return null;
            }
        });
    }

    async getCheckStats(forceRefresh = false) {
        if (!forceRefresh && this.cache.has('check_stats')) {
            return this.cache.get('check_stats');
        }

        return this.executeRequest('check_stats', async () => {
            try {
                const { data, error } = await this.supabase
                    .from('checks')
                    .select('amount, status, due_date');

                if (error) throw error;

                const stats = {
                    totalAmount: 0,
                    pendingAmount: 0,
                    clearedAmount: 0,
                    bouncedAmount: 0,
                    checkCount: data.length,
                    overdueChecks: 0
                };

                const today = new Date();
                data.forEach(check => {
                    const amount = parseFloat(check.amount);
                    stats.totalAmount += amount;

                    switch (check.status) {
                        case 'pending':
                            stats.pendingAmount += amount;
                            break;
                        case 'cleared':
                            stats.clearedAmount += amount;
                            break;
                        case 'bounced':
                            stats.bouncedAmount += amount;
                            break;
                    }

                    if (check.due_date && new Date(check.due_date) < today && check.status === 'pending') {
                        stats.overdueChecks++;
                    }
                });

                return stats;
            } catch (error) {
                console.error('Error getting check stats:', error);
                if (error.message === 'No internet connection') {
                    this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
                }
                return null;
            }
        });
    }

    // ==================== UTILITY FUNCTIONS ====================
    async testConnection() {
        try {
            this.checkConnection();
            
            const { data, error } = await this.supabase
                .from('transactions')
                .select('count')
                .limit(1);

            if (error) throw error;
            console.log('✅ Database connection successful!');
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            if (error.message === 'No internet connection') {
                this.showNotification('خطا: اتصال اینترنت برقرار نیست', 'error');
            }
            return false;
        }
    }

    // Clear all cache
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }

    // Force refresh all data
    async refreshAllData() {
        this.clearCache();
        await Promise.all([
            this.getTransactions(50, true),
            this.getChecks(50, true),
            this.getProducts(50, true),
            this.getTransactionStats(true),
            this.getCheckStats(true)
        ]);
        this.showNotification('داده‌ها بروزرسانی شدند', 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `custom-alert custom-alert-${type} show`;
        notification.innerHTML = `
            <div class="alert-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            </div>
            <div class="alert-message">${message}</div>
            <button class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('fa-IR', {
            style: 'currency',
            currency: 'IRR'
        }).format(amount);
    }

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('fa-IR');
    }
}

// Initialize Database Manager
window.dbManager = new DatabaseManager();

// Test connection on page load
document.addEventListener('DOMContentLoaded', () => {
    window.dbManager.testConnection();
}); 