# حل مشكلة عدم ظهور الحسابات

## الخطوات للتشخيص:

### 1. تطبيق Migration على قاعدة البيانات
قبل كل شيء، يجب تطبيق الـ migration الجديد على Supabase:

```sql
-- في Supabase SQL Editor، نفذ هذا الكود:

DROP POLICY IF EXISTS "Allow anon to view users" ON users;

CREATE POLICY "Allow anon to view users"
  ON users FOR SELECT
  TO anon
  USING (true);
```

### 2. التحقق من الحسابات في قاعدة البيانات
افتح Supabase Dashboard > Table Editor > users

تحقق من:
- هل توجد حسابات في الجدول؟
- هل الحقل `is_active` = `true`؟
- هل الحقول `username` أو `email` موجودة؟

### 3. تحديث الحسابات إذا لزم الأمر
إذا كانت الحسابات لديها `is_active = false` أو `null`، قم بتحديثها:

```sql
-- جعل جميع الحسابات نشطة
UPDATE users SET is_active = true WHERE is_active IS NULL OR is_active = false;
```

### 4. فتح Console في المتصفح
افتح Developer Tools (F12) > Console وسترى:
- عدد الحسابات الموجودة
- عدد الحسابات النشطة
- أي أخطاء في الاتصال

### 5. إذا استمرت المشكلة
تحقق من:
- هل Supabase URL و API Key صحيحة في `.env`؟
- هل الـ RLS مفعل على جدول `users`؟
- هل هناك أي أخطاء في Network tab في Developer Tools؟



