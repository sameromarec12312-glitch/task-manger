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
    setEntries(it.reduce((acc, item) => ({ ...acc, [item.id]: { qty: '', note: '' } }), {}))
    setLoading(false)
  }

  const setEntry = (id, field, val) =>
    setEntries(p => ({ ...p, [id]: { ...p[id], [field]: val } }))

  const handleSubmit = async () => {
    const filled = items.filter(i => entries[i.id]?.qty || entries[i.id]?.note)
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
          <div className="summary-card">
            {categories.map(cat => {
              const filled = items.filter(i =>
                i.category === cat && (displaySub.entries?.[i.id]?.qty || displaySub.entries?.[i.id]?.note)
              )
              if (!filled.length) return null
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div className="cat-label">{cat}</div>
                  {filled.map(i => {
                    const e = displaySub.entries[i.id]
                    return (
                      <div key={i.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{i.name}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {e?.qty && <span className="summary-val">الكمية: {e.qty}</span>}
                          {e?.note && <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>📝 {e.note}</span>}
                        </div>
                      </div>
                    )
                  })}
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
        <div>
          <div className="emp-name">{emp.name}</div>
          <div className="emp-meta">{todayStr()}</div>
        </div>
        <button onClick={() => nav(`/org/${slug}/submit`)} style={{
          background: 'var(--amber-light)', border: '1px solid var(--amber)',
          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, color: 'var(--amber-dark)',
          fontFamily: "'Cairo', sans-serif"
        }}>← المهام</button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="icon">📦</div>
          <p>لا توجد أصناف بعد</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>يضيفها المدير من لوحة التحكم</p>
        </div>
      ) : (
        <div className="task-list-wrap">
          {categories.map(cat => (
            <div key={cat} className="cat-section">
              <div className="cat-header">{cat}</div>
              {items.filter(i => i.category === cat).map(item => (
                <div key={item.id} style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
                  <div className="task-row">
                    <div className="task-name" style={{ fontSize: 12 }}>{item.name}</div>
                    <div className="task-inputs">
                      <label>كمية</label>
                      <input type="number" min="0" placeholder="0" className="task-input"
                        value={entries[item.id]?.qty || ''}
                        onChange={e => setEntry(item.id, 'qty', e.target.value)} />
                      <input
                        placeholder="ملاحظة"
                        className="task-input"
                        style={{ width: 80, fontSize: 11 }}
                        value={entries[item.id]?.note || ''}
                        onChange={e => setEntry(item.id, 'note', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
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
