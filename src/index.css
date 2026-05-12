@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* Brand */
  --brand: #FF6B35;
  --brand-dark: #E55A26;
  --brand-light: #FFF0EB;
  --brand-glow: rgba(255,107,53,0.15);

  /* Neutrals */
  --ink: #0D0D0D;
  --ink-2: #1A1A1A;
  --ink-3: #2C2C2C;
  --slate: #64748b;
  --muted: #94a3b8;
  --border: #e2e8f0;
  --border-strong: #cbd5e1;
  --bg: #F7F8FC;
  --surface: #FFFFFF;
  --surface-2: #F1F5F9;

  /* Status */
  --green: #10b981;
  --green-light: #d1fae5;
  --green-dark: #059669;
  --red: #ef4444;
  --red-light: #fee2e2;
  --blue: #3b82f6;
  --blue-light: #dbeafe;
  --amber: #f59e0b;
  --amber-light: #fef3c7;
  --amber-dark: #d97706;

  /* Layout */
  --radius-sm: 8px;
  --radius: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow: 0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
  --shadow-xl: 0 24px 64px rgba(0,0,0,0.16);
}

html { scroll-behavior: smooth; }

body {
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  background: var(--bg);
  color: var(--ink);
  direction: rtl;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
}

input, button, select, textarea { font-family: 'IBM Plex Sans Arabic', sans-serif; }
input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--muted); }

/* ── ANIMATIONS ── */
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }

.fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
.fade-up-1 { animation-delay: 0.05s; }
.fade-up-2 { animation-delay: 0.1s; }
.fade-up-3 { animation-delay: 0.15s; }
.fade-up-4 { animation-delay: 0.2s; }

/* ── PAGE ── */
.page { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); }

/* ── AUTH ── */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--ink);
  position: relative;
  overflow: hidden;
}

.auth-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,107,53,0.25) 0%, transparent 70%);
  pointer-events: none;
}

.auth-page::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

.auth-card {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-xl);
  position: relative;
  z-index: 1;
  animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
}

.auth-logo { font-size: 48px; text-align: center; margin-bottom: 8px; }
.auth-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--brand-light);
  color: var(--brand-dark);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
}
.auth-title { font-size: 22px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
.auth-sub { font-size: 13px; color: var(--slate); margin-bottom: 24px; }

.input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: 0 14px;
  margin-bottom: 10px;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.input-group:focus-within {
  border-color: var(--brand);
  background: var(--surface);
  box-shadow: 0 0 0 4px var(--brand-glow);
}
.input-group .icon { font-size: 17px; flex-shrink: 0; opacity: 0.7; }
.input-group input {
  flex: 1; border: none; background: none;
  padding: 13px 0; font-size: 14px; color: var(--ink); outline: none;
}
.input-group input::placeholder { color: var(--muted); }

.btn-primary {
  width: 100%; padding: 14px;
  background: var(--brand);
  border: none; border-radius: var(--radius);
  font-size: 15px; font-weight: 700; color: white;
  cursor: pointer; transition: all 0.2s;
  margin-top: 6px; position: relative; overflow: hidden;
  letter-spacing: 0.3px;
}
.btn-primary::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(255,255,255,0.1), transparent);
}
.btn-primary:hover { background: var(--brand-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,107,53,0.35); }
.btn-primary:active { transform: translateY(0); box-shadow: none; }
.btn-primary:disabled { background: var(--muted); cursor: not-allowed; transform: none; box-shadow: none; }

.btn-ghost {
  width: 100%; padding: 12px;
  background: transparent; border: 1.5px solid var(--border);
  border-radius: var(--radius); font-size: 14px; font-weight: 600; color: var(--slate);
  cursor: pointer; transition: all 0.2s; margin-top: 8px;
}
.btn-ghost:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-light); }

.btn-dark {
  width: 100%; padding: 14px;
  background: var(--ink); border: none; border-radius: var(--radius);
  font-size: 15px; font-weight: 700; color: white;
  cursor: pointer; transition: all 0.2s; margin-top: 6px;
}
.btn-dark:hover { background: var(--ink-3); transform: translateY(-1px); }

.error-msg { background: var(--red-light); color: var(--red); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.error-msg::before { content: '⚠️'; }
.success-msg { background: var(--green-light); color: var(--green-dark); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 12px; }
.link-text { text-align: center; margin-top: 16px; font-size: 13px; color: var(--muted); }
.link-text a { color: var(--brand); font-weight: 600; text-decoration: none; }
.link-text a:hover { text-decoration: underline; }
.back-btn { background: none; border: none; color: var(--slate); font-size: 13px; cursor: pointer; padding: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 4px; font-family: inherit; transition: color 0.2s; }
.back-btn:hover { color: var(--brand); }

/* ── TOP NAV ── */
.topnav {
  background: var(--ink);
  color: white;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky; top: 0; z-index: 100;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.topnav-brand { display: flex; align-items: center; gap: 10px; }
.topnav-logo { width: 32px; height: 32px; background: var(--brand); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
.topnav-title { font-weight: 700; font-size: 15px; color: white; }
.topnav-sub { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 1px; }
.topnav-logout {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.8);
  padding: 7px 14px; border-radius: var(--radius-sm);
  cursor: pointer; font-size: 12px; font-weight: 600;
  transition: all 0.2s; font-family: inherit;
}
.topnav-logout:hover { background: rgba(255,255,255,0.15); color: white; }

/* ── TABS ── */
.tabs {
  display: flex;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 57px; z-index: 99;
  padding: 0 4px;
}
.tab-btn {
  flex: 1; padding: 13px 6px;
  border: none; background: none;
  font-size: 11px; font-weight: 600; color: var(--muted);
  cursor: pointer; border-bottom: 2.5px solid transparent;
  transition: all 0.2s; font-family: inherit;
  white-space: nowrap;
}
.tab-btn.active { color: var(--brand); border-bottom-color: var(--brand); }
.tab-btn:hover:not(.active) { color: var(--slate); }

/* ── CONTENT ── */
.tab-content { padding: 16px; max-width: 760px; margin: 0 auto; padding-bottom: 40px; }

/* ── CARDS ── */
.card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 18px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}

.card-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.card-title { font-weight: 700; font-size: 15px; }
.card-date { font-size: 12px; color: var(--muted); background: var(--surface-2); padding: 3px 10px; border-radius: 20px; }

/* ── STAT CARDS ── */
.stat-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 14px;
  text-align: center;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  flex: 1;
}
.stat-icon { font-size: 22px; margin-bottom: 4px; }
.stat-value { font-size: 22px; font-weight: 700; color: var(--ink); line-height: 1.2; }
.stat-label { font-size: 11px; color: var(--muted); margin-top: 2px; }

/* ── CATEGORY ── */
.cat-header {
  background: var(--ink);
  color: white;
  padding: 9px 14px;
  font-weight: 700; font-size: 13px;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  display: flex; align-items: center; gap: 8px;
}
.cat-header::before { content: '▸'; color: var(--brand); font-size: 10px; }

.cat-label {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--ink); color: var(--brand);
  padding: 4px 12px; font-weight: 700; font-size: 11px;
  border-radius: 20px; margin-bottom: 6px;
  text-transform: uppercase; letter-spacing: 0.5px;
}

/* ── TASK ROW ── */
.task-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; background: var(--surface);
  padding: 10px 14px; border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.task-row:hover { background: var(--surface-2); }
.task-name { flex: 1; font-size: 13px; font-weight: 500; color: var(--ink-3); }
.task-inputs { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.task-inputs label { font-size: 10px; color: var(--muted); white-space: nowrap; font-weight: 500; }
.task-input {
  width: 60px; padding: 6px 6px;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-size: 13px; text-align: center; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: 'IBM Plex Mono', monospace;
  background: var(--surface-2);
}
.task-input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-glow); background: white; }

/* ── ICON BUTTONS ── */
.icon-btn {
  background: none; border: none; font-size: 15px;
  cursor: pointer; padding: 5px 7px; border-radius: var(--radius-sm);
  transition: background 0.15s; color: var(--muted);
}
.icon-btn:hover { background: var(--surface-2); color: var(--ink); }

.btn-sm {
  padding: 6px 12px; border: none; border-radius: var(--radius-sm);
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: all 0.15s; white-space: nowrap;
}
.btn-green { background: var(--green-light); color: var(--green-dark); }
.btn-green:hover { background: var(--green); color: white; }
.btn-red { background: var(--red-light); color: var(--red); }
.btn-red:hover { background: var(--red); color: white; }
.btn-blue { background: var(--blue-light); color: var(--blue); }
.btn-blue:hover { background: var(--blue); color: white; }
.btn-amber { background: var(--amber-light); color: var(--amber-dark); }
.btn-amber:hover { background: var(--amber); color: white; }
.btn-ink { background: var(--ink); color: white; }
.btn-ink:hover { background: var(--ink-3); }

/* ── TABLE ── */
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th {
  background: var(--surface-2); padding: 8px 10px;
  text-align: right; font-weight: 600; color: var(--slate);
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px;
  border-bottom: 2px solid var(--border);
}
.data-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.data-table tr:hover td { background: var(--surface-2); }
.data-table td.num { text-align: center; font-weight: 700; color: var(--ink); font-family: 'IBM Plex Mono', monospace; }

/* ── FORM ── */
.form-grid { display: grid; gap: 10px; }
.input-plain {
  width: 100%; padding: 11px 14px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-size: 14px; outline: none; background: var(--surface-2);
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  font-family: inherit; color: var(--ink);
}
.input-plain:focus {
  border-color: var(--brand); background: var(--surface);
  box-shadow: 0 0 0 4px var(--brand-glow);
}
.input-label { font-size: 12px; font-weight: 600; color: var(--slate); margin-bottom: 5px; display: block; }

.select-plain {
  width: 100%; padding: 11px 14px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-size: 14px; outline: none; background: var(--surface-2);
  font-family: inherit; cursor: pointer;
  transition: border-color 0.2s;
  color: var(--ink);
}
.select-plain:focus { border-color: var(--brand); }

/* ── EMPLOYEE ROW ── */
.emp-row {
  display: flex; align-items: center; gap: 12px;
  background: var(--surface); padding: 14px 16px;
  border-radius: var(--radius); margin-bottom: 8px;
  box-shadow: var(--shadow-sm); border: 1px solid var(--border);
  transition: box-shadow 0.2s, transform 0.2s;
}
.emp-row:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
.emp-avatar {
  width: 42px; height: 42px; border-radius: 12px;
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 16px; color: white; flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(255,107,53,0.3);
}
.emp-name { font-weight: 700; font-size: 15px; color: var(--ink); }
.emp-meta { font-size: 12px; color: var(--muted); margin-top: 2px; }
.emp-code {
  background: var(--surface-2); border: 1px solid var(--border);
  padding: 2px 10px; border-radius: 20px; font-size: 12px; color: var(--slate);
  font-family: 'IBM Plex Mono', monospace;
}

/* ── FILTER ROW ── */
.filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-row .select-plain, .filter-row input { flex: 1; min-width: 120px; }

/* ── PIN PAD ── */
.pin-display { display: flex; justify-content: center; gap: 10px; margin: 20px 0; }
.pin-dot {
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--border); transition: all 0.2s;
}
.pin-dot.filled { background: var(--brand); transform: scale(1.2); box-shadow: 0 0 12px var(--brand-glow); }
.numpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.num-btn {
  padding: 15px 0; font-size: 20px; font-weight: 600;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  background: var(--surface); color: var(--ink);
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.num-btn:hover { background: var(--surface-2); border-color: var(--border-strong); }
.num-btn:active { transform: scale(0.95); }
.num-btn.ok { background: var(--brand); color: white; border-color: var(--brand); }
.num-btn.ok:hover { background: var(--brand-dark); }
.num-btn.del { background: var(--red-light); color: var(--red); border-color: var(--red-light); }

/* ── ORG BADGE ── */
.org-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--ink); color: var(--brand);
  padding: 7px 16px; border-radius: 20px;
  font-size: 13px; font-weight: 700; margin-bottom: 14px;
}

/* ── SUCCESS ── */
.success-page {
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 16px; gap: 14px; max-width: 560px; margin: 0 auto;
  animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
}
.success-icon { font-size: 72px; filter: drop-shadow(0 8px 24px rgba(16,185,129,0.3)); }
.success-title { font-size: 24px; font-weight: 700; color: var(--green-dark); }
.success-date {
  color: var(--muted); font-size: 14px;
  background: var(--surface-2); padding: 4px 14px; border-radius: 20px;
}

/* ── EMPLOYEE HEADER ── */
.emp-header-bar {
  background: var(--surface);
  padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

/* ── TASK LIST ── */
.task-list-wrap { padding: 12px 12px 100px; max-width: 760px; margin: 0 auto; }
.cat-section { margin-bottom: 12px; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); }

/* ── SUBMIT BAR ── */
.submit-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 12px 16px 20px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
  box-shadow: 0 -8px 32px rgba(0,0,0,0.08);
}
.submit-bar button { max-width: 760px; margin: 0 auto; display: block; }

/* ── LINK BOX ── */
.link-box {
  background: var(--ink-2); color: var(--brand);
  padding: 12px 16px; border-radius: var(--radius);
  font-size: 12px; font-weight: 600; word-break: break-all;
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; margin-top: 8px; border: 1px solid rgba(255,255,255,0.08);
  font-family: 'IBM Plex Mono', monospace;
}

/* ── LOADING ── */
.loading {
  display: flex; align-items: center; justify-content: center;
  min-height: 200px; color: var(--muted); font-size: 14px; gap: 10px;
}
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── EMPTY STATE ── */
.empty-state {
  text-align: center; padding: 56px 16px; color: var(--muted);
  animation: fadeIn 0.4s ease both;
}
.empty-state .icon { font-size: 48px; margin-bottom: 12px; opacity: 0.6; }
.empty-state p { font-size: 15px; font-weight: 500; }
.empty-state p:last-child { font-size: 13px; margin-top: 4px; }

/* ── HOME PAGE ── */
.home-hero {
  min-height: 100vh;
  background: var(--ink);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 32px 20px; text-align: center;
  position: relative; overflow: hidden;
}
.home-hero::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 100% 60% at 50% 0%, rgba(255,107,53,0.2) 0%, transparent 65%);
  pointer-events: none;
}
.home-hero::after {
  content: '';
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
}
.home-logo-wrap {
  width: 80px; height: 80px;
  background: var(--brand);
  border-radius: 22px;
  display: flex; align-items: center; justify-content: center;
  font-size: 40px; margin: 0 auto 20px;
  box-shadow: 0 16px 48px rgba(255,107,53,0.4);
  position: relative; z-index: 1;
  animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
.home-title {
  font-size: 28px; font-weight: 700; color: white;
  margin-bottom: 8px; position: relative; z-index: 1;
  animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both;
}
.home-sub {
  font-size: 14px; color: rgba(255,255,255,0.45);
  margin-bottom: 40px; max-width: 280px;
  position: relative; z-index: 1;
  animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both;
}
.home-btns {
  display: flex; flex-direction: column; gap: 12px;
  width: 100%; max-width: 360px;
  position: relative; z-index: 1;
}
.home-btn {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 20px; border: none; border-radius: var(--radius-lg);
  cursor: pointer; text-align: right; width: 100%;
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: inherit; position: relative; overflow: hidden;
}
.home-btn:hover { transform: translateY(-2px); }
.home-btn:active { transform: scale(0.98); }
.home-btn.emp { background: var(--brand); box-shadow: 0 8px 32px rgba(255,107,53,0.4); animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
.home-btn.admin { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
.home-btn.signup { background: transparent; border: 1.5px solid rgba(255,255,255,0.15); animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
.home-btn-icon { font-size: 26px; flex-shrink: 0; }
.home-btn-label { font-size: 15px; font-weight: 700; }
.home-btn-hint { font-size: 12px; margin-top: 2px; opacity: 0.6; }
.home-btn.emp .home-btn-label, .home-btn.emp .home-btn-hint { color: white; }
.home-btn.admin .home-btn-label, .home-btn.admin .home-btn-hint { color: rgba(255,255,255,0.9); }
.home-btn.signup .home-btn-label { color: rgba(255,255,255,0.8); }
.home-btn.signup .home-btn-hint { color: rgba(255,255,255,0.4); }

/* ── TASK ADMIN ROW ── */
.task-admin-row {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; background: var(--surface);
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.task-admin-row:hover { background: var(--surface-2); }
.task-admin-row span { flex: 1; font-size: 13px; color: var(--ink-3); }

/* ── SUMMARY CARD ── */
.summary-card { width: 100%; }
.summary-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px;
}
.summary-vals { display: flex; gap: 8px; flex-wrap: wrap; }
.summary-val {
  background: var(--brand-light); color: var(--brand-dark);
  padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
}

/* ── ORG CARDS ── */
.org-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  transition: box-shadow 0.2s, transform 0.2s;
  margin-bottom: 12px;
}
.org-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }

/* ── BADGE ── */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
}
.badge-brand { background: var(--brand-light); color: var(--brand-dark); }
.badge-green { background: var(--green-light); color: var(--green-dark); }
.badge-blue { background: var(--blue-light); color: var(--blue); }
.badge-amber { background: var(--amber-light); color: var(--amber-dark); }
.badge-ink { background: var(--ink); color: var(--brand); }

/* ── DIVIDER ── */
.divider { height: 1px; background: var(--border); margin: 16px 0; }

/* ── SECTION PICKER ── */
.section-btn {
  display: flex; align-items: center; gap: 16px;
  padding: 18px 20px; background: var(--surface);
  border: 1.5px solid var(--border); border-radius: var(--radius-lg);
  cursor: pointer; width: 100%; font-family: inherit;
  transition: all 0.2s; box-shadow: var(--shadow-sm);
}
.section-btn:hover { border-color: var(--brand); box-shadow: 0 4px 16px var(--brand-glow); transform: translateY(-1px); }
.section-btn:active { transform: scale(0.98); }

/* ── RESPONSIVE ── */
@media (max-width: 480px) {
  .auth-card { padding: 2rem 1.25rem; }
  .home-title { font-size: 24px; }
  .task-input { width: 52px; }
  .topnav { padding: 12px 14px; }
}

/* ── SHIMMER SKELETON ── */
.skeleton {
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
