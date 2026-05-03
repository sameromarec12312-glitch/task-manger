import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTasks, addTask, updateTask, deleteTask, getEmployees, addEmployee, deleteEmployee, getSubmissions } from '../lib/supabase'

export default function AdminDashboard() {
  const nav = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [org, setOrg] = useState(null)
  const [tab, setTab] = useState('reports')
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedAdmin = sessionStorage.getItem('admin')
    const storedOrg = sessionStorage.getItem('current_org')
    if (!storedAdmin || !storedOrg) { nav('/admin/orgs'); return }
    setAdmin(JSON.parse(storedAdmin))
    const o = JSON.parse(storedOrg)
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
  const logout = () => { sessionStorage.removeItem('admin'); sessionStorage.removeItem('current_org'); nav('/') }
  const backToOrgs = () => { sessionStorage.removeItem('current_org'); nav('/admin/orgs') }
  const appUrl = window.location.origin

  if (!org) return <div className="loading"><div className="spinner" /><span>تحميل...</span></div>

  return (
    <div className="page">
      <nav className="topnav">
        <div>
          <div className="topnav-title">🏢 {org.name}</div>
          <div className="topnav-sub" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={backToOrgs}>← العودة لقائمة المؤسسات</div>
        </div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>

      <div style={{ background: 'var(--amber-light)', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: 12, color: 'var(--amber-dark)', fontWeight: 700, marginBottom: 4 }}>🔗 رابط موظفي هذه المؤسسة:</p>
          <div className="link-box">
            <span style={{ fontSize: 13 }}>{appUrl}/org/{org.slug}</span>
            <button className="btn-sm btn-amber" onClick={() => { navigator.clipboard?.writeText(`${appUrl}/org/${org.slug}`); alert('تم نسخ الرابط!') }}>📋 نسخ</button>
          </div>
        </div>
      </div>

      <div className="tabs">
        {[['reports', '📊 التقارير'], ['tasks', '📋 المهام'], ['employees', '👥 الموظفين']].map(([k, l]) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {loading
        ? <div className="loading"><div className="spinner" /><span>تحميل...</span></div>
        : <>
          {tab === 'reports' && <ReportsTab submissions={submissions} employees={employees} tasks={tasks} reload={reload} />}
          {tab === 'tasks' && <TasksTab tasks={tasks} orgId={org.id} reload={reload} />}
          {tab === 'employees' && <EmployeesTab employees={employees} orgId={org.id} appUrl={appUrl} orgSlug={org.slug} reload={reload} />}
        </>
      }
    </div>
  )
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function ReportsTab({ submissions, employees, tasks, reload }) {
  const [viewMode, setViewMode] = useState('date') // date | employee
  const [filterEmp, setFilterEmp] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [openSub, setOpenSub] = useState(null)
  const [openGroup, setOpenGroup] = useState(null)

  const categories = [...new Set(tasks.map(t => t.category))]
  const countFilled = (sub) => tasks.filter(t => sub.entries?.[t.id]?.qty || sub.entries?.[t.id]?.time).length

  const filtered = submissions.filter(s =>
    (!filterEmp || s.employee_id === filterEmp) &&
    (!filterFrom || s.date >= filterFrom) &&
    (!filterTo || s.date <= filterTo)
  )

  // Group by date
  const byDate = filtered.reduce((acc, s) => { if (!acc[s.date]) acc[s.date] = []; acc[s.date].push(s); return acc }, {})
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  // Group by employee
  const byEmployee = filtered.reduce((acc, s) => {
    if (!acc[s.employee_id]) acc[s.employee_id] = { name: s.employee_name, subs: [] }
    acc[s.employee_id].subs.push(s)
    return acc
  }, {})

  const handleRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false) }

  const exportCSV = () => {
    const rows = [['الموظف', 'التاريخ', 'المهمة', 'الكمية', 'الوقت (دقيقة)']]
    filtered.forEach(sub => tasks.forEach(t => {
      const e = sub.entries?.[t.id]
      if (e?.qty || e?.time) rows.push([sub.employee_name, sub.date, t.name, e.qty || '', e.time || ''])
    }))
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'تقرير.csv'; a.click()
  }

  // Single submission expandable card
  const SubCard = ({ sub }) => {
    const isOpen = openSub === sub.id
    return (
      <div style={{ marginBottom: 6, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <button onClick={() => setOpenSub(isOpen ? null : sub.id)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          background: 'white', border: 'none', cursor: 'pointer', textAlign: 'right', fontFamily: "'Cairo', sans-serif"
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: 'var(--amber)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, color: 'white', flexShrink: 0
          }}>{sub.employee_name[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--dark)' }}>
              {viewMode === 'date' ? sub.employee_name : `📅 ${sub.date}`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>✅ {countFilled(sub)} مهمة</div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</div>
        </button>
        {isOpen && (
          <div style={{ background: '#fafafa', padding: '10px 12px' }}>
            {categories.map(cat => {
              const filled = tasks.filter(t => t.category === cat && (sub.entries?.[t.id]?.qty || sub.entries?.[t.id]?.time))
              if (!filled.length) return null
              return (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div className="cat-label">{cat}</div>
                  <table className="data-table">
                    <thead><tr><th>المهمة</th><th style={{ textAlign: 'center' }}>الكمية</th><th style={{ textAlign: 'center' }}>الوقت(د)</th></tr></thead>
                    <tbody>{filled.map(t => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td className="num">{sub.entries[t.id]?.qty || '-'}</td>
                        <td className="num">{sub.entries[t.id]?.time || '-'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="tab-content">

      {/* ── View mode toggle ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setViewMode('date')} style={{
          flex: 1, padding: '10px', border: 'none', borderRadius: 10, cursor: 'pointer',
          fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: 13,
          background: viewMode === 'date' ? 'var(--dark)' : 'white',
          color: viewMode === 'date' ? 'white' : 'var(--muted)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}>📅 حسب اليوم</button>
        <button onClick={() => setViewMode('employee')} style={{
          flex: 1, padding: '10px', border: 'none', borderRadius: 10, cursor: 'pointer',
          fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: 13,
          background: viewMode === 'employee' ? 'var(--dark)' : 'white',
          color: viewMode === 'employee' ? 'white' : 'var(--muted)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}>👤 حسب الموظف</button>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select className="select-plain" style={{ flex: 1, minWidth: 130 }} value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
            <option value="">كل الموظفين</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <button className="btn-sm btn-amber" onClick={handleRefresh} disabled={refreshing}>{refreshing ? '...' : '🔄'}</button>
          <button className="btn-sm btn-green" onClick={exportCSV}>⬇ CSV</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>من</div>
            <input type="date" className="input-plain" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>إلى</div>
            <input type="date" className="input-plain" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
          </div>
        </div>
        {(filterEmp || filterFrom || filterTo) && (
          <button onClick={() => { setFilterEmp(''); setFilterFrom(''); setFilterTo('') }}
            style={{ marginTop: 8, fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
            ✕ مسح الفلاتر
          </button>
        )}
      </div>

      {/* ── Summary bar ── */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            ['📋', 'تسليم', filtered.length],
            ['👥', 'موظف', new Set(filtered.map(s => s.employee_id)).size],
            ['📅', 'يوم', new Set(filtered.map(s => s.date)).size],
          ].map(([icon, label, count]) => (
            <div key={label} style={{
              flex: 1, background: 'white', borderRadius: 10, padding: '10px 8px',
              textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: 18 }}>{icon}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--dark)' }}>{count}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── No results ── */}
      {filtered.length === 0 && (
        <div className="empty-state"><div className="icon">📋</div><p>لا توجد تسليمات</p></div>
      )}

      {/* ── BY DATE view ── */}
      {viewMode === 'date' && sortedDates.map(date => {
        const subs = byDate[date]
        const isOpen = openGroup === date
        return (
          <div key={date} style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            {/* Date group header */}
            <button onClick={() => setOpenGroup(isOpen ? null : date)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: 'var(--dark)', border: 'none', cursor: 'pointer',
              fontFamily: "'Cairo', sans-serif"
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: 'var(--amber)', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {subs.length} تسليم
                </span>
                <span style={{ color: 'white', fontSize: 16, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
              </div>
            </button>
            {isOpen && (
              <div style={{ padding: '10px 10px', background: '#f8fafc' }}>
                {subs.map(sub => <SubCard key={sub.id} sub={sub} />)}
              </div>
            )}
          </div>
        )
      })}

      {/* ── BY EMPLOYEE view ── */}
      {viewMode === 'employee' && Object.entries(byEmployee).map(([empId, { name, subs }]) => {
        const isOpen = openGroup === empId
        const sortedSubs = [...subs].sort((a, b) => b.date.localeCompare(a.date))
        return (
          <div key={empId} style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            {/* Employee group header */}
            <button onClick={() => setOpenGroup(isOpen ? null : empId)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', background: 'var(--dark)', border: 'none', cursor: 'pointer',
              fontFamily: "'Cairo', sans-serif"
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: 'var(--amber)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 15, color: 'white', flexShrink: 0
              }}>{name[0]}</div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{subs.length} تسليم</div>
              </div>
              <span style={{ color: 'white', fontSize: 16, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
            </button>
            {isOpen && (
              <div style={{ padding: '10px 10px', background: '#f8fafc' }}>
                {sortedSubs.map(sub => <SubCard key={sub.id} sub={sub} />)}
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
  const handleDelete = async (id) => { if (!window.confirm('حذف المهمة؟')) return; await deleteTask(id); reload() }
  const handleEdit = async (id) => { await updateTask(id, editName); setEditId(null); reload() }

  return (
    <div className="tab-content">
      <div className="card">
        <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>إضافة مهمة جديدة</h3>
        <div className="form-grid">
          <input className="input-plain" placeholder="الفئة" list="cats" value={newCat} onChange={e => setNewCat(e.target.value)} />
          <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
          <input className="input-plain" placeholder="اسم المهمة" value={newName}
            onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving ? '...' : '+ إضافة'}</button>
        </div>
      </div>
      {categories.map(cat => (
        <div key={cat} className="cat-section">
          <div className="cat-header">{cat}</div>
          {tasks.filter(t => t.category === cat).map(t => (
            <div key={t.id} className="task-admin-row">
              {editId === t.id
                ? <><input className="input-plain" style={{ flex: 1 }} value={editName} onChange={e => setEditName(e.target.value)} />
                  <button className="btn-sm btn-green" onClick={() => handleEdit(t.id)}>💾</button>
                  <button className="btn-sm btn-red" onClick={() => setEditId(null)}>✕</button></>
                : <><span>{t.name}</span>
                  <button className="icon-btn" onClick={() => { setEditId(t.id); setEditName(t.name) }}>✏️</button>
                  <button className="icon-btn" onClick={() => handleDelete(t.id)}>🗑</button></>
              }
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
    try { await addEmployee({ orgId, name: newName.trim(), pin: newPin }); await reload(); setNewName(''); setNewPin('') }
    catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }
  const handleDelete = async (id) => { if (!window.confirm('حذف الموظف؟')) return; await deleteEmployee(id); reload() }
  const copy = (text, key) => { navigator.clipboard?.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 2000) }
  const empLink = `${appUrl}/org/${orgSlug}`

  return (
    <div className="tab-content">
      {error && <div className="error-msg">{error}</div>}
      <div className="card">
        <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>إضافة موظف جديد</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>الموظف يدخل فقط برابط المؤسسة + الكود</p>
        <div className="form-grid">
          <input className="input-plain" placeholder="اسم الموظف" value={newName} onChange={e => setNewName(e.target.value)} />
          <input className="input-plain" placeholder="كود الدخول (4-6 أرقام)" maxLength={6}
            value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
          <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving ? '...' : '+ إضافة الموظف'}</button>
        </div>
      </div>
      {employees.length === 0
        ? <div className="empty-state"><div className="icon">👥</div><p>لم تضف موظفين بعد</p></div>
        : employees.map(e => (
          <div key={e.id} className="emp-row">
            <div className="emp-avatar">{e.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div className="emp-name">{e.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <span className="emp-code">🔑 {e.pin}</span>
                <button className="btn-sm btn-blue" onClick={() => copy(e.pin, e.id + 'p')}>{copied === e.id + 'p' ? '✅ تم' : '📋 نسخ الكود'}</button>
                <button className="btn-sm btn-amber" onClick={() => copy(`${empLink}\nالكود: ${e.pin}`, e.id + 'f')}>{copied === e.id + 'f' ? '✅ تم' : '🔗 رابط + كود'}</button>
              </div>
            </div>
            <button className="icon-btn" onClick={() => handleDelete(e.id)}>🗑</button>
          </div>
        ))
      }
    </div>
  )
}
