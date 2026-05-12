import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrgsByAdmin, createOrg, deleteOrg } from '../lib/supabase'

export default function OrgSelector() {
  const nav = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('admin')
    if (!stored) { nav('/admin/login'); return }
    const a = JSON.parse(stored)
    setAdmin(a)
    load(a.id)
  }, [nav])

  const load = async (adminId) => {
    setLoading(true)
    const data = await getOrgsByAdmin(adminId)
    setOrgs(data)
    setLoading(false)
  }

  const handleOrgNameChange = (val) => {
    setOrgName(val)
    setOrgSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30))
  }

  const handleCreate = async () => {
    setError('')
    if (!orgName.trim()) return setError('أدخل اسم المؤسسة')
    if (!orgSlug.trim()) return setError('الرابط المختصر مطلوب')
    setSaving(true)
    try {
      await createOrg({ adminId: admin.id, orgName: orgName.trim(), slug: orgSlug })
      await load(admin.id)
      setShowAdd(false); setOrgName(''); setOrgSlug('')
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (org) => {
    if (!window.confirm(`حذف "${org.name}"؟ سيتم حذف كل البيانات.`)) return
    setDeleting(org.id)
    try { await deleteOrg(org.id); setOrgs(p => p.filter(o => o.id !== org.id)) }
    finally { setDeleting(null) }
  }

  const openOrg = (org) => {
    sessionStorage.setItem('current_org', JSON.stringify(org))
    nav('/admin/dashboard')
  }

  const logout = () => { sessionStorage.removeItem('admin'); sessionStorage.removeItem('current_org'); nav('/') }
  const appUrl = window.location.origin

  if (loading) return <div className="loading"><div className="spinner" /><span>تحميل...</span></div>

  return (
    <div className="page">
      <nav className="topnav">
        <div className="topnav-brand">
          <div className="topnav-logo">🍖</div>
          <div>
            <div className="topnav-title">مؤسساتي</div>
            <div className="topnav-sub">مرحباً، {admin?.name}</div>
          </div>
        </div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>

      <div className="tab-content" style={{ paddingTop: 20 }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }} className="fade-up">
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-value">{orgs.length}</div>
            <div className="stat-label">مؤسسة</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{new Date().toLocaleDateString('ar-SA', { weekday: 'short' })}</div>
            <div className="stat-label">{new Date().toLocaleDateString('ar-SA')}</div>
          </div>
        </div>

        {/* Add button */}
        <button onClick={() => { setShowAdd(p => !p); setError('') }}
          className="fade-up fade-up-1"
          style={{
            width: '100%', padding: 14, marginBottom: 16,
            background: showAdd ? 'var(--surface-2)' : 'var(--brand)',
            border: showAdd ? '1.5px dashed var(--border)' : 'none',
            borderRadius: 'var(--radius-lg)', fontSize: 14, fontWeight: 700,
            color: showAdd ? 'var(--muted)' : 'white',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            boxShadow: showAdd ? 'none' : '0 6px 24px rgba(255,107,53,0.3)'
          }}>
          {showAdd ? '✕ إلغاء' : '＋ إضافة مؤسسة جديدة'}
        </button>

        {/* Add form */}
        {showAdd && (
          <div className="card fade-up" style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              🏢 مؤسسة جديدة
            </h3>
            {error && <div className="error-msg">{error}</div>}
            <div style={{ marginBottom: 10 }}>
              <label className="input-label">اسم المؤسسة</label>
              <input className="input-plain" placeholder="مثال: مطعم الأصيل" value={orgName} onChange={e => handleOrgNameChange(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="input-label">الرابط المختصر (إنجليزي)</label>
              <input className="input-plain" placeholder="aseel-restaurant" value={orgSlug}
                onChange={e => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
              {orgSlug && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  🔗 <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{appUrl}/org/{orgSlug}</span>
                </div>
              )}
            </div>
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'جاري الإنشاء...' : '✓ إنشاء المؤسسة'}
            </button>
          </div>
        )}

        {/* Org list */}
        {orgs.length === 0 ? (
          <div className="empty-state fade-up">
            <div className="icon">🏢</div>
            <p>لا توجد مؤسسات بعد</p>
            <p>اضغط "إضافة مؤسسة جديدة" للبدء</p>
          </div>
        ) : orgs.map((org, i) => (
          <div key={org.id} className={`org-card fade-up fade-up-${Math.min(i+1,4)}`}>
            <button onClick={() => openOrg(org)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', background: 'none', border: 'none',
              cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
                boxShadow: '0 4px 14px rgba(255,107,53,0.3)'
              }}>🏢</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{org.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, fontFamily: 'IBM Plex Mono, monospace' }}>
                  {appUrl}/org/{org.slug}
                </div>
              </div>
              <div style={{ fontSize: 18, color: 'var(--muted)' }}>←</div>
            </button>
            <div style={{ display: 'flex', gap: 8, padding: '10px 18px', background: 'var(--surface-2)' }}>
              <button className="btn-sm btn-amber" style={{ flex: 1 }}
                onClick={() => { navigator.clipboard?.writeText(`${appUrl}/org/${org.slug}`); alert('تم نسخ رابط الموظفين!') }}>
                🔗 نسخ رابط الموظفين
              </button>
              <button className="btn-sm btn-red"
                onClick={() => handleDelete(org)} disabled={deleting === org.id}>
                {deleting === org.id ? '...' : '🗑'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
