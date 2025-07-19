# راهنمای وارد کردن داده‌های نمونه به دیتابیس - نسخه اصلاح شده

## ⚠️ مهم: ابتدا جداول را دوباره بسازید!

### مرحله 1: حذف جداول قدیمی
در Supabase SQL Editor این کدها را اجرا کنید:

```sql
-- حذف جداول قدیمی
DROP TABLE IF EXISTS checks CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
```

### مرحله 2: ساخت جداول جدید
فایل `database_schema.sql` را در SQL Editor اجرا کنید یا این کدها را کپی کنید:

```sql
-- ساختار صحیح جداول دیتابیس برای سیستم حسابداری پیانو

-- جدول تراکنش‌ها (بر اساس فیلدهای واقعی فرم)
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'income',
  category VARCHAR(100) DEFAULT 'فروش پیانو',
  date DATE NOT NULL,
  description TEXT,
  
  -- اطلاعات مشتری
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  birth_date DATE,
  customer_address TEXT,
  province VARCHAR(100),
  city VARCHAR(100),
  
  -- اطلاعات محصول
  product_name VARCHAR(255),
  product_type VARCHAR(100),
  serial_number VARCHAR(100),
  
  -- اطلاعات مالی
  purchase_price DECIMAL(15,2) DEFAULT 0,
  sale_price DECIMAL(15,2) DEFAULT 0,
  color_cost DECIMAL(15,2) DEFAULT 0,
  regulation_cost DECIMAL(15,2) DEFAULT 0,
  transport_cost DECIMAL(15,2) DEFAULT 0,
  gross_profit DECIMAL(15,2) DEFAULT 0,
  net_profit DECIMAL(15,2) DEFAULT 0,
  
  -- اطلاعات پورسانت
  teacher_name VARCHAR(255),
  teacher_percent DECIMAL(5,2) DEFAULT 0,
  teacher_commission DECIMAL(15,2) DEFAULT 0,
  seller_name VARCHAR(255),
  seller_percent DECIMAL(5,2) DEFAULT 0,
  seller_commission DECIMAL(15,2) DEFAULT 0,
  
  -- اطلاعات پرداخت
  payment_method VARCHAR(50) DEFAULT 'cash',
  advance_payment DECIMAL(15,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول چک‌ها (بر اساس فیلدهای واقعی فرم)
CREATE TABLE checks (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- اطلاعات چک
  sayadi_number VARCHAR(50),
  series_number VARCHAR(50),
  bank_name VARCHAR(100),
  branch_name VARCHAR(100),
  issuer_name VARCHAR(255),
  payee_name VARCHAR(255),
  national_code VARCHAR(20),
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول محصولات
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(15,2),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ایندکس‌ها برای بهبود عملکرد
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_customer ON transactions(customer_name);
CREATE INDEX idx_transactions_product ON transactions(product_name);
CREATE INDEX idx_checks_transaction ON checks(transaction_id);
CREATE INDEX idx_checks_status ON checks(status);
CREATE INDEX idx_checks_due_date ON checks(due_date);
```

## فایل‌های آماده شده (نسخه اصلاح شده):

### 1. `sample_transactions_fixed.csv` - تراکنش‌های نمونه
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
- `gross_profit`: سود ناخالص
- `net_profit`: سود خالص
- `teacher_name`: نام معلم
- `teacher_percent`: درصد معلم
- `teacher_commission`: کمیسیون معلم
- `seller_name`: نام فروشنده
- `seller_percent`: درصد فروشنده
- `seller_commission`: کمیسیون فروشنده
- `payment_method`: روش پرداخت
- `advance_payment`: پیش پرداخت

### 2. `sample_products.csv` - محصولات نمونه
**فیلدهای موجود:**
- `name`: نام محصول
- `price`: قیمت
- `category`: دسته‌بندی

### 3. `sample_checks_fixed.csv` - چک‌های نمونه
**فیلدهای موجود:**
- `sayadi_number`: شماره صیادی
- `series_number`: شماره سری
- `bank_name`: نام بانک
- `branch_name`: نام شعبه
- `issuer_name`: نام صادرکننده
- `payee_name`: در وجه
- `national_code`: کد ملی
- `amount`: مبلغ
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
2. فایل `sample_transactions_fixed.csv` را آپلود کنید
3. ستون‌ها را مطابقت دهید (همه فیلدها)

### مرحله 3: وارد کردن چک‌ها
1. جدول `checks` را انتخاب کنید
2. فایل `sample_checks_fixed.csv` را آپلود کنید
3. ستون‌ها را مطابقت دهید (همه فیلدها)
4. **نکته مهم**: فیلد `transaction_id` را خالی بگذارید (بعداً پر می‌شود)

## نکات مهم:

1. **تاریخ‌ها**: همه تاریخ‌ها به شکل شمسی هستند (YYYY-MM-DD)
2. **مبالغ**: همه مبالغ به تومان هستند
3. **کدگذاری**: فایل‌ها با UTF-8 ذخیره شده‌اند
4. **جداسازی**: از کاما (,) برای جداسازی فیلدها استفاده شده
5. **Foreign Key**: چک‌ها به تراکنش‌ها متصل می‌شوند

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