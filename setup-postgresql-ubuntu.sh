#!/bin/bash

# =======================================================
# สคริปต์ติดตั้ง PostgreSQL บน Ubuntu Server
# =======================================================

set -e

echo "🚀 เริ่มต้นการติดตั้ง PostgreSQL บน Ubuntu Server..."

# ตรวจสอบ user privileges
if [ "$EUID" -ne 0 ]; then 
    echo "❌ กรุณารันสคริปต์นี้ด้วย sudo หรือ root user"
    exit 1
fi

# Update package list
echo "📦 อัพเดต package list..."
apt update

# ติดตั้ง PostgreSQL
echo "🔧 ติดตั้ง PostgreSQL และ tools ที่จำเป็น..."
apt install -y postgresql postgresql-contrib postgresql-client

# เริ่มต้น PostgreSQL service
echo "▶️ เริ่มต้นและเปิดใช้งาน PostgreSQL service..."
systemctl start postgresql
systemctl enable postgresql

# ตรวจสอบสถานะ
echo "✅ ตรวจสอบสถานะ PostgreSQL..."
systemctl status postgresql --no-pager -l

# สร้าง database และ user สำหรับแอปพลิเคชัน
echo "👤 ตั้งค่า database และ user..."

# ตั้งค่า password สำหรับ postgres user (ให้ user กรอกเอง)
echo "🔐 ตั้งค่า password สำหรับ postgres user:"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_secure_password';"

# สร้าง database สำหรับ stock management
echo "🗄️ สร้าง database สำหรับระบบจัดการสต็อก..."
sudo -u postgres createdb storcknrs

# สร้าง user สำหรับแอปพลิเคชัน
echo "👥 สร้าง user สำหรับแอปพลิเคชัน..."
sudo -u postgres psql -c "CREATE USER koratnrs WITH PASSWORD 'Login123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE storcknrs TO koratnrs;"
sudo -u postgres psql -d storcknrs -c "GRANT ALL ON SCHEMA public TO koratnrs;"

# ตั้งค่า PostgreSQL configuration
echo "⚙️ ตั้งค่า PostgreSQL configuration..."

# สำรองไฟล์ config เดิม
cp /etc/postgresql/*/main/postgresql.conf /etc/postgresql/*/main/postgresql.conf.backup
cp /etc/postgresql/*/main/pg_hba.conf /etc/postgresql/*/main/pg_hba.conf.backup

# แก้ไข postgresql.conf เพื่อให้รับ connection จากภายนอก
POSTGRESQL_VERSION=$(ls /etc/postgresql/)
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/$POSTGRESQL_VERSION/main/postgresql.conf

# แก้ไข pg_hba.conf เพื่อให้ authentication ผ่าน md5
echo "host    all             all             0.0.0.0/0               md5" >> /etc/postgresql/$POSTGRESQL_VERSION/main/pg_hba.conf

# รีสตาร์ท PostgreSQL เพื่อให้การตั้งค่าใหม่มีผล
echo "🔄 รีสตาร์ท PostgreSQL service..."
systemctl restart postgresql

# ตั้งค่า firewall (ถ้ามี ufw)
if command -v ufw &> /dev/null; then
    echo "🔥 ตั้งค่า firewall สำหรับ PostgreSQL..."
    ufw allow 5432/tcp
    echo "⚠️ กรุณาตรวจสอบการตั้งค่า firewall ให้เหมาะสมกับความต้องการ"
fi

echo ""
echo "🎉 การติดตั้ง PostgreSQL เสร็จสิ้น!"
echo ""
echo "📋 ข้อมูลการเชื่อมต่อ:"
echo "   Host: $(hostname -I | awk '{print $1}') หรือ localhost"
echo "   Port: 5432"
echo "   Database: storcknrs"
echo "   Username: koratnrs"
echo "   Password: Login123"
echo ""
echo "⚠️ คำแนะนำด้านความปลอดภัย:"
echo "   1. เปลี่ยน password ทั้งหมดให้แข็งแกร่งขึ้น"
echo "   2. ตั้งค่า firewall ให้เหมาะสม"
echo "   3. ตรวจสอบการตั้งค่า pg_hba.conf"
echo "   4. สำรองข้อมูลเป็นประจำ"
echo ""
echo "🔧 คำสั่งทดสอบการเชื่อมต่อ:"
echo "   psql -h localhost -U koratnrs -d storcknrs"