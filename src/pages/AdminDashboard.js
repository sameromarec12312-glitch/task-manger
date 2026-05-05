import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTasks, addTask, updateTask, deleteTask, getEmployees, addEmployee, deleteEmployee, getSubmissions, deleteSubmission, getSections, addSection, deleteSection, getOrderItems, addOrderItem, updateOrderItem, deleteOrderItem, getOrderSubmissions, deleteOrderSubmission, seedOrderItems } from '../lib/supabase'

export default function AdminDashboard() {
  const nav = useNavigate()
  const [org, setOrg] = useState(null)
  const [tab, setTab] = useState('reports')
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [sections, setSections] = useState([])
  const [orderItems, setOrderItems] = useState([])
  const [orderSubmissions, setOrderSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedAdmin = sessionStorage.getItem('admin')
    const storedOrg = sessionStorage.getItem('current_org')
    if (!storedAdmin || !storedOrg) { nav('/admin/orgs'); return }
    const o = JSON.parse(storedOrg)
    setOrg(o)
    loadAll(o.id)
  }, [nav])

  const loadAll = async (orgId) => {
    setLoading(true)
    const [t, e, s, sec, oi, os] = await Promise.all([getTasks(orgId), getEmployees(orgId), getSubmissions(orgId), getSections(orgId), getOrderItems(orgId), getOrderSubmissions(orgId)])
    setOrderItems(oi); setOrderSubmissions(os)
    setTasks(t); setEmployees(e); setSubmissions(s); setSections(sec)
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
        {[['reports','📊 التقارير'],['orders','📦 الطلبيات'],['tasks','📋 المهام'],['employees','👥 الموظفين'],['sections','📍 الأقسام']].map(([k,l]) => (
          <button key={k} className={`tab-btn ${tab===k?'active':''}`} onClick={() => setTab(k)} style={{ fontSize: 11 }}>{l}</button>
        ))}
      </div>

      {loading
        ? <div className="loading"><div className="spinner" /><span>تحميل...</span></div>
        : <>
          {tab==='reports' && <ReportsTab submissions={submissions} employees={employees} tasks={tasks} sections={sections} reload={reload} />}
          {tab==='tasks' && <TasksTab tasks={tasks} orgId={org.id} reload={reload} />}
          {tab==='employees' && <EmployeesTab employees={employees} orgId={org.id} appUrl={appUrl} orgSlug={org.slug} reload={reload} />}
          {tab==='orders' && <OrdersTab orderItems={orderItems} orderSubmissions={orderSubmissions} employees={employees} orgId={org.id} reload={reload} />}
          {tab==='sections' && <SectionsTab sections={sections} orgId={org.id} reload={reload} />}
        </>
      }
    </div>
  )
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function ReportsTab({ submissions, employees, tasks, sections, reload }) {
  const [viewMode, setViewMode] = useState('date')
  const [filterEmp, setFilterEmp] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [openSub, setOpenSub] = useState(null)
  const [openGroup, setOpenGroup] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const categories = [...new Set(tasks.map(t => t.category))]
  const countFilled = (sub) => tasks.filter(t => sub.entries?.[t.id]?.qty || sub.entries?.[t.id]?.time || sub.entries?.[t.id]?.note).length

  const filtered = submissions.filter(s =>
    (!filterEmp || s.employee_id === filterEmp) &&
    (!filterSection || s.section_name === filterSection) &&
    (!filterFrom || s.date >= filterFrom) &&
    (!filterTo || s.date <= filterTo)
  )

  const byDate = filtered.reduce((acc, s) => { if (!acc[s.date]) acc[s.date] = []; acc[s.date].push(s); return acc }, {})
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))
  const byEmployee = filtered.reduce((acc, s) => {
    if (!acc[s.employee_id]) acc[s.employee_id] = { name: s.employee_name, subs: [] }
    acc[s.employee_id].subs.push(s); return acc
  }, {})
  const bySection = filtered.reduce((acc, s) => {
    const key = s.section_name || 'بدون قسم'
    if (!acc[key]) acc[key] = { icon: sections.find(sec => sec.name === s.section_name)?.icon || '📋', subs: [] }
    acc[key].subs.push(s); return acc
  }, {})

  const handleRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false) }
  const clearFilters = () => { setFilterEmp(''); setFilterSection(''); setFilterFrom(''); setFilterTo('') }
  const hasFilters = filterEmp || filterSection || filterFrom || filterTo

  const handleDelete = async (subId) => {
    if (!window.confirm('حذف هذا التسليم نهائياً؟')) return
    setDeleting(subId)
    try { await deleteSubmission(subId); await reload(); setOpenSub(null) }
    finally { setDeleting(null) }
  }

  const exportCSV = () => {
    const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
    const empName = filterEmp ? employees.find(e => e.id === filterEmp)?.name || '' : 'كل الموظفين'
    const secName = filterSection || 'كل الأقسام'
    const dateRange = filterFrom && filterTo ? `${filterFrom} إلى ${filterTo}` : 'كل الفترات'

    const infoRows = [
      ['تقرير أداء الموظفين'],
      [`الفترة: ${dateRange}`],
      [`الموظف: ${empName}`],
      [`القسم: ${secName}`],
      [`تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`],
      [],
      ['التاريخ','اليوم','الموظف','القسم','الفئة','المهمة','الكمية','الوقت (دقيقة)','ملاحظة'],
    ]

    const dataRows = []
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date))
    sorted.forEach(sub => {
      const dayName = days[new Date(sub.date).getDay()]
      let firstRow = true
      categories.forEach(cat => {
        const catTasks = tasks.filter(t => t.category === cat && (sub.entries?.[t.id]?.qty || sub.entries?.[t.id]?.time || sub.entries?.[t.id]?.note))
        catTasks.forEach(t => {
          const e = sub.entries[t.id]
          dataRows.push([
            firstRow ? sub.date : '',
            firstRow ? dayName : '',
            firstRow ? sub.employee_name : '',
            firstRow ? (sub.section_name || '-') : '',
            cat, t.name, e?.qty||'', e?.time||'', e?.note||''
          ])
          firstRow = false
        })
      })
      if (dataRows.length) dataRows.push([])
    })

    const summaryRows = [
      [],['ملخص'],
      ['إجمالي التسليمات', filtered.length],
      ['عدد الموظفين', new Set(filtered.map(s => s.employee_id)).size],
      ['عدد الأيام', new Set(filtered.map(s => s.date)).size],
    ]

    const allRows = [...infoRows, ...dataRows, ...summaryRows]
    const csv = allRows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `تقرير_${filterFrom||'كل'}.csv`; a.click()
  }

  const SubCard = ({ sub }) => {
    const isOpen = openSub === sub.id
    const isDel = deleting === sub.id
    const sec = sections.find(s => s.name === sub.section_name)
    return (
      <div style={{ marginBottom: 6, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white' }}>
          <button onClick={() => setOpenSub(isOpen ? null : sub.id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', fontFamily: "'Cairo', sans-serif"
          }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: 'white', flexShrink: 0 }}>
              {sub.employee_name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--dark)' }}>
                {viewMode === 'date' ? sub.employee_name : viewMode === 'employee' ? `📅 ${sub.date}` : sub.employee_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>✅ {countFilled(sub)} مهمة</span>
                {sub.section_name && (
                  <span style={{ fontSize: 10, background: 'var(--amber-light)', color: 'var(--amber-dark)', padding: '1px 8px', borderRadius: 20, fontWeight: 700 }}>
                    {sec?.icon || '📍'} {sub.section_name}
                  </span>
                )}
              </div>
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</div>
          </button>
          <button onClick={() => handleDelete(sub.id)} disabled={isDel} style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--red)', opacity: isDel ? 0.5 : 1 }}>
            {isDel ? '...' : '🗑'}
          </button>
        </div>
        {isOpen && (
          <div style={{ background: '#fafafa', padding: '10px 12px' }}>
            {sub.section_name && (
              <div style={{ background: 'var(--amber-light)', borderRadius: 8, padding: '6px 12px', marginBottom: 10, fontSize: 13, fontWeight: 700, color: 'var(--amber-dark)' }}>
                📍 القسم: {sec?.icon} {sub.section_name}
              </div>
            )}
            {categories.map(cat => {
              const filled = tasks.filter(t => t.category === cat && (sub.entries?.[t.id]?.qty || sub.entries?.[t.id]?.time || sub.entries?.[t.id]?.note))
              if (!filled.length) return null
              return (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div className="cat-label">{cat}</div>
                  <table className="data-table">
                    <thead><tr><th>المهمة</th><th style={{ textAlign:'center' }}>الكمية</th><th style={{ textAlign:'center' }}>الوقت(د)</th><th>ملاحظة</th></tr></thead>
                    <tbody>{filled.map(t => {
                      const e = sub.entries[t.id]
                      return (
                        <tr key={t.id}>
                          <td>{t.name}</td>
                          <td className="num">{e?.qty||'-'}</td>
                          <td className="num">{e?.time||'-'}</td>
                          <td style={{ fontSize:11, color: e?.note?'var(--amber-dark)':'var(--muted)', fontStyle: e?.note?'italic':'normal' }}>{e?.note ? `📝 ${e.note}` : '-'}</td>
                        </tr>
                      )
                    })}</tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const GroupHeader = ({ icon, title, count, groupKey }) => {
    const isOpen = openGroup === groupKey
    return (
      <button onClick={() => setOpenGroup(isOpen ? null : groupKey)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--dark)', border: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: 'var(--amber)', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{count} تسليم</span>
          <span style={{ color: 'white', fontSize: 16, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
        </div>
      </button>
    )
  }

  return (
    <div className="tab-content">
      {/* View mode */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['date','📅 اليوم'],['employee','👤 الموظف'],['section','📍 القسم']].map(([mode,label]) => (
          <button key={mode} onClick={() => setViewMode(mode)} style={{
            flex: 1, padding: '9px 4px', border: 'none', borderRadius: 10, cursor: 'pointer',
            fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: 12,
            background: viewMode===mode ? 'var(--dark)' : 'white',
            color: viewMode===mode ? 'white' : 'var(--muted)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
          }}>{label}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select className="select-plain" style={{ flex: 1, minWidth: 120 }} value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
            <option value="">كل الموظفين</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {sections.length > 0 && (
            <select className="select-plain" style={{ flex: 1, minWidth: 120 }} value={filterSection} onChange={e => setFilterSection(e.target.value)}>
              <option value="">كل الأقسام</option>
              {sections.map(s => <option key={s.id} value={s.name}>{s.icon} {s.name}</option>)}
            </select>
          )}
          <button className="btn-sm btn-amber" onClick={handleRefresh} disabled={refreshing}>{refreshing ? '...' : '🔄'}</button>
          <button className="btn-sm btn-green" onClick={exportCSV}>⬇ CSV</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>من</div><input type="date" className="input-plain" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} /></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>إلى</div><input type="date" className="input-plain" value={filterTo} onChange={e => setFilterTo(e.target.value)} /></div>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} style={{ marginTop: 8, fontSize: 12, color: 'var(--red)', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>✕ مسح الفلاتر</button>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[['📋','تسليم',filtered.length],['👥','موظف',new Set(filtered.map(s=>s.employee_id)).size],['📅','يوم',new Set(filtered.map(s=>s.date)).size]].map(([icon,label,count]) => (
            <div key={label} style={{ flex:1, background:'white', borderRadius:10, padding:'10px 8px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:18 }}>{icon}</div>
              <div style={{ fontWeight:800, fontSize:16, color:'var(--dark)' }}>{count}</div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && <div className="empty-state"><div className="icon">📋</div><p>لا توجد تسليمات</p></div>}

      {/* By date */}
      {viewMode === 'date' && sortedDates.map(date => {
        const subs = byDate[date]
        const isOpen = openGroup === date
        return (
          <div key={date} style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <GroupHeader icon="📅" title={date} count={subs.length} groupKey={date} />
            {isOpen && <div style={{ padding: '10px', background: '#f8fafc' }}>{subs.map(sub => <SubCard key={sub.id} sub={sub} />)}</div>}
          </div>
        )
      })}

      {/* By employee */}
      {viewMode === 'employee' && Object.entries(byEmployee).map(([empId, { name, subs }]) => {
        const isOpen = openGroup === empId
        return (
          <div key={empId} style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <GroupHeader icon="👤" title={name} count={subs.length} groupKey={empId} />
            {isOpen && <div style={{ padding: '10px', background: '#f8fafc' }}>{[...subs].sort((a,b)=>b.date.localeCompare(a.date)).map(sub => <SubCard key={sub.id} sub={sub} />)}</div>}
          </div>
        )
      })}

      {/* By section */}
      {viewMode === 'section' && Object.entries(bySection).map(([secName, { icon, subs }]) => {
        const isOpen = openGroup === secName
        return (
          <div key={secName} style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <GroupHeader icon={icon} title={secName} count={subs.length} groupKey={secName} />
            {isOpen && <div style={{ padding: '10px', background: '#f8fafc' }}>{[...subs].sort((a,b)=>b.date.localeCompare(a.date)).map(sub => <SubCard key={sub.id} sub={sub} />)}</div>}
          </div>
        )
      })}
    </div>
  )
}

// ─── SECTIONS TAB ─────────────────────────────────────────────────────────────
function SectionsTab({ sections, orgId, reload }) {
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🏢')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const ICONS = ['🍖','🥗','🧊','🔥','🍳','🥙','🍽','🧹','📦','🏭','🛒','⚙️']

  const handleAdd = async () => {
    if (!newName.trim()) return setError('أدخل اسم القسم')
    setSaving(true)
    try { await addSection({ orgId, name: newName.trim(), icon: newIcon }); await reload(); setNewName(''); setNewIcon('🏢'); setError('') }
    catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('حذف القسم؟')) return
    await deleteSection(id); reload()
  }

  return (
    <div className="tab-content">
      <div className="card">
        <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>إضافة قسم جديد</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          الأقسام تظهر للموظف ليختار منها قبل التسليم
        </p>
        {error && <div className="error-msg">{error}</div>}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>اختر أيقونة</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ICONS.map(ic => (
              <button key={ic} onClick={() => setNewIcon(ic)} style={{
                fontSize: 22, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                border: newIcon === ic ? '2px solid var(--amber)' : '2px solid var(--border)',
                background: newIcon === ic ? 'var(--amber-light)' : 'white'
              }}>{ic}</button>
            ))}
          </div>
        </div>
        <input className="input-plain" placeholder="اسم القسم (مثال: المطبخ الساخن)" value={newName}
          onChange={e => setNewName(e.target.value)} style={{ marginBottom: 10 }} />
        <button className="btn-primary" onClick={handleAdd} disabled={saving}>
          {saving ? '...' : `+ إضافة ${newIcon} ${newName || 'القسم'}`}
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📍</div>
          <p>لم تضف أقساماً بعد</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>أضف أقسام لتظهر للموظفين عند التسليم</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sections.map(sec => (
            <div key={sec.id} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 32 }}>{sec.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{sec.name}</div>
              </div>
              <button className="icon-btn" onClick={() => handleDelete(sec.id)}>🗑</button>
            </div>
          ))}
        </div>
      )}
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
          <input className="input-plain" placeholder="اسم المهمة" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleAdd()} />
          <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving?'...':'+ إضافة'}</button>
        </div>
      </div>
      {categories.map(cat => (
        <div key={cat} className="cat-section">
          <div className="cat-header">{cat}</div>
          {tasks.filter(t => t.category===cat).map(t => (
            <div key={t.id} className="task-admin-row">
              {editId===t.id
                ? <><input className="input-plain" style={{ flex:1 }} value={editName} onChange={e => setEditName(e.target.value)} />
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

  return (
    <div className="tab-content">
      {error && <div className="error-msg">{error}</div>}
      <div className="card">
        <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>إضافة موظف جديد</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>الموظف يدخل فقط برابط المؤسسة + الكود</p>
        <div className="form-grid">
          <input className="input-plain" placeholder="اسم الموظف" value={newName} onChange={e => setNewName(e.target.value)} />
          <input className="input-plain" placeholder="كود الدخول (4-6 أرقام)" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g,''))} />
          <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving?'...':'+ إضافة الموظف'}</button>
        </div>
      </div>
      {employees.length===0
        ? <div className="empty-state"><div className="icon">👥</div><p>لم تضف موظفين بعد</p></div>
        : employees.map(e => (
          <div key={e.id} className="emp-row">
            <div className="emp-avatar">{e.name[0]}</div>
            <div style={{ flex:1 }}>
              <div className="emp-name">{e.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, flexWrap:'wrap' }}>
                <span className="emp-code">🔑 {e.pin}</span>
                <button className="btn-sm btn-blue" onClick={() => copy(e.pin, e.id+'p')}>{copied===e.id+'p'?'✅ تم':'📋 نسخ الكود'}</button>
                <button className="btn-sm btn-amber" onClick={() => copy(`كود المؤسسة: ${orgSlug}\nكودك: ${e.pin}`, e.id+'f')}>{copied===e.id+'f'?'✅ تم':'🔗 نسخ للموظف'}</button>
              </div>
            </div>
            <button className="icon-btn" onClick={() => handleDelete(e.id)}>🗑</button>
          </div>
        ))
      }
    </div>
  )
}

// ─── ORDERS TAB ───────────────────────────────────────────────────────────────
function OrdersTab({ orderItems, orderSubmissions, employees, orgId, reload }) {
  const [subTab, setSubTab] = useState('reports') // reports | items
  const [filterEmp, setFilterEmp] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [openSub, setOpenSub] = useState(null)
  const [openGroup, setOpenGroup] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [seeding, setSeeding] = useState(false)
  // item management
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  const categories = [...new Set(orderItems.map(i => i.category))]

  const filtered = orderSubmissions.filter(s =>
    (!filterEmp || s.employee_id === filterEmp) &&
    (!filterFrom || s.date >= filterFrom) &&
    (!filterTo || s.date <= filterTo)
  )
  const byDate = filtered.reduce((acc, s) => { if (!acc[s.date]) acc[s.date] = []; acc[s.date].push(s); return acc }, {})
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  const handleRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false) }
  const clearFilters = () => { setFilterEmp(''); setFilterFrom(''); setFilterTo('') }
  const hasFilters = filterEmp || filterFrom || filterTo

  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذا الطلب؟')) return
    setDeleting(id)
    try { await deleteOrderSubmission(id); await reload() }
    finally { setDeleting(null) }
  }

  const handleSeedItems = async () => {
    if (!window.confirm('إضافة كل الأصناف من قائمة المشتريات الافتراضية؟')) return
    setSeeding(true)
    try { await seedOrderItems(orgId); await reload() }
    catch (e) { alert('خطأ: ' + e.message) }
    finally { setSeeding(false) }
  }

  const handleAddItem = async () => {
    if (!newName.trim() || !newCat.trim()) return
    setSaving(true)
    try { await addOrderItem({ orgId, category: newCat.trim(), name: newName.trim() }); await reload(); setNewName(''); setNewCat('') }
    finally { setSaving(false) }
  }

  const handleEditItem = async (id) => { await updateOrderItem(id, editName); setEditId(null); reload() }
  const handleDeleteItem = async (id) => { if (!window.confirm('حذف الصنف؟')) return; await deleteOrderItem(id); reload() }

  const countFilled = (sub) => orderItems.filter(i => sub.entries?.[i.id]?.qty || sub.entries?.[i.id]?.note).length

  const exportCSV = () => {
    const rows = [['الموظف', 'التاريخ', 'الفئة', 'الصنف', 'الكمية', 'ملاحظة']]
    filtered.forEach(sub => {
      orderItems.forEach(i => {
        const e = sub.entries?.[i.id]
        if (e?.qty || e?.note) rows.push([sub.employee_name, sub.date, i.category, i.name, e?.qty || '', e?.note || ''])
      })
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'طلبيات.csv'; a.click()
  }

  return (
    <div className="tab-content">
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['reports', '📊 تقارير الطلبيات'], ['items', '📋 قائمة الأصناف']].map(([k, l]) => (
          <button key={k} onClick={() => setSubTab(k)} style={{
            flex: 1, padding: 10, border: 'none', borderRadius: 10, cursor: 'pointer',
            fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: 13,
            background: subTab === k ? 'var(--dark)' : 'white',
            color: subTab === k ? 'white' : 'var(--muted)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
          }}>{l}</button>
        ))}
      </div>

      {/* ── REPORTS ── */}
      {subTab === 'reports' && (
        <>
          <div style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="select-plain" style={{ flex: 1, minWidth: 120 }} value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
                <option value="">كل الموظفين</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <button className="btn-sm btn-amber" onClick={handleRefresh} disabled={refreshing}>{refreshing ? '...' : '🔄'}</button>
              <button className="btn-sm btn-green" onClick={exportCSV}>⬇ CSV</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>من</div><input type="date" className="input-plain" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>إلى</div><input type="date" className="input-plain" value={filterTo} onChange={e => setFilterTo(e.target.value)} /></div>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} style={{ marginTop: 8, fontSize: 12, color: 'var(--red)', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>✕ مسح الفلاتر</button>
            )}
          </div>

          {filtered.length === 0
            ? <div className="empty-state"><div className="icon">📦</div><p>لا توجد طلبيات</p></div>
            : sortedDates.map(date => {
              const subs = byDate[date]
              const isOpen = openGroup === date
              return (
                <div key={date} style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                  <button onClick={() => setOpenGroup(isOpen ? null : date)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'var(--dark)', border: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif"
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>📅</span>
                      <span style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ background: 'var(--amber)', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{subs.length} طلب</span>
                      <span style={{ color: 'white', fontSize: 16, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: 10, background: '#f8fafc' }}>
                      {subs.map(sub => {
                        const isSubOpen = openSub === sub.id
                        const isDel = deleting === sub.id
                        return (
                          <div key={sub.id} style={{ marginBottom: 6, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'white' }}>
                              <button onClick={() => setOpenSub(isSubOpen ? null : sub.id)} style={{
                                flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', fontFamily: "'Cairo', sans-serif"
                              }}>
                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: 'white', flexShrink: 0 }}>{sub.employee_name[0]}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, fontSize: 13 }}>{sub.employee_name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>📦 {countFilled(sub)} صنف</div>
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--muted)', transform: isSubOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</div>
                              </button>
                              <button onClick={() => handleDelete(sub.id)} disabled={isDel} style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--red)', opacity: isDel ? 0.5 : 1 }}>
                                {isDel ? '...' : '🗑'}
                              </button>
                            </div>
                            {isSubOpen && (
                              <div style={{ background: '#fafafa', padding: '10px 12px' }}>
                                {categories.map(cat => {
                                  const filled = orderItems.filter(i => i.category === cat && (sub.entries?.[i.id]?.qty || sub.entries?.[i.id]?.note))
                                  if (!filled.length) return null
                                  return (
                                    <div key={cat} style={{ marginBottom: 10 }}>
                                      <div className="cat-label">{cat}</div>
                                      <div style={{ overflowX: 'auto' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 500 }}>
                                        <thead><tr style={{ background: '#f1f5f9' }}>
                                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' }}>No.</th>
                                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Code</th>
                                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' }}>UoM</th>
                                          <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: 'var(--muted)', minWidth: 150 }}>Description</th>
                                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)', minWidth: 100 }}>Arabic</th>
                                          <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: '#b45309', background: '#fef3c7', width: 60 }}>QTY</th>
                                        </tr></thead>
                                        <tbody>{filled.map((i, idx) => {
                                          const e = sub.entries[i.id]
                                          return (
                                            <tr key={i.id} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                              <td style={{ padding: '6px 8px', fontWeight: 700 }}>{i.item_no || ''}</td>
                                              <td style={{ padding: '6px 8px', color: 'var(--muted)', fontSize: 10 }}>{i.code || ''}</td>
                                              <td style={{ padding: '6px 8px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{i.uom || ''}</td>
                                              <td style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10 }}>{i.name_en || i.name}</td>
                                              <td style={{ padding: '6px 8px', fontWeight: 600 }}>{i.name_ar || ''}</td>
                                              <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, color: 'var(--dark)' }}>{e?.qty || '-'}</td>
                                            </tr>
                                          )
                                        })}</tbody>
                                      </table></div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          }
        </>
      )}

      {/* ── ITEMS MANAGEMENT ── */}
      {subTab === 'items' && (
        <>
          {orderItems.length === 0 && (
            <div style={{ marginBottom: 16 }}>
              <button className="btn-primary" onClick={handleSeedItems} disabled={seeding} style={{ background: 'var(--dark)' }}>
                {seeding ? 'جاري الإضافة...' : '📦 إضافة قائمة Original Shawarma كاملة'}
              </button>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>كل الأصناف من قائمتك ستضاف دفعة واحدة</p>
            </div>
          )}
          {orderItems.length > 0 && (
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-sm btn-red" onClick={() => { if(window.confirm('حذف كل الأصناف؟')) orderItems.forEach(i => handleDeleteItem(i.id)) }}>🗑 حذف الكل</button>
            </div>
          )}
          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{ background: 'var(--dark)', color: 'white', padding: '10px 16px', fontWeight: 800, fontSize: 13 }}>{cat}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid var(--border)' }}>
                      <th style={OTH}>Item No.</th>
                      <th style={OTH}>Code</th>
                      <th style={OTH}>UoM</th>
                      <th style={{ ...OTH, minWidth: 180, textAlign: 'left' }}>Description</th>
                      <th style={{ ...OTH, minWidth: 110 }}>Arabic</th>
                      <th style={{ ...OTH, width: 70 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.filter(i => i.category === cat).map((i, idx) => (
                      <tr key={i.id} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <td style={OTD}>{i.item_no || ''}</td>
                        <td style={{ ...OTD, fontSize: 10, color: 'var(--muted)' }}>{i.code || ''}</td>
                        <td style={{ ...OTD, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{i.uom || ''}</td>
                        <td style={{ ...OTD, textAlign: 'left', fontSize: 11 }}>{i.name_en || i.name}</td>
                        <td style={{ ...OTD, fontWeight: 600 }}>{i.name_ar || ''}</td>
                        <td style={{ ...OTD, textAlign: 'center' }}>
                          <button className="icon-btn" onClick={() => handleDeleteItem(i.id)}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

const OTH = { padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap' }
const OTD = { padding: '7px 10px', verticalAlign: 'middle', textAlign: 'right' }
