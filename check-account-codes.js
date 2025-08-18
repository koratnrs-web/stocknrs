#!/usr/bin/env node

// สคริปต์ดูข้อมูลในตาราง account_codes
import { Pool } from 'pg';
import dotenv from 'dotenv';

// โหลด environment variables
dotenv.config();

console.log('🔍 ตรวจสอบข้อมูลในตาราง account_codes...\n');

// กำหนดค่าการเชื่อมต่อ
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'stocknrs',
  user: process.env.DB_USER || 'stockuser',
  password: process.env.DB_PASSWORD || 'Login123',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

console.log('📋 การตั้งค่าการเชื่อมต่อ:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log('');

// สร้าง connection pool
const pool = new Pool(dbConfig);

async function checkAccountCodes() {
  try {
    console.log('⏳ กำลังเชื่อมต่อฐานข้อมูล...');
    
    // ทดสอบการเชื่อมต่อ
    const client = await pool.connect();
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ!');

    // ดูข้อมูลในตาราง account_codes
    console.log('\n📊 ข้อมูลในตาราง account_codes:');
    const result = await client.query('SELECT id, code, name FROM account_codes ORDER BY code');
    
    if (result.rows.length === 0) {
      console.log('❌ ไม่พบข้อมูลในตาราง account_codes');
    } else {
      console.log(`✅ พบข้อมูล ${result.rows.length} รายการ:\n`);
      
      // แสดงข้อมูลในรูปแบบตาราง
      console.log('ID  | Code        | Name');
      console.log('----|-------------|----------------------------------------');
      
      result.rows.forEach(row => {
        const id = row.id.toString().padEnd(4);
        const code = (row.code || '').padEnd(13);
        const name = row.name || '';
        console.log(`${id} | ${code} | ${name}`);
      });
      
      console.log('\n📋 รายละเอียดเพิ่มเติม:');
      console.log(`   - จำนวนรหัสบัญชีทั้งหมด: ${result.rows.length} รายการ`);
      
      // ดูโครงสร้างตาราง
      console.log('\n🏗️ โครงสร้างตาราง account_codes:');
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'account_codes' 
        ORDER BY ordinal_position
      `);
      
      structureResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultValue = col.column_default ? `DEFAULT ${col.column_default}` : '';
        console.log(`   - ${col.column_name}: ${col.data_type} ${nullable} ${defaultValue}`.trim());
      });
    }

    client.release();
    return true;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

checkAccountCodes().then((success) => {
  if (success) {
    console.log('\n🎉 การตรวจสอบเสร็จสิ้น!');
    process.exit(0);
  } else {
    console.log('\n❌ การตรวจสอบล้มเหลว');
    process.exit(1);
  }
});
