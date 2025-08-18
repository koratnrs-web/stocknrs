# 🔧 คู่มือการแก้ไขปัญหา Encoding ใน PostgreSQL

## 🚨 **ปัญหาที่พบ:**
```
ERROR: character with byte sequence 0xe0 0xb8 0x84 in encoding "UTF8" has no equivalent in encoding "WIN1252"
```

## ✅ **วิธีแก้ไข:**

### 1. **เปลี่ยน Code Page ของ Command Prompt:**
```cmd
chcp 65001
```

### 2. **ใช้ SET client_encoding ใน PostgreSQL:**
```sql
SET client_encoding TO 'UTF8';
```

### 3. **ตัวอย่างการใช้งาน:**
```cmd
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d stocknrs -c "SET client_encoding TO 'UTF8'; SELECT * FROM account_codes;"
```

## 📁 **ไฟล์ที่สร้างขึ้น:**

### **check-account-codes.bat**
- ดูข้อมูลในตาราง account_codes
- แก้ไขปัญหา encoding อัตโนมัติ

### **check-all-tables.bat**
- ดูข้อมูลในตารางหลักทั้งหมด
- แก้ไขปัญหา encoding อัตโนมัติ

## 🚀 **วิธีใช้งาน:**

1. **รันไฟล์ batch:**
   ```cmd
   check-account-codes.bat
   ```

2. **หรือใช้คำสั่งโดยตรง:**
   ```cmd
   chcp 65001
   "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d stocknrs -c "SET client_encoding TO 'UTF8'; SELECT * FROM account_codes;"
   ```

## 🔍 **สาเหตุของปัญหา:**
- Windows Command Prompt ใช้ encoding WIN1252 เป็นค่าเริ่มต้น
- ข้อมูลในฐานข้อมูลเป็น UTF8
- การแสดงผลภาษาไทยจึงมีปัญหา

## 💡 **คำแนะนำ:**
- ใช้ไฟล์ batch ที่สร้างขึ้นเพื่อความสะดวก
- หรือเปลี่ยน code page ก่อนใช้ psql command
- ใช้ Node.js script เป็นทางเลือกที่ดีกว่า (ไม่มีปัญหา encoding)
