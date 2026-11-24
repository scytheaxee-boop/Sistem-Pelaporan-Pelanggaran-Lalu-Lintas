import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle, AlertTriangle, ArrowDownToLine, ArrowLeft, ArrowRight, Bell, Camera, Check,
  CheckCircle2, ChevronDown, CircleHelp, Clock3, FileCheck2, FileImage, FilePlus2,
  Filter, Flag, Gauge, ImagePlus, Info, LayoutDashboard, Lock, LogIn, LogOut, MapPin,
  Menu, MessageSquareText, Pencil, Plus, RefreshCw, Search, Send, ShieldCheck, Sparkles, TrafficCone,
  UserPlus, UserRound, Users, X
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { CATEGORIES, STATUS, formatDate, shortId } from './lib/reports';

function useEscape(handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') handler(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler, active]);
}

function parseCoordinate(value) {
  const text = String(value).trim().replace(',', '.');
  if (!text) return null;
  if (!/^-?\d+(\.\d+)?$/.test(text)) return NaN;
  return Number(text);
}

function localDateTimeNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const loadProfile = useCallback(async (user) => {
    if (!user || !supabase) { setProfile(null); return; }
    const { data, error } = await supabase.from('profiles')
      .select('id, full_name, role').eq('id', user.id).maybeSingle();
    if (error) setProfileError('Profil tidak dapat dimuat. Pastikan SQL schema sudah dijalankan.');
    else { setProfile(data); setProfileError(''); }
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadProfile(data.session?.user);
      if (alive) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) { setProfile(null); setLoading(false); }
      else setTimeout(() => loadProfile(nextSession.user), 0);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);

  useEffect(() => { setMobileNav(false); }, [location.pathname]);
  const closeMobileNav = useCallback(() => setMobileNav(false), []);
  useEscape(closeMobileNav, mobileNav);
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.pathname, location.hash, location.key]);

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null); setProfile(null); navigate('/');
  }

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Menyiapkan LaporLintas...</p></div>;

  const isAdmin = profile?.role === 'admin';
  return (
    <div className={`app-shell ${isAdmin ? 'admin-shell' : ''}`}>
      {!isAdmin && (
        <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
          <Link to="/" className="brand" onClick={() => setMobileNav(false)}>
            <span className="brand-mark"><TrafficCone size={23} /></span>
            <span><b>LaporLintas</b><small>Pelaporan masyarakat</small></span>
          </Link>
          <div className="workspace-label">MENU UTAMA</div>
          <nav className="side-nav">
            <NavLink to="/" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Gauge size={18}/> Ringkasan</NavLink>
            {session && <NavLink to="/laporan-saya" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><FileCheck2 size={18}/> Laporan Saya</NavLink>}
            {session && <NavLink to="/buat-laporan" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><FilePlus2 size={18}/> Buat Laporan</NavLink>}
          </nav>
          <div className="sidebar-bottom">
            <div className="help-card"><span className="help-icon"><CircleHelp size={17}/></span><b>Butuh bantuan?</b><p>Laporkan informasi yang jelas dan sesuai fakta.</p><Link to={{pathname:'/',hash:'#panduan'}} onClick={() => setMobileNav(false)}>Lihat panduan <ArrowRight size={13}/></Link></div>
            <div className="sidebar-foot"><ShieldCheck size={15}/> Pelaporan yang bertanggung jawab</div>
          </div>
        </aside>
      )}
      {!isAdmin && mobileNav && <button aria-label="Tutup menu" className="mobile-scrim" onClick={() => setMobileNav(false)} />}
      <div className="main-column">
        <header className="topbar">
          {isAdmin ? (
            <div className="topbar-brand-wrap">
              <Link to="/admin" className="brand-inline">
                <span className="brand-mark sm"><TrafficCone size={19} /></span>
                <span><b>LaporLintas</b><small>Panel Administrator</small></span>
              </Link>
              <span className="crumb-sep">/</span>
              <b>Dashboard Admin</b>
            </div>
          ) : (
            <>
              <button className="icon-button mobile-menu" aria-label="Buka menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button>
              <div className="breadcrumb"><span>Workspace</span><span className="crumb-sep">/</span><b>{pageName(location.pathname)}</b></div>
            </>
          )}
          <div className="topbar-actions">
            <span className="secure-chip"><ShieldCheck size={15}/> {isAdmin ? 'Pusat kendali' : 'Sistem pelaporan'}</span>
            {session ? <div className="user-menu"><div className="avatar">{(profile?.full_name || session.user.email || 'U').slice(0,1).toUpperCase()}</div><div className="user-info"><b>{profile?.full_name || 'Pengguna'}</b><small>{isAdmin ? 'Administrator' : 'Masyarakat'}</small></div><button className="icon-button" title="Keluar" onClick={signOut}><LogOut size={17}/></button></div>
            : <Link to="/auth" className="button button-primary button-sm"><LogIn size={16}/> Masuk</Link>}
          </div>
        </header>
        {profileError && <div className="notice notice-error"><AlertCircle size={18}/>{profileError}</div>}
        <main className="page-content">
          <Routes>
            <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <HomePage session={session} profile={profile} />} />
            <Route path="/auth" element={isAdmin ? <Navigate to="/admin" replace /> : <AuthPage session={session} profile={profile} isAdmin={isAdmin} />} />
            <Route path="/buat-laporan" element={isAdmin ? <Navigate to="/admin" replace /> : <Protected session={session}><CreateReportPage session={session}/></Protected>} />
            <Route path="/laporan-saya" element={isAdmin ? <Navigate to="/admin" replace /> : <Protected session={session}><MyReportsPage session={session}/></Protected>} />
            <Route path="/admin" element={<Protected session={session} admin={isAdmin}><AdminPage profile={profile}/></Protected>} />
            <Route path="*" element={<NotFound isAdmin={isAdmin} />}/>
          </Routes>
        </main>
        <footer className="footer"><span>© {new Date().getFullYear()} LaporLintas</span><span><ShieldCheck size={14}/> {isAdmin ? 'Panel Kontrol Administrator' : 'Informasi diverifikasi sebelum tindak lanjut'}</span></footer>
      </div>
    </div>
  );
}

function pageName(path) {
  return ({'/':'Ringkasan','/auth':'Autentikasi','/buat-laporan':'Buat Laporan','/laporan-saya':'Laporan Saya','/admin':'Dashboard Admin'})[path] || 'Halaman';
}

function SetupScreen() {
  return <div className="setup-screen"><div className="setup-card"><div className="brand-mark large"><TrafficCone size={28}/></div><h1>Siapkan LaporLintas</h1><p>Hubungkan aplikasi ke proyek Supabase untuk mengaktifkan login, database, dan unggah foto.</p><ol><li>Buat proyek di Supabase.</li><li>Jalankan file <code>supabase/schema.sql</code> melalui SQL Editor.</li><li>Salin <code>.env.example</code> menjadi <code>.env</code> dan isi URL serta anon/publishable key.</li><li>Jalankan <code>npm install</code> lalu <code>npm run dev</code>.</li></ol><div className="notice notice-info"><Info size={18}/> Kunci service_role tidak boleh dimasukkan ke frontend. Gunakan hanya anon/publishable key.</div></div></div>;
}

function Protected({session, admin, children}) {
  if (!session) return <div className="center-state"><div className="empty-icon"><LogIn size={25}/></div><h2>Silakan masuk terlebih dahulu</h2><p>Masuk atau buat akun untuk melanjutkan.</p><Link to="/auth" className="button button-primary">Masuk / Daftar</Link></div>;
  if (admin === false) return <div className="center-state"><div className="empty-icon"><ShieldCheck size={25}/></div><h2>Akses khusus admin</h2><p>Akun ini tidak memiliki izin untuk membuka dashboard administrator.</p><Link to="/" className="button button-secondary">Kembali ke ringkasan</Link></div>;
  return children;
}

function SplashScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFading(true), 2100);
    const timer2 = setTimeout(() => onFinish(), 2700);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  function handleSkip() {
    setFading(true);
    setTimeout(onFinish, 450);
  }

  return (
    <div
      className={`splash-screen ${fading ? 'splash-fade-out' : ''}`}
      onClick={handleSkip}
      role="button"
      tabIndex={0}
      aria-label="Lewati splash screen"
    >
      <div className="splash-ambient-glow" />
      <div className="splash-content">
        <div className="splash-badge-wrap">
          <div className="splash-ring-pulse" />
          <div className="splash-ring-pulse secondary" />
          <div className="splash-badge">
            <TrafficCone size={48} className="splash-icon" />
          </div>
        </div>
        <div className="splash-text-wrap">
          <h1 className="splash-title">Lapor<span>Lintas</span></h1>
          <p className="splash-subtitle">SISTEM PELAPORAN PELANGGARAN LALU LINTAS</p>
        </div>
        <div className="splash-loader-bar">
          <div className="splash-loader-progress" />
        </div>
      </div>
    </div>
  );
}

function HomePage({session, profile}) {
  const [showSplash, setShowSplash] = useState(() => !session);
  const [stats, setStats] = useState({total:0,pending:0,progress:0,completed:0});
  const [recent, setRecent] = useState([]);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let active = true;
    async function fetchData() {
      if (!supabase) return;
      let query = supabase.from('reports').select('id,status,category,location,created_at');
      if (profile?.role !== 'admin') {
        if (session?.user?.id) query = query.eq('user_id', session.user.id);
        else { setBusy(false); return; }
      }
      const {data} = await query.order('created_at',{ascending:false}).limit(100);
      if (!active) return;
      const rows = data || [];
      setStats({total:rows.length,pending:rows.filter(r=>['pending','reviewing'].includes(r.status)).length,progress:rows.filter(r=>['forwarded','in_progress'].includes(r.status)).length,completed:rows.filter(r=>r.status==='completed').length});
      setRecent(rows.slice(0,5)); setBusy(false);
    }
    fetchData();
    return () => { active = false; };
  }, [session, profile]);

  const restContent = (
    <>
      <div className="section-heading"><div><h2>Ringkasan laporan</h2><p>{profile?.role==='admin'?'Pantau laporan yang masuk ke sistem.':'Pantau laporan Anda setelah masuk ke akun.'}</p></div>{session && <Link className="text-link" to={profile?.role==='admin'?'/admin':'/laporan-saya'}>Lihat semua <ArrowRight size={15}/></Link>}</div>
      <div className="stats-grid">
        <StatCard icon={<FileCheck2 size={19}/>} label="Total laporan" value={session?(busy?'…':stats.total):'—'} tone="blue" foot="Laporan yang tercatat"/>
        <StatCard icon={<Clock3 size={19}/>} label="Menunggu verifikasi" value={session?(busy?'…':stats.pending):'—'} tone="orange" foot="Menunggu pemeriksaan"/>
        <StatCard icon={<ArrowDownToLine size={19}/>} label="Dalam tindak lanjut" value={session?(busy?'…':stats.progress):'—'} tone="purple" foot="Diteruskan ke pihak terkait"/>
        <StatCard icon={<CheckCircle2 size={19}/>} label="Selesai" value={session?(busy?'…':stats.completed):'—'} tone="green" foot="Status telah diselesaikan"/>
      </div>
      <section className="content-card recent-card"><div className="card-heading"><div><h3>Laporan terbaru</h3><p>Aktivitas laporan yang terakhir tercatat.</p></div>{session && <Link to={profile?.role==='admin'?'/admin':'/laporan-saya'} className="button button-secondary button-sm">Lihat semua</Link>}</div>
        {!session ? <div className="empty-inline"><FileCheck2 size={23}/><span>Masuk untuk melihat laporan terbaru Anda.</span></div> : recent.length===0 ? <div className="empty-inline"><FileImage size={23}/><span>Belum ada laporan. Mulai dengan membuat laporan pertama.</span><Link to="/buat-laporan">Buat laporan</Link></div> : <ReportTable reports={recent} compact/>}
      </section>
      <section className="how-section" id="panduan"><div className="section-heading"><div><h2>Bagaimana prosesnya?</h2><p>Setiap laporan melewati tahapan pemeriksaan sebelum ditindaklanjuti.</p></div></div><div className="steps-grid"><Step n="01" icon={<FilePlus2/>} title="Kirim laporan" text="Isi detail kejadian, kategori, lokasi, dan foto pendukung jika tersedia."/><Step n="02" icon={<ShieldCheck/>} title="Verifikasi admin" text="Admin meninjau kelengkapan, relevansi, dan kewajaran informasi."/><Step n="03" icon={<MessageSquareText/>} title="Status diperbarui" text="Pelapor dapat memantau status dan catatan tindak lanjut." /></div><div className="disclaimer"><Info size={18}/><p><b>Perlu diketahui:</b> laporan yang dikirim merupakan informasi awal untuk pemeriksaan. Laporan yang diteruskan tidak otomatis membuktikan pelanggaran atau menjadi bukti pelanggaran resmi.</p></div></section>
    </>
  );

  return (
    <>
      {!session && showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot"/> PLATFORM PELAPORAN PUBLIK</div>
          <h1>Wujudkan lalu lintas<br/><span>yang lebih tertib.</span></h1>
          <p>Laporkan kondisi atau dugaan pelanggaran lalu lintas dengan informasi yang jelas agar dapat diverifikasi dan ditindaklanjuti oleh pihak berwenang.</p>
          <div className="hero-actions">
            {session ? (
              <Link to="/buat-laporan" className="button button-white"><Plus size={17}/> Buat laporan <ArrowRight size={16}/></Link>
            ) : (
              <Link to="/auth" className="button button-white hero-highlight-btn"><LogIn size={17}/> Masuk / Daftar Akun <ArrowRight size={16}/></Link>
            )}
            <Link to={{pathname:'/',hash:'#panduan'}} className="hero-link">Pelajari alurnya <ArrowRight size={15}/></Link>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-circle circle-one"/><div className="art-circle circle-two"/>
          <div className="road-illustration">
            <div className="road-line"/><div className="road-line"/>
            <div className="road-pin"><MapPin size={26}/></div>
            <div className="road-card"><span className="road-card-icon"><CheckCircle2 size={17}/></span><span><b>Pelaporan tercatat</b><small>Menunggu verifikasi</small></span></div>
          </div>
          <div className="hero-mini-stat"><ShieldCheck size={16}/><span>Verifikasi sebelum tindak lanjut</span></div>
        </div>
      </section>

      {!session ? (
        <div className="gated-container">
          <div className="gated-blur-area" aria-hidden="true">
            {restContent}
          </div>
          <div className="gated-lock-overlay">
            <div className="gated-card">
              <div className="gated-lock-badge"><Lock size={26}/></div>
              <h3>Akses Pelaporan Terkunci</h3>
              <p>Silakan masuk atau daftarkan akun terlebih dahulu sebelum mengakses dan menggunakan seluruh fitur sistem pelaporan <b>LaporLintas</b>.</p>
              <div className="gated-actions">
                <Link to="/auth" className="button button-primary button-lg"><LogIn size={18}/> Masuk ke Akun Anda <ArrowRight size={16}/></Link>
                <Link to="/auth" className="button button-secondary button-lg"><UserPlus size={18}/> Daftar Akun Baru</Link>
              </div>
              <div className="gated-note"><ShieldCheck size={15}/> Sistem pelaporan masyarakat yang aman & terverifikasi</div>
            </div>
          </div>
        </div>
      ) : (
        restContent
      )}
    </>
  );
}

function StatCard({icon,label,value,tone,foot}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-foot">{foot}</span></div>;
}
function Step({n,icon,title,text}) {return <div className="step-card"><div className="step-top"><span className="step-number">{n}</span><span className="step-icon">{icon}</span></div><h3>{title}</h3><p>{text}</p></div>;}

function AuthPage({session, profile, isAdmin}) {
  const navigate = useNavigate();
  const [mode,setMode] = useState('login');
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  useEffect(()=>{
    if(session) {
      if(isAdmin) {
        navigate('/admin', { replace: true });
      } else if (profile !== null) {
        navigate('/', { replace: true });
      }
    }
  },[session,profile,isAdmin,navigate]);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode==='register') {
        const {data,error:err} = await supabase.auth.signUp({email,password,options:{data:{full_name:name.trim()}}});
        if(err) throw err;
        if(data.session) { setMessage('Akun berhasil dibuat.'); navigate('/'); }
        else setMessage('Pendaftaran berhasil. Periksa email untuk konfirmasi sebelum masuk.');
      } else {
        const {data,error:err} = await supabase.auth.signInWithPassword({email,password});
        if(err) throw err;
        if (data?.user) {
          const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
          if (prof?.role === 'admin') {
            navigate('/admin', { replace: true });
            return;
          }
        }
        navigate('/');
      }
    } catch(err) { setError(err.message || 'Autentikasi gagal.'); }
    finally {setBusy(false);}
  }
  return <div className="auth-layout"><div className="auth-aside"><div className="auth-aside-content"><div className="brand-mark large"><TrafficCone size={27}/></div><h1>Suara Anda<br/>berarti untuk<br/><span>jalan yang aman.</span></h1><p>Gunakan platform ini untuk menyampaikan informasi dugaan pelanggaran dan kondisi lalu lintas secara bertanggung jawab.</p><div className="auth-trust"><ShieldCheck size={18}/> Data laporan dibatasi sesuai hak akses</div></div></div><div className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><div className="eyebrow">SELAMAT DATANG</div><h2>{mode==='login'?'Masuk ke akun Anda':'Buat akun masyarakat'}</h2><p>{mode==='login'?'Lanjutkan untuk memantau laporan dan status tindak lanjut.':'Daftar untuk mengirim dan memantau laporan lalu lintas.'}</p>{mode==='register'&&<Field label="Nama lengkap" required><input value={name} onChange={e=>setName(e.target.value)} required minLength={2} placeholder="Nama Anda"/></Field>}<Field label="Email" required><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="nama@email.com"/></Field><Field label="Kata sandi" required><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="Minimal 8 karakter"/></Field>{error&&<div className="notice notice-error"><AlertCircle size={17}/>{error}</div>}{message&&<div className="notice notice-success"><CheckCircle2 size={17}/>{message}</div>}<button disabled={busy} className="button button-primary button-full" type="submit">{busy?'Memproses…':mode==='login'?'Masuk':'Daftar akun'} <ArrowRight size={17}/></button><div className="auth-switch">{mode==='login'?'Belum memiliki akun?':'Sudah memiliki akun?'} <button type="button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setMessage('');}}>{mode==='login'?'Daftar sekarang':'Masuk'}</button></div></form></div></div>;
}

function Field({label,required,children,hint}) {return <label className="field"><span>{label}{required&&<i> *</i>}</span>{children}{hint&&<small>{hint}</small>}</label>;}

const ML_API_BASE = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

async function checkSpamWithAI(description) {
  const resp = await fetch(`${ML_API_BASE}/api/ml/detect-spam`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  });
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const errJson = await resp.json();
      if (errJson?.detail) msg = errJson.detail;
    } catch {}
    throw new Error(msg);
  }
  return await resp.json();
}

async function analyzePhotoWithAI(fileOrBlob, filename = 'photo.jpg', description = '', category = '') {
  const form = new FormData();
  form.append('file', fileOrBlob, filename);
  if (description) form.append('description', description);
  if (category) form.append('category', category);
  const resp = await fetch(`${ML_API_BASE}/api/ml/analyze-photo`, {
    method: 'POST',
    body: form
  });
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const errJson = await resp.json();
      if (errJson?.detail) msg = errJson.detail;
    } catch {}
    throw new Error(msg);
  }
  return await resp.json();
}

function buildPhotoAiPayload(photoAi) {
  if (!photoAi) return {};
  const combinedSummary = [photoAi.summary, photoAi.match_summary].filter(Boolean).join(' · ');
  return {
    photo_ai_prediction: photoAi.prediction,
    photo_ai_confidence: photoAi.confidence,
    photo_ai_objects: photoAi.detected_objects || [],
    photo_ai_summary: combinedSummary || null,
    photo_ai_checked_at: photoAi.checked_at || new Date().toISOString()
  };
}

function stripOptionalAiFields(payload, err) {
  if (!err) return false;
  const msg = err.message || '';
  if (msg.includes('spam_') || msg.includes('photo_ai_') || err.code === 'PGRST204') {
    delete payload.spam_prediction;
    delete payload.spam_probability;
    delete payload.normal_probability;
    delete payload.spam_model_version;
    delete payload.spam_checked_at;
    delete payload.photo_ai_prediction;
    delete payload.photo_ai_confidence;
    delete payload.photo_ai_objects;
    delete payload.photo_ai_summary;
    delete payload.photo_ai_checked_at;
    return true;
  }
  return false;
}

function CreateReportPage({session}) {
  const navigate = useNavigate();
  const [category,setCategory] = useState(CATEGORIES[0]);
  const [description,setDescription] = useState('');
  const [location,setLocation] = useState('');
  const [lat,setLat] = useState('');
  const [lng,setLng] = useState('');
  const [incidentTime,setIncidentTime] = useState('');
  const [file,setFile] = useState(null);
  const [preview,setPreview] = useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  useEffect(()=>()=>{if(preview) URL.revokeObjectURL(preview);},[preview]);
  function chooseFile(e) {
    const next=e.target.files?.[0]; if(!next) return;
    setError('');
    if(!['image/jpeg','image/png','image/webp'].includes(next.type)){setError('Gunakan file JPG, PNG, atau WebP.');e.target.value='';return;}
    if(next.size>5*1024*1024){setError('Ukuran foto maksimal 5 MB.');e.target.value='';return;}
    if(preview) URL.revokeObjectURL(preview);
    setFile(next);setPreview(URL.createObjectURL(next));
  }
  function useLocation() {
    if(!navigator.geolocation){setError('Browser tidak mendukung geolokasi.');return;}
    navigator.geolocation.getCurrentPosition(pos=>{setLat(String(pos.coords.latitude));setLng(String(pos.coords.longitude));if(!location)setLocation('Koordinat GPS pengguna');},()=>setError('Lokasi tidak dapat diakses. Izinkan akses lokasi atau isi alamat secara manual.'),{enableHighAccuracy:true,timeout:10000});
  }
  async function submit(e) {
    e.preventDefault();setBusy(true);setError('');setSuccess('');
    let photoPath=null;
    try {
      const cleanLocation=location.trim();
      const cleanDescription=description.trim();
      if(!cleanLocation) throw new Error('Lokasi kejadian wajib diisi.');
      if(cleanLocation.length<3) throw new Error('Lokasi kejadian minimal 3 karakter.');
      if(cleanDescription.length<20) throw new Error('Deskripsi minimal 20 karakter agar laporan dapat diperiksa.');
      if(cleanDescription.split(/\s+/).filter(w=>/\p{L}/u.test(w)).length<3) throw new Error('Deskripsi minimal terdiri dari 3 kata yang menjelaskan kejadian.');
      const latNum=parseCoordinate(lat);
      const lngNum=parseCoordinate(lng);
      if((latNum===null)!==(lngNum===null)) throw new Error('Koordinat harus memiliki latitude dan longitude.');
      if(Number.isNaN(latNum)||Number.isNaN(lngNum)) throw new Error('Latitude dan longitude harus berupa angka, contoh: 1.4748 dan 124.8421.');
      if(latNum!==null && (latNum<-90||latNum>90||lngNum<-180||lngNum>180)) throw new Error('Koordinat tidak valid. Latitude -90 s.d. 90, longitude -180 s.d. 180.');
      if(incidentTime){const t=new Date(incidentTime);if(Number.isNaN(t.getTime())) throw new Error('Waktu kejadian tidak valid.');if(t.getTime()>Date.now()) throw new Error('Waktu kejadian tidak boleh di masa depan.');}
      if(file) {
        const ext=file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
        photoPath=`${session.user.id}/${crypto.randomUUID()}.${ext}`;
        const {error:uploadError}=await supabase.storage.from('report-photos').upload(photoPath,file,{contentType:file.type,upsert:false});
        if(uploadError) throw uploadError;
      }

      // Deteksi AI otomatis (teks + foto) secara silent di background tanpa membebani warga
      const [spamRes, photoRes] = await Promise.allSettled([
        checkSpamWithAI(cleanDescription),
        file ? analyzePhotoWithAI(file, file.name, cleanDescription, category) : Promise.resolve(null)
      ]);
      const autoAi = spamRes.status === 'fulfilled' ? spamRes.value : null;
      const autoPhotoAi = photoRes.status === 'fulfilled' ? photoRes.value : null;

      const payload={
        user_id:session.user.id,
        category,
        description:cleanDescription,
        location:cleanLocation,
        latitude:latNum,
        longitude:lngNum,
        incident_time:incidentTime?new Date(incidentTime).toISOString():null,
        photo_path:photoPath,
        status:'pending'
      };

      if (autoAi) {
        payload.spam_prediction = autoAi.prediction;
        payload.spam_probability = autoAi.spam_probability;
        payload.normal_probability = autoAi.normal_probability;
        payload.spam_model_version = autoAi.model_version || '1.0.0';
        payload.spam_checked_at = new Date().toISOString();
      }
      if (autoPhotoAi) {
        Object.assign(payload, buildPhotoAiPayload(autoPhotoAi));
      }

      let {data,error:insertError} = await supabase.from('reports').insert(payload).select('id').single();
      if (stripOptionalAiFields(payload, insertError)) {
        const fallbackRes = await supabase.from('reports').insert(payload).select('id').single();
        if (fallbackRes.error) throw fallbackRes.error;
        data = fallbackRes.data;
      } else if (insertError) {
        throw insertError;
      }

      setSuccess(`Laporan ${shortId(data.id)} berhasil dikirim dan menunggu verifikasi.`);
      setTimeout(()=>navigate('/laporan-saya'),1200);
    } catch(err) {
      if(photoPath) await supabase.storage.from('report-photos').remove([photoPath]);
      setError(err.message||'Laporan gagal dikirim.');
    } finally {setBusy(false);}
  }
  return <><PageTitle eyebrow="PELAPORAN MASYARAKAT" title="Buat laporan baru" subtitle="Sampaikan informasi kejadian secara jelas. Laporan akan ditinjau sebelum diteruskan."/><div className="form-layout"><form className="content-card report-form" onSubmit={submit}><div className="form-section-title"><span className="form-section-icon"><FilePlus2 size={18}/></span><div><h3>Informasi kejadian</h3><p>Isi detail yang Anda ketahui berdasarkan pengamatan.</p></div></div><Field label="Kategori dugaan pelanggaran" required><select value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Deskripsi kejadian" required hint="Minimal 20 karakter. Hindari asumsi atau tuduhan yang tidak dapat dijelaskan."><textarea rows="5" value={description} onChange={e=>setDescription(e.target.value)} required minLength={20} maxLength={3000} placeholder="Jelaskan apa yang terlihat, lokasi spesifik, arah kendaraan jika relevan, dan informasi faktual lainnya…"/><small className="char-count">{description.length}/3000</small></Field><Field label="Lokasi kejadian" required hint="Tulis alamat, nama jalan, patokan, atau area kejadian."><div className="input-with-action"><MapPin size={17}/><input value={location} onChange={e=>setLocation(e.target.value)} required minLength={3} maxLength={300} placeholder="Contoh: Jalan Sam Ratulangi, dekat persimpangan…"/></div></Field><div className="coordinate-row"><Field label="Latitude"><input value={lat} onChange={e=>setLat(e.target.value)} inputMode="decimal" placeholder="Contoh: 1.4748"/></Field><Field label="Longitude"><input value={lng} onChange={e=>setLng(e.target.value)} inputMode="decimal" placeholder="Contoh: 124.8421"/></Field><button type="button" className="button button-secondary location-button" onClick={useLocation}><MapPin size={16}/> Gunakan GPS</button></div><Field label="Waktu kejadian" hint="Opsional. Isi jika waktu diketahui."><input type="datetime-local" value={incidentTime} max={localDateTimeNow()} onChange={e=>setIncidentTime(e.target.value)}/></Field><div className="field"><span>Foto pendukung <small className="optional">(opsional)</small></span><label className={`upload-zone ${preview?'has-preview':''}`}>{preview?<><img src={preview} alt="Pratinjau foto laporan"/><span className="upload-change"><Camera size={16}/> Ganti foto</span></>:<><span className="upload-icon"><ImagePlus size={22}/></span><b>Unggah foto kejadian</b><span>JPG, PNG atau WebP · Maksimal 5 MB</span><span className="upload-browse">Pilih foto</span></>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} hidden/></label>{file&&<div className="file-row"><FileImage size={16}/><span>{file.name}</span><button type="button" className="icon-button" onClick={()=>{setFile(null);setPreview('');}} aria-label="Hapus foto"><X size={16}/></button></div>}</div><div className="privacy-note"><ShieldCheck size={17}/><span>Foto dan detail laporan hanya dapat diakses sesuai kebijakan akses sistem. Hindari mengunggah gambar yang tidak relevan atau membahayakan privasi orang lain.</span></div>{error&&<div className="notice notice-error"><AlertCircle size={17}/>{error}</div>}{success&&<div className="notice notice-success"><CheckCircle2 size={17}/>{success}</div>}<div className="form-actions"><button type="button" className="button button-secondary" onClick={()=>navigate(-1)}>Batal</button><button type="submit" disabled={busy} className="button button-primary">{busy?'Mengirim…':'Kirim laporan'} <ArrowRight size={16}/></button></div></form><aside className="form-aside"><div className="aside-info-card"><div className="aside-icon blue"><ShieldCheck size={20}/></div><h3>Proses verifikasi</h3><p>Admin memeriksa kelengkapan laporan. Admin dapat menerima untuk ditindaklanjuti, meminta perbaikan, atau menolak dengan alasan.</p></div><div className="aside-info-card"><div className="aside-icon orange"><Info size={20}/></div><h3>Laporkan secara bertanggung jawab</h3><ul><li>Berikan informasi yang faktual.</li><li>Jangan mengambil foto sambil berkendara.</li><li>Jangan mengunggah data pribadi yang tidak diperlukan.</li><li>Jangan menganggap laporan sebagai bukti resmi.</li></ul></div></aside></div></>;
}

function PageTitle({eyebrow,title,subtitle,action}) {return <div className="page-title-row"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;}

function MyReportsPage({session}) {
  const [reports,setReports]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('all');
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState(null);
  const [editing,setEditing]=useState(null);
  const [loadError,setLoadError]=useState('');
  const [actionSuccess,setActionSuccess]=useState('');

  const refresh=useCallback(async()=>{
    setLoading(true);
    setLoadError('');
    const {data,error}=await supabase.from('reports').select('id,category,description,location,status,created_at,incident_time,photo_path,admin_note,latitude,longitude').eq('user_id',session.user.id).order('created_at',{ascending:false});
    if(error){
      setLoadError(`Laporan gagal dimuat: ${error.message}`);
      setReports([]);
    } else {
      setReports(data||[]);
    }
    setLoading(false);
  },[session.user.id]);

  useEffect(()=>{refresh();},[refresh]);

  const visible=useMemo(()=>reports.filter(r=>(filter==='all'||r.status===filter)&&`${r.category} ${r.location} ${shortId(r.id)}`.toLowerCase().includes(search.toLowerCase())),[reports,filter,search]);

  return <>
    <PageTitle eyebrow="AKTIVITAS ANDA" title="Laporan saya" subtitle="Pantau status, catatan verifikasi, dan perbaiki laporan jika diminta." action={<Link to="/buat-laporan" className="button button-primary"><Plus size={17}/> Buat laporan</Link>}/>
    {actionSuccess && <div className="notice notice-success"><CheckCircle2 size={17}/>{actionSuccess}</div>}
    <div className="filter-toolbar">
      <div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari ID, kategori, atau lokasi…"/></div>
      <div className="filter-select"><Filter size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Semua status</option>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select><ChevronDown size={15}/></div>
    </div>
    <section className="content-card table-card">
      <div className="card-heading"><div><h3>Daftar laporan</h3><p>{visible.length} laporan ditampilkan</p></div></div>
      {loadError&&<div className="notice notice-error"><AlertCircle size={17}/>{loadError}</div>}
      {loading?<LoadingRows/>:loadError?null:visible.length===0?<EmptyState title="Laporan tidak ditemukan" text="Coba ubah filter atau kirim laporan baru."/>:<div className="report-list">{visible.map(r=><ReportListItem key={r.id} report={r} onClick={()=>setSelected(r)} onEdit={()=>setEditing(r)}/>)}</div>}
    </section>
    {selected&&<ReportDetail report={selected} onClose={()=>setSelected(null)} onEdit={(r)=>{setSelected(null);setEditing(r);}}/>}
    {editing&&<EditReportModal report={editing} session={session} onClose={()=>setEditing(null)} onSuccess={(msg)=>{setActionSuccess(msg);refresh();}}/>}
  </>;
}

function ReportListItem({report,onClick,onEdit}) {
  const status=STATUS[report.status]||STATUS.pending;
  const canEdit=['pending','revision'].includes(report.status);
  return (
    <div className="report-list-item-wrap">
      <button className="report-list-item" onClick={onClick}>
        <div className="report-type-icon"><Flag size={19}/></div>
        <div className="report-list-main">
          <div className="report-list-title">
            <b>{report.category}</b>
            <span className={`status-badge ${status.className}`}><span/>{status.label}</span>
          </div>
          <div className="report-list-meta">
            <span>{shortId(report.id)}</span>
            <span><MapPin size={13}/>{report.location}</span>
            <span><Clock3 size={13}/>{formatDate(report.created_at)}</span>
          </div>
          {report.status==='revision'&&report.admin_note&&<span className="revision-pill"><Pencil size={11}/> Perlu perbaikan dari admin</span>}
        </div>
        <ArrowRight size={17} className="list-arrow"/>
      </button>
      {canEdit&&(
        <button className="button button-secondary button-sm quick-edit-btn" title="Edit & Kirim Ulang" onClick={(e)=>{e.stopPropagation();onEdit();}}>
          <Pencil size={13}/> Edit
        </button>
      )}
    </div>
  );
}

function ReportDetail({report,onClose,onEdit}) {
  const [photo,setPhoto]=useState('');
  const [photoError,setPhotoError]=useState('');
  const status=STATUS[report.status]||STATUS.pending;
  const canEdit=['pending','revision'].includes(report.status);
  useEscape(onClose);

  useEffect(()=>{
    let active=true;setPhoto('');setPhotoError('');
    if(report.photo_path)supabase.storage.from('report-photos').createSignedUrl(report.photo_path,60).then(({data,error})=>{
      if(!active)return;
      if(error||!data?.signedUrl)setPhotoError(`Foto tidak dapat dimuat${error?.message?`: ${error.message}`:'.'}`);
      else setPhoto(data.signedUrl);
    });
    return()=>{active=false;};
  },[report.photo_path]);

  return <div className="modal-backdrop" onClick={onClose}><div className="modal-card" onClick={e=>e.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">{shortId(report.id)}</span><h2>Detail laporan</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></div><div className="modal-body"><span className={`status-badge ${status.className}`}><span/>{status.label}</span><DetailLine label="Kategori" value={report.category}/><DetailLine label="Lokasi" value={report.location}/><DetailLine label="Waktu laporan" value={formatDate(report.created_at)}/><DetailLine label="Waktu kejadian" value={formatDate(report.incident_time)}/><div className="detail-block"><b>Deskripsi</b><p>{report.description}</p></div>{report.latitude&&report.longitude&&<a className="text-link" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=17/${report.latitude}/${report.longitude}`}><MapPin size={15}/> Buka lokasi di OpenStreetMap <ArrowRight size={14}/></a>}{photo&&<img className="detail-photo" src={photo} alt="Foto pendukung laporan"/>}{photoError&&<div className="notice notice-error"><AlertCircle size={16}/>{photoError}</div>}{report.admin_note&&<div className="admin-note"><b><MessageSquareText size={15}/> Catatan admin</b><p>{report.admin_note}</p></div>}<p className="small-muted">Status merupakan informasi proses administrasi dan tidak otomatis membuktikan pelanggaran.</p></div><div className="modal-footer"><button className="button button-secondary" onClick={onClose}>Tutup</button>{canEdit&&<button className="button button-primary" onClick={()=>{onEdit(report);}}><Pencil size={15}/> Edit & Kirim Ulang</button>}</div></div></div>;
}

function EditReportModal({report, session, onClose, onSuccess}) {
  const [category, setCategory] = useState(report.category || CATEGORIES[0]);
  const [description, setDescription] = useState(report.description || '');
  const [location, setLocation] = useState(report.location || '');
  const [lat, setLat] = useState(report.latitude != null ? String(report.latitude) : '');
  const [lng, setLng] = useState(report.longitude != null ? String(report.longitude) : '');
  const [incidentTime, setIncidentTime] = useState(
    report.incident_time ? new Date(report.incident_time).toISOString().slice(0, 16) : ''
  );
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [existingPhoto, setExistingPhoto] = useState('');
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEscape(onClose, !busy);

  useEffect(() => {
    let active = true;
    if (report.photo_path) {
      supabase.storage.from('report-photos').createSignedUrl(report.photo_path, 120).then(({data}) => {
        if (active && data?.signedUrl) setExistingPhoto(data.signedUrl);
      });
    }
    return () => {
      active = false;
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [report.photo_path, preview]);

  function chooseFile(e) {
    const next = e.target.files?.[0];
    if (!next) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) {
      setError('Gunakan file JPG, PNG, atau WebP.');
      e.target.value = '';
      return;
    }
    if (next.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5 MB.');
      e.target.value = '';
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setRemoveExistingPhoto(false);
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolokasi.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        if (!location) setLocation('Koordinat GPS pengguna');
      },
      () => setError('Lokasi tidak dapat diakses. Izinkan akses lokasi atau isi alamat secara manual.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    let uploadedPath = null;
    try {
      const cleanLocation = location.trim();
      const cleanDescription = description.trim();
      if (!cleanLocation) throw new Error('Lokasi kejadian wajib diisi.');
      if (cleanLocation.length < 3) throw new Error('Lokasi kejadian minimal 3 karakter.');
      if (cleanDescription.length < 20) throw new Error('Deskripsi minimal 20 karakter agar laporan dapat diperiksa.');
      if (cleanDescription.split(/\s+/).filter(w => /\p{L}/u.test(w)).length < 3) {
        throw new Error('Deskripsi minimal terdiri dari 3 kata yang menjelaskan kejadian.');
      }
      const latNum = parseCoordinate(lat);
      const lngNum = parseCoordinate(lng);
      if ((latNum === null) !== (lngNum === null)) throw new Error('Koordinat harus memiliki latitude dan longitude.');
      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        throw new Error('Latitude dan longitude harus berupa angka, contoh: 1.4748 dan 124.8421.');
      }
      if (latNum !== null && (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180)) {
        throw new Error('Koordinat tidak valid. Latitude -90 s.d. 90, longitude -180 s.d. 180.');
      }
      if (incidentTime) {
        const t = new Date(incidentTime);
        if (Number.isNaN(t.getTime())) throw new Error('Waktu kejadian tidak valid.');
        if (t.getTime() > Date.now()) throw new Error('Waktu kejadian tidak boleh di masa depan.');
      }

      let finalPhotoPath = report.photo_path;
      if (file) {
        const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        uploadedPath = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('report-photos').upload(uploadedPath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        finalPhotoPath = uploadedPath;
      } else if (removeExistingPhoto) {
        finalPhotoPath = null;
      }

      // Deteksi AI otomatis (teks + foto baru) secara silent di background
      const [spamRes, photoRes] = await Promise.allSettled([
        checkSpamWithAI(cleanDescription),
        file ? analyzePhotoWithAI(file, file.name, cleanDescription, category) : Promise.resolve(null)
      ]);
      const autoAi = spamRes.status === 'fulfilled' ? spamRes.value : null;
      const autoPhotoAi = photoRes.status === 'fulfilled' ? photoRes.value : null;

      // 1. Coba lewat RPC user_resubmit_report
      const { error: rpcErr } = await supabase.rpc('user_resubmit_report', {
        p_report_id: report.id,
        p_category: category,
        p_description: cleanDescription,
        p_location: cleanLocation,
        p_latitude: latNum,
        p_longitude: lngNum,
        p_incident_time: incidentTime ? new Date(incidentTime).toISOString() : null,
        p_photo_path: finalPhotoPath
      });

      const aiPatch = {};
      if (autoAi) {
        aiPatch.spam_prediction = autoAi.prediction;
        aiPatch.spam_probability = autoAi.spam_probability;
        aiPatch.normal_probability = autoAi.normal_probability;
        aiPatch.spam_model_version = autoAi.model_version || '1.0.0';
        aiPatch.spam_checked_at = new Date().toISOString();
      }
      if (autoPhotoAi) {
        Object.assign(aiPatch, buildPhotoAiPayload(autoPhotoAi));
      } else if (removeExistingPhoto) {
        aiPatch.photo_ai_prediction = null;
        aiPatch.photo_ai_confidence = null;
        aiPatch.photo_ai_objects = null;
        aiPatch.photo_ai_summary = null;
        aiPatch.photo_ai_checked_at = null;
      }

      if (!rpcErr) {
        if (Object.keys(aiPatch).length > 0) {
          try {
            await supabase.from('reports').update(aiPatch).eq('id', report.id);
          } catch (_) {}
        }
      } else {
        // 2. Fallback direct update jika RPC belum dijalankan di database
        const payload = {
          category,
          description: cleanDescription,
          location: cleanLocation,
          latitude: latNum,
          longitude: lngNum,
          incident_time: incidentTime ? new Date(incidentTime).toISOString() : null,
          photo_path: finalPhotoPath,
          status: 'pending',
          updated_at: new Date().toISOString(),
          ...aiPatch
        };
        let { error: directErr } = await supabase.from('reports').update(payload).eq('id', report.id);
        if (stripOptionalAiFields(payload, directErr)) {
          const retry = await supabase.from('reports').update(payload).eq('id', report.id);
          if (retry.error) throw retry.error;
        } else if (directErr) {
          throw directErr;
        }
      }

      onSuccess(`Laporan ${shortId(report.id)} berhasil diperbarui dan dikirim ulang ke admin.`);
      onClose();
    } catch (err) {
      if (uploadedPath) await supabase.storage.from('report-photos').remove([uploadedPath]);
      setError(err.message || 'Gagal mengirim ulang laporan.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !busy && onClose()}>
      <div className="modal-card edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">{shortId(report.id)} · PERBAIKAN</span>
            <h2>Edit & Kirim Ulang Laporan</h2>
          </div>
          <button className="icon-button" disabled={busy} onClick={onClose}><X size={19}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {report.admin_note && (
              <div className="edit-note-banner">
                <MessageSquareText size={18} style={{flexShrink:0, marginTop:2}}/>
                <div>
                  <b>Catatan dari Admin:</b>
                  <p>{report.admin_note}</p>
                </div>
              </div>
            )}
            <Field label="Kategori dugaan pelanggaran" required>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Deskripsi kejadian" required hint="Minimal 20 karakter dan minimal 3 kata.">
              <textarea
                rows="4"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                minLength={20}
                maxLength={3000}
                placeholder="Perbarui penjelasan kejadian secara jelas dan faktual…"
              />
              <small className="char-count">{description.length}/3000</small>
            </Field>
            <Field label="Lokasi kejadian" required hint="Alamat, persimpangan, atau patokan lokasi kejadian.">
              <div className="input-with-action">
                <MapPin size={17}/>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                  minLength={3}
                  maxLength={300}
                  placeholder="Contoh: Jl. Sam Ratulangi dekat simpang…"
                />
              </div>
            </Field>
            <div className="coordinate-row">
              <Field label="Latitude"><input value={lat} onChange={e => setLat(e.target.value)} inputMode="decimal" placeholder="Contoh: 1.4748"/></Field>
              <Field label="Longitude"><input value={lng} onChange={e => setLng(e.target.value)} inputMode="decimal" placeholder="Contoh: 124.8421"/></Field>
              <button type="button" className="button button-secondary location-button" onClick={useLocation}><MapPin size={16}/> GPS</button>
            </div>
            <Field label="Waktu kejadian" hint="Opsional.">
              <input type="datetime-local" value={incidentTime} max={localDateTimeNow()} onChange={e => setIncidentTime(e.target.value)}/>
            </Field>
            <div className="field">
              <span>Foto pendukung <small className="optional">(opsional)</small></span>
              {(preview || (existingPhoto && !removeExistingPhoto)) ? (
                <div className="upload-zone has-preview">
                  <img src={preview || existingPhoto} alt="Pratinjau foto laporan"/>
                  <div className="preview-action-row">
                    <label className="button button-secondary button-sm">
                      <Camera size={15}/> Ganti foto
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} hidden/>
                    </label>
                    <button
                      type="button"
                      className="button button-secondary button-sm"
                      onClick={() => {
                        setFile(null);
                        setPreview('');
                        setRemoveExistingPhoto(true);
                      }}
                    >
                      <X size={15}/> Hapus foto
                    </button>
                  </div>
                </div>
              ) : (
                <label className="upload-zone">
                  <span className="upload-icon"><ImagePlus size={22}/></span>
                  <b>Unggah foto kejadian</b>
                  <span>JPG, PNG atau WebP · Maksimal 5 MB</span>
                  <span className="upload-browse">Pilih foto</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} hidden/>
                </label>
              )}
            </div>
            {error && <div className="notice notice-error"><AlertCircle size={17}/>{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" disabled={busy} className="button button-secondary" onClick={onClose}>Batal</button>
            <button type="submit" disabled={busy} className="button button-primary">
              {busy ? 'Mengirim ulang…' : 'Kirim Ulang Laporan'} <Send size={15}/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailLine({label,value}) {return <div className="detail-line"><span>{label}</span><b>{value||'—'}</b></div>;}

function AdminPage({profile}) {
  const [reports,setReports]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('all');
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState(null);
  const [status,setStatus]=useState('reviewing');
  const [note,setNote]=useState('');
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [adminSpamVerify,setAdminSpamVerify]=useState('');
  const [adminAiTesting,setAdminAiTesting]=useState(false);
  const [adminAiResult,setAdminAiResult]=useState(null);
  const [adminPhotoAiTesting,setAdminPhotoAiTesting]=useState(false);
  const [adminPhotoAiResult,setAdminPhotoAiResult]=useState(null);

  const refresh=useCallback(async()=>{
    setLoading(true);
    setError('');
    try {
      // 1. Ambil laporan beserta relasi profiles dan kolom AI (spam + foto)
      const selectWithAllAi = 'id,user_id,category,description,location,status,created_at,incident_time,photo_path,admin_note,latitude,longitude,spam_prediction,spam_probability,normal_probability,spam_model_version,spam_checked_at,admin_spam_verification,photo_ai_prediction,photo_ai_confidence,photo_ai_objects,photo_ai_summary,photo_ai_checked_at,profiles!user_id(full_name)';
      const selectFieldsWithSpam = 'id,user_id,category,description,location,status,created_at,incident_time,photo_path,admin_note,latitude,longitude,spam_prediction,spam_probability,normal_probability,spam_model_version,spam_checked_at,admin_spam_verification,profiles!user_id(full_name)';
      const selectFallback = 'id,user_id,category,description,location,status,created_at,incident_time,photo_path,admin_note,latitude,longitude,profiles!user_id(full_name)';

      let repData = null;
      let {data:d0, error:err0} = await supabase
        .from('reports')
        .select(selectWithAllAi)
        .order('created_at',{ascending:false})
        .limit(500);

      if (!err0) {
        repData = d0;
      } else {
        let {data:d1, error:err1} = await supabase
          .from('reports')
          .select(selectFieldsWithSpam)
          .order('created_at',{ascending:false})
          .limit(500);
        if (!err1) {
          repData = d1;
        } else {
          let {data:d2, error:err2} = await supabase
            .from('reports')
            .select(selectFallback)
            .order('created_at',{ascending:false})
            .limit(500);
          if (err2) {
            const res = await supabase
              .from('reports')
              .select('id,user_id,category,description,location,status,created_at,incident_time,photo_path,admin_note,latitude,longitude,profiles(full_name)')
              .order('created_at',{ascending:false})
              .limit(500);
            if (res.error) throw res.error;
            repData = res.data;
          } else {
            repData = d2;
          }
        }
      }

      // 2. Query tabel profiles langsung untuk menjamin nama/username pelapor selalu terbaca oleh admin
      const {data:profs} = await supabase.from('profiles').select('id, full_name');
      const profMap = {};
      if (profs) {
        for (const p of profs) {
          if (p.full_name) profMap[p.id] = p.full_name;
        }
      }

      // 3. Pasangkan nama pelapor secara akurat
      const finalReports = (repData || []).map(r => {
        const joined = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        const reporterName = profMap[r.user_id] || joined?.full_name || 'Pengguna';
        return {
          ...r,
          reporterName
        };
      });

      setReports(finalReports);

      // Auto-scan laporan yang belum memiliki prediksi AI secara otomatis di latar belakang
      const unscanned = (finalReports || []).filter(r => !r.spam_prediction && r.description);
      if (unscanned.length > 0) {
        (async () => {
          for (const item of unscanned.slice(0, 10)) {
            try {
              const res = await checkSpamWithAI(item.description);
              const patch = {
                spam_prediction: res.prediction,
                spam_probability: res.spam_probability,
                normal_probability: res.normal_probability,
                spam_model_version: res.model_version || '1.0.0',
                spam_checked_at: new Date().toISOString()
              };
              setReports(prev => prev.map(r => r.id === item.id ? { ...r, ...patch } : r));
              await supabase.from('reports').update(patch).eq('id', item.id);
            } catch (_) {
              break;
            }
          }
        })();
      }
    } catch(err) {
      setError(err.message || 'Gagal memuat daftar laporan.');
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(()=>{refresh();},[refresh]);

  const counts=useMemo(()=>({
    total:reports.length,
    pending:reports.filter(r=>r.status==='pending').length,
    reviewing:reports.filter(r=>r.status==='reviewing').length,
    action:reports.filter(r=>['forwarded','in_progress'].includes(r.status)).length
  }),[reports]);

  const visible=useMemo(()=>reports.filter(r=>(filter==='all'||r.status===filter)&&`${r.category} ${r.location} ${shortId(r.id)} ${r.reporterName||''}`.toLowerCase().includes(search.toLowerCase())),[reports,filter,search]);

  const closeReview=useCallback(()=>{if(!saving)setSelected(null);},[saving]);
  useEscape(closeReview,!!selected);

  const scanStoragePhoto = useCallback(async (report) => {
    if (!report?.photo_path) return null;
    const { data, error: signErr } = await supabase.storage.from('report-photos').createSignedUrl(report.photo_path, 60);
    if (signErr || !data?.signedUrl) throw new Error(signErr?.message || 'Gagal mengakses URL foto.');
    const imgResp = await fetch(data.signedUrl);
    if (!imgResp.ok) throw new Error(`Gagal mengunduh foto (HTTP ${imgResp.status}).`);
    const blob = await imgResp.blob();
    const res = await analyzePhotoWithAI(
      blob,
      report.photo_path.split('/').pop() || 'photo.jpg',
      report.description || '',
      report.category || ''
    );
    return {
      ...res,
      checked_at: new Date().toISOString()
    };
  }, []);

  function openReport(r){
    setSelected(r);
    setStatus(r.status);
    setNote(r.admin_note||'');
    setAdminSpamVerify(r.admin_spam_verification||'');
    setMessage('');
    setError('');

    if (r.spam_prediction) {
      setAdminAiResult({
        prediction: r.spam_prediction,
        spam_probability: r.spam_probability,
        normal_probability: r.normal_probability,
        model_version: r.spam_model_version,
        checked_at: r.spam_checked_at,
        is_spam: r.spam_prediction === 'SPAM',
        recommendation: r.spam_prediction === 'SPAM'
          ? 'Laporan terindikasi tidak relevan atau berisi konten spam.'
          : 'Laporan terindikasi relevan dengan konteks lalu lintas.'
      });
    } else {
      // Otomatis scan langsung saat admin membuka detail laporan!
      setAdminAiResult(null);
      if (r.description) {
        setAdminAiTesting(true);
        checkSpamWithAI(r.description).then(async (res) => {
          const scanned = {
            prediction: res.prediction,
            spam_probability: res.spam_probability,
            normal_probability: res.normal_probability,
            model_version: res.model_version || '1.0.0',
            checked_at: new Date().toISOString(),
            is_spam: res.prediction === 'SPAM',
            recommendation: res.recommendation
          };
          setAdminAiResult(scanned);
          setReports(prev => prev.map(item => item.id === r.id ? {
            ...item,
            spam_prediction: scanned.prediction,
            spam_probability: scanned.spam_probability,
            normal_probability: scanned.normal_probability,
            spam_model_version: scanned.model_version,
            spam_checked_at: scanned.checked_at
          } : item));
          try {
            await supabase.from('reports').update({
              spam_prediction: scanned.prediction,
              spam_probability: scanned.spam_probability,
              normal_probability: scanned.normal_probability,
              spam_model_version: scanned.model_version,
              spam_checked_at: scanned.checked_at
            }).eq('id', r.id);
          } catch (_) {}
        }).catch(() => {
          // Layanan ML belum aktif
        }).finally(() => {
          setAdminAiTesting(false);
        });
      }
    }

    if (r.photo_ai_prediction) {
      setAdminPhotoAiResult({
        prediction: r.photo_ai_prediction,
        is_traffic_relevant: r.photo_ai_prediction === 'RELEVAN',
        confidence: r.photo_ai_confidence,
        detected_objects: Array.isArray(r.photo_ai_objects) ? r.photo_ai_objects : [],
        summary: r.photo_ai_summary,
        checked_at: r.photo_ai_checked_at
      });
      if (r.photo_path) {
        // Segarkan analisis kecocokan teks <-> foto secara real-time saat modal dibuka
        setAdminPhotoAiTesting(true);
        scanStoragePhoto(r).then((scannedPhoto) => {
          if (scannedPhoto) setAdminPhotoAiResult(scannedPhoto);
        }).catch(() => {}).finally(() => {
          setAdminPhotoAiTesting(false);
        });
      }
    } else {
      setAdminPhotoAiResult(null);
      if (r.photo_path) {
        setAdminPhotoAiTesting(true);
        scanStoragePhoto(r).then(async (scannedPhoto) => {
          if (!scannedPhoto) return;
          setAdminPhotoAiResult(scannedPhoto);
          const photoPatch = buildPhotoAiPayload(scannedPhoto);
          setReports(prev => prev.map(item => item.id === r.id ? { ...item, ...photoPatch } : item));
          try {
            await supabase.from('reports').update(photoPatch).eq('id', r.id);
          } catch (_) {}
        }).catch(() => {
          // Layanan ML foto belum aktif atau foto tidak dapat diakses
        }).finally(() => {
          setAdminPhotoAiTesting(false);
        });
      }
    }
  }

  async function runAdminAICheck() {
    if (!selected) return;
    setAdminAiTesting(true);
    setError('');
    try {
      const res = await checkSpamWithAI(selected.description);
      setAdminAiResult({
        ...res,
        checked_at: new Date().toISOString()
      });
    } catch (err) {
      setError(`Gagal memeriksa dengan AI: ${err.message}`);
    } finally {
      setAdminAiTesting(false);
    }
  }

  async function runAdminPhotoAICheck() {
    if (!selected?.photo_path) return;
    setAdminPhotoAiTesting(true);
    setError('');
    try {
      const scannedPhoto = await scanStoragePhoto(selected);
      setAdminPhotoAiResult(scannedPhoto);
    } catch (err) {
      setError(`Gagal memindai foto dengan AI: ${err.message}`);
    } finally {
      setAdminPhotoAiTesting(false);
    }
  }

  async function saveReview(e){
    e.preventDefault();
    if(!selected)return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const {error:err}=await supabase.rpc('admin_update_report_status',{p_report_id:selected.id,p_status:status,p_admin_note:note.trim()||null});
      if(err)throw err;

      try {
        const updatePayload = {
          admin_spam_verification: adminSpamVerify || null
        };
        if (adminAiResult && adminAiResult.prediction) {
          updatePayload.spam_prediction = adminAiResult.prediction;
          updatePayload.spam_probability = adminAiResult.spam_probability;
          updatePayload.normal_probability = adminAiResult.normal_probability;
          updatePayload.spam_model_version = adminAiResult.model_version || '1.0.0';
          updatePayload.spam_checked_at = adminAiResult.checked_at || new Date().toISOString();
        }
        if (adminPhotoAiResult && adminPhotoAiResult.prediction) {
          Object.assign(updatePayload, buildPhotoAiPayload(adminPhotoAiResult));
        }
        await supabase.from('reports').update(updatePayload).eq('id', selected.id);
      } catch (_) {}

      setMessage('Status laporan berhasil diperbarui.');
      await refresh();
      setSelected(null);
    } catch(err){
      setError(err.message||'Gagal memperbarui status.');
    } finally {
      setSaving(false);
    }
  }

  return <>
    <PageTitle eyebrow="PUSAT KENDALI" title="Dashboard admin" subtitle="Verifikasi laporan masuk, catat keputusan, dan perbarui tindak lanjut."/>
    <div className="admin-stats">
      <StatCard icon={<FileCheck2 size={19}/>} label="Total laporan" value={counts.total} tone="blue" foot="Semua laporan"/>
      <StatCard icon={<Clock3 size={19}/>} label="Menunggu verifikasi" value={counts.pending} tone="orange" foot="Perlu diperiksa"/>
      <StatCard icon={<ShieldCheck size={19}/>} label="Sedang diverifikasi" value={counts.reviewing} tone="purple" foot="Dalam pemeriksaan"/>
      <StatCard icon={<ArrowDownToLine size={19}/>} label="Diteruskan / tindak lanjut" value={counts.action} tone="green" foot="Memerlukan pemantauan"/>
    </div>
    <section className="content-card table-card">
      <div className="card-heading">
        <div><h3>Manajemen laporan</h3><p>Pilih laporan untuk memeriksa detail dan menentukan status.</p></div>
        <button className="button button-secondary button-sm" onClick={refresh}><RefreshCw size={15}/> Segarkan</button>
      </div>
      <div className="filter-toolbar admin-filter">
        <div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari ID, username pelapor, kategori, lokasi…"/></div>
        <div className="filter-select"><Filter size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Semua status</option>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select><ChevronDown size={15}/></div>
      </div>
      {error&&!selected&&<div className="notice notice-error"><AlertCircle size={17}/>{error}</div>}
      {message&&!selected&&<div className="notice notice-success"><CheckCircle2 size={17}/>{message}</div>}
      {loading?<LoadingRows/>:visible.length===0?<EmptyState title="Tidak ada laporan" text="Laporan yang sesuai pencarian atau filter akan muncul di sini."/>:(
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID / Tanggal</th>
                <th>Pelapor (Username)</th>
                <th>Kategori</th>
                <th>Lokasi</th>
                <th>AI Moderasi</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(r=>(
                <tr key={r.id}>
                  <td><b>{shortId(r.id)}</b><small>{formatDate(r.created_at)}</small></td>
                  <td className="reporter-cell">
                    <div className="reporter-chip">
                      <span className="reporter-avatar">{(r.reporterName||'P').slice(0,1).toUpperCase()}</span>
                      <div>
                        <b>{r.reporterName||'Pengguna'}</b>
                        <small className="reporter-id">{shortId(r.user_id)}</small>
                      </div>
                    </div>
                  </td>
                  <td>{r.category}</td>
                  <td className="location-cell">{r.location}</td>
                  <td className="ai-col">
                    <div className="ai-col-stack">
                      {r.spam_prediction === 'SPAM' ? (
                        <span className="ai-pill spam" title={`Probabilitas Spam: ${(Number(r.spam_probability || 0) * 100).toFixed(1)}%`}>
                          <AlertTriangle size={11}/> SPAM ({Math.round((r.spam_probability || 0) * 100)}%)
                        </span>
                      ) : r.spam_prediction === 'NORMAL' ? (
                        <span className="ai-pill normal" title={`Probabilitas Normal: ${(Number(r.spam_probability !== undefined ? (r.normal_probability || 0) : 0) * 100).toFixed(1)}%`}>
                          <CheckCircle2 size={11}/> Normal ({Math.round((r.normal_probability || 0) * 100)}%)
                        </span>
                      ) : (
                        <span className="ai-pill neutral">—</span>
                      )}
                      {r.photo_ai_prediction === 'RELEVAN' && (
                        <span className="ai-pill normal" title={r.photo_ai_summary || 'Foto relevan lalu lintas'}>
                          <Camera size={11}/> Foto Relevan
                        </span>
                      )}
                      {r.photo_ai_prediction === 'TIDAK_RELEVAN' && (
                        <span className="ai-pill spam" title={r.photo_ai_summary || 'Foto tidak relevan lalu lintas'}>
                          <Camera size={11}/> Foto Tdk Relevan
                        </span>
                      )}
                    </div>
                  </td>
                  <td><StatusBadge status={r.status}/></td>
                  <td><button className="button button-secondary button-sm" onClick={()=>openReport(r)}>Periksa <ArrowRight size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
    {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="modal-card admin-modal" onClick={e=>e.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">VERIFIKASI · {shortId(selected.id)}</span><h2>Periksa laporan</h2></div><button className="icon-button" onClick={()=>setSelected(null)}><X size={19}/></button></div><form onSubmit={saveReview}><div className="modal-body"><div className="report-byline"><div className="avatar">{(selected.reporterName||'P').slice(0,1).toUpperCase()}</div><div><b>{selected.reporterName||'Pengguna'}</b><small>ID Akun: {shortId(selected.user_id)} · {formatDate(selected.created_at)}</small></div><StatusBadge status={selected.status}/></div><DetailLine label="Kategori" value={selected.category}/><DetailLine label="Lokasi" value={selected.location}/><DetailLine label="Waktu kejadian" value={formatDate(selected.incident_time)}/><div className="detail-block"><b>Deskripsi pelapor</b><p>{selected.description}</p></div>{selected.latitude&&selected.longitude&&<a className="text-link" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}><MapPin size={15}/> Lihat koordinat di peta <ArrowRight size={14}/></a>}<AdminPhoto path={selected.photo_path}/><div className="admin-ai-panel"><div className="admin-ai-header"><div><b><Sparkles size={14} style={{display:'inline',verticalAlign:'-2px',marginRight:5}}/> Moderasi AI Spam Detection</b><small>Model Machine Learning Multinomial Naive Bayes (Otomatis)</small></div><button type="button" disabled={adminAiTesting} onClick={runAdminAICheck} className="button button-secondary button-sm"><RefreshCw size={13} className={adminAiTesting ? 'spin' : ''}/>{adminAiTesting ? 'Menganalisis…' : 'Pindai ulang AI'}</button></div>{adminAiTesting ? (<div className="notice notice-info compact-notice" style={{marginBottom: 14}}><RefreshCw size={14} className="spin" style={{display:'inline-block',marginRight:6,verticalAlign:'-2px'}}/><span>Sedang memindai dan menganalisis teks laporan dengan AI secara otomatis…</span></div>) : adminAiResult ? (<div className="admin-ai-grid"><div className="ai-stat-tile"><span>Hasil Prediksi</span><strong className={adminAiResult.prediction === 'SPAM' ? 'text-red' : 'text-green'}>{adminAiResult.prediction === 'SPAM' ? 'TERINDIKASI SPAM' : 'NORMAL'}</strong></div><div className="ai-stat-tile"><span>Probabilitas Spam</span><b>{(Number(adminAiResult.spam_probability || 0) * 100).toFixed(1)}%</b></div><div className="ai-stat-tile"><span>Probabilitas Normal</span><b>{(Number(adminAiResult.normal_probability || 0) * 100).toFixed(1)}%</b></div><div className="ai-stat-tile"><span>Waktu Pemeriksaan</span><b>{adminAiResult.checked_at ? formatDate(adminAiResult.checked_at) : 'Baru saja'}</b></div></div>) : (<div className="notice notice-info compact-notice" style={{marginBottom: 14}}><Info size={15}/> Layanan AI belum aktif atau sedang offline (port 8000).</div>)}{selected.photo_path && (<div className="ai-photo-panel"><div className="admin-ai-header"><div><b><Camera size={14} style={{display:'inline',verticalAlign:'-2px',marginRight:5}}/> Analisis AI Foto Bukti</b><small>Deteksi Objek Lalu Lintas YOLOv8n ONNX (Otomatis)</small></div><button type="button" disabled={adminPhotoAiTesting} onClick={runAdminPhotoAICheck} className="button button-secondary button-sm"><RefreshCw size={13} className={adminPhotoAiTesting ? 'spin' : ''}/>{adminPhotoAiTesting ? 'Memindai foto…' : 'Pindai ulang foto'}</button></div>{adminPhotoAiTesting ? (<div className="notice notice-info compact-notice" style={{marginBottom: 10}}><RefreshCw size={14} className="spin" style={{display:'inline-block',marginRight:6,verticalAlign:'-2px'}}/><span>Sedang menganalisis objek pada foto bukti…</span></div>) : adminPhotoAiResult ? (<> <div className="admin-ai-grid"><div className="ai-stat-tile"><span>Relevansi Foto</span><strong className={adminPhotoAiResult.prediction === 'RELEVAN' ? 'text-green' : 'text-red'}>{adminPhotoAiResult.prediction === 'RELEVAN' ? 'RELEVAN LALU LINTAS' : 'TIDAK RELEVAN'}</strong></div><div className="ai-stat-tile"><span>Kecocokan Teks ↔ Foto</span><strong className={adminPhotoAiResult.match_status === 'COCOK' ? 'text-green' : adminPhotoAiResult.match_status === 'SEBAGIAN_COCOK' ? 'text-muted' : 'text-red'}>{adminPhotoAiResult.match_status === 'COCOK' ? 'COCOK' : adminPhotoAiResult.match_status === 'SEBAGIAN_COCOK' ? 'SEBAGIAN COCOK' : adminPhotoAiResult.match_status === 'TIDAK_COCOK' ? 'TIDAK COCOK' : '—'}</strong></div><div className="ai-stat-tile"><span>Keyakinan Objek</span><b>{(Number(adminPhotoAiResult.confidence || 0) * 100).toFixed(1)}%</b></div><div className="ai-stat-tile"><span>Objek Terdeteksi</span><b>{(adminPhotoAiResult.detected_objects || []).length} jenis</b></div></div>{adminPhotoAiResult.match_summary && <p className="ai-photo-summary"><b>Hasil Cocok Teks:</b> {adminPhotoAiResult.match_summary}</p>}{adminPhotoAiResult.summary && <p className="ai-photo-summary">{adminPhotoAiResult.summary}</p>}{(adminPhotoAiResult.detected_objects || []).length > 0 && (<div className="ai-object-chips">{adminPhotoAiResult.detected_objects.map((obj) => (<span key={obj.label} className="ai-object-chip">{obj.label_id || obj.label} ×{obj.count} ({Math.round(Number(obj.confidence || 0) * 100)}%)</span>))}</div>)}</>) : (<div className="notice notice-info compact-notice" style={{marginBottom: 10}}><Info size={15}/> Analisis foto belum tersedia (pastikan layanan AI di port 8000 aktif).</div>)}</div>)}<div className="admin-spam-verify-row"><span>Status Verifikasi Administrator:</span><div className="verify-options"><label className="radio-label"><input type="radio" name="admin_spam_verification" value="" checked={!adminSpamVerify} onChange={() => setAdminSpamVerify('')}/><span>Belum diverifikasi</span></label><label className="radio-label"><input type="radio" name="admin_spam_verification" value="verified_normal" checked={adminSpamVerify === 'verified_normal'} onChange={() => setAdminSpamVerify('verified_normal')}/><span className="text-green">Verifikasi: Normal</span></label><label className="radio-label"><input type="radio" name="admin_spam_verification" value="verified_spam" checked={adminSpamVerify === 'verified_spam'} onChange={() => setAdminSpamVerify('verified_spam')}/><span className="text-red">Verifikasi: Spam</span></label><label className="radio-label"><input type="radio" name="admin_spam_verification" value="dismissed" checked={adminSpamVerify === 'dismissed'} onChange={() => setAdminSpamVerify('dismissed')}/><span className="text-muted">Abaikan</span></label></div></div><div className="admin-ai-disclaimer"><Info size={13}/><span>Hasil AI hanya alat bantu pendukung moderasi. Administrator memiliki wewenang penuh dalam menentukan keabsahan laporan.</span></div></div><div className="review-divider"/><Field label="Keputusan / status" required><select value={status} onChange={e=>setStatus(e.target.value)} required>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field><Field label="Catatan verifikasi" hint="Wajib diisi jika laporan ditolak atau perlu perbaikan. Jelaskan alasan dengan sopan."><textarea rows="3" value={note} onChange={e=>setNote(e.target.value)} maxLength={2000} placeholder="Contoh: Mohon tambahkan patokan lokasi agar kejadian dapat diperiksa…"/></Field>{['rejected','revision'].includes(status)&&!note.trim()&&<div className="notice notice-info"><Info size={16}/> Status ini memerlukan catatan alasan.</div>}{error&&<div className="notice notice-error"><AlertCircle size={17}/>{error}</div>}{message&&<div className="notice notice-success"><CheckCircle2 size={17}/>{message}</div>}<div className="disclaimer compact-disclaimer"><Info size={16}/><p>Verifikasi aplikasi bukan penetapan kesalahan hukum. Teruskan informasi melalui prosedur resmi jika diperlukan.</p></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={()=>setSelected(null)}>Batal</button><button disabled={saving||(['rejected','revision'].includes(status)&&!note.trim())} className="button button-primary" type="submit">{saving?'Menyimpan…':'Simpan keputusan'} <Check size={16}/></button></div></form></div></div>}
  </>;
}
function AdminPhoto({path}) {const [url,setUrl]=useState('');const [photoError,setPhotoError]=useState('');useEffect(()=>{let active=true;setUrl('');setPhotoError('');if(path)supabase.storage.from('report-photos').createSignedUrl(path,60).then(({data,error})=>{if(!active)return;if(error||!data?.signedUrl)setPhotoError(`Foto tidak dapat dimuat${error?.message?`: ${error.message}`:'.'}`);else setUrl(data.signedUrl);});return()=>{active=false;};},[path]);if(photoError)return <div className="notice notice-error"><AlertCircle size={16}/>{photoError}</div>;return url?<div className="admin-photo-wrap"><b>Foto pendukung</b><a href={url} target="_blank" rel="noreferrer"><img className="detail-photo" src={url} alt="Foto pendukung laporan"/></a></div>:null;}
function StatusBadge({status}) {const s=STATUS[status]||STATUS.pending;return <span className={`status-badge ${s.className}`}><span/>{s.label}</span>;}
function ReportTable({reports}) {return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ID / Tanggal</th><th>Kategori</th><th>Lokasi</th><th>Status</th></tr></thead><tbody>{reports.map(r=><tr key={r.id}><td><b>{shortId(r.id)}</b><small>{formatDate(r.created_at)}</small></td><td>{r.category}</td><td className="location-cell">{r.location}</td><td><StatusBadge status={r.status}/></td></tr>)}</tbody></table></div>;}
function LoadingRows() {return <div className="loading-rows"><div/><div/><div/></div>;}
function EmptyState({title,text}) {return <div className="empty-state"><div className="empty-icon"><Search size={23}/></div><h3>{title}</h3><p>{text}</p></div>;}
function NotFound({isAdmin}) {return <div className="center-state"><div className="empty-icon"><AlertCircle size={25}/></div><h2>Halaman tidak ditemukan</h2><p>Halaman yang Anda cari tidak tersedia.</p><Link to={isAdmin ? "/admin" : "/"} className="button button-primary">{isAdmin ? 'Kembali ke dashboard' : 'Kembali ke beranda'}</Link></div>;}

export default App;