import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrgBySlug, loginEmployee } from '../lib/supabase'

export default function EmployeeEntry() {
  const nav = useNavigate()
  const [step, setStep] = useState('search')
  const [slugInput, setSlugInput] = useState('')
  const [org, setOrg] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [logging, setLogging] = useState(false)

  const handleSearch = async () => {
    if (!slugInput.trim()) return setError('أدخل كود المؤسسة')
    setSearching(true); setError('')
    try {
      const found = await getOrgBySlug(slugInput.trim().toLowerCase())
      setOrg(found)
      setStep('pin')
    } catch (e) {
      setError('المؤسسة غير موجودة، تأكد من الكود')
    } finally { setSearching(false) }
  }

  const handleKey = async (k) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return }
    if (k === '✓') {
      if (!pin) return
      setLogging(true); setError('')
      try {
        const emp = await loginEmployee({ orgId: org.id, pin })
        sessionStorage.setItem('employee', JSON.stringify({
          ...emp, orgName: org.name, orgSlug: org.slug
        }))
        nav(`/org/${org.slug}/submit`)
      } catch (e) {
        setError(e.message); setPin('')
      } finally { setLogging(false) }
      return
    }
    if (pin.length < 6) { setPin(p => p + k); setError('') }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="back-btn" onClick={() => step === 'pin' ? (setStep('search'), setPin(''), setError('')) : nav('/')}>
          → رجوع
        </button>
        <div className="auth-logo">👤</div>
        <h1 className="auth-title">دخول الموظف</h1>

        {step === 'search' ? (
          <>
            <p className="auth-sub">أدخل كود مؤسستك</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, textAlign: 'center' }}>
              الكود يعطيك إياه المدير — مثال: my-restaurant
            </p>
            {error && <div className="error-msg">{error}</div>}
            <div className="input-group">
              <span className="icon">🏢</span>
              <input
                placeholder="كود المؤسسة"
                value={slugInput}
                onChange={e => { setSlugInput(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ direction: 'ltr' }}
              />
            </div>
            <button className="btn-primary" onClick={handleSearch} disabled={searching}>
              {searching ? 'جاري البحث...' : 'تأكيد ←'}
            </button>
          </>
        ) : (
          <>
            <div className="org-badge">🏢 {org.name}</div>
            <p className="auth-sub">أدخل كودك الشخصي</p>
            <div className="pin-display">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
              ))}
            </div>
            {error && <div className="error-msg">{error}</div>}
            <div className="numpad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(k => (
                <button key={k}
                  className={`num-btn ${k === '✓' ? 'ok' : k === '⌄' ? 'del' : ''}`}
                  onClick={() => !logging && handleKey(String(k))}
                  disabled={logging}>
                  {logging && k === '✓' ? '...' : k}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
