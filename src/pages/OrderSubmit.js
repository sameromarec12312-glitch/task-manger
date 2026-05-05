import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrderItems, getTodayOrderSubmission, submitOrder } from '../lib/supabase'

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
    setEmp(e)
    init(e)
  }, [slug, nav])

  const init = async (e) => {
    const [it, sub] = await Promise.all([
      getOrderItems(e.org_id),
      getTodayOrderSubmission(e.org_id, e.id)
    ])
    setItems(it)
    setExisting(sub)
    setEntries(it.reduce((acc, item) => ({ ...acc, [item.id]: { qty: '' } }), {}))
    setLoading(false)
  }

  const handleSubmit = async () => {
    const filled = items.filter(i => entries[i.id]?.qty)
    if (!filled.length) { alert('أدخل كمية لصنف واحد على الأقل'); return }
    setSubmitting(true)
    try {
      const snapshot = { ...entries }
      await submitOrder({ orgId: emp.org_id, employeeId: emp.id, employeeName: emp.name, entries: snapshot })
      setSubmittedEntries(snapshot)
    } catch (e) {
      alert('حدث خطأ: ' + e.message)
    } finally { setSubmitting(false) }
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
        <div className="topnav-title">تم إرسال الطلب ✅</div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>
      <div className="success-page">
        <div className="success-icon">📦</div>
        <h2 className="success-title">تم إرسال طلبك!</h2>
        <p className="success-date">{todayStr()}</p>
        {displaySub && (
          <div className="summary-card" style={{ width: '100%' }}>
            {categories.map(cat => {
              const filled = items.filter(i => i.category === cat && displaySub.entries?.[i.id]?.qty)
              if (!filled.length) return null
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div className="cat-label">{cat}</div>
                  <table className="data-table">
                    <thead><tr>
                      <th>No.</th><th>Code</th><th>Arabic</th><th style={{ textAlign: 'center' }}>QTY</th>
                    </tr></thead>
                    <tbody>{filled.map(i => (
                      <tr key={i.id}>
                        <td style={{ fontSize: 11, color: 'var(--muted)' }}>{i.item_no || ''}</td>
                        <td style={{ fontSize: 11, color: 'var(--muted)' }}>{i.code || ''}</td>
                        <td style={{ fontSize: 12 }}>{i.name_ar || i.name}</td>
                        <td className="num">{displaySub.entries[i.id]?.qty}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}
        <button className="btn-primary" style={{ maxWidth: 280, marginTop: 8 }} onClick={logout}>تسجيل الخروج</button>
      </div>
    </div>
  )

  // ── ORDER FORM ────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <nav className="topnav">
        <div>
          <div className="topnav-title">📦 تسليم الطلبيات</div>
          <div className="topnav-sub">{emp.org_name || ''}</div>
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
          background: 'var(--amber)', border: 'none', borderRadius: 8,
          padding: '6px 12px', cursor: 'pointer', fontSize: 12,
          fontWeight: 700, color: 'white', fontFamily: "'Cairo', sans-serif"
        }}>✅ المهام</button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="icon">📦</div>
          <p>لا توجد أصناف بعد</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>يضيفها المدير من لوحة التحكم</p>
        </div>
      ) : (
        <div style={{ padding: '8px 0 100px', overflowX: 'auto' }}>
          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: 16 }}>
              {/* Category header */}
              <div style={{
                background: 'var(--dark)', color: 'white',
                padding: '10px 16px', fontWeight: 800, fontSize: 14,
                position: 'sticky', top: 0, zIndex: 5
              }}>{cat}</div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={thStyle}>Item No.</th>
                      <th style={thStyle}>Code</th>
                      <th style={thStyle}>UoM</th>
                      <th style={{ ...thStyle, minWidth: 200 }}>Description</th>
                      <th style={thStyle}>Arabic</th>
                      <th style={{ ...thStyle, width: 80, background: 'var(--amber-light)', color: 'var(--amber-dark)' }}>QTY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i => i.category === cat).map((item, idx) => (
                      <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={tdStyle}>{item.item_no || ''}</td>
                        <td style={{ ...tdStyle, color: 'var(--muted)', fontSize: 11 }}>{item.code || ''}</td>
                        <td style={{ ...tdStyle, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{item.uom || ''}</td>
                        <td style={{ ...tdStyle, fontSize: 11 }}>{item.name_en || item.name}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, direction: 'rtl', textAlign: 'right' }}>{item.name_ar || ''}</td>
                        <td style={{ ...tdStyle, padding: '4px 6px' }}>
                          <input
                            type="number" min="0" placeholder="0"
                            style={{
                              width: 70, padding: '6px 8px', border: '1.5px solid var(--border)',
                              borderRadius: 6, fontSize: 13, textAlign: 'center',
                              fontFamily: "'Cairo', sans-serif", outline: 'none'
                            }}
                            value={entries[item.id]?.qty || ''}
                            onChange={e => setEntries(p => ({ ...p, [item.id]: { qty: e.target.value } }))}
                            onFocus={e => e.target.style.borderColor = 'var(--amber)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
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
        <button className="btn-primary" onClick={handleSubmit} disabled={submitting}
          style={{ background: 'var(--dark)' }}>
          {submitting ? 'جاري الإرسال...' : '📦 إرسال الطلبيات'}
        </button>
      </div>
    </div>
  )
}

const thStyle = {
  padding: '8px 10px', textAlign: 'right', fontWeight: 700,
  color: 'var(--muted)', fontSize: 11, borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap'
}

const tdStyle = {
  padding: '8px 10px', borderBottom: '1px solid var(--border)',
  textAlign: 'right', verticalAlign: 'middle'
}
