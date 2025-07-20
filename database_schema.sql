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

-- جدول چک‌های خروجی (جدید)
CREATE TABLE outgoing_checks (
  id SERIAL PRIMARY KEY,
  
  -- اطلاعات چک
  sayadi_number VARCHAR(50) NOT NULL,
  series_number VARCHAR(50),
  bank_name VARCHAR(100) NOT NULL,
  branch_name VARCHAR(100),
  payee_name VARCHAR(255) NOT NULL,
  national_code VARCHAR(20),
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  
  -- اطلاعات اضافی
  reason VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'در جریان',
  
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
CREATE INDEX idx_outgoing_checks_status ON outgoing_checks(status);
CREATE INDEX idx_outgoing_checks_due_date ON outgoing_checks(due_date);
CREATE INDEX idx_outgoing_checks_payee ON outgoing_checks(payee_name); 