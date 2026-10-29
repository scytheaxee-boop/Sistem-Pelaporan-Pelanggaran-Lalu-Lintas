import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowDownToLine, ArrowLeft, ArrowRight, Bell, Camera, Check,
  CheckCircle2, ChevronDown, CircleHelp, Clock3, FileCheck2, FileImage, FilePlus2,
  Filter, Flag, Gauge, ImagePlus, Info, LayoutDashboard, LogIn, LogOut, MapPin,
  Menu, MessageSquareText, Plus, Search, ShieldCheck, SlidersHorizontal, TrafficCone,
  UserRound, Users, X
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { CATEGORIES, STATUS, formatDate, shortId } from './lib/reports';

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

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null); setProfile(null); navigate('/');
  }

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Menyiapkan LaporLintas...</p></div>;

  const isAdmin = profile?.role === 'admin';
  return (
    <div className="app-shell">
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
          {isAdmin && <div className="nav-divider" />}
          {isAdmin && <div className="workspace-label">ADMINISTRATOR</div>}
          {isAdmin && <NavLink to="/admin" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={18}/> Dashboard Admin</NavLink>}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon"><CircleHelp size={17}/></span><b>Butuh bantuan?</b><p>Laporkan informasi yang jelas dan sesuai fakta.</p><a href="#panduan">Lihat panduan <ArrowRight size={13}/></a></div>
          <div className="sidebar-foot"><ShieldCheck size={15}/> Pelaporan yang bertanggung jawab</div>
        </div>
      </aside>
      {mobileNav && <button aria-label="Tutup menu" className="mobile-scrim" onClick={() => setMobileNav(false)} />}
      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Buka menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button>
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-sep">/</span><b>{pageName(location.pathname)}</b></div>
          <div className="topbar-actions">
            <span className="secure-chip"><ShieldCheck size={15}/> Sistem pelaporan</span>
            {session ? <div className="user-menu"><div className="avatar">{(profile?.full_name || session.user.email || 'U').slice(0,1).toUpperCase()}</div><div className="user-info"><b>{profile?.full_name || 'Pengguna'}</b><small>{isAdmin ? 'Administrator' : 'Masyarakat'}</small></div><button className="icon-button" title="Keluar" onClick={signOut}><LogOut size={17}/></button></div>
            : <Link to="/auth" className="button button-primary button-sm"><LogIn size={16}/> Masuk</Link>}
          </div>
        </header>
        {profileError && <div className="notice notice-error"><AlertCircle size={18}/>{profileError}</div>}
        <main className="page-content">
          <Routes>
            <Route path="/" element={<HomePage session={session} profile={profile} />} />
            <Route path="/auth" element={<AuthPage session={session} />} />
            <Route path="/buat-laporan" element={<Protected session={session}><CreateReportPage session={session}/></Protected>} />
            <Route path="/laporan-saya" element={<Protected session={session}><MyReportsPage session={session}/></Protected>} />
            <Route path="/admin" element={<Protected session={session} admin={isAdmin}><AdminPage profile={profile}/></Protected>} />
            <Route path="*" element={<NotFound/>}/>
          </Routes>
        </main>
        <footer className="footer"><span>© {new Date().getFullYear()} LaporLintas</span><span><ShieldCheck size={14}/> Informasi diverifikasi sebelum tindak lanjut</span></footer>
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

function HomePage({session, profile}) {
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
  return <>
    <section className="hero-panel">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> PLATFORM PELAPORAN PUBLIK</div><h1>Wujudkan lalu lintas<br/><span>yang lebih tertib.</span></h1><p>Laporkan kondisi atau dugaan pelanggaran lalu lintas dengan informasi yang jelas agar dapat diverifikasi dan ditindaklanjuti oleh pihak berwenang.</p><div className="hero-actions"><Link to={session?'/buat-laporan':'/auth'} className="button button-white"><Plus size={17}/> Buat laporan <ArrowRight size={16}/></Link><a href="#panduan" className="hero-link">Pelajari alurnya <ArrowRight size={15}/></a></div></div>
      <div className="hero-art"><div className="art-circle circle-one"/><div className="art-circle circle-two"/><div className="road-illustration"><div className="road-line"/><div className="road-line"/><div className="road-pin"><MapPin size={26}/></div><div className="road-card"><span className="road-card-icon"><CheckCircle2 size={17}/></span><span><b>Pelaporan tercatat</b><small>Menunggu verifikasi</small></span></div></div><div className="hero-mini-stat"><ShieldCheck size={16}/><span>Verifikasi sebelum tindak lanjut</span></div></div>
    </section>
    <div className="section-heading"><div><h2>Ringkasan laporan</h2><p>{profile?.role==='admin'?'Pantau laporan yang masuk ke sistem.':'Pantau laporan Anda setelah masuk ke akun.'}</p></div>{session && <Link className="text-link" to={profile?.role==='admin'?'/admin':'/laporan-saya'}>Lihat semua <ArrowRight size={15}/></Link>}</div>
    {!session && <div className="notice notice-info"><Info size={18}/> Masuk untuk melihat ringkasan dan memantau laporan Anda. <Link to="/auth">Masuk sekarang <ArrowRight size={14}/></Link></div>}
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
  </>;
}

function StatCard({icon,label,value,tone,foot}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-foot">{foot}</span></div>;
}
function Step({n,icon,title,text}) {return <div className="step-card"><div className="step-top"><span className="step-number">{n}</span><span className="step-icon">{icon}</span></div><h3>{title}</h3><p>{text}</p></div>;}

function AuthPage({session}) {
  const navigate = useNavigate();
  const [mode,setMode] = useState('login');
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  useEffect(()=>{if(session) navigate('/');},[session,navigate]);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode==='register') {
        const {data,error:err} = await supabase.auth.signUp({email,password,options:{data:{full_name:name.trim()}}});
        if(err) throw err;
        if(data.session) { setMessage('Akun berhasil dibuat.'); navigate('/'); }
        else setMessage('Pendaftaran berhasil. Periksa email untuk konfirmasi sebelum masuk.');
      } else {
        const {error:err} = await supabase.auth.signInWithPassword({email,password});
        if(err) throw err;
        navigate('/');
      }
    } catch(err) { setError(err.message || 'Autentikasi gagal.'); }
    finally {setBusy(false);}
  }
  return <div className="auth-layout"><div className="auth-aside"><div className="auth-aside-content"><div className="brand-mark large"><TrafficCone size={27}/></div><h1>Suara Anda<br/>berarti untuk<br/><span>jalan yang aman.</span></h1><p>Gunakan platform ini untuk menyampaikan informasi dugaan pelanggaran dan kondisi lalu lintas secara bertanggung jawab.</p><div className="auth-trust"><ShieldCheck size={18}/> Data laporan dibatasi sesuai hak akses</div></div></div><div className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><div className="eyebrow">SELAMAT DATANG</div><h2>{mode==='login'?'Masuk ke akun Anda':'Buat akun masyarakat'}</h2><p>{mode==='login'?'Lanjutkan untuk memantau laporan dan status tindak lanjut.':'Daftar untuk mengirim dan memantau laporan lalu lintas.'}</p>{mode==='register'&&<Field label="Nama lengkap" required><input value={name} onChange={e=>setName(e.target.value)} required minLength={2} placeholder="Nama Anda"/></Field>}<Field label="Email" required><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="nama@email.com"/></Field><Field label="Kata sandi" required><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="Minimal 8 karakter"/></Field>{error&&<div className="notice notice-error"><AlertCircle size={17}/>{error}</div>}{message&&<div className="notice notice-success"><CheckCircle2 size={17}/>{message}</div>}<button disabled={busy} className="button button-primary button-full" type="submit">{busy?'Memproses…':mode==='login'?'Masuk':'Daftar akun'} <ArrowRight size={17}/></button><div className="auth-switch">{mode==='login'?'Belum memiliki akun?':'Sudah memiliki akun?'} <button type="button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setMessage('');}}>{mode==='login'?'Daftar sekarang':'Masuk'}</button></div><div className="auth-note"><Info size={15}/> Admin tidak dapat ditetapkan melalui formulir pendaftaran. Peran admin harus diberikan secara aman melalui database.</div></form></div></div>;
}

function Field({label,required,children,hint}) {return <label className="field"><span>{label}{required&&<i> *</i>}</span>{children}{hint&&<small>{hint}</small>}</label>;}

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
      if(!location.trim()) throw new Error('Lokasi kejadian wajib diisi.');
      if(description.trim().length<20) throw new Error('Deskripsi minimal 20 karakter agar laporan dapat diperiksa.');
      if((lat&&!lng)||(!lat&&lng)) throw new Error('Koordinat harus memiliki latitude dan longitude.');
      if(lat && (Number(lat)<-90||Number(lat)>90||Number(lng)<-180||Number(lng)>180)) throw new Error('Koordinat tidak valid.');
      if(file) {
        const ext=file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
        photoPath=`${session.user.id}/${crypto.randomUUID()}.${ext}`;
        const {error:uploadError}=await supabase.storage.from('report-photos').upload(photoPath,file,{contentType:file.type,upsert:false});
        if(uploadError) throw uploadError;
      }
      const payload={user_id:session.user.id,category,description:description.trim(),location:location.trim(),latitude:lat?Number(lat):null,longitude:lng?Number(lng):null,incident_time:incidentTime?new Date(incidentTime).toISOString():null,photo_path:photoPath,status:'pending'};
      const {data,error:insertError}=await supabase.from('reports').insert(payload).select('id').single();
      if(insertError) throw insertError;
      setSuccess(`Laporan ${shortId(data.id)} berhasil dikirim dan menunggu verifikasi.`);
      setTimeout(()=>navigate('/laporan-saya'),1200);
    } catch(err) {
      if(photoPath) await supabase.storage.from('report-photos').remove([photoPath]);
      setError(err.message||'Laporan gagal dikirim.');
    } finally {setBusy(false);}
  }
  return <><PageTitle eyebrow="PELAPORAN MASYARAKAT" title="Buat laporan baru" subtitle="Sampaikan informasi kejadian secara jelas. Laporan akan ditinjau sebelum diteruskan."/><div className="form-layout"><form className="content-card report-form" onSubmit={submit}><div className="form-section-title"><span className="form-section-icon"><FilePlus2 size={18}/></span><div><h3>Informasi kejadian</h3><p>Isi detail yang Anda ketahui berdasarkan pengamatan.</p></div></div><Field label="Kategori dugaan pelanggaran" required><select value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Deskripsi kejadian" required hint="Minimal 20 karakter. Hindari asumsi atau tuduhan yang tidak dapat dijelaskan."><textarea rows="5" value={description} onChange={e=>setDescription(e.target.value)} required minLength={20} maxLength={3000} placeholder="Jelaskan apa yang terlihat, lokasi spesifik, arah kendaraan jika relevan, dan informasi faktual lainnya…"/><small className="char-count">{description.length}/3000</small></Field><Field label="Lokasi kejadian" required hint="Tulis alamat, nama jalan, patokan, atau area kejadian."><div className="input-with-action"><MapPin size={17}/><input value={location} onChange={e=>setLocation(e.target.value)} required maxLength={300} placeholder="Contoh: Jalan Sam Ratulangi, dekat persimpangan…"/></div></Field><div className="coordinate-row"><Field label="Latitude"><input value={lat} onChange={e=>setLat(e.target.value)} inputMode="decimal" placeholder="Contoh: 1.4748"/></Field><Field label="Longitude"><input value={lng} onChange={e=>setLng(e.target.value)} inputMode="decimal" placeholder="Contoh: 124.8421"/></Field><button type="button" className="button button-secondary location-button" onClick={useLocation}><MapPin size={16}/> Gunakan GPS</button></div><Field label="Waktu kejadian" hint="Opsional. Isi jika waktu diketahui."><input type="datetime-local" value={incidentTime} onChange={e=>setIncidentTime(e.target.value)}/></Field><div className="field"><span>Foto pendukung <small className="optional">(opsional)</small></span><label className={`upload-zone ${preview?'has-preview':''}`}>{preview?<><img src={preview} alt="Pratinjau foto laporan"/><span className="upload-change"><Camera size={16}/> Ganti foto</span></>:<><span className="upload-icon"><ImagePlus size={22}/></span><b>Unggah foto kejadian</b><span>JPG, PNG atau WebP · Maksimal 5 MB</span><span className="upload-browse">Pilih foto</span></>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} hidden/></label>{file&&<div className="file-row"><FileImage size={16}/><span>{file.name}</span><button type="button" className="icon-button" onClick={()=>{setFile(null);setPreview('');}} aria-label="Hapus foto"><X size={16}/></button></div>}</div><div className="privacy-note"><ShieldCheck size={17}/><span>Foto dan detail laporan hanya dapat diakses sesuai kebijakan akses sistem. Hindari mengunggah gambar yang tidak relevan atau membahayakan privasi orang lain.</span></div>{error&&<div className="notice notice-error"><AlertCircle size={17}/>{error}</div>}{success&&<div className="notice notice-success"><CheckCircle2 size={17}/>{success}</div>}<div className="form-actions"><button type="button" className="button button-secondary" onClick={()=>navigate(-1)}>Batal</button><button type="submit" disabled={busy} className="button button-primary">{busy?'Mengirim…':'Kirim laporan'} <ArrowRight size={16}/></button></div></form><aside className="form-aside"><div className="aside-info-card"><div className="aside-icon blue"><ShieldCheck size={20}/></div><h3>Proses verifikasi</h3><p>Admin memeriksa kelengkapan laporan. Admin dapat menerima untuk ditindaklanjuti, meminta perbaikan, atau menolak dengan alasan.</p></div><div className="aside-info-card"><div className="aside-icon orange"><Info size={20}/></div><h3>Laporkan secara bertanggung jawab</h3><ul><li>Berikan informasi yang faktual.</li><li>Jangan mengambil foto sambil berkendara.</li><li>Jangan mengunggah data pribadi yang tidak diperlukan.</li><li>Jangan menganggap laporan sebagai bukti resmi.</li></ul></div></aside></div></>;
}

function PageTitle({eyebrow,title,subtitle,action}) {return <div className="page-title-row"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;}

function MyReportsPage({session}) {
  const [reports,setReports]=useState([]);const [loading,setLoading]=useState(true);const [filter,setFilter]=useState('all');const [search,setSearch]=useState('');const [selected,setSelected]=useState(null);
  const refresh=useCallback(async()=>{setLoading(true);const {data}=await supabase.from('reports').select('id,category,description,location,status,created_at,incident_time,photo_path,admin_note,latitude,longitude').eq('user_id',session.user.id).order('created_at',{ascending:false});setReports(data||[]);setLoading(false);},[session.user.id]);
  useEffect(()=>{refresh();},[refresh]);
  const visible=useMemo(()=>reports.filter(r=>(filter==='all'||r.status===filter)&&`${r.category} ${r.location} ${shortId(r.id)}`.toLowerCase().includes(search.toLowerCase())),[reports,filter,search]);
  return <><PageTitle eyebrow="AKTIVITAS ANDA" title="Laporan saya" subtitle="Pantau status, catatan verifikasi, dan perkembangan laporan Anda." action={<Link to="/buat-laporan" className="button button-primary"><Plus size={17}/> Buat laporan</Link>}/><div className="filter-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari ID, kategori, atau lokasi…"/></div><div className="filter-select"><Filter size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Semua status</option>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select><ChevronDown size={15}/></div></div><section className="content-card table-card"><div className="card-heading"><div><h3>Daftar laporan</h3><p>{visible.length} laporan ditampilkan</p></div></div>{loading?<LoadingRows/>:visible.length===0?<EmptyState title="Laporan tidak ditemukan" text="Coba ubah filter atau kirim laporan baru."/>:<div className="report-list">{visible.map(r=><ReportListItem key={r.id} report={r} onClick={()=>setSelected(r)}/>)}</div>}</section>{selected&&<ReportDetail report={selected} onClose={()=>setSelected(null)}/>}</>;
}

function ReportListItem({report,onClick}) {const status=STATUS[report.status]||STATUS.pending;return <button className="report-list-item" onClick={onClick}><div className="report-type-icon"><Flag size={19}/></div><div className="report-list-main"><div className="report-list-title"><b>{report.category}</b><span className={`status-badge ${status.className}`}><span/>{status.label}</span></div><div className="report-list-meta"><span>{shortId(report.id)}</span><span><MapPin size={13}/>{report.location}</span><span><Clock3 size={13}/>{formatDate(report.created_at)}</span></div></div><ArrowRight size={17} className="list-arrow"/></button>}

function ReportDetail({report,onClose}) {const [photo,setPhoto]=useState('');const status=STATUS[report.status]||STATUS.pending;useEffect(()=>{let active=true;if(report.photo_path)supabase.storage.from('report-photos').createSignedUrl(report.photo_path,60).then(({data})=>{if(active)setPhoto(data?.signedUrl||'');});return()=>{active=false;};},[report.photo_path]);return <div className="modal-backdrop" onClick={onClose}><div className="modal-card" onClick={e=>e.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">{shortId(report.id)}</span><h2>Detail laporan</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></div><div className="modal-body"><span className={`status-badge ${status.className}`}><span/>{status.label}</span><DetailLine label="Kategori" value={report.category}/><DetailLine label="Lokasi" value={report.location}/><DetailLine label="Waktu laporan" value={formatDate(report.created_at)}/><DetailLine label="Waktu kejadian" value={formatDate(report.incident_time)}/><div className="detail-block"><b>Deskripsi</b><p>{report.description}</p></div>{report.latitude&&report.longitude&&<a className="text-link" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=17/${report.latitude}/${report.longitude}`}><MapPin size={15}/> Buka lokasi di OpenStreetMap <ArrowRight size={14}/></a>}{photo&&<img className="detail-photo" src={photo} alt="Foto pendukung laporan"/>}{report.admin_note&&<div className="admin-note"><b><MessageSquareText size={15}/> Catatan admin</b><p>{report.admin_note}</p></div>}<p className="small-muted">Status merupakan informasi proses administrasi dan tidak otomatis membuktikan pelanggaran.</p></div><div className="modal-footer"><button className="button button-secondary" onClick={onClose}>Tutup</button></div></div></div>;}
function DetailLine({label,value}) {return <div className="detail-line"><span>{label}</span><b>{value||'—'}</b></div>;}

function AdminPage({profile}) {
  const [reports,setReports]=useState([]);const [loading,setLoading]=useState(true);const [filter,setFilter]=useState('all');const [search,setSearch]=useState('');const [selected,setSelected]=useState(null);const [status,setStatus]=useState('reviewing');const [note,setNote]=useState('');const [saving,setSaving]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
  const refresh=useCallback(async()=>{setLoading(true);const {data,error:err}=await supabase.from('reports').select('id,user_id,category,description,location,status,created_at,incident_time,photo_path,admin_note,latitude,longitude,profiles(full_name)').order('created_at',{ascending:false}).limit(500);if(err)setError(err.message);else setReports(data||[]);setLoading(false);},[]);
  useEffect(()=>{refresh();},[refresh]);
  const counts=useMemo(()=>({total:reports.length,pending:reports.filter(r=>r.status==='pending').length,reviewing:reports.filter(r=>r.status==='reviewing').length,action:reports.filter(r=>['forwarded','in_progress'].includes(r.status)).length}),[reports]);
  const visible=useMemo(()=>reports.filter(r=>(filter==='all'||r.status===filter)&&`${r.category} ${r.location} ${shortId(r.id)} ${r.profiles?.full_name||''}`.toLowerCase().includes(search.toLowerCase())),[reports,filter,search]);
  function openReport(r){setSelected(r);setStatus(r.status);setNote(r.admin_note||'');setMessage('');setError('');}
  async function saveReview(e){e.preventDefault();if(!selected)return;setSaving(true);setMessage('');setError('');try{const {error:err}=await supabase.rpc('admin_update_report_status',{p_report_id:selected.id,p_status:status,p_admin_note:note.trim()||null});if(err)throw err;setMessage('Status laporan berhasil diperbarui.');await refresh();setSelected(null);}catch(err){setError(err.message||'Gagal memperbarui status.');}finally{setSaving(false);}}
  return <><PageTitle eyebrow="PUSAT KENDALI" title="Dashboard admin" subtitle="Verifikasi laporan masuk, catat keputusan, dan perbarui tindak lanjut."/><div className="admin-stats"><StatCard icon={<FileCheck2 size={19}/>} label="Total laporan" value={counts.total} tone="blue" foot="Semua laporan"/><StatCard icon={<Clock3 size={19}/>} label="Menunggu verifikasi" value={counts.pending} tone="orange" foot="Perlu diperiksa"/><StatCard icon={<ShieldCheck size={19}/>} label="Sedang diverifikasi" value={counts.reviewing} tone="purple" foot="Dalam pemeriksaan"/><StatCard icon={<ArrowDownToLine size={19}/>} label="Diteruskan / tindak lanjut" value={counts.action} tone="green" foot="Memerlukan pemantauan"/></div><section className="content-card table-card"><div className="card-heading"><div><h3>Manajemen laporan</h3><p>Pilih laporan untuk memeriksa detail dan menentukan status.</p></div><button className="button button-secondary button-sm" onClick={refresh}><SlidersHorizontal size={15}/> Segarkan</button></div><div className="filter-toolbar admin-filter"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari ID, pelapor, kategori, lokasi…"/></div><div className="filter-select"><Filter size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Semua status</option>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select><ChevronDown size={15}/></div></div>{error&&!selected&&<div className="notice notice-error"><AlertCircle size={17}/>{error}</div>}{loading?<LoadingRows/>:visible.length===0?<EmptyState title="Tidak ada laporan" text="Laporan yang sesuai pencarian atau filter akan muncul di sini."/>:<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ID / Tanggal</th><th>Pelapor</th><th>Kategori</th><th>Lokasi</th><th>Status</th><th></th></tr></thead><tbody>{visible.map(r=><tr key={r.id}><td><b>{shortId(r.id)}</b><small>{formatDate(r.created_at)}</small></td><td>{r.profiles?.full_name||'Pengguna'}</td><td>{r.category}</td><td className="location-cell">{r.location}</td><td><StatusBadge status={r.status}/></td><td><button className="button button-secondary button-sm" onClick={()=>openReport(r)}>Periksa <ArrowRight size={14}/></button></td></tr>)}</tbody></table></div>}</section>{selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="modal-card admin-modal" onClick={e=>e.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">VERIFIKASI · {shortId(selected.id)}</span><h2>Periksa laporan</h2></div><button className="icon-button" onClick={()=>setSelected(null)}><X size={19}/></button></div><form onSubmit={saveReview}><div className="modal-body"><div className="report-byline"><div className="avatar">{(selected.profiles?.full_name||'P').slice(0,1).toUpperCase()}</div><div><b>{selected.profiles?.full_name||'Pengguna'}</b><small>{formatDate(selected.created_at)}</small></div><StatusBadge status={selected.status}/></div><DetailLine label="Kategori" value={selected.category}/><DetailLine label="Lokasi" value={selected.location}/><DetailLine label="Waktu kejadian" value={formatDate(selected.incident_time)}/><div className="detail-block"><b>Deskripsi pelapor</b><p>{selected.description}</p></div>{selected.latitude&&selected.longitude&&<a className="text-link" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}><MapPin size={15}/> Lihat koordinat di peta <ArrowRight size={14}/></a>}<AdminPhoto path={selected.photo_path}/><div className="review-divider"/><Field label="Keputusan / status" required><select value={status} onChange={e=>setStatus(e.target.value)} required>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field><Field label="Catatan verifikasi" hint="Wajib diisi jika laporan ditolak atau perlu perbaikan. Jelaskan alasan dengan sopan."><textarea rows="3" value={note} onChange={e=>setNote(e.target.value)} maxLength={2000} placeholder="Contoh: Mohon tambahkan patokan lokasi agar kejadian dapat diperiksa…"/></Field>{['rejected','revision'].includes(status)&&!note.trim()&&<div className="notice notice-info"><Info size={16}/> Status ini memerlukan catatan alasan.</div>}{error&&<div className="notice notice-error"><AlertCircle size={17}/>{error}</div>}{message&&<div className="notice notice-success"><CheckCircle2 size={17}/>{message}</div>}<div className="disclaimer compact-disclaimer"><Info size={16}/><p>Verifikasi aplikasi bukan penetapan kesalahan hukum. Teruskan informasi melalui prosedur resmi jika diperlukan.</p></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={()=>setSelected(null)}>Batal</button><button disabled={saving||(['rejected','revision'].includes(status)&&!note.trim())} className="button button-primary" type="submit">{saving?'Menyimpan…':'Simpan keputusan'} <Check size={16}/></button></div></form></div></div>}</>;
}
function AdminPhoto({path}) {const [url,setUrl]=useState('');useEffect(()=>{let active=true;if(path)supabase.storage.from('report-photos').createSignedUrl(path,60).then(({data})=>{if(active)setUrl(data?.signedUrl||'');});return()=>{active=false;};},[path]);return url?<div className="admin-photo-wrap"><b>Foto pendukung</b><a href={url} target="_blank" rel="noreferrer"><img className="detail-photo" src={url} alt="Foto pendukung laporan"/></a></div>:null;}
function StatusBadge({status}) {const s=STATUS[status]||STATUS.pending;return <span className={`status-badge ${s.className}`}><span/>{s.label}</span>;}
function ReportTable({reports}) {return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ID / Tanggal</th><th>Kategori</th><th>Lokasi</th><th>Status</th></tr></thead><tbody>{reports.map(r=><tr key={r.id}><td><b>{shortId(r.id)}</b><small>{formatDate(r.created_at)}</small></td><td>{r.category}</td><td className="location-cell">{r.location}</td><td><StatusBadge status={r.status}/></td></tr>)}</tbody></table></div>;}
function LoadingRows() {return <div className="loading-rows"><div/><div/><div/></div>;}
function EmptyState({title,text}) {return <div className="empty-state"><div className="empty-icon"><Search size={23}/></div><h3>{title}</h3><p>{text}</p></div>;}
function NotFound() {return <div className="center-state"><div className="empty-icon"><AlertCircle size={25}/></div><h2>Halaman tidak ditemukan</h2><p>Halaman yang Anda cari tidak tersedia.</p><Link to="/" className="button button-primary">Kembali ke beranda</Link></div>;}

export default App;