import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTasks, getTodaySubmission, submitWork, getSections, uploadPhoto, deletePhoto } from '../lib/supabase'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function EmployeeSubmit() {
  const { slug } = useParams()
  const nav = useNavigate()
  const [emp, setEmp] = useState(null)
  const [tasks, setTasks] = useState([])
  const [sections, setSections] = useState([])
  const [selectedSection, setSelectedSection] = useState(null)
  const [step, setStep] = useState('section') // section | tasks
  const [entries, setEntries] = useState({})
  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submittedEntries, setSubmittedEntries] = useState(null)
  const [noteOpen, setNoteOpen] = useState(null)
  const [photoOpen, setPhotoOpen] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('employee')
    if (!stored) { nav(`/org/${slug}`); return }
    const e = JSON.parse(stored)
    setEmp(e)
    init(e)
  }, [slug, nav])

  const init = async (e) => {
    const [t, sub, sec] = await Promise.all([
      getTasks(e.org_id),
      getTodaySubmission(e.org_id, e.id),
      getSections(e.org_id)
    ])
    setTasks(t)
    setExisting(sub)
    setSections(sec)
    const initEntries = t.reduce((acc, task) => ({ ...acc, [task.id]: { qty: '', time: '', note: '' } }), {})
    setEntries(initEntries)
    // If no sections defined, skip section step
    if (sec.length === 0) setStep('tasks')
    setLoading(false)
  }

  const setEntry = (taskId, field, val) =>
    setEntries(p => ({ ...p, [taskId]: { ...p[taskId], [field]: val } }))

  const handleSubmit = async () => {
    const filled = tasks.filter(t => entries[t.id]?.qty || entries[t.id]?.time || entries[t.id]?.note)
    if (!filled.length) { alert('أدخل بيانات لمهمة واحدة على الأقل'); return }
    setSubmitting(true)
    try {
      const snapshot = { ...entries }
      await submitWork({
        orgId: emp.org_id,
        employeeId: emp.id,
        employeeName: emp.name,
        entries: snapshot,
        sectionId: selectedSection?.id || null,
        sectionName: selectedSection?.name || null
      })
      setSubmittedEntries(snapshot)
    } catch (e) {
      alert('حدث خطأ: ' + e.message)
    } finally { setSubmitting(false) }
  }

  const logout = () => { sessionStorage.removeItem('employee'); nav(`/org/${slug}`) }
  const categories = [...new Set(tasks.map(t => t.category))]
  const displaySub = existing || (submittedEntries ? { entries: submittedEntries, section_name: selectedSection?.name } : null)

  if (loading) return <div className="loading"><div className="spinner" /><span>تحميل...</span></div>
  if (!emp) return null

  // ── SUCCESS ──────────────────────────────────────────────────────────────────
  if (existing || submittedEntries) return (
    <div className="page">
      <nav className="topnav">
        <div className="topnav-title">تم التسليم ✅</div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>
      <div className="success-page">
        <div className="success-icon">✅</div>
        <h2 className="success-title">تم تسليم مهامك!</h2>
        <p className="success-date">{todayStr()}</p>
        {displaySub?.section_name && (
          <div style={{ background: 'var(--brand-light)', border: '1px solid var(--brand)', borderRadius: 10, padding: '8px 16px', marginBottom: 8, fontWeight: 700, color: 'var(--brand-dark)' }}>
            📍 القسم: {displaySub.section_name}
          </div>
        )}
        {displaySub && (
          <div className="summary-card">
            {categories.map(cat => {
              const filled = tasks.filter(t =>
                t.category === cat &&
                (displaySub.entries?.[t.id]?.qty || displaySub.entries?.[t.id]?.time || displaySub.entries?.[t.id]?.note)
              )
              if (!filled.length) return null
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div className="cat-label">{cat}</div>
                  {filled.map(t => {
                    const e = displaySub.entries[t.id]
                    return (
                      <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t.name}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {e?.qty && <span className="summary-val">الكمية: {e.qty}</span>}
                          {e?.time && <span className="summary-val">الوقت: {e.time}د</span>}
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

  // ── STEP 1: PICK SECTION ──────────────────────────────────────────────────────
  if (step === 'section') return (
    <div className="page">
      <nav className="topnav">
        <div>
          <div className="topnav-title">تسليم المهام اليومي</div>
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
      </div>
      <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: 'var(--ink)' }}>اختر قسمك</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>حدد القسم الذي تعمل فيه اليوم</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sections.map(sec => (
            <button key={sec.id}
              onClick={() => { setSelectedSection(sec); setStep('tasks') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 20px', background: 'white',
                border: '2px solid var(--border)', borderRadius: 14,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.15s'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--amber)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{ fontSize: 32 }}>{sec.icon}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>{sec.name}</div>
              </div>
              <div style={{ marginRight: 'auto', color: 'var(--muted)', fontSize: 18 }}>←</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── STEP 2: TASK FORM ─────────────────────────────────────────────────────────
  return (
    <div className="page">
      <nav className="topnav">
        <div>
          <div className="topnav-title">تسليم المهام اليومي</div>
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
        <button onClick={() => nav(`/org/${slug}/orders`)} style={{ background: "var(--dark)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "white", fontFamily: "Cairo, sans-serif", flexShrink: 0 }}>📦 طلبيات</button>
        {selectedSection && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--brand-light)', border: '1px solid var(--brand)',
            borderRadius: 20, padding: '4px 12px', cursor: 'pointer'
          }} onClick={() => setStep('section')}>
            <span style={{ fontSize: 16 }}>{selectedSection.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-dark)' }}>{selectedSection.name}</span>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>✎</span>
          </div>
        )}
      </div>

      <div className="task-list-wrap">
        {categories.map(cat => (
          <div key={cat} className="cat-section">
            <div className="cat-header">{cat}</div>
            {tasks.filter(t => t.category === cat).map(task => {
              const hasNote = entries[task.id]?.note
              const hasPhoto = entries[task.id]?.photo
              const noteIsOpen = noteOpen === task.id
              const photoIsOpen = photoOpen === task.id
              return (
                <div key={task.id} style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
                  <div className="task-row">
                    <div className="task-name">{task.name}</div>
                    <div className="task-inputs">
                      <label>كمية</label>
                      <input type="number" min="0" placeholder="0" className="task-input"
                        value={entries[task.id]?.qty || ''}
                        onChange={e => setEntry(task.id, 'qty', e.target.value)} />
                      <label>وقت(د)</label>
                      <input type="number" min="0" placeholder="0" className="task-input"
                        value={entries[task.id]?.time || ''}
                        onChange={e => setEntry(task.id, 'time', e.target.value)} />
                      <button
                        onClick={() => setNoteOpen(noteIsOpen ? null : task.id)}
                        style={{
                          background: hasNote ? 'var(--amber-light)' : 'var(--bg)',
                          border: `1px solid ${hasNote ? 'var(--amber)' : 'var(--border)'}`,
                          borderRadius: 6, padding: '5px 7px', cursor: 'pointer', fontSize: 13,
                          color: hasNote ? 'var(--amber-dark)' : 'var(--muted)'
                        }}>📝</button>
                      <button
                        onClick={() => setPhotoOpen(photoIsOpen ? null : task.id)}
                        style={{
                          background: hasPhoto ? '#dcfce7' : 'var(--bg)',
                          border: `1px solid ${hasPhoto ? 'var(--green)' : 'var(--border)'}`,
                          borderRadius: 6, padding: '5px 7px', cursor: 'pointer', fontSize: 13,
                          color: hasPhoto ? 'var(--green)' : 'var(--muted)'
                        }}>📷</button>
                    </div>
                  </div>
                  {noteIsOpen && (
                    <div style={{ padding: '8px 14px 10px', background: 'var(--brand-light)', borderTop: '1px solid var(--amber)' }}>
                      <label style={{ fontSize: 11, color: 'var(--brand-dark)', fontWeight: 700, display: 'block', marginBottom: 4 }}>📝 ملاحظة</label>
                      <input className="input-plain" placeholder="اكتب ملاحظتك هنا..."
                        value={entries[task.id]?.note || ''}
                        onChange={e => setEntry(task.id, 'note', e.target.value)}
                        style={{ fontSize: 13 }} />
                    </div>
                  )}
                  {photoIsOpen && (
                    <PhotoBlock
                      taskId={task.id}
                      empId={emp.id}
                      orgId={emp.org_id}
                      photo={entries[task.id]?.photo}
                      uploading={entries[task.id]?.uploading}
                      onPhoto={(url) => setEntry(task.id, 'photo', url)}
                      onUploading={(val) => setEntry(task.id, 'uploading', val)}
                    />
                  )}
                </div>
              )
            })}
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

function PhotoBlock({ taskId, empId, orgId, photo, uploading, onPhoto, onUploading }) {
  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    // Compress and add timestamp watermark
    const stamped = await addTimestamp(file)
    onUploading(true)
    try {
      const url = await uploadPhoto(orgId, empId, taskId, stamped)
      onPhoto(url)
    } catch (err) {
      alert('فشل رفع الصورة: ' + err.message)
    } finally {
      onUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('حذف الصورة؟')) return
    if (photo) await deletePhoto(photo)
    onPhoto('')
  }

  return (
    <div style={{ padding: '10px 14px', background: '#f0fdf4', borderTop: '1px solid var(--green)' }}>
      <label style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, display: 'block', marginBottom: 8 }}>📷 صورة</label>
      {uploading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, color: 'var(--green)' }}>
          <div className="spinner" style={{ borderTopColor: 'var(--green)' }} />
          <span style={{ fontSize: 13 }}>جاري رفع الصورة...</span>
        </div>
      ) : photo ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={photo} alt="task" style={{ width: '100%', maxWidth: 280, borderRadius: 8, display: 'block' }} />
          <button onClick={handleDelete} style={{
            position: 'absolute', top: 4, left: 4, background: 'var(--red)', color: 'white',
            border: 'none', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700
          }}>✕ حذف</button>
        </div>
      ) : (
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '18px', border: '2px dashed var(--green)', borderRadius: 10,
          cursor: 'pointer', color: 'var(--green)', fontWeight: 700, fontSize: 14, background: 'white'
        }}>
          <span style={{ fontSize: 28 }}>📷</span>
          <span>اضغط لالتقاط صورة</span>
          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
        </label>
      )}
    </div>
  )
}

// Compress image and add timestamp watermark
async function addTimestamp(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1000
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = (height / width) * MAX; width = MAX }
        else { width = (width / height) * MAX; height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Timestamp text
      const now = new Date()
      const dateStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const stamp = `${dateStr}  ${timeStr}`

      const fontSize = Math.max(14, Math.round(width * 0.035))
      ctx.font = `bold ${fontSize}px Arial`

      // Background bar at bottom
      const barH = fontSize * 2.2
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, height - barH, width, barH)

      // White text
      ctx.fillStyle = 'white'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(stamp, fontSize * 0.5, height - barH / 2)

      canvas.toBlob(blob => {
        resolve(new File([blob], file.name, { type: 'image/jpeg' }))
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.85)
    }
    img.src = url
  })
}
