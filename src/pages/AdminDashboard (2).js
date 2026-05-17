import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTasks, getEmployees, getSubmissions, deleteSubmission, getSections, addSection, deleteSection, getOrderItems, addOrderItem, updateOrderItem, deleteOrderItem, getOrderSubmissions, deleteOrderSubmission, seedOrderItems } from '../lib/supabase'
import { downloadOrderPDF } from '../lib/printOrder'
import TasksTab from './TasksTab'
import EmployeesTab from './EmployeesTab'

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
    const [t, e, s, sec, oi, os] = await Promise.all([
      getTasks(orgId), getEmployees(orgId), getSubmissions(orgId),
      getSections(orgId), getOrderItems(orgId), getOrderSubmissions(orgId)
    ])
    setTasks(t); setEmployees(e); setSubmissions(s); setSections(sec)
    setOrderItems(oi); setOrderSubmissions(os)
    setLoading(false)
  }

  const reload = () => org && loadAll(org.id)
  const logout = () => { sessionStorage.removeItem('admin'); sessionStorage.removeItem('current_org'); nav('/') }
  const backToOrgs = () => { sessionStorage.removeItem('current_org'); nav('/admin/orgs') }
  const appUrl = window.location.origin

  if (!org) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <nav className="topnav">
        <div className="topnav-brand">
          <div className="topnav-logo">🏢</div>
          <div>
            <div className="topnav-title">{org.name}</div>
            <div className="topnav-sub" onClick={backToOrgs} style={{ cursor: 'pointer', textDecoration: 'underline' }}>← العودة للمؤسسات</div>
          </div>
        </div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>

      {/* Employee link banner */}
      <div style={{ background: 'var(--ink-2)', padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>🔗 رابط الموظفين:</span>
          <span style={{ flex: 1, fontSize: 11, color: 'var(--brand)', fontFamily: 'IBM Plex Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appUrl}/org/{org.slug}</span>
          <button className="btn-sm btn-amber" onClick={() => { navigator.clipboard?.writeText(`${appUrl}/org/${org.slug}`); alert('تم نسخ الرابط!') }}>📋 نسخ</button>
        </div>
      </div>

      <div className="tabs">
        {[['reports','📊 التقارير'],['orders','📦 الطلبيات'],['tasks','📋 المهام'],['employees','👥 الموظفين'],['sections','📍 الأقسام']].map(([k,l]) => (
          <button key={k} className={`tab-btn ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {loading
        ? <div className="loading"><div className="spinner" /><span>تحميل...</span></div>
        : <>
          {tab==='reports' && <ReportsTab submissions={submissions} employees={employees} tasks={tasks} sections={sections} reload={reload} />}
          {tab==='tasks' && <TasksTab tasks={tasks} sections={sections} orgId={org.id} reload={reload} />}
          {tab==='employees' && <EmployeesTab employees={employees} sections={sections} orgId={org.id} appUrl={appUrl} orgSlug={org.slug} reload={reload} />}
          {tab==='orders' && <OrdersTab orderItems={orderItems} orderSubmissions={orderSubmissions} employees={employees} orgId={org.id} reload={reload} />}
          {tab==='sections' && <SectionsTab sections={sections} orgId={org.id} reload={reload} />}
        </>
      }
    </div>
  )
}

// ─── REPORTS TAB ──────────────────────────────────────────────────────────────
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
    if (!window.confirm('حذف هذا التسليم؟')) return
    setDeleting(subId)
    try { await deleteSubmission(subId); await reload(); setOpenSub(null) }
    finally { setDeleting(null) }
  }

  const downloadSub = (sub) => {
    const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
    const dayName = days[new Date(sub.date).getDay()]
    const rows = [
      ['تقرير يومي - Original Shawarma'],
      [`الموظف: ${sub.employee_name}`],
      [`التاريخ: ${sub.date} - ${dayName}`],
      [`القسم: ${sub.section_name || '-'}`],
      [],
      ['الفئة','المهمة','الكمية','الوقت (دقيقة)','ملاحظة'],
    ]
    categories.forEach(cat => {
      tasks.filter(t => t.category === cat && (sub.entries?.[t.id]?.qty || sub.entries?.[t.id]?.time || sub.entries?.[t.id]?.note))
        .forEach(t => { const e = sub.entries[t.id]; rows.push([cat, t.name, e?.qty||'', e?.time||'', e?.note||'']) })
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${sub.employee_name}_${sub.date}.csv`; a.click()
  }

  const buildCSV = (subs, empLabel) => {
    const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
    const rows = [['تقرير أداء الموظفين'],['الموظف: '+empLabel],[`تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`],[],['التاريخ','اليوم','الموظف','القسم','الفئة','المهمة','الكمية','الوقت','ملاحظة']]
    const sorted = [...subs].sort((a,b) => b.date.localeCompare(a.date))
    sorted.forEach(sub => {
      const dayName = days[new Date(sub.date).getDay()]
      let first = true
      categories.forEach(cat => {
        tasks.filter(t => t.category===cat && (sub.entries?.[t.id]?.qty || sub.entries?.[t.id]?.time || sub.entries?.[t.id]?.note))
          .forEach(t => { const e=sub.entries[t.id]; rows.push([first?sub.date:'',first?dayName:'',first?sub.employee_name:'',first?(sub.section_name||'-'):'',cat,t.name,e?.qty||'',e?.time||'',e?.note||'']); first=false })
      })
      rows.push([])
    })
    return rows
  }

  const exportCSV = () => {
    const empName = filterEmp ? employees.find(e => e.id === filterEmp)?.name || 'موظف' : 'كل الموظفين'
    const csv = buildCSV(filtered, empName).map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `تقرير_${empName}.csv`; a.click()
  }

  const exportAllCSV = () => {
    employees.forEach(emp => {
      const subs = filtered.filter(s => s.employee_id === emp.id)
      if (!subs.length) return
      const csv = buildCSV(subs, emp.name).map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
      const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'})
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
      a.download = `تقرير_${emp.name}.csv`; a.click()
    })
  }

  const SubCard = ({ sub }) => {
    const isOpen = openSub === sub.id
    const isDel = deleting === sub.id
    const sec = sections.find(s => s.name === sub.section_name)
    return (
      <div style={{ marginBottom: 6, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setOpenSub(isOpen ? null : sub.id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px',
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit'
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'white', flexShrink: 0 }}>
              {sub.employee_name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
                {viewMode === 'date' ? sub.employee_name : `📅 ${sub.date}`}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>✅ {countFilled(sub)} مهمة</span>
                {sec && <span className="badge badge-brand" style={{ fontSize: 10 }}>{sec.icon} {sec.name}</span>}
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</div>
          </button>
          <button onClick={() => downloadSub(sub)} style={{ padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--green)' }} title="تحميل">⬇</button>
          <button onClick={() => handleDelete(sub.id)} disabled={isDel} style={{ padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--red)', opacity: isDel ? 0.5 : 1 }}>
            {isDel ? '...' : '🗑'}
          </button>
        </div>
        {isOpen && (
          <div style={{ background: 'var(--surface-2)', padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
            {sec && <div className="badge badge-brand" style={{ marginBottom: 10, fontSize: 12 }}>📍 القسم: {sec.icon} {sec.name}</div>}
            {categories.map(cat => {
              const filled = tasks.filter(t => t.category === cat && (sub.entries?.[t.id]?.qty || sub.entries?.[t.id]?.time || sub.entries?.[t.id]?.note))
              if (!filled.length) return null
              return (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div className="cat-label">{cat}</div>
                  <table className="data-table">
                    <thead><tr><th>المهمة</th><th style={{ textAlign:'center' }}>الكمية</th><th style={{ textAlign:'center' }}>الوقت(د)</th><th>ملاحظة</th><th>صورة</th></tr></thead>
                    <tbody>{filled.map(t => {
                      const e = sub.entries[t.id]
                      return (
                        <tr key={t.id}>
                          <td>{t.name}</td>
                          <td className="num">{e?.qty||'-'}</td>
                          <td className="num">{e?.time||'-'}</td>
                          <td style={{ fontSize:11, color:e?.note?'var(--brand-dark)':'var(--muted)', fontStyle:e?.note?'italic':'normal' }}>{e?.note||'-'}</td>
                          <td>{e?.photo ? <img src={e.photo} alt="" style={{ width:50, height:50, objectFit:'cover', borderRadius:6, cursor:'pointer' }} onClick={() => window.open(e.photo,'_blank')} /> : '-'}</td>
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
        padding: '12px 16px', background: 'var(--ink)', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        borderRadius: isOpen ? '10px 10px 0 0' : 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-brand">{count} تسليم</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
        </div>
      </button>
    )
  }

  return (
    <div className="tab-content">
      {/* View toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--surface-2)', borderRadius: 12, padding: 4 }} className="fade-up">
        {[['date','📅 اليوم'],['employee','👤 الموظف'],['section','📍 القسم']].map(([mode,label]) => (
          <button key={mode} onClick={() => setViewMode(mode)} style={{
            flex: 1, padding: '9px 6px', border: 'none', borderRadius: 9, cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: 700, fontSize: 12, transition: 'all 0.2s',
            background: viewMode===mode ? 'var(--ink)' : 'transparent',
            color: viewMode===mode ? 'white' : 'var(--muted)',
            boxShadow: viewMode===mode ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
          }}>{label}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="card fade-up fade-up-1" style={{ marginBottom: 14 }}>
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
          <button className="btn-sm btn-blue" onClick={exportAllCSV}>⬇ كل الموظفين</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">من</label>
            <input type="date" className="input-plain" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label">إلى</label>
            <input type="date" className="input-plain" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
          </div>
        </div>
        {hasFilters && (
          <button className="btn-sm btn-red" style={{ marginTop: 10 }} onClick={clearFilters}>✕ مسح الفلاتر</button>
        )}
      </div>

      {/* Stats */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }} className="fade-up fade-up-2">
          {[['📋', 'تسليم', filtered.length], ['👥', 'موظف', new Set(filtered.map(s=>s.employee_id)).size], ['📅', 'يوم', new Set(filtered.map(s=>s.date)).size]].map(([icon,label,count]) => (
            <div key={label} className="stat-card">
              <div className="stat-icon">{icon}</div>
              <div className="stat-value">{count}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && <div className="empty-state"><div className="icon">📋</div><p>لا توجد تسليمات</p></div>}

      {/* By date */}
      {viewMode==='date' && sortedDates.map(date => {
        const subs = byDate[date]; const isOpen = openGroup === date
        return (
          <div key={date} style={{ marginBottom: 10 }} className="fade-up">
            <GroupHeader icon="📅" title={date} count={subs.length} groupKey={date} />
            {isOpen && <div style={{ padding: 10, background: 'var(--surface-2)', borderRadius: '0 0 10px 10px', border: '1px solid var(--border)', borderTop: 'none' }}>{subs.map(sub => <SubCard key={sub.id} sub={sub} />)}</div>}
          </div>
        )
      })}

      {/* By employee */}
      {viewMode==='employee' && Object.entries(byEmployee).map(([empId, { name, subs }]) => {
        const isOpen = openGroup === empId
        return (
          <div key={empId} style={{ marginBottom: 10 }} className="fade-up">
            <GroupHeader icon="👤" title={name} count={subs.length} groupKey={empId} />
            {isOpen && <div style={{ padding: 10, background: 'var(--surface-2)', borderRadius: '0 0 10px 10px', border: '1px solid var(--border)', borderTop: 'none' }}>{[...subs].sort((a,b)=>b.date.localeCompare(a.date)).map(sub => <SubCard key={sub.id} sub={sub} />)}</div>}
          </div>
        )
      })}

      {/* By section */}
      {viewMode==='section' && Object.entries(bySection).map(([secName, { icon, subs }]) => {
        const isOpen = openGroup === secName
        return (
          <div key={secName} style={{ marginBottom: 10 }} className="fade-up">
            <GroupHeader icon={icon} title={secName} count={subs.length} groupKey={secName} />
            {isOpen && <div style={{ padding: 10, background: 'var(--surface-2)', borderRadius: '0 0 10px 10px', border: '1px solid var(--border)', borderTop: 'none' }}>{[...subs].sort((a,b)=>b.date.localeCompare(a.date)).map(sub => <SubCard key={sub.id} sub={sub} />)}</div>}
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
  const ICONS = ['🍖','🥗','🧊','🔥','🍳','🥙','🍽','🧹','📦','🏭','🛒','⚙️','🥤','🍰','🧂','🫕']

  const handleAdd = async () => {
    if (!newName.trim()) return setError('أدخل اسم القسم')
    setSaving(true)
    try { await addSection({ orgId, name: newName.trim(), icon: newIcon }); await reload(); setNewName(''); setNewIcon('🏢'); setError('') }
    catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => { if (!window.confirm('حذف القسم؟ سيتم إلغاء ربط الموظفين والمهام به.')) return; await deleteSection(id); reload() }

  return (
    <div className="tab-content">
      <div className="card fade-up" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>إضافة قسم جديد</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
          كل قسم له موظفوه ومهامه الخاصة — الموظف يرى فقط مهام قسمه
        </p>
        {error && <div className="error-msg">{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label className="input-label">اختر أيقونة</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ICONS.map(ic => (
              <button key={ic} onClick={() => setNewIcon(ic)} style={{
                fontSize: 22, padding: '7px 10px', borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${newIcon === ic ? 'var(--brand)' : 'var(--border)'}`,
                background: newIcon === ic ? 'var(--brand-light)' : 'var(--surface)',
                transition: 'all 0.15s'
              }}>{ic}</button>
            ))}
          </div>
        </div>
        <input className="input-plain" placeholder="اسم القسم (مثال: المطبخ الساخن)" value={newName}
          onChange={e => setNewName(e.target.value)} style={{ marginBottom: 10 }} />
        <button className="btn-primary" onClick={handleAdd} disabled={saving}>
          {saving ? 'جاري الإضافة...' : `+ إضافة ${newIcon} ${newName || 'القسم'}`}
        </button>
      </div>

      {sections.length === 0
        ? <div className="empty-state"><div className="icon">📍</div><p>لم تضف أقساماً بعد</p><p>أضف أقساماً لتنظيم الموظفين والمهام</p></div>
        : sections.map((sec, i) => (
          <div key={sec.id} className={`card fade-up fade-up-${Math.min(i+1,4)}`} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{sec.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{sec.name}</div>
            </div>
            <button className="icon-btn" onClick={() => handleDelete(sec.id)}>🗑</button>
          </div>
        ))
      }
    </div>
  )
}

// ─── ORDERS TAB ───────────────────────────────────────────────────────────────
function OrdersTab({ orderItems, orderSubmissions, employees, orgId, reload }) {
  const [subTab, setSubTab] = useState('reports')
  const [filterEmp, setFilterEmp] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [openSub, setOpenSub] = useState(null)
  const [openGroup, setOpenGroup] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [seeding, setSeeding] = useState(false)
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
  const sortedDates = Object.keys(byDate).sort((a,b) => b.localeCompare(a))

  const handleRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false) }
  const handleSeedItems = async () => {
    if (!window.confirm('إضافة كل أصناف Original Shawarma؟')) return
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
  const handleDeleteSub = async (id) => {
    if (!window.confirm('حذف هذا الطلب؟')) return
    setDeleting(id)
    try { await deleteOrderSubmission(id); await reload() }
    finally { setDeleting(null) }
  }
  const countFilled = (sub) => orderItems.filter(i => sub.entries?.[i.id]?.qty).length

  const downloadOrderSub = (sub) => {
    const rows = [['تقرير طلبيات'],['الموظف: '+sub.employee_name],['التاريخ: '+sub.date],[],['Item No.','Code','UoM','Description','Arabic','QTY']]
    categories.forEach(cat => orderItems.filter(i => i.category===cat && sub.entries?.[i.id]?.qty).forEach(i => { const e=sub.entries[i.id]; rows.push([i.item_no||'',i.code||'',i.uom||'',i.name_en||i.name,i.name_ar||'',e?.qty||'']) }))
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `طلبيات_${sub.employee_name}_${sub.date}.csv`; a.click()
  }

  const exportCSV = () => {
    const rows = [['الموظف','التاريخ','Item No.','Code','UoM','Description','Arabic','QTY']]
    filtered.forEach(sub => orderItems.forEach(i => { const e=sub.entries?.[i.id]; if(e?.qty) rows.push([sub.employee_name,sub.date,i.item_no||'',i.code||'',i.uom||'',i.name_en||i.name,i.name_ar||'',e.qty]) }))
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'طلبيات.csv'; a.click()
  }

  return (
    <div className="tab-content">
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--surface-2)', borderRadius: 12, padding: 4 }}>
        {[['reports','📊 تقارير الطلبيات'],['items','📋 قائمة الأصناف']].map(([k,l]) => (
          <button key={k} onClick={() => setSubTab(k)} style={{
            flex: 1, padding: '10px 8px', border: 'none', borderRadius: 9, cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
            background: subTab===k ? 'var(--ink)' : 'transparent',
            color: subTab===k ? 'white' : 'var(--muted)',
          }}>{l}</button>
        ))}
      </div>

      {subTab === 'reports' && (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="select-plain" style={{ flex: 1 }} value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
                <option value="">كل الموظفين</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <button className="btn-sm btn-amber" onClick={handleRefresh} disabled={refreshing}>{refreshing?'...':'🔄'}</button>
              <button className="btn-sm btn-green" onClick={exportCSV}>⬇ CSV</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <div style={{ flex: 1 }}><label className="input-label">من</label><input type="date" className="input-plain" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} /></div>
              <div style={{ flex: 1 }}><label className="input-label">إلى</label><input type="date" className="input-plain" value={filterTo} onChange={e => setFilterTo(e.target.value)} /></div>
            </div>
          </div>

          {filtered.length === 0
            ? <div className="empty-state"><div className="icon">📦</div><p>لا توجد طلبيات</p></div>
            : sortedDates.map(date => {
              const subs = byDate[date]; const isOpen = openGroup === date
              return (
                <div key={date} style={{ marginBottom: 10 }}>
                  <button onClick={() => setOpenGroup(isOpen ? null : date)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'var(--ink)', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', borderRadius: isOpen ? '10px 10px 0 0' : 10
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 700, fontSize: 14 }}>📅 {date}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-brand">{subs.length} طلب</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: 10, background: 'var(--surface-2)', borderRadius: '0 0 10px 10px', border: '1px solid var(--border)', borderTop: 'none' }}>
                      {subs.map(sub => {
                        const isSubOpen = openSub === sub.id; const isDel = deleting === sub.id
                        return (
                          <div key={sub.id} style={{ marginBottom: 6, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <button onClick={() => setOpenSub(isSubOpen ? null : sub.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit' }}>
                                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'white', flexShrink: 0 }}>{sub.employee_name[0]}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, fontSize: 13 }}>{sub.employee_name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>📦 {countFilled(sub)} صنف</div>
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--muted)', transform: isSubOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</div>
                              </button>
                              <button onClick={() => downloadOrderPDF(sub, orderItems)} style={{ padding:'8px 10px', background:'none', border:'none', cursor:'pointer', fontSize:15, color:'var(--blue)' }} title="طباعة">🖨️</button>
                              <button onClick={() => downloadOrderSub(sub)} style={{ padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--green)' }}>⬇</button>
                              <button onClick={() => handleDeleteSub(sub.id)} disabled={isDel} style={{ padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--red)', opacity: isDel ? 0.5 : 1 }}>{isDel?'...':'🗑'}</button>
                            </div>
                            {isSubOpen && (
                              <div style={{ background: 'var(--surface-2)', padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
                                {categories.map(cat => {
                                  const filled = orderItems.filter(i => i.category===cat && sub.entries?.[i.id]?.qty)
                                  if (!filled.length) return null
                                  return (
                                    <div key={cat} style={{ marginBottom: 10 }}>
                                      <div className="cat-label">{cat}</div>
                                      <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 500 }}>
                                          <thead><tr style={{ background: 'var(--surface-2)' }}>
                                            {['No.','Code','UoM','Description','Arabic','QTY'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: h==='Description'?'left':'right', fontWeight: 600, color: 'var(--muted)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>)}
                                          </tr></thead>
                                          <tbody>{filled.map((i, idx) => (
                                            <tr key={i.id} style={{ background: idx%2===0?'white':'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                                              <td style={{ padding: '6px 8px', fontWeight: 700 }}>{i.item_no||''}</td>
                                              <td style={{ padding: '6px 8px', color: 'var(--muted)', fontSize: 10 }}>{i.code||''}</td>
                                              <td style={{ padding: '6px 8px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{i.uom||''}</td>
                                              <td style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10 }}>{i.name_en||i.name}</td>
                                              <td style={{ padding: '6px 8px', fontWeight: 600 }}>{i.name_ar||''}</td>
                                              <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, color: 'var(--brand)' }}>{sub.entries[i.id]?.qty}</td>
                                            </tr>
                                          ))}</tbody>
                                        </table>
                                      </div>
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

      {subTab === 'items' && (
        <>
          {orderItems.length === 0 && (
            <div style={{ marginBottom: 16 }}>
              <button className="btn-dark" onClick={handleSeedItems} disabled={seeding}>
                {seeding ? 'جاري الإضافة...' : '📦 إضافة قائمة Original Shawarma كاملة'}
              </button>
            </div>
          )}
          {orderItems.length > 0 && (
            <div style={{ marginBottom: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-sm btn-red" onClick={async () => {
                if (!window.confirm('حذف كل الأصناف؟')) return
                for (const i of orderItems) { await deleteOrderItem(i.id) }
                await reload()
              }}>🗑 حذف الكل</button>
              <button className="btn-sm btn-ink" onClick={handleSeedItems} disabled={seeding}>
                {seeding ? '...' : '🔄 إعادة تحميل القائمة'}
              </button>
            </div>
          )}
          <div className="card" style={{ marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>إضافة صنف جديد</h3>
            <div className="form-grid">
              <input className="input-plain" placeholder="الفئة" list="order-cats" value={newCat} onChange={e => setNewCat(e.target.value)} />
              <datalist id="order-cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
              <input className="input-plain" placeholder="اسم الصنف" value={newName} onChange={e => setNewName(e.target.value)} />
              <button className="btn-primary" onClick={handleAddItem} disabled={saving}>{saving?'...':'+ إضافة'}</button>
            </div>
          </div>
          {categories.map(cat => (
            <div key={cat} className="cat-section">
              <div className="cat-header">{cat}</div>
              {orderItems.filter(i => i.category===cat).map(i => (
                <div key={i.id} className="task-admin-row">
                  {editId===i.id
                    ? <><input className="input-plain" style={{ flex:1 }} value={editName} onChange={e => setEditName(e.target.value)} />
                      <button className="btn-sm btn-green" onClick={() => handleEditItem(i.id)}>💾</button>
                      <button className="btn-sm btn-red" onClick={() => setEditId(null)}>✕</button></>
                    : <><span style={{ fontSize:12, flex:1 }}>{i.name_en||i.name}</span>
                      <span style={{ fontSize:11, color:'var(--muted)' }}>{i.name_ar||''}</span>
                      <button className="icon-btn" onClick={() => { setEditId(i.id); setEditName(i.name_en||i.name) }}>✏️</button>
                      <button className="icon-btn" onClick={() => handleDeleteItem(i.id)}>🗑</button></>
                  }
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

const OTH = { padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap' }
const OTD = { padding: '7px 10px', verticalAlign: 'middle', textAlign: 'right' }
