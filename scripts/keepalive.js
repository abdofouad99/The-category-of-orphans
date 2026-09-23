// scripts/keepalive.js
const { PrismaClient } = require('@prisma/client');

async function testConnection(url) {
  const p = new PrismaClient(url ? { datasources: { db: { url } } } : undefined);
  try {
    const user = await p.user.findFirst({ select: { id: true, name: true } });
    const count = await p.user.count();
    return { success: true, count, name: user?.name };
  } finally {
    await p.$disconnect().catch(() => {});
  }
}

async function keepAlive() {
  const now = new Date().toISOString();
  console.log(`[${now}] بدء فحص إبقاء الاتصال (Keep-Alive)...`);
  
  // Try 1: Default DATABASE_URL (Port 6543)
  try {
    const res = await testConnection();
    console.log(`✅ تم الاتصال بقاعدة البيانات بنجاح (Pooler 6543): مستخدم نشط (${res.name || 'موجود'}) | إجمالي: ${res.count}`);
    console.log('🎉 تم تجديد نشاط مشروع Supabase بنجاح! تم تصفير عداد الخمول للأيام الـ 7 القادمة.');
    return;
  } catch (err1) {
    console.log('⚠️ المحاولة عبر المنفذ 6543 واجهت تأخيراً، جاري التحويل للمنفذ المباشر 5432...');
  }

  // Try 2: DIRECT_URL (Port 5432)
  try {
    const directUrl = "postgresql://postgres.fzxqojzhrkdqfuoajxoo:Abdo770681605%40@3.111.105.85:5432/postgres?sslmode=require";
    const res = await testConnection(directUrl);
    console.log(`✅ تم الاتصال المباشر بقاعدة البيانات بنجاح (Direct 5432): مستخدم نشط (${res.name || 'موجود'}) | إجمالي: ${res.count}`);
    console.log('🎉 تم تجديد نشاط مشروع Supabase بنجاح! تم تصفير عداد الخمول للأيام الـ 7 القادمة.');
  } catch (err2) {
    console.error('❌ فشل الاتصال عبر كلا المنفذين:', err2.message || err2);
  }
}

keepAlive();
