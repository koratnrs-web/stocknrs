#!/bin/bash

# =======================================================
# สคริปต์สร้างฐานข้อมูลและ schema สำหรับระบบจัดการสต็อก
# =======================================================

set -e

echo "🗄️ เริ่มต้นสร้างฐานข้อมูลและ schema..."

# กำหนดค่าการเชื่อมต่อ (สามารถแก้ไขได้ตามต้องการ)
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"stocknrs"}
DB_USER=${DB_USER:-"stockuser"}
DB_PASSWORD=${DB_PASSWORD:-"Login123"}

echo "📋 ข้อมูลการเชื่อมต่อ:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# ตรวจสอบว่า PostgreSQL client มีการติดตั้งหรือไม่
if ! command -v psql &> /dev/null; then
    echo "❌ ไม่พบ psql client, กรุณาติดตั้ง PostgreSQL client ก่อน"
    echo "   Ubuntu: sudo apt install postgresql-client"
    echo "   CentOS/RHEL: sudo yum install postgresql"
    exit 1
fi

# ฟังก์ชันรัน SQL โดยใช้ environment variables สำหรับ password
run_sql() {
    local sql_file=$1
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file"
}

# ตรวจสอบการเชื่อมต่อ
echo "🔍 ตรวจสอบการเชื่อมต่อฐานข้อมูล..."
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ เชื่อมต่อฐานข้อมูลสำเร็จ"
else
    echo "❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้"
    echo "   กรุณาตรวจสอบ:"
    echo "   1. PostgreSQL server ทำงานอยู่หรือไม่"
    echo "   2. ข้อมูลการเชื่อมต่อถูกต้องหรือไม่"
    echo "   3. User มีสิทธิ์เข้าถึงฐานข้อมูลหรือไม่"
    exit 1
fi

# รัน database setup script
echo "🏗️ สร้าง schema และตารางข้อมูล..."
if [ -f "database_setup.sql" ]; then
    run_sql "database_setup.sql"
    echo "✅ สร้าง schema เสร็จสิ้น"
else
    echo "❌ ไม่พบไฟล์ database_setup.sql"
    exit 1
fi

# ตรวจสอบตารางที่สร้างขึ้น
echo "🔍 ตรวจสอบตารางที่สร้างขึ้น..."
TABLES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;")

echo "📊 ตารางในฐานข้อมูล:"
for table in $TABLES; do
    table_trimmed=$(echo $table | xargs)  # remove whitespace
    if [ ! -z "$table_trimmed" ]; then
        count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM $table_trimmed;")
        echo "   ✅ $table_trimmed: $(echo $count | xargs) รายการ"
    fi
done

echo ""
echo "🎉 การสร้างฐานข้อมูลเสร็จสิ้น!"
echo ""
echo "📝 ขั้นตอนถัดไป:"
echo "   1. สร้างไฟล์ .env จาก env.example"
echo "   2. แก้ไขค่า DB_* ใน .env ตามข้อมูลการเชื่อมต่อ"
echo "   3. เริ่มต้นแอปพลิเคชัน: npm run dev"
echo ""