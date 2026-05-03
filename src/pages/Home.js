import { useNavigate } from 'react-router-dom'

export default function Home() {
  const nav = useNavigate()
  return (
    <div className="home-hero">
      <div className="home-logo">🍖</div>
      <h1 className="home-title">نظام متابعة المهام</h1>
      <p className="home-sub">إدارة مهام الموظفين بسهولة</p>
      <div className="home-btns">
        <button className="home-btn emp" onClick={() => nav('/employee')}>
          <span className="home-btn-icon">👤</span>
          <div>
            <div className="home-btn-label">دخول الموظف</div>
            <div className="home-btn-hint">اختر مؤسستك وأدخل كودك</div>
          </div>
        </button>
        <button className="home-btn admin" onClick={() => nav('/admin/login')}>
          <span className="home-btn-icon">🛡</span>
          <div>
            <div className="home-btn-label">دخول المدير</div>
            <div className="home-btn-hint">اسم المستخدم وكلمة المرور</div>
          </div>
        </button>
        <button className="home-btn signup" onClick={() => nav('/admin/signup')}>
          <span className="home-btn-icon">✨</span>
          <div>
            <div className="home-btn-label">إنشاء حساب جديد</div>
            <div className="home-btn-hint">للمديرين — مجاني تماماً</div>
          </div>
        </button>
      </div>
    </div>
  )
}
