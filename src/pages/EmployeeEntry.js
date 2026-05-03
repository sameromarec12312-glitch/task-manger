import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllOrgs, loginEmployee } from '../lib/supabase'

export default function EmployeeEntry() {
  const nav = useNavigate()
  const [orgs, setOrgs] = useState([])
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    getAllOrgs().then(data => {
      setOrgs(data)
      setLoading(false)
    })
  }, [])

  const handleKey = async (k) => {
    if (!selectedOrg) return
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return }
    if (k === '✓') {
      if (!pin) return
      setLogging(true); setError('')
      try {
        const emp = await loginEmployee({ orgId: selectedOrg.id, pin })
        sessionStorage.setItem('employee', JSON.stringify({
          ...emp,
          orgName: selectedOrg.name,
          orgSlug: selectedOrg.slug
        }))
        nav(`/org/${selectedOrg.slug}/submit`)
      } catch (e) {
        setError(e.message); setPin('')
      } finally { setLogging(false) }
      return
    }
    if (pin.length < 6) { setPin(p => p + k); setError('') }
  }

  if (loading) return (
    <div className="loading"><div className="spinner" /><span>تحميل...</span></div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="back-btn" onClick={() => nav('/')}>→ رجوع</button>
        <div className="auth-logo">👤</div>
        <h1 className="auth-title">دخول الموظف</h1>

        {/* Step 1 - pick org */}
        {!selectedOrg ? (
          <>
            <p className="auth-sub">اختر مؤسستك</p>
            {orgs.length === 0 && (
              <div className="error-msg">لا توجد مؤسسات مسجلة بعد</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {orgs.map(org => (
                <button key={org.id}
                  onClick={() => { setSelectedOrg(org); setPin(''); setError('') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', background: 'var(--bg)',
                    border: '1.5px solid var(--border)', borderRadius: 12,
                    cursor: 'pointer', fontFamily: "'Cairo', sans-serif",
                    transition: 'all 0.15s'
                  }}>
                  <span style={{ fontSize: 22 }}>🏢</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{org.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Step 2 - enter PIN */
          <>
            <div className="org-badge">🏢 {selectedOrg.name}</div>
            <p className="auth-sub">أدخل كودك</p>

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

            <button className="btn-ghost" onClick={() => { setSelectedOrg(null); setPin(''); setError('') }}>
              ← تغيير المؤسسة
            </button>
          </>
        )}
      </div>
    </div>
  )
}
