# راهنمای وارد کردن داده‌های نمونه به دیتابیس

## فایل‌های آماده شده:

### 1. `sample_transactions.csv` - تراکنش‌های نمونه
این فایل شامل 10 تراکنش فروش پیانو است که همه فیلدهای موجود در فرم را پوشش می‌دهد:

**فیلدهای موجود:**
- `title`: عنوان تراکنش
- `amount`: مبلغ کل
- `type`: نوع (income/expense)
- `category`: دسته‌بندی
- `date`: تاریخ (شکل شمسی)
- `description`: توضیحات
- `customer_name`: نام مشتری
- `customer_phone`: شماره تماس
- `birth_date`: تاریخ تولد
- `customer_address`: آدرس
- `province`: استان
- `city`: شهر
- `product_name`: نام محصول
- `product_type`: نوع ساز
- `serial_number`: شماره سریال
- `purchase_price`: قیمت خرید
- `sale_price`: قیمت فروش
- `color_cost`: هزینه رنگ
- `regulation_cost`: هزینه رگلاژ
- `transport_cost`: هزینه حمل
- `teacher_name`: نام معلم
- `teacher_percent`: درصد معلم
- `teacher_commission`: کمیسیون معلم
- `seller_name`: نام فروشنده
- `seller_percent`: درصد فروشنده
- `seller_commission`: کمیسیون فروشنده
- `payment_method`: روش پرداخت
- `advance_payment`: پیش پرداخت
- `gross_profit`: سود ناخالص
- `net_profit`: سود خالص

### 2. `sample_products.csv` - محصولات نمونه
این فایل شامل 10 محصول پیانو مختلف است:

**فیلدهای موجود:**
- `name`: نام محصول
- `price`: قیمت
- `category`: دسته‌بندی

### 3. `sample_checks.csv` - چک‌های نمونه
این فایل شامل 10 چک نمونه است:

**فیلدهای موجود:**
- `check_number`: شماره چک
- `amount`: مبلغ
- `bank_name`: نام بانک
- `due_date`: تاریخ سررسید
- `status`: وضعیت

## نحوه وارد کردن به Supabase:

### مرحله 1: وارد کردن محصولات
1. در Supabase به بخش **Table Editor** بروید
2. جدول `products` را انتخاب کنید
3. روی **Import** کلیک کنید
4. فایل `sample_products.csv` را آپلود کنید
5. ستون‌ها را مطابقت دهید:
   - `name` → `name`
   - `price` → `price`
   - `category` → `category`

### مرحله 2: وارد کردن تراکنش‌ها
1. جدول `transactions` را انتخاب کنید
2. فایل `sample_transactions.csv` را آپلود کنید
3. ستون‌های اصلی را مطابقت دهید:
   - `title` → `title`
   - `amount` → `amount`
   - `type` → `type`
   - `category` → `category`
   - `date` → `date`
   - `description` → `description`

### مرحله 3: وارد کردن چک‌ها
1. جدول `checks` را انتخاب کنید
2. فایل `sample_checks.csv` را آپلود کنید
3. ستون‌ها را مطابقت دهید:
   - `check_number` → `check_number`
   - `amount` → `amount`
   - `bank_name` → `bank_name`
   - `due_date` → `due_date`
   - `status` → `status`

## نکات مهم:

1. **تاریخ‌ها**: همه تاریخ‌ها به شکل شمسی هستند (YYYY-MM-DD)
2. **مبالغ**: همه مبالغ به تومان هستند
3. **کدگذاری**: فایل‌ها با UTF-8 ذخیره شده‌اند
4. **جداسازی**: از کاما (,) برای جداسازی فیلدها استفاده شده

## تست سیستم:

بعد از وارد کردن داده‌ها، می‌توانید در Console مرورگر این کدها را اجرا کنید:

```javascript
// تست دریافت تراکنش‌ها
window.dbManager.getTransactions().then(data => console.log('تراکنش‌ها:', data));

// تست دریافت محصولات
window.dbManager.getProducts().then(data => console.log('محصولات:', data));

// تست دریافت چک‌ها
window.dbManager.getChecks().then(data => console.log('چک‌ها:', data));

// تست آمارگیری
window.dbManager.getTransactionStats().then(stats => console.log('آمار:', stats));
```

## محصولات موجود در نمونه:

### پیانوهای آکوستیک:
- پیانو یاماها U1 (85,000,000 تومان)
- پیانو کاوایی K300 (92,000,000 تومان)
- پیانو یاماها U3 (95,000,000 تومان)
- پیانو کاوایی K500 (110,000,000 تومان)
- پیانو یاماها C1 (120,000,000 تومان)
- پیانو کاوایی GL10 (95,000,000 تومان)

### پیانوهای دیجیتال:
- پیانو دیجیتال Roland (45,000,000 تومان)
- پیانو دیجیتال Yamaha (38,000,000 تومان)
- پیانو دیجیتال Casio (32,000,000 تومان)
- پیانو دیجیتال Kawai (42,000,000 تومان)

## مشتریان نمونه:
- علی احمدی (تهران)
- فاطمه رضایی (اصفهان)
- حسین کریمی (مشهد)
- زهرا نوری (شیراز)
- مهدی صادقی (تبریز)
- نرگس جعفری (یزد)
- رضا محمودی (کرج)
- سارا احمدی (قم)
- امیر رضایی (اهواز)
- الهام کریمی (ارومیه) 