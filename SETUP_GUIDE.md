# 🚀 دليل النشر الكامل — خطوة بخطوة

## المطلوب: 3 حسابات مجانية
1. **Supabase** — قاعدة البيانات (supabase.com)
2. **GitHub** — لحفظ الكود (github.com)
3. **Vercel** — لنشر الموقع (vercel.com)

---

## الخطوة 1: إعداد Supabase

### 1.1 إنشاء المشروع
1. اذهب إلى https://supabase.com → اضغط **Start your project**
2. اضغط **New Project** → اختر اسماً وكلمة مرور
3. انتظر دقيقتين حتى يكتمل الإنشاء

### 1.2 إنشاء الجداول
1. من القائمة اضغط **SQL Editor** → **New query**
2. انسخ والصق الكود التالي كاملاً ثم اضغط **Run**:

```sql
-- جدول المديرين (حساب واحد يدير أكثر من مؤسسة)
create table admins (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text unique not null,
  password text not null,
  created_at timestamptz default now()
);

-- جدول المؤسسات (كل مدير ممكن عنده أكثر من مؤسسة)
create table orgs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(id) on delete cascade,
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- جدول الموظفين
create table employees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  name text not null,
  pin text not null,
  created_at timestamptz default now()
);

-- جدول المهام
create table tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  category text not null,
  name text not null,
  created_at timestamptz default now()
);

-- جدول التسليمات
create table submissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  employee_name text not null,
  date date not null,
  entries jsonb not null default '{}',
  submitted_at timestamptz default now()
);

-- صلاحيات الوصول
alter table admins enable row level security;
alter table orgs enable row level security;
alter table employees enable row level security;
alter table tasks enable row level security;
alter table submissions enable row level security;

create policy "allow_all" on admins for all using (true) with check (true);
create policy "allow_all" on orgs for all using (true) with check (true);
create policy "allow_all" on employees for all using (true) with check (true);
create policy "allow_all" on tasks for all using (true) with check (true);
create policy "allow_all" on submissions for all using (true) with check (true);
```

### 1.3 الحصول على مفاتيح API
1. اضغط **Settings** (⚙️) → **API**
2. انسخ واحفظ:
   - **Project URL**
   - **anon public** key

---

## الخطوة 2: رفع الكود على GitHub

1. اذهب إلى https://github.com → **New repository**
2. اسم المشروع: `task-manager` → اضغط **Create**
3. اضغط **uploading an existing file**
4. اسحب وأفلت كل الملفات (بدون node_modules و .env)
5. اضغط **Commit changes**

---

## الخطوة 3: النشر على Vercel

1. اذهب إلى https://vercel.com → **Sign up with GitHub**
2. اضغط **Add New Project** → اختر `task-manager`
3. قبل Deploy، اضغط **Environment Variables** وأضف:

| الاسم | القيمة |
|-------|--------|
| `REACT_APP_SUPABASE_URL` | رابط Supabase |
| `REACT_APP_SUPABASE_ANON_KEY` | المفتاح anon |

4. اضغط **Deploy** → انتظر 3 دقائق ✅

---

## كيف يعمل التطبيق

### كمدير:
1. اضغط **إنشاء حساب جديد** — تسجل مرة واحدة فقط
2. بعد الدخول ترى قائمة مؤسساتك
3. اضغط **إضافة مؤسسة جديدة** لكل فرع أو مطعم
4. ادخل أي مؤسسة وأضف موظفيها ومهامها

### كموظف:
1. يفتح الرابط الخاص بمؤسسته
2. يدخل الكود
3. يسجل المهام ✅

---

## 🆓 التكلفة: مجاني تماماً للاستخدام العادي
