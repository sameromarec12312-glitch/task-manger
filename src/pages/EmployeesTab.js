import { useState } from 'react'
import { addEmployee, deleteEmployee, updateEmployee, setEmployeeSections } from '../lib/supabase'

export default function EmployeesTab({ employees, sections, orgId, appUrl, orgSlug, reload }) {
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newSectionId, setNewSectionId] = useState('')
  const [newCanOrders, setNewCanOrders] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [editingEmp, setEditingEmp] = useState(null) // {id, name, pin, sectionIds:[], canOrders}

  const handleAdd = async () => {
    setError('')
    if (!newName.trim()) return setError('أدخل اسم الموظف')
    if (newPin.length < 4) return setError('الكود يجب أن يكون 4 أرقام على الأقل')
    setSaving(true)
    try {
      await addEmployee({ orgId, name: newName.trim(), pin: newPin, sectionId: newSectionId || null, canOrders: newCanOrders })
      await reload(); setNewName(''); setNewPin(''); setNewSectionId(''); setNewCanOrders(false)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => { if (!window.confirm('حذف الموظف؟')) return; await deleteEmployee(id); reload() }

  const handleSaveEdit = async () => {
    if (!editingEmp) return
    try {
      await updateEmployee(editingEmp.id, { canOrders: editingEmp.canOrders })
      await setEmployeeSections(editingEmp.id, editingEmp.sectionIds || [])
      await reload()
      setEditingEmp(null)
    } catch (e) { alert('خطأ: ' + e.message) }
  }

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text)
    setCopied(key); setTimeout(() => setCopied(''), 2000)
  }

  const filtered = filterSection ? employees.filter(e => e.section_id === filterSection) : employees

  return (
    <div className="tab-content">
      {error && <div className="error-msg">{error}</div>}

      <div className="card fade-up">
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>إضافة موظف جديد</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
          الموظف يرى فقط مهام القسم المخصص له
        </p>
        <div className="form-grid">
          <div>
            <label className="input-label">اسم الموظف</label>
            <input className="input-plain" placeholder="الاسم الكامل" value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          <div>
            <label className="input-label">القسم</label>
            <select className="select-plain" value={newSectionId} onChange={e => setNewSectionId(e.target.value)}>
              <option value="">بدون قسم محدد</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">كود الدخول (4-6 أرقام)</label>
            <input className="input-plain" placeholder="مثال: 1234" maxLength={6}
              value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              style={{ fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 4 }} />
          </div>
          {/* Orders access toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: newCanOrders ? 'var(--brand-light)' : 'var(--surface-2)', borderRadius: 10, border: `1.5px solid ${newCanOrders ? 'var(--brand)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setNewCanOrders(p => !p)}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: newCanOrders ? 'var(--brand-dark)' : 'var(--ink)' }}>📦 صلاحية الطلبيات</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>يرى زر الطلبيات ويمكنه تسليمها</div>
            </div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: newCanOrders ? 'var(--brand)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: newCanOrders ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
          <button className="btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? 'جاري الإضافة...' : '+ إضافة الموظف'}
          </button>
        </div>
      </div>

      {/* Filter by section */}
      {sections.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }} className="fade-up fade-up-1">
          <button onClick={() => setFilterSection('')} style={{
            padding: '7px 14px', border: '1.5px solid var(--border)', borderRadius: 20,
            background: !filterSection ? 'var(--ink)' : 'var(--surface)',
            color: !filterSection ? 'white' : 'var(--muted)',
            cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s'
          }}>الكل ({employees.length})</button>
          {sections.map(s => {
            const count = employees.filter(e => e.section_id === s.id).length
            return (
              <button key={s.id} onClick={() => setFilterSection(s.id)} style={{
                padding: '7px 14px', border: '1.5px solid var(--border)', borderRadius: 20,
                background: filterSection === s.id ? 'var(--ink)' : 'var(--surface)',
                color: filterSection === s.id ? 'white' : 'var(--muted)',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s'
              }}>{s.icon} {s.name} ({count})</button>
            )
          })}
        </div>
      )}

      {filtered.length === 0
        ? <div className="empty-state"><div className="icon">👥</div><p>لا يوجد موظفون</p></div>
        : filtered.map((e, i) => {
          const sec = sections.find(s => s.id === e.section_id)
          return (
            <div key={e.id} style={{ background: 'var(--surface)', borderRadius: 12, marginBottom: 8, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }} className={`fade-up fade-up-${Math.min(i+1,4)}`}>
              {/* Main row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                <div className="emp-avatar">{e.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div className="emp-name">{e.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {(() => {
                    const empSecs = (e.employee_sections || []).map(es => es.sections).filter(Boolean)
                    return empSecs.length > 0
                      ? empSecs.map(s => <span key={s.id} className="badge badge-brand" style={{ marginLeft: 4 }}>{s.icon} {s.name}</span>)
                      : <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>بدون قسم</span>
                  })()}
                    {e.can_orders && <span className="badge badge-green">📦 طلبيات</span>}
                    <span className="emp-code">🔑 {e.pin}</span>
                  </div>
                </div>
                <button className="btn-sm btn-blue" onClick={() => {
                    const existingSections = (e.employee_sections || []).map(es => es.section_id).filter(Boolean)
                    setEditingEmp({ id: e.id, name: e.name, sectionIds: existingSections, canOrders: e.can_orders || false })
                  }}>✏️ تعديل</button>
                <button className="icon-btn" onClick={() => handleDelete(e.id)}>🗑</button>
              </div>

              {/* Edit panel */}
              {editingEmp?.id === e.id && (
                <div style={{ padding: '14px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: 12 }}>
                    <label className="input-label">الأقسام (يمكن اختيار أكثر من قسم)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {sections.map(s => {
                        const isChecked = editingEmp.sectionIds?.includes(s.id)
                        return (
                          <div key={s.id}
                            onClick={() => setEditingEmp(p => ({
                              ...p,
                              sectionIds: isChecked
                                ? p.sectionIds.filter(id => id !== s.id)
                                : [...(p.sectionIds || []), s.id]
                            }))}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                              background: isChecked ? 'var(--brand-light)' : 'var(--surface)',
                              border: `1.5px solid ${isChecked ? 'var(--brand)' : 'var(--border)'}`,
                              transition: 'all 0.15s'
                            }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                              background: isChecked ? 'var(--brand)' : 'white',
                              border: `2px solid ${isChecked ? 'var(--brand)' : 'var(--border)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: 12, transition: 'all 0.15s'
                            }}>{isChecked ? '✓' : ''}</div>
                            <span style={{ fontSize: 22 }}>{s.icon}</span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: isChecked ? 'var(--brand-dark)' : 'var(--ink)' }}>{s.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: editingEmp.canOrders ? 'var(--brand-light)' : 'var(--surface)', borderRadius: 10, border: `1.5px solid ${editingEmp.canOrders ? 'var(--brand)' : 'var(--border)'}`, cursor: 'pointer', marginBottom: 12 }}
                    onClick={() => setEditingEmp(p => ({ ...p, canOrders: !p.canOrders }))}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: editingEmp.canOrders ? 'var(--brand-dark)' : 'var(--ink)' }}>📦 صلاحية الطلبيات</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>يرى زر الطلبيات</div>
                    </div>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: editingEmp.canOrders ? 'var(--brand)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: editingEmp.canOrders ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-sm btn-green" style={{ flex: 1 }} onClick={handleSaveEdit}>💾 حفظ</button>
                    <button className="btn-sm btn-red" onClick={() => setEditingEmp(null)}>✕ إلغاء</button>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <button className="btn-sm btn-blue" style={{ flex: 1 }} onClick={() => copy(e.pin, e.id + 'p')}>
                      {copied === e.id + 'p' ? '✅ تم' : '📋 نسخ الكود'}
                    </button>
                    <button className="btn-sm btn-amber" style={{ flex: 1 }} onClick={() => copy(`كود المؤسسة: ${orgSlug}\nكودك: ${e.pin}`, e.id + 'f')}>
                      {copied === e.id + 'f' ? '✅ تم' : '🔗 نسخ للموظف'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      }
    </div>
  )
}
