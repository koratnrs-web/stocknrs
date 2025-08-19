-- ===================================
-- อัปเดตฐานข้อมูลสำหรับระบบจัดการสต็อกสินค้า
-- ===================================

-- เพิ่มคอลัมน์ expiry_date ในตาราง products (ถ้ายังไม่มี)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE products ADD COLUMN expiry_date DATE;
    END IF;
END $$;

-- เพิ่มคอลัมน์ is_medicine ในตาราง categories (ถ้ายังไม่มี)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'is_medicine'
    ) THEN
        ALTER TABLE categories ADD COLUMN is_medicine BOOLEAN DEFAULT false;
    END IF;
END $$;

-- อัปเดตข้อมูลหมวดหมู่ที่มีอยู่ให้เป็น is_medicine = false
UPDATE categories SET is_medicine = false WHERE is_medicine IS NULL;

-- เพิ่มหมวดหมู่ยา (ถ้ายังไม่มี)
INSERT INTO categories (name, description, is_medicine) VALUES
('ยาและเวชภัณฑ์', 'ยาต่างๆ และเวชภัณฑ์ทางการแพทย์', true)
ON CONFLICT (name) DO NOTHING;

-- สร้าง index สำหรับ expiry_date (ถ้ายังไม่มี)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'products' AND indexname = 'idx_products_expiry_date'
    ) THEN
        CREATE INDEX idx_products_expiry_date ON products(expiry_date);
    END IF;
END $$;

-- สร้าง index สำหรับ barcode (ถ้ายังไม่มี)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'products' AND indexname = 'idx_products_barcode'
    ) THEN
        CREATE INDEX idx_products_barcode ON products(barcode);
    END IF;
END $$;

-- อัปเดต updated_at trigger สำหรับตารางใหม่
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger สำหรับ updated_at ในตาราง products (ถ้ายังไม่มี)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_products_updated_at'
    ) THEN
        CREATE TRIGGER update_products_updated_at 
          BEFORE UPDATE ON products 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- สร้าง trigger สำหรับ updated_at ในตาราง categories (ถ้ายังไม่มี)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_categories_updated_at'
    ) THEN
        CREATE TRIGGER update_categories_updated_at 
          BEFORE UPDATE ON categories 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- สร้าง trigger สำหรับ updated_at ในตาราง suppliers (ถ้ายังไม่มี)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_suppliers_updated_at'
    ) THEN
        CREATE TRIGGER update_suppliers_updated_at 
          BEFORE UPDATE ON suppliers 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ตรวจสอบและสร้าง RLS policies (ถ้ายังไม่มี)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Allow all operations on products'
    ) THEN
        ALTER TABLE products ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' AND policyname = 'Allow all operations on categories'
    ) THEN
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'suppliers' AND policyname = 'Allow all operations on suppliers'
    ) THEN
        ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow all operations on suppliers" ON suppliers FOR ALL USING (true);
    END IF;
END $$;

-- แสดงข้อความยืนยัน
SELECT 'Database schema updated successfully!' as message;
