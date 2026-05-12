import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const nav = useNavigate()
  useEffect(() => {
    const savedSlug = localStorage.getItem('emp_org_slug')
    if (savedSlug) nav('/employee')
  }, [nav])

  return (
    <div className="home-hero">
      <div className="home-logo-wrap">🍖</div>
      <h1 className="home-title">نظام إدارة المهام</h1>
      <p className="home-sub">منصة متكاملة لمتابعة أداء الموظفين يومياً</p>
      <div className="home-btns">
        <button className="home-btn emp" onClick={() => nav('/employee')}>
          <span className="home-btn-icon">👤</span>
          <div>
            <div className="home-btn-label">دخول الموظف</div>
            <div className="home-btn-hint">أدخل كود مؤسستك وكودك الشخصي</div>
          </div>
        </button>
        <button className="home-btn admin" onClick={() => nav('/admin/login')}>
          <span className="home-btn-icon">🛡</span>
          <div>
            <div className="home-btn-label">دخول المدير</div>
            <div className="home-btn-hint">لوحة التحكم والتقارير</div>
          </div>
        </button>
        <button className="home-btn signup" onClick={() => nav('/admin/signup')}>
          <span className="home-btn-icon">✨</span>
          <div>
            <div className="home-btn-label">إنشاء حساب جديد</div>
            <div className="home-btn-hint">للمديرين المخولين فقط</div>
          </div>
        </button>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 32, position: 'relative', zIndex: 1 }}>
        Original Shawarma © 2026
      </p>
    </div>
  )
}
