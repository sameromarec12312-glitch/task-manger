import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── ADMINS ───────────────────────────────────────────────────────────────────
export async function signupAdmin({ adminName, username, password }) {
  const { data: existing } = await supabase
    .from('admins').select('id').eq('username', username).maybeSingle()
  if (existing) throw new Error('اسم المستخدم موجود مسبقاً')

  const { data, error } = await supabase
    .from('admins').insert({ name: adminName, username, password }).select().single()
  if (error) throw error
  return data
}

export async function loginAdmin({ username, password }) {
  const { data } = await supabase
    .from('admins').select('*').eq('username', username).eq('password', password).maybeSingle()
  if (!data) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة')
  return data
}

// ─── ORGS ─────────────────────────────────────────────────────────────────────
export async function getOrgsByAdmin(adminId) {
  const { data } = await supabase
    .from('orgs').select('*').eq('admin_id', adminId).order('created_at', { ascending: false })
  return data || []
}

export async function createOrg({ adminId, orgName, slug }) {
  const safeSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const { data: existing } = await supabase
    .from('orgs').select('id').eq('slug', safeSlug).maybeSingle()
  if (existing) throw new Error('هذا الرابط مستخدم، جرب اسماً آخر')

  const { data, error } = await supabase
    .from('orgs').insert({ admin_id: adminId, name: orgName, slug: safeSlug }).select().single()
  if (error) throw error
  await seedDefaultTasks(data.id)
  return data
}

export async function deleteOrg(orgId) {
  const { error } = await supabase.from('orgs').delete().eq('id', orgId)
  if (error) throw error
}

export async function updateOrgName(orgId, name) {
  const { error } = await supabase.from('orgs').update({ name }).eq('id', orgId)
  if (error) throw error
}

export async function getOrgBySlug(slug) {
  const { data } = await supabase.from('orgs').select('*').eq('slug', slug).maybeSingle()
  if (!data) throw new Error('المؤسسة غير موجودة')
  return data
}

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
export async function getEmployees(orgId) {
  const { data } = await supabase.from('employees').select('*').eq('org_id', orgId).order('name')
  return data || []
}

export async function addEmployee({ orgId, name, pin }) {
  const { data: existing } = await supabase
    .from('employees').select('id').eq('org_id', orgId).eq('pin', pin).maybeSingle()
  if (existing) throw new Error('هذا الكود مستخدم بالفعل')
  const { data, error } = await supabase
    .from('employees').insert({ org_id: orgId, name, pin }).select().single()
  if (error) throw error
  return data
}

export async function deleteEmployee(id) {
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) throw error
}

export async function loginEmployee({ orgId, pin }) {
  const { data } = await supabase
    .from('employees').select('*').eq('org_id', orgId).eq('pin', pin).maybeSingle()
  if (!data) throw new Error('الكود غير صحيح')
  return data
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
export async function getTasks(orgId) {
  const { data } = await supabase.from('tasks').select('*').eq('org_id', orgId)
    .order('category').order('created_at')
  return data || []
}

export async function addTask({ orgId, category, name }) {
  const { data, error } = await supabase
    .from('tasks').insert({ org_id: orgId, category, name }).select().single()
  if (error) throw error
  return data
}

export async function updateTask(id, name) {
  const { error } = await supabase.from('tasks').update({ name }).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ─── SUBMISSIONS ──────────────────────────────────────────────────────────────
export async function getSubmissions(orgId, { employeeId, date } = {}) {
  let q = supabase.from('submissions').select('*')
    .eq('org_id', orgId).order('submitted_at', { ascending: false })
  if (employeeId) q = q.eq('employee_id', employeeId)
  if (date) q = q.eq('date', date)
  const { data } = await q
  return data || []
}

export async function getTodaySubmission(orgId, employeeId) {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase.from('submissions').select('*')
    .eq('org_id', orgId).eq('employee_id', employeeId).eq('date', today).maybeSingle()
  return data || null
}

export async function submitWork({ orgId, employeeId, employeeName, entries }) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase.from('submissions')
    .insert({ org_id: orgId, employee_id: employeeId, employee_name: employeeName, date: today, entries })
    .select().single()
  if (error) throw error
  return data
}

// ─── SEED ─────────────────────────────────────────────────────────────────────
const DEFAULT_TASKS = [
  { category: "تهيئة صوصبات", name: "ثوم صغير عدد" },
  { category: "تهيئة صوصبات", name: "ثوم كبير حر عدد" },
  { category: "تهيئة صوصبات", name: "ثوم صغير حر عدد" },
  { category: "تهيئة صوصبات", name: "طحينة كبير عدد" },
  { category: "تهيئة صوصبات", name: "صوص مندي كبير عدد" },
  { category: "تهيئة صوصبات", name: "صوص مندي صغير عدد" },
  { category: "تهيئة صوصبات", name: "ليمون و ثوم صغير عدد" },
  { category: "تهيئة صوصبات", name: "مكسرات صغير عدد" },
  { category: "تهيئة صوصبات", name: "مكسرات كبير عدد" },
  { category: "تقطيع خضره", name: "بقدونس جرزه عدد" },
  { category: "تقطيع خضره", name: "خس حبه عدد" },
  { category: "تقطيع خضره", name: "خيار حبه عدد" },
  { category: "تقطيع خضره", name: "بندوره كرتونه عدد" },
  { category: "تقطيع خضره", name: "بصل كغ" },
  { category: "تنضيف و ترتيب", name: "براد كبير تحت" },
  { category: "تنضيف و ترتيب", name: "فريزة كبيره تحت" },
  { category: "تنضيف و ترتيب", name: "ممتلوع" },
  { category: "تنضيف و ترتيب", name: "جلي المطبخ" },
  { category: "تنضيف و ترتيب", name: "جلي البسطة" },
  { category: "تنزيل بضاعه", name: "خبز ساج" },
  { category: "تنزيل بضاعه", name: "خبز بن" },
  { category: "تنزيل بضاعه", name: "خبز برغل" },
  { category: "تنزيل بضاعه", name: "كاشن كيري" },
  { category: "تنزيل بضاعه", name: "طلبيت تزيه" },
  { category: "تنزيل بضاعه", name: "جاج على الفريزه" },
  { category: "تنزيل بضاعه", name: "لحمه على الفريزه" },
  { category: "تنزيل بضاعه", name: "خضره على ابراد" },
  { category: "تقاطيع من الفريزه", name: "مندي جاج كرتون عدد" },
  { category: "تقاطيع من الفريزه", name: "مندي جاج فخد كرتون عدد" },
  { category: "تقاطيع من الفريزه", name: "موزات مندي كرتون عدد" },
  { category: "تقاطيع من الفريزه", name: "تندر جاط عدد" },
  { category: "تقاطيع من الفريزه", name: "فروج شوي جاج عدد" },
  { category: "تقاطيع من الفريزه", name: "جوانح جاج عدد" },
  { category: "تقاطيع من الفريزه", name: "درام ستيك عدد" },
  { category: "تقاطيع من الفريزه", name: "مندي لحمه شقف كغ" },
]

async function seedDefaultTasks(orgId) {
  await supabase.from('tasks').insert(DEFAULT_TASKS.map(t => ({ org_id: orgId, ...t })))
}
