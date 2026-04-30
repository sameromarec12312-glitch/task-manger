import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signupAdmin } from '../lib/supabase'

export default function AdminSignup() {
  const nav = useNavigate()
  const [form, setForm] = useState({ adminName: '', username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    setError('')
    if (!form.adminName || !form.username || !form.password) return setError('جميع الحقول مطلوبة')
    if (form.password !== form.confirm) return setError('كلمة المرور غير متطابقة')
    if (form.password.length < 4) return setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل')
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return setError('اسم المستخدم: أحرف إنجليزية وأرقام فقط')
    setLoading(true)
    try {
      const admin = await signupAdmin(form)
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
        <div className="auth-logo">✨</div>
        <h1 className="auth-title">إنشاء حساب مدير</h1>
        <p className="auth-sub">حساب واحد يدير كل مؤسساتك</p>
        {error && <div className="error-msg">{error}</div>}
        {[
          ['adminName', 'اسمك', 'text', '👤'],
          ['username', 'اسم المستخدم (إنجليزي)', 'text', '🔑'],
          ['password', 'كلمة المرور', 'password', '🔒'],
          ['confirm', 'تأكيد كلمة المرور', 'password', '🔒'],
        ].map(([k, ph, type, icon]) => (
          <div className="input-group" key={k}>
            <span className="icon">{icon}</span>
            <input placeholder={ph} type={type} value={form[k]} onChange={f(k)}
              onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
        ))}
        <button className="btn-primary" onClick={submit} disabled={loading}>
          {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب ✓'}
        </button>
        <div className="link-text">لديك حساب؟ <Link to="/admin/login">تسجيل الدخول</Link></div>
      </div>
    </div>
  )
}
