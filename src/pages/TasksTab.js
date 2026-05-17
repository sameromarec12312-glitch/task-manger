import { useState } from 'react'
import { addTask, updateTask, deleteTask } from '../lib/supabase'

export default function TasksTab({ tasks, sections, orgId, reload }) {
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState('')
  const [newSectionId, setNewSectionId] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterSection, setFilterSection] = useState('')

  const categories = [...new Set(tasks.map(t => t.category))]
  const filteredTasks = filterSection ? tasks.filter(t => t.section_id === filterSection) : tasks

  const handleAdd = async () => {
    if (!newName.trim() || !newCat.trim()) return
    if (!newSectionId) { alert('يرجى اختيار القسم للمهمة'); return }
    setSaving(true)
    try {
      await addTask({ orgId, category: newCat.trim(), name: newName.trim(), sectionId: newSectionId })
      await reload(); setNewName(''); setNewCat('')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => { if (!window.confirm('حذف المهمة؟')) return; await deleteTask(id); reload() }
  const handleEdit = async (id) => { await updateTask(id, editName); setEditId(null); reload() }

  const getSectionInfo = (sectionId) => sections.find(s => s.id === sectionId)

  return (
    <div className="tab-content">
      <div className="card fade-up">
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>إضافة مهمة جديدة</h3>
        <div className="form-grid">
          <div>
            <label className="input-label">القسم *</label>
            <select className="select-plain" value={newSectionId} onChange={e => setNewSectionId(e.target.value)}>
              <option value="">اختر القسم</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">الفئة</label>
            <input className="input-plain" placeholder="مثال: تهيئة صوصبات" list="cats" value={newCat} onChange={e => setNewCat(e.target.value)} />
            <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="input-label">اسم المهمة</label>
            <input className="input-plain" placeholder="اسم المهمة" value={newName}
              onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'جاري الإضافة...' : '+ إضافة مهمة'}</button>
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
          }}>كل الأقسام</button>
          {sections.map(s => (
            <button key={s.id} onClick={() => setFilterSection(s.id)} style={{
              padding: '7px 14px', border: '1.5px solid var(--border)', borderRadius: 20,
              background: filterSection === s.id ? 'var(--ink)' : 'var(--surface)',
              color: filterSection === s.id ? 'white' : 'var(--muted)',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s'
            }}>{s.icon} {s.name}</button>
          ))}
        </div>
      )}

      {sections.length === 0 && (
        <div className="card fade-up" style={{ background: 'var(--amber-light)', borderColor: 'var(--amber)', marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--amber-dark)', fontWeight: 600 }}>
            ⚠️ يرجى إضافة الأقسام أولاً من تبويب "الأقسام" قبل إضافة المهام
          </p>
        </div>
      )}

      {[...new Set(filteredTasks.map(t => t.category))].map(cat => (
        <div key={cat} className="cat-section fade-up fade-up-2">
          <div className="cat-header">{cat}</div>
          {filteredTasks.filter(t => t.category === cat).map(t => {
            const sec = getSectionInfo(t.section_id)
            return (
              <div key={t.id} className="task-admin-row">
                {editId === t.id
                  ? <><input className="input-plain" style={{ flex: 1 }} value={editName} onChange={e => setEditName(e.target.value)} />
                    <button className="btn-sm btn-green" onClick={() => handleEdit(t.id)}>💾</button>
                    <button className="btn-sm btn-red" onClick={() => setEditId(null)}>✕</button></>
                  : <>
                    <div style={{ flex: 1 }}>
                      <span>{t.name}</span>
                      {sec && <span className="badge badge-brand" style={{ marginRight: 8, fontSize: 10 }}>{sec.icon} {sec.name}</span>}
                    </div>
                    <button className="icon-btn" onClick={() => { setEditId(t.id); setEditName(t.name) }}>✏️</button>
                    <button className="icon-btn" onClick={() => handleDelete(t.id)}>🗑</button>
                  </>
                }
              </div>
            )
          })}
        </div>
      ))}

      {filteredTasks.length === 0 && (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>لا توجد مهام</p>
          <p>أضف مهام من الأعلى</p>
        </div>
      )}
    </div>
  )
}
