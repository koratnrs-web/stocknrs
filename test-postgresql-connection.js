#!/usr/bin/env node

// Test script สำหรับทดสอบการเชื่อมต่อ PostgreSQL
import { Pool } from 'pg';
import dotenv from 'dotenv';

// โหลด environment variables
dotenv.config();

console.log('🔍 ตรวจสอบการเชื่อมต่อฐานข้อมูล PostgreSQL...\n');

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
console.log(`   Password: ${dbConfig.password.substring(0, 3)}***`);
console.log('');

// สร้าง connection pool
const pool = new Pool(dbConfig);

async function testConnection() {
  try {
    console.log('⏳ กำลังทดสอบการเชื่อมต่อ...');
    
    // ทดสอบการเชื่อมต่อพื้นฐาน
    const client = await pool.connect();
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ!');

    // ตรวจสอบเวอร์ชันของ PostgreSQL
    const versionResult = await client.query('SELECT version()');
    console.log('📊 เวอร์ชัน PostgreSQL:', versionResult.rows[0].version.split(' ')[1]);

    // ตรวจสอบ current time
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('🕐 เวลาปัจจุบันจากฐานข้อมูล:', timeResult.rows[0].current_time.toLocaleString('th-TH'));

    client.release();

    // ตรวจสอบตารางในฐานข้อมูล
    console.log('\n🔍 ตรวจสอบตารางในฐานข้อมูล:');
    const tablesResult = await pool.query(`
      SELECT tablename, schemaname 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    if (tablesResult.rows.length === 0) {
      console.log('❌ ไม่พบตารางในฐานข้อมูล');
      console.log('💡 กรุณารันสคริปต์ setup-database-schema.sh เพื่อสร้างตาราง');
    } else {
      console.log('📊 รายการตาราง:');
      
      for (const table of tablesResult.rows) {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) FROM ${table.tablename}`);
          const count = parseInt(countResult.rows[0].count);
          console.log(`   ✅ ${table.tablename}: ${count} รายการ`);
        } catch (error) {
          console.log(`   ❌ ${table.tablename}: ไม่สามารถนับจำนวนได้ (${error.message})`);
        }
      }
    }

    // ทดสอบ CRUD operations (ถ้ามีตาราง categories)
    const hasCategories = tablesResult.rows.some(row => row.tablename === 'categories');
    if (hasCategories) {
      console.log('\n🧪 ทดสอบการทำงาน CRUD:');
      
      try {
        // ทดสอบ INSERT
        const insertResult = await pool.query(
          "INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING RETURNING *",
          ['Test Category', 'หมวดทดสอบการเชื่อมต่อ']
        );
        
        if (insertResult.rows.length > 0) {
          console.log('   ✅ INSERT: สร้างข้อมูลทดสอบสำเร็จ');
          
          // ทดสอบ SELECT
          const selectResult = await pool.query(
            "SELECT * FROM categories WHERE name = $1",
            ['Test Category']
          );
          console.log(`   ✅ SELECT: ดึงข้อมูลสำเร็จ (${selectResult.rows.length} รายการ)`);
          
          // ทดสอบ DELETE (ลบข้อมูลทดสอบ)
          await pool.query("DELETE FROM categories WHERE name = $1", ['Test Category']);
          console.log('   ✅ DELETE: ลบข้อมูลทดสอบสำเร็จ');
        } else {
          console.log('   ℹ️ ข้อมูลทดสอบมีอยู่แล้ว (ข้าม CRUD test)');
        }
      } catch (error) {
        console.log(`   ❌ CRUD Test ล้มเหลว: ${error.message}`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ:', error.message);
    
    // แสดงคำแนะนำการแก้ไข
    console.log('\n💡 คำแนะนำการแก้ไข:');
    if (error.code === 'ECONNREFUSED') {
      console.log('   - ตรวจสอบว่า PostgreSQL server ทำงานอยู่');
      console.log('   - ตรวจสอบ host และ port ในการตั้งค่า');
    } else if (error.code === '28P01') {
      console.log('   - ตรวจสอบ username และ password');
      console.log('   - ตรวจสอบสิทธิ์การเข้าถึงของ user');
    } else if (error.code === '3D000') {
      console.log('   - ฐานข้อมูลไม่มีอยู่ กรุณาสร้างฐานข้อมูลก่อน');
    }
    
    return false;
  } finally {
    await pool.end();
  }
}

testConnection().then((success) => {
  if (success) {
    console.log('\n🎉 การตรวจสอบเสร็จสิ้น: ฐานข้อมูล PostgreSQL พร้อมใช้งาน!');
    process.exit(0);
  } else {
    console.log('\n❌ การตรวจสอบเสร็จสิ้น: พบปัญหาในการเชื่อมต่อฐานข้อมูล');
    process.exit(1);
  }
});