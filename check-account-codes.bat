@echo off
chcp 65001 >nul
echo 🔍 ตรวจสอบข้อมูลในตาราง account_codes...
echo.

"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d stocknrs -c "SET client_encoding TO 'UTF8'; SELECT id, code, name FROM account_codes ORDER BY code;"

echo.
echo ✅ เสร็จสิ้นการตรวจสอบ
pause
