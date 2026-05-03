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

  // Auto-generate slug from org name
  const handleOrgNameChange = (val) => {
    setOrgName(val)
    setOrgSlug(val.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 30))
  }

  const handleCreate = async () => {
    setError('')
    if (!orgName.trim()) return setError('أدخل اسم المؤسسة')
    if (!orgSlug.trim()) return setError('الرابط المختصر لا يمكن أن يكون فارغاً')
    setSaving(true)
    try {
      await createOrg({ adminId: admin.id, orgName: orgName.trim(), slug: orgSlug })
      await load(admin.id)
      setShowAdd(false)
      setOrgName('')
      setOrgSlug('')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (org) => {
    if (!window.confirm(`حذف "${org.name}"؟ سيتم حذف كل الموظفين والمهام والتسليمات.`)) return
    setDeleting(org.id)
    try {
      await deleteOrg(org.id)
      setOrgs(p => p.filter(o => o.id !== org.id))
    } finally {
      setDeleting(null)
    }
  }

  const openOrg = (org) => {
    sessionStorage.setItem('current_org', JSON.stringify(org))
    nav('/admin/dashboard')
  }

  const logout = () => {
    sessionStorage.removeItem('admin')
    sessionStorage.removeItem('current_org')
    nav('/')
  }

  const appUrl = window.location.origin

  if (loading) return <div className="loading"><div className="spinner" /><span>تحميل...</span></div>

  return (
    <div className="page">
      {/* Header */}
      <nav className="topnav">
        <div>
          <div className="topnav-title">👋 مرحباً {admin?.name}</div>
          <div className="topnav-sub">اختر مؤسسة للإدارة</div>
        </div>
        <button className="topnav-logout" onClick={logout}>خروج</button>
      </nav>

      <div className="tab-content">

        {/* Add new org button */}
        <button
          onClick={() => { setShowAdd(p => !p); setError('') }}
          style={{
            width: '100%', padding: '14px', marginBottom: 16,
            background: showAdd ? 'var(--bg)' : 'var(--amber)',
            border: showAdd ? '2px dashed var(--border)' : 'none',
            borderRadius: 12, fontSize: 15, fontWeight: 800,
            color: showAdd ? 'var(--muted)' : 'white',
            cursor: 'pointer', fontFamily: "'Cairo', sans-serif",
            transition: 'all 0.2s'
          }}>
          {showAdd ? '✕ إلغاء' : '＋ إضافة مؤسسة جديدة'}
        </button>

        {/* Add org form */}
        {showAdd && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>مؤسسة جديدة</h3>
            {error && <div className="error-msg">{error}</div>}

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>
                اسم المؤسسة
              </label>
              <input className="input-plain" placeholder="مثال: مطعم الأصيل" value={orgName}
                onChange={e => handleOrgNameChange(e.target.value)} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>
                الرابط المختصر (إنجليزي)
              </label>
              <input className="input-plain" placeholder="aseel-restaurant" value={orgSlug}
                onChange={e => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
              {orgSlug && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
                  🔗 رابط الموظفين: <strong style={{ color: 'var(--amber-dark)' }}>{appUrl}/org/{orgSlug}</strong>
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
          <div className="empty-state">
            <div className="icon">🏢</div>
            <p>لا توجد مؤسسات بعد</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>اضغط "إضافة مؤسسة جديدة" للبدء</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orgs.map(org => (
              <div key={org.id} style={{
                background: 'white', borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)'
              }}>
                {/* Main tap area */}
                <button
                  onClick={() => openOrg(org)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'right', fontFamily: "'Cairo', sans-serif",
                    borderBottom: '1px solid var(--border)'
                  }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'linear-gradient(135deg, var(--amber) 0%, var(--amber-dark) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0
                  }}>🏢</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--dark)' }}>{org.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                      {appUrl}/org/{org.slug}
                    </div>
                  </div>
                  <div style={{ fontSize: 20, color: 'var(--muted)' }}>←</div>
                </button>

                {/* Bottom actions */}
                <div style={{ display: 'flex', gap: 8, padding: '10px 16px', background: 'var(--bg)' }}>
                  <button className="btn-sm btn-amber" style={{ flex: 1 }}
                    onClick={() => {
                      navigator.clipboard?.writeText(`${appUrl}/org/${org.slug}`)
                      alert('تم نسخ رابط الموظفين!')
                    }}>
                    🔗 نسخ رابط الموظفين
                  </button>
                  <button className="btn-sm btn-red"
                    onClick={() => handleDelete(org)}
                    disabled={deleting === org.id}>
                    {deleting === org.id ? '...' : '🗑'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
