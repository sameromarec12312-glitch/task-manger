import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTasks, getTodaySubmission, submitWork } from '../lib/supabase'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function EmployeeSubmit() {
  const { slug } = useParams()
  const nav = useNavigate()
  const [emp, setEmp] = useState(null)
  const [tasks, setTasks] = useState([])
  const [entries, setEntries] = useState({})
  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedEntries, setSubmittedEntries] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('employee')
    if (!stored) { nav(`/org/${slug}`); return }
    const e = JSON.parse(stored)
    setEmp(e)
    init(e)
  }, [slug, nav])

  const init = async (e) => {
    const [t, sub] = await Promise.all([getTasks(e.org_id), getTodaySubmission(e.org_id, e.id)])
    setTasks(t)
    setExisting(sub)
    // init entries map
    const init = t.reduce((acc, task) => ({ ...acc, [task.id]: { qty: '', time: '' } }), {})
    setEntries(init)
    setLoading(false)
  }

  const setEntry = (taskId, field, val) => {
    setEntries(p => ({ ...p, [taskId]: { ...p[taskId], [field]: val } }))
  }

  const handleSubmit = async () => {
    const filled = tasks.filter(t => entries[t.id]?.qty || entries[t.id]?.time)
    if (!filled.length) { alert('أدخل بيانات لمهمة واحدة على الأقل'); return }
    setSubmitting(true)
    try {
      const snapshot = { ...entries }
      await submitWork({ orgId: emp.org_id, employeeId: emp.id, employeeName: emp.name, entries: snapshot })
      setSubmittedEntries(snapshot)
      setSubmitted(true)
    } catch (e) {
      alert('حدث خطأ: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const logout = () => { sessionStorage.removeItem('employee'); nav(`/org/${slug}`) }

  const categories = [...new Set(tasks.map(t => t.category))]
  const displaySub = existing || (submitted && submittedEntries ? { entries: submittedEntries } : null)

  if (loading) return <div className="loading"><div className="spinner" /><span>تحميل...</span></div>
  if (!emp) return null

  // ── ALREADY SUBMITTED / SUCCESS ────────────────────────────────────────────
  if (existing || submitted) return (
    <div className="page">
      <nav className="topnav">
        <div className="topnav-title">تم التسليم ✅</div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>
      <div className="success-page">
        <div className="success-icon">✅</div>
        <h2 className="success-title">تم تسليم مهامك!</h2>
        <p className="success-date">{todayStr()}</p>

        {displaySub && (
          <div className="summary-card">
            {categories.map(cat => {
              const filled = tasks.filter(t =>
                t.category === cat &&
                (displaySub.entries?.[t.id]?.qty || displaySub.entries?.[t.id]?.time)
              )
              if (!filled.length) return null
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div className="cat-label">{cat}</div>
                  {filled.map(t => (
                    <div key={t.id} className="summary-row">
                      <span>{t.name}</span>
                      <div className="summary-vals">
                        {displaySub.entries[t.id]?.qty && (
                          <span className="summary-val">الكمية: {displaySub.entries[t.id].qty}</span>
                        )}
                        {displaySub.entries[t.id]?.time && (
                          <span className="summary-val">الوقت: {displaySub.entries[t.id].time}د</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
        <button className="btn-primary" style={{ maxWidth: 280, marginTop: 8 }} onClick={logout}>
          تسجيل الخروج
        </button>
      </div>
    </div>
  )

  // ── TASK FORM ──────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <nav className="topnav">
        <div>
          <div className="topnav-title">تسليم المهام اليومي</div>
          <div className="topnav-sub">{emp.org_name || 'المؤسسة'}</div>
        </div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>

      <div className="emp-header-bar">
        <div className="emp-avatar">{emp.name[0]}</div>
        <div>
          <div className="emp-name">{emp.name}</div>
          <div className="emp-meta">{todayStr()}</div>
        </div>
      </div>

      <div className="task-list-wrap">
        {categories.map(cat => (
          <div key={cat} className="cat-section">
            <div className="cat-header">{cat}</div>
            {tasks.filter(t => t.category === cat).map(task => (
              <div key={task.id} className="task-row">
                <div className="task-name">{task.name}</div>
                <div className="task-inputs">
                  <label>الكمية</label>
                  <input type="number" min="0" placeholder="0" className="task-input"
                    value={entries[task.id]?.qty || ''}
                    onChange={e => setEntry(task.id, 'qty', e.target.value)} />
                  <label>وقت(د)</label>
                  <input type="number" min="0" placeholder="0" className="task-input"
                    value={entries[task.id]?.time || ''}
                    onChange={e => setEntry(task.id, 'time', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="submit-bar">
        <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'جاري التسليم...' : '✅ تسليم المهام اليومية'}
        </button>
      </div>
    </div>
  )
}
