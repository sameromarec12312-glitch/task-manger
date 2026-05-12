import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginAdmin } from '../lib/supabase'

export default function AdminLogin() {
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const submit = async () => {
    setError('')
    if (!username || !password) return setError('أدخل اسم المستخدم وكلمة المرور')
    setLoading(true)
    try {
      const admin = await loginAdmin({ username, password })
      sessionStorage.setItem('admin', JSON.stringify(admin))
      nav('/admin/orgs')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🛡</div>
        <div style={{ textAlign: 'center' }}>
          <span className="auth-badge">لوحة تحكم المدير</span>
        </div>
        <h1 className="auth-title" style={{ textAlign: 'center' }}>تسجيل الدخول</h1>
        <p className="auth-sub" style={{ textAlign: 'center' }}>أدخل بياناتك للوصول إلى لوحة التحكم</p>

        {error && <div className="error-msg">{error}</div>}

        <div className="input-group">
          <span className="icon">👤</span>
          <input placeholder="اسم المستخدم" value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <div className="input-group">
          <span className="icon">🔒</span>
          <input placeholder="كلمة المرور" type={showPass ? 'text' : 'password'}
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          <button onClick={() => setShowPass(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted)', padding: '0 4px' }}>
            {showPass ? '🙈' : '👁'}
          </button>
        </div>

        <button className="btn-primary" onClick={submit} disabled={loading}>
          {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />جاري الدخول...</span> : 'دخول →'}
        </button>
        <div className="link-text">ليس لديك حساب؟ <Link to="/admin/signup">إنشاء حساب</Link></div>
      </div>
    </div>
  )
}
