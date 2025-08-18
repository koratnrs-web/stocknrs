@echo off
chcp 65001 >nul
echo 🔍 ตรวจสอบข้อมูลในตารางทั้งหมด...
echo.

echo 📊 ตาราง account_codes:
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d stocknrs -c "SET client_encoding TO 'UTF8'; SELECT id, code, name FROM account_codes ORDER BY code;"

echo.
echo 📊 ตาราง categories:
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d stocknrs -c "SET client_encoding TO 'UTF8'; SELECT id, name, description FROM categories ORDER BY name;"

echo.
echo 📊 ตาราง suppliers:
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d stocknrs -c "SET client_encoding TO 'UTF8'; SELECT id, name, email, phone FROM suppliers ORDER BY name;"

echo.
echo 📊 ตาราง products:
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d stocknrs -c "SET client_encoding TO 'UTF8'; SELECT id, name, sku, current_stock, unit_price FROM products ORDER BY name;"

echo.
echo ✅ เสร็จสิ้นการตรวจสอบ
pause
