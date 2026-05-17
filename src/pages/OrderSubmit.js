import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrderItems, getTodayOrderSubmission, submitOrder } from '../lib/supabase'
import { downloadOrderPDF } from '../lib/printOrder'
 
const todayStr = () => new Date().toISOString().split('T')[0]
 
export default function OrderSubmit() {
  const { slug } = useParams()
  const nav = useNavigate()
  const [emp, setEmp] = useState(null)
  const [items, setItems] = useState([])
  const [entries, setEntries] = useState({})
  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submittedEntries, setSubmittedEntries] = useState(null)
 
  useEffect(() => {
    const stored = sessionStorage.getItem('employee')
    if (!stored) { nav(`/org/${slug}`); return }
    const e = JSON.parse(stored)
    // Block access if employee doesn't have orders permission
    if (!e.can_orders) { nav(`/org/${slug}/submit`); return }
    setEmp(e)
    init(e)
  }, [slug, nav])
 
  const init = async (e) => {
    const [it, sub] = await Promise.all([getOrderItems(e.org_id), getTodayOrderSubmission(e.org_id, e.id)])
    setItems(it)
    setExisting(sub)
    setEntries(it.reduce((acc, i) => ({ ...acc, [i.id]: { qty: '' } }), {}))
    setLoading(false)
  }
 
  const handleSubmit = async () => {
    const filled = items.filter(i => entries[i.id]?.qty)
    if (!filled.length) { alert('أدخل كمية لصنف واحد على الأقل'); return }
    setSubmitting(true)
    try {
      await submitOrder({ orgId: emp.org_id, employeeId: emp.id, employeeName: emp.name, entries: { ...entries } })
      setSubmittedEntries({ ...entries })
    } catch (e) { alert('حدث خطأ: ' + e.message) }
    finally { setSubmitting(false) }
  }
 
  const logout = () => { sessionStorage.removeItem('employee'); nav(`/org/${slug}`) }
  const categories = [...new Set(items.map(i => i.category))]
  const displaySub = existing || (submittedEntries ? { entries: submittedEntries } : null)
 
  if (loading) return <div className="loading"><div className="spinner" /><span>تحميل...</span></div>
  if (!emp) return null
 
  // ── SUCCESS ──────────────────────────────────────────────────────────────────
  if (existing || submittedEntries) return (
    <div className="page">
      <nav className="topnav">
        <div className="topnav-brand">
          <div className="topnav-logo">📦</div>
          <div><div className="topnav-title">تم إرسال الطلب</div></div>
        </div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>
      <div className="success-page">
        <div className="success-icon">📦</div>
        <h2 className="success-title">تم إرسال طلبك!</h2>
        <p className="success-date">{todayStr()}</p>
        {displaySub && (
          <div className="card" style={{ width: '100%', maxWidth: 560 }}>
            {categories.map(cat => {
              const filled = items.filter(i => i.category === cat && displaySub.entries?.[i.id]?.qty)
              if (!filled.length) return null
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div className="cat-label">{cat}</div>
                  <table className="data-table">
                    <thead><tr><th>No.</th><th>Arabic</th><th style={{ textAlign: 'center' }}>QTY</th></tr></thead>
                    <tbody>{filled.map(i => (
                      <tr key={i.id}>
                        <td style={{ fontSize: 11, color: 'var(--muted)' }}>{i.item_no || ''}</td>
                        <td style={{ fontWeight: 600 }}>{i.name_ar || i.name}</td>
                        <td className="num" style={{ color: 'var(--brand)' }}>{displaySub.entries[i.id]?.qty}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}
        <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap', justifyContent:'center' }}>
          <button className="btn-primary" style={{ maxWidth:200 }} onClick={() => downloadOrderPDF(displaySub, items)}>
            ⬇ تحميل PDF
          </button>
          <button className="btn-ghost" style={{ maxWidth:200 }} onClick={logout}>تسجيل الخروج</button>
        </div>
      </div>
    </div>
  )
 
  // ── ORDER FORM ────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <nav className="topnav">
        <div className="topnav-brand">
          <div className="topnav-logo">📦</div>
          <div>
            <div className="topnav-title">تسليم الطلبيات</div>
            <div className="topnav-sub">{emp.org_name || ''}</div>
          </div>
        </div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>
 
      <div className="emp-header-bar">
        <div className="emp-avatar">{emp.name[0]}</div>
        <div style={{ flex: 1 }}>
          <div className="emp-name">{emp.name}</div>
          <div className="emp-meta">{todayStr()}</div>
        </div>
        <button onClick={() => nav(`/org/${slug}/submit`)} style={{
          background: 'var(--brand)', border: 'none', borderRadius: 8,
          padding: '6px 12px', cursor: 'pointer', fontSize: 11,
          fontWeight: 700, color: 'white', fontFamily: 'inherit'
        }}>✅ المهام</button>
      </div>
 
      {items.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="icon">📦</div>
          <p>لا توجد أصناف بعد</p>
          <p>يضيفها المدير من لوحة التحكم</p>
        </div>
      ) : (
        <div style={{ paddingBottom: 80 }}>
          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div className="cat-header">{cat}</div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--border)' }}>
                      <th style={TH}>Item No.</th>
                      <th style={TH}>Code</th>
                      <th style={TH}>UoM</th>
                      <th style={{ ...TH, minWidth: 180, textAlign: 'left' }}>Description</th>
                      <th style={{ ...TH, minWidth: 120 }}>Arabic</th>
                      <th style={{ ...TH, width: 75, background: 'var(--brand-light)', color: 'var(--brand-dark)' }}>QTY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i => i.category === cat).map((item, idx) => (
                      <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ ...TD, fontWeight: 700, color: 'var(--ink)' }}>{item.item_no || ''}</td>
                        <td style={{ ...TD, color: 'var(--muted)', fontSize: 10 }}>{item.code || ''}</td>
                        <td style={{ ...TD, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{item.uom || ''}</td>
                        <td style={{ ...TD, textAlign: 'left', fontSize: 11 }}>{item.name_en || item.name}</td>
                        <td style={{ ...TD, fontWeight: 600 }}>{item.name_ar || ''}</td>
                        <td style={{ ...TD, padding: '4px 6px', textAlign: 'center' }}>
                          <input type="number" min="0" placeholder="0"
                            style={{
                              width: 65, padding: '6px 6px', border: '1.5px solid var(--border)',
                              borderRadius: 8, fontSize: 13, textAlign: 'center',
                              fontFamily: 'IBM Plex Mono, monospace', outline: 'none',
                              background: 'var(--surface-2)', transition: 'all 0.2s'
                            }}
                            value={entries[item.id]?.qty || ''}
                            onChange={e => setEntries(p => ({ ...p, [item.id]: { qty: e.target.value } }))}
                            onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.background = 'white' }}
                            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface-2)' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
 
      <div className="submit-bar">
        <button className="btn-dark" onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />جاري الإرسال...</span>
            : '📦 إرسال الطلبيات'}
        </button>
      </div>
    </div>
  )
}
 
const TH = { padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap' }
const TD = { padding: '7px 10px', verticalAlign: 'middle', textAlign: 'right' }
