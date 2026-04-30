import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginAdmin } from '../lib/supabase'

export default function AdminLogin() {
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    if (!username || !password) return setError('أدخل اسم المستخدم وكلمة المرور')
    setLoading(true)
    try {
      const admin = await loginAdmin({ username, password })
      sessionStorage.setItem('admin', JSON.stringify(admin))
      nav('/admin/orgs')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🛡</div>
        <h1 className="auth-title">دخول المدير</h1>
        <p className="auth-sub">أدخل بياناتك للوصول إلى مؤسساتك</p>
        {error && <div className="error-msg">{error}</div>}
        <div className="input-group">
          <span className="icon">🔑</span>
          <input placeholder="اسم المستخدم" value={username} onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <div className="input-group">
          <span className="icon">🔒</span>
          <input placeholder="كلمة المرور" type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <button className="btn-primary" onClick={submit} disabled={loading}>
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
        <div className="link-text">ليس لديك حساب؟ <Link to="/admin/signup">إنشاء حساب</Link></div>
      </div>
    </div>
  )
}
