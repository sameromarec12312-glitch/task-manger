import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTasks, addTask, updateTask, deleteTask, getEmployees, addEmployee, deleteEmployee, getSubmissions } from '../lib/supabase'

export default function AdminDashboard() {
  const nav = useNavigate()
  const [org, setOrg] = useState(null)
  const [tab, setTab] = useState('reports')
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_org')
    if (!stored) { nav('/admin/login'); return }
    const o = JSON.parse(stored)
    setOrg(o)
    loadAll(o.id)
  }, [nav])

  const loadAll = async (orgId) => {
    setLoading(true)
    const [t, e, s] = await Promise.all([getTasks(orgId), getEmployees(orgId), getSubmissions(orgId)])
    setTasks(t); setEmployees(e); setSubmissions(s)
    setLoading(false)
  }

  const reload = () => org && loadAll(org.id)

  const logout = () => { sessionStorage.removeItem('admin_org'); nav('/') }

  const appUrl = window.location.origin

  if (!org) return <div className="loading"><div className="spinner" /><span>تحميل...</span></div>

  return (
    <div className="page">
      <nav className="topnav">
        <div>
          <div className="topnav-title">🛡 {org.name}</div>
          <div className="topnav-sub">مرحباً {org.admin_name}</div>
        </div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>

      {/* Employee link banner */}
      <div style={{ background: 'var(--amber-light)', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: 12, color: 'var(--amber-dark)', fontWeight: 700, marginBottom: 4 }}>
            🔗 رابط الموظفين — أرسل هذا الرابط لموظفيك:
          </p>
          <div className="link-box">
            <span>{appUrl}/org/{org.slug}</span>
            <button className="btn-sm btn-amber" onClick={() => {
              navigator.clipboard?.writeText(`${appUrl}/org/${org.slug}`)
              alert('تم نسخ الرابط!')
            }}>📋 نسخ</button>
          </div>
        </div>
      </div>

      <div className="tabs">
        {[['reports', '📊 التقارير'], ['tasks', '📋 المهام'], ['employees', '👥 الموظفين']].map(([k, l]) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><span>تحميل...</span></div>
      ) : (
        <>
          {tab === 'reports' && <ReportsTab submissions={submissions} employees={employees} tasks={tasks} orgId={org.id} reload={reload} />}
          {tab === 'tasks' && <TasksTab tasks={tasks} orgId={org.id} reload={reload} />}
          {tab === 'employees' && <EmployeesTab employees={employees} orgId={org.id} appUrl={appUrl} orgSlug={org.slug} reload={reload} />}
        </>
      )}
    </div>
  )
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function ReportsTab({ submissions, employees, tasks, orgId, reload }) {
  const [filterEmp, setFilterEmp] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [openId, setOpenId] = useState(null) // which submission is expanded

  const filtered = submissions.filter(s =>
    (!filterEmp || s.employee_id === filterEmp) &&
    (!filterDate || s.date === filterDate)
  )
  const categories = [...new Set(tasks.map(t => t.category))]

  const handleRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false) }

  const exportCSV = () => {
    const rows = [['الموظف', 'التاريخ', 'المهمة', 'الكمية', 'الوقت (دقيقة)']]
    filtered.forEach(sub => {
      tasks.forEach(t => {
        const e = sub.entries?.[t.id]
        if (e?.qty || e?.time) rows.push([sub.employee_name, sub.date, t.name, e.qty || '', e.time || ''])
      })
    })
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `تقرير_${filterDate || 'كل'}.csv`
    a.click()
  }

  // Count filled tasks for a submission
  const countFilled = (sub) => tasks.filter(t => sub.entries?.[t.id]?.qty || sub.entries?.[t.id]?.time).length

  return (
    <div className="tab-content">
      <div className="filter-row">
        <select className="select-plain" value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
          <option value="">كل الموظفين</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input type="date" className="input-plain" style={{ flex: 1, minWidth: 130 }}
          value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        <button className="btn-sm btn-amber" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? '...' : '🔄'}
        </button>
        <button className="btn-sm btn-green" onClick={exportCSV}>⬇ CSV</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>لا توجد تسليمات</p>
        </div>
      ) : filtered.map(sub => {
        const isOpen = openId === sub.id
        const filled = countFilled(sub)
        return (
          <div key={sub.id} style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>

            {/* ── Collapsed row — always visible ── */}
            <button
              onClick={() => setOpenId(isOpen ? null : sub.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', background: 'white', border: 'none',
                cursor: 'pointer', textAlign: 'right', fontFamily: "'Cairo', sans-serif",
                borderBottom: isOpen ? '2px solid var(--amber)' : 'none'
              }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: 'var(--amber)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 16, color: 'white', flexShrink: 0
              }}>
                {sub.employee_name[0]}
              </div>

              {/* Name + date */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--dark)' }}>{sub.employee_name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  📅 {sub.date} &nbsp;·&nbsp; ✅ {filled} مهمة
                </div>
              </div>

              {/* Arrow */}
              <div style={{
                fontSize: 18, color: 'var(--muted)',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>⌄</div>
            </button>

            {/* ── Expanded details ── */}
            {isOpen && (
              <div style={{ background: '#fafafa', padding: '12px 16px' }}>
                {categories.map(cat => {
                  const catFilled = tasks.filter(t => t.category === cat && (sub.entries?.[t.id]?.qty || sub.entries?.[t.id]?.time))
                  if (!catFilled.length) return null
                  return (
                    <div key={cat} style={{ marginBottom: 14 }}>
                      <div className="cat-label">{cat}</div>
                      <table className="data-table">
                        <thead><tr>
                          <th>المهمة</th>
                          <th style={{ textAlign: 'center' }}>الكمية</th>
                          <th style={{ textAlign: 'center' }}>الوقت(د)</th>
                        </tr></thead>
                        <tbody>
                          {catFilled.map(t => (
                            <tr key={t.id}>
                              <td>{t.name}</td>
                              <td className="num">{sub.entries[t.id]?.qty || '-'}</td>
                              <td className="num">{sub.entries[t.id]?.time || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
function TasksTab({ tasks, orgId, reload }) {
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const categories = [...new Set(tasks.map(t => t.category))]

  const handleAdd = async () => {
    if (!newName.trim() || !newCat.trim()) return
    setSaving(true)
    try { await addTask({ orgId, category: newCat.trim(), name: newName.trim() }); await reload(); setNewName(''); setNewCat('') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('حذف المهمة؟')) return
    await deleteTask(id); reload()
  }

  const handleEdit = async (id) => {
    await updateTask(id, editName); setEditId(null); reload()
  }

  return (
    <div className="tab-content">
      <div className="card">
        <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>إضافة مهمة جديدة</h3>
        <div className="form-grid">
          <input className="input-plain" placeholder="الفئة" list="cats" value={newCat} onChange={e => setNewCat(e.target.value)} />
          <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
          <input className="input-plain" placeholder="اسم المهمة" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <button className="btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? '...' : '+ إضافة'}
          </button>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat} className="cat-section">
          <div className="cat-header">{cat}</div>
          {tasks.filter(t => t.category === cat).map(t => (
            <div key={t.id} className="task-admin-row">
              {editId === t.id ? (
                <>
                  <input className="input-plain" style={{ flex: 1 }} value={editName} onChange={e => setEditName(e.target.value)} />
                  <button className="btn-sm btn-green" onClick={() => handleEdit(t.id)}>💾</button>
                  <button className="btn-sm btn-red" onClick={() => setEditId(null)}>✕</button>
                </>
              ) : (
                <>
                  <span>{t.name}</span>
                  <button className="icon-btn" onClick={() => { setEditId(t.id); setEditName(t.name) }}>✏️</button>
                  <button className="icon-btn" onClick={() => handleDelete(t.id)}>🗑</button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
function EmployeesTab({ employees, orgId, appUrl, orgSlug, reload }) {
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')

  const handleAdd = async () => {
    setError('')
    if (!newName.trim()) return setError('أدخل اسم الموظف')
    if (newPin.length < 4) return setError('الكود يجب أن يكون 4 أرقام على الأقل')
    setSaving(true)
    try {
      await addEmployee({ orgId, name: newName.trim(), pin: newPin })
      await reload(); setNewName(''); setNewPin('')
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('حذف الموظف؟')) return
    await deleteEmployee(id); reload()
  }

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text)
    setCopied(key); setTimeout(() => setCopied(''), 2000)
  }

  const empLink = `${appUrl}/org/${orgSlug}`

  return (
    <div className="tab-content">
      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>إضافة موظف جديد</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          الموظف يدخل فقط عبر رابط مؤسستك + الكود الخاص به
        </p>
        <div className="form-grid">
          <input className="input-plain" placeholder="اسم الموظف" value={newName}
            onChange={e => setNewName(e.target.value)} />
          <input className="input-plain" placeholder="كود الدخول (4-6 أرقام)" maxLength={6}
            value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
          <button className="btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? '...' : '+ إضافة الموظف'}
          </button>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <p>لم تضف موظفين بعد</p>
        </div>
      ) : employees.map(e => (
        <div key={e.id} className="emp-row">
          <div className="emp-avatar">{e.name[0]}</div>
          <div style={{ flex: 1 }}>
            <div className="emp-name">{e.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <span className="emp-code">🔑 {e.pin}</span>
              <button className="btn-sm btn-blue" onClick={() => copy(e.pin, e.id + 'pin')}>
                {copied === e.id + 'pin' ? '✅ تم' : '📋 نسخ الكود'}
              </button>
              <button className="btn-sm btn-amber" onClick={() => copy(`${empLink}\nالكود: ${e.pin}`, e.id + 'full')}>
                {copied === e.id + 'full' ? '✅ تم' : '🔗 نسخ الرابط + الكود'}
              </button>
            </div>
          </div>
          <button className="icon-btn" onClick={() => handleDelete(e.id)}>🗑</button>
        </div>
      ))}
    </div>
  )
}
