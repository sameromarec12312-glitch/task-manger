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

  if (existing || submittedEntries) return (
    <div className="page">
      <nav className="topnav">
        <div className="topnav-title">تم إرسال الطلب ✅</div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>
      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 56 }}>📦</div>
          <h2 style={{ color: 'var(--green)', fontWeight: 800 }}>تم إرسال طلبك!</h2>
          <p style={{ color: 'var(--muted)' }}>{todayStr()}</p>
        </div>
        <OrderTable items={items} categories={categories} entries={displaySub?.entries} readOnly />
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={logout}>تسجيل الخروج</button>
      </div>
    </div>
  )

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
        <button onClick={() => nav(`/org/${slug}/submit`)} style={{ background: 'var(--amber)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'white', fontFamily: "'Cairo', sans-serif" }}>✅ المهام</button>
      </div>

      {items.length === 0
        ? <div className="empty-state"><div className="icon">📦</div><p>لا توجد أصناف بعد</p></div>
        : <div style={{ paddingBottom: 80 }}>
            <OrderTable items={items} categories={categories} entries={entries}
              onQtyChange={(id, val) => setEntries(p => ({ ...p, [id]: { qty: val } }))} />
          </div>
      }
      <div className="submit-bar">
        <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ background: 'var(--dark)' }}>
          {submitting ? 'جاري الإرسال...' : '📦 إرسال الطلبيات'}
        </button>
      </div>
    </div>
  )
}

function OrderTable({ items, categories, entries, onQtyChange, readOnly }) {
  return (
    <div>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <div style={{ background: 'var(--dark)', color: 'white', padding: '10px 16px', fontWeight: 800, fontSize: 14 }}>{cat}</div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 650 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid var(--border)' }}>
                  <th style={TH}>Item No.</th>
                  <th style={TH}>Code</th>
                  <th style={TH}>UoM</th>
                  <th style={{ ...TH, minWidth: 180, textAlign: 'left' }}>Description</th>
                  <th style={{ ...TH, minWidth: 120 }}>Arabic</th>
                  <th style={{ ...TH, width: 75, background: '#fef3c7', color: '#b45309' }}>QTY</th>
                </tr>
              </thead>
              <tbody>
                {items.filter(i => i.category === cat).map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <td style={{ ...TD, fontWeight: 700, color: 'var(--dark)' }}>{item.item_no || ''}</td>
                    <td style={{ ...TD, color: 'var(--muted)', fontSize: 10 }}>{item.code || ''}</td>
                    <td style={{ ...TD, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{item.uom || ''}</td>
                    <td style={{ ...TD, textAlign: 'left', fontSize: 11 }}>{item.name_en || item.name}</td>
                    <td style={{ ...TD, fontWeight: 600, direction: 'rtl' }}>{item.name_ar || ''}</td>
                    <td style={{ ...TD, padding: '4px 6px', textAlign: 'center' }}>
                      {readOnly
                        ? <span style={{ fontWeight: 800, color: entries?.[item.id]?.qty ? 'var(--dark)' : 'var(--muted)' }}>
                            {entries?.[item.id]?.qty || '-'}
                          </span>
                        : <input type="number" min="0" placeholder="0"
                            style={{ width: 65, padding: '5px 6px', border: '1.5px solid var(--border)', borderRadius: 6, fontSize: 13, textAlign: 'center', fontFamily: "'Cairo',sans-serif", outline: 'none' }}
                            value={entries?.[item.id]?.qty || ''}
                            onChange={e => onQtyChange(item.id, e.target.value)}
                            onFocus={e => e.target.style.borderColor = '#f59e0b'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                          />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

const TH = { padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap' }
const TD = { padding: '7px 10px', verticalAlign: 'middle', textAlign: 'right' }
