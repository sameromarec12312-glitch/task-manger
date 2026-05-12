import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrgBySlug, loginEmployee } from '../lib/supabase'

export default function EmployeeLogin() {
  const { slug } = useParams()
  const nav = useNavigate()
  const [org, setOrg] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    getOrgBySlug(slug)
      .then(o => setOrg(o))
      .catch(() => setOrg(null))
      .finally(() => setLoading(false))
  }, [slug])

  const handleKey = async (k) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return }
    if (k === '✓') {
      if (!pin) return
      setLogging(true); setError('')
      try {
        const emp = await loginEmployee({ orgId: org.id, pin })
        sessionStorage.setItem('employee', JSON.stringify({ ...emp, orgName: org.name, orgSlug: slug }))
        nav(`/org/${slug}/submit`)
      } catch (e) {
        setError(e.message); setPin('')
      } finally { setLogging(false) }
      return
    }
    if (pin.length < 6) { setPin(p => p + k); setError('') }
  }

  if (loading) return <div className="loading"><div className="spinner" /><span>تحميل...</span></div>

  if (!org) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <h2 style={{ marginBottom: 8 }}>المؤسسة غير موجودة</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>تأكد من الرابط وحاول مجدداً</p>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">👤</div>
        <div className="org-badge">🏢 {org.name}</div>
        <h1 className="auth-title">أدخل كودك</h1>
        <p className="auth-sub">الكود الخاص بك من 4-6 أرقام</p>

        <div className="pin-display">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
          ))}
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="numpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(k => (
            <button key={k}
              className={`num-btn ${k === '✓' ? 'ok' : k === '⌫' ? 'del' : ''}`}
              onClick={() => !logging && handleKey(String(k))}
              disabled={logging}>
              {logging && k === '✓' ? '...' : k}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
