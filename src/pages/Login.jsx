import { useEffect, useMemo, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  LockKeyhole,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  BrainCircuit,
  Lock,
  Activity,
  QrCode,
  Users,
  TrendingUp,
  Zap,
  Award,
} from "lucide-react";

import { auth, db } from "../config/firebase";
import ErrorAlert from "../components/Common/ErrorAlert";

/* ─── tiny motion helpers (no framer needed on this page) ─── */
const pulse = `@keyframes hv-pulse { 0%,100%{opacity:.7} 50%{opacity:1} }`;
const floatA = `@keyframes hv-float-a { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-22px) translateX(12px)} }`;
const floatB = `@keyframes hv-float-b { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(18px) translateX(-14px)} }`;
const floatC = `@keyframes hv-float-c { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-10px) scale(1.06)} }`;
const shimmer = `@keyframes hv-shimmer { 0%{opacity:0;transform:translateX(-100%)} 60%{opacity:.5} 100%{opacity:0;transform:translateX(200%)} }`;
const spin = `@keyframes hv-spin { to{transform:rotate(360deg)} }`;
const fadeUp = `@keyframes hv-fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`;
const scanLine = `@keyframes hv-scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }`;

const stats = [
  { value: "10K+", label: "Verified Staff",   icon: Users },
  { value: "99.9%", label: "Uptime",           icon: TrendingUp },
  { value: "<2s",   label: "Verification",     icon: Zap },
  { value: "50+",   label: "Hospitals",        icon: Award },
];

const features = [
  { icon: ShieldCheck,  title: "Protected",  desc: "Admin-only routes" },
  { icon: Activity,     title: "Live",        desc: "Firestore data" },
  { icon: Lock,         title: "Secure",      desc: "Firebase auth" },
  { icon: BrainCircuit, title: "AI-Powered",  desc: "Smart verification" },
];

export default function Login() {
  const [email, setEmail] = useState(
    localStorage.getItem("rememberedEmail") || ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(
    Boolean(localStorage.getItem("rememberedEmail"))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    setMounted(true);
    if (rememberEmail && email.trim()) {
      localStorage.setItem("rememberedEmail", email.trim());
    }
    if (!rememberEmail) {
      localStorage.removeItem("rememberedEmail");
    }
  }, [email, rememberEmail]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) { navigate("/pending", { replace: true }); return; }
      const data = snap.data();
      const role = String(data.role || "").toLowerCase();
      const approved = data.approved === true || data.status === "approved" || data.status === "verified";
      const rejected = data.rejected === true || data.status === "rejected";
      if (rejected) { navigate("/rejected", { replace: true }); return; }
      if (role === "admin") { navigate("/admin/dashboard", { replace: true }); return; }
      navigate("/pending", { replace: true });
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found") setError("No account was found with this email.");
      else if (err.code === "auth/wrong-password") setError("Incorrect password. Please try again.");
      else if (err.code === "auth/invalid-email") setError("Please enter a valid email address.");
      else if (err.code === "auth/too-many-requests") setError("Too many login attempts. Please try again later.");
      else setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setEmail(""); setPassword(""); setError("");
    localStorage.removeItem("rememberedEmail");
    setRememberEmail(false);
  };

  const handleDemoFill = () => {
    setEmail("admin@healthverify.com");
    setPassword("");
    setError("Put your real Firebase admin password, then click Login.");
  };

  return (
    <main style={{
      position: "relative", width: "100%", minHeight: "100vh",
      background: "#020617", color: "#fff",
      overflowX: "hidden", fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        ${pulse} ${floatA} ${floatB} ${floatC} ${shimmer} ${spin} ${fadeUp} ${scanLine}
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #fff;
          -webkit-box-shadow: 0 0 0 1000px rgba(255,255,255,0.04) inset;
          transition: background-color 9999s;
        }
        .lv-fade-up { animation: hv-fade-up .55s cubic-bezier(.22,1,.36,1) both; }
        .lv-fade-up-1 { animation: hv-fade-up .55s .08s cubic-bezier(.22,1,.36,1) both; }
        .lv-fade-up-2 { animation: hv-fade-up .55s .16s cubic-bezier(.22,1,.36,1) both; }
        .lv-fade-up-3 { animation: hv-fade-up .55s .24s cubic-bezier(.22,1,.36,1) both; }
        .lv-fade-up-4 { animation: hv-fade-up .55s .32s cubic-bezier(.22,1,.36,1) both; }
        .lv-fade-up-5 { animation: hv-fade-up .55s .40s cubic-bezier(.22,1,.36,1) both; }
        .lv-fade-up-6 { animation: hv-fade-up .55s .48s cubic-bezier(.22,1,.36,1) both; }
        .lv-field:focus-within { border-color: rgba(59,130,246,.45) !important; box-shadow: 0 0 0 3px rgba(59,130,246,.10); }
        .lv-submit:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 8px 32px rgba(59,130,246,.35); }
        .lv-submit:active:not(:disabled) { transform: scale(.98); }
        .lv-submit:disabled { opacity:.6; cursor:not-allowed; }
        .lv-feat-card:hover { background: rgba(255,255,255,.06) !important; transform: translateY(-2px); border-color: rgba(255,255,255,.12) !important; }
        .lv-stat:hover { background: rgba(255,255,255,.06) !important; }
        .lv-icon-btn:hover { background: rgba(255,255,255,.08) !important; }
        .lv-back:hover { background: rgba(255,255,255,.06) !important; color: #fff; }
        .lv-shimmer::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.06) 50%, transparent 60%);
          animation: hv-shimmer 3.5s ease-in-out infinite;
        }
      `}</style>

      {/* ── BACKGROUND ── */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
        {/* base radial – same as home */}
        <div style={{
          position:"absolute", inset:0,
          background:"radial-gradient(circle at top right,rgba(59,130,246,.22),transparent 34%), radial-gradient(circle at bottom left,rgba(16,185,129,.18),transparent 34%), radial-gradient(circle at center,rgba(139,92,246,.10),transparent 45%)"
        }} />
        {/* animated blobs */}
        <div style={{ position:"absolute", top:"-8%", right:"-4%", width:520, height:520, background:"rgba(37,99,235,.12)", borderRadius:"50%", filter:"blur(120px)", animation:"hv-float-a 18s ease-in-out infinite" }} />
        <div style={{ position:"absolute", bottom:"-8%", left:"-4%", width:520, height:520, background:"rgba(16,185,129,.10)", borderRadius:"50%", filter:"blur(120px)", animation:"hv-float-b 22s ease-in-out infinite" }} />
        <div style={{ position:"absolute", top:"40%", left:"42%", width:400, height:400, background:"rgba(99,102,241,.08)", borderRadius:"50%", filter:"blur(100px)", animation:"hv-float-c 16s ease-in-out infinite" }} />
        {/* top line */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(96,165,250,.3),transparent)" }} />
      </div>

      {/* ── GRID ── */}
      <div style={{
        position:"relative", zIndex:1, width:"100%", minHeight:"100vh",
        display:"grid",
        gridTemplateColumns:"minmax(0,1fr)",
      }}>

        {/* ════════════════════════════ LEFT PANEL ════════════════════════════ */}
        <div style={{
          display:"none",
          // shown via media query below — we'll use inline style override via a wrapper
        }} className="lv-left-panel">
        </div>

        {/* We need real xl layout — use a flex row wrapper */}
        <div style={{
          position:"relative", zIndex:1, width:"100%", minHeight:"100vh",
          display:"flex", flexDirection:"row",
        }}>

          {/* LEFT — hero panel */}
          <div className="lv-left" style={{
            flex:1, minHeight:"100vh", display:"flex", flexDirection:"column",
            justifyContent:"space-between",
            padding:"36px 48px",
            borderRight:"1px solid rgba(255,255,255,.06)",
            overflow:"hidden",
          }}>

            {/* logo */}
            <Link to="/" className="lv-fade-up" style={{
              display:"inline-flex", alignItems:"center", gap:12,
              textDecoration:"none", color:"inherit", width:"fit-content",
            }}>
              <div style={{
                width:44, height:44, borderRadius:14,
                background:"linear-gradient(135deg,#3b82f6,#10b981)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 20px rgba(59,130,246,.3)",
              }}>
                <Stethoscope size={22} />
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:17, letterSpacing:"-.3px" }}>HealthVerify</div>
                <div style={{ fontSize:10, color:"#64748b", fontWeight:500, letterSpacing:"1.2px", textTransform:"uppercase" }}>AI Healthcare Verification</div>
              </div>
            </Link>

            {/* centre hero */}
            <div style={{ maxWidth:700 }}>

              {/* badge */}
              <div className="lv-fade-up-1" style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"6px 14px", borderRadius:999,
                background:"rgba(59,130,246,.1)", border:"1px solid rgba(59,130,246,.25)",
                color:"#93c5fd", fontSize:12, fontWeight:500,
                marginBottom:32,
              }}>
                <Sparkles size={13} />
                Secure professional healthcare platform
              </div>

              {/* heading */}
              <div className="lv-fade-up-2">
                <h2 style={{
                  fontSize:"clamp(2rem,4vw,3.5rem)", fontWeight:800,
                  lineHeight:1.08, letterSpacing:"-.5px",
                  marginBottom:20,
                }}>
                  Secure Admin Access
                  <span style={{
                    display:"block",
                    background:"linear-gradient(135deg,#60a5fa,#34d399)",
                    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                    marginTop:4,
                  }}>
                    for Healthcare Verification
                  </span>
                </h2>
              </div>

              <p className="lv-fade-up-3" style={{
                fontSize:15, color:"#94a3b8", lineHeight:1.75,
                maxWidth:560, marginBottom:44,
              }}>
                Login to manage doctors, nurses, pharmacists, documents, approval
                status, reports, and healthcare verification workflows.
              </p>

              {/* stats row */}
              <div className="lv-fade-up-4" style={{
                display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:32,
              }}>
                {stats.map(({ value, label, icon: Icon }) => (
                  <div key={label} className="lv-stat" style={{
                    background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)",
                    borderRadius:16, padding:"14px 16px",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                    transition:"background .2s",
                  }}>
                    <div style={{
                      width:32, height:32, borderRadius:10,
                      background:"rgba(59,130,246,.1)", border:"1px solid rgba(59,130,246,.2)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#60a5fa",
                    }}>
                      <Icon size={14} />
                    </div>
                    <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-.5px" }}>{value}</div>
                    <div style={{ fontSize:10, color:"#64748b", fontWeight:500, textAlign:"center" }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* feature cards */}
              <div className="lv-fade-up-5" style={{
                display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12,
              }}>
                {features.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="lv-feat-card" style={{
                    background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)",
                    borderRadius:16, padding:"16px 18px",
                    display:"flex", alignItems:"center", gap:12,
                    cursor:"default", transition:"all .2s",
                  }}>
                    <div style={{
                      width:36, height:36, borderRadius:10, flexShrink:0,
                      background:"rgba(16,185,129,.1)", border:"1px solid rgba(16,185,129,.2)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#34d399",
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{title}</div>
                      <div style={{ fontSize:12, color:"#64748b", marginTop:1 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* footer */}
            <div className="lv-fade-up-6" style={{ fontSize:12, color:"#334155" }}>
              © {currentYear} HealthVerify System
            </div>
          </div>

          {/* RIGHT — form panel */}
          <div style={{
            width:"min(100%,520px)", minHeight:"100vh",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"32px 24px",
            flexShrink:0,
          }}>
            <div style={{ width:"100%", maxWidth:460 }}>

              {/* mobile logo */}
              <div className="lv-mobile-logo lv-fade-up" style={{
                display:"none", justifyContent:"center", marginBottom:32,
              }}>
                <Link to="/" style={{ display:"inline-flex", alignItems:"center", gap:12, textDecoration:"none", color:"inherit" }}>
                  <div style={{
                    width:44, height:44, borderRadius:14,
                    background:"linear-gradient(135deg,#3b82f6,#10b981)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:17 }}>HealthVerify</div>
                    <div style={{ fontSize:10, color:"#64748b", fontWeight:500, letterSpacing:"1.2px", textTransform:"uppercase" }}>AI Healthcare Verification</div>
                  </div>
                </Link>
              </div>

              {/* CARD */}
              <div className="lv-fade-up lv-shimmer" style={{
                background:"rgba(15,23,42,.85)",
                backdropFilter:"blur(24px)",
                border:"1px solid rgba(255,255,255,.09)",
                borderRadius:28,
                padding:"36px 32px",
                boxShadow:"0 24px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05)",
                position:"relative", overflow:"hidden",
              }}>

                {/* card inner top glow */}
                <div style={{
                  position:"absolute", top:-60, left:"50%", transform:"translateX(-50%)",
                  width:300, height:120,
                  background:"radial-gradient(ellipse,rgba(59,130,246,.15),transparent 70%)",
                  pointerEvents:"none",
                }} />

                {/* top row */}
                <div className="lv-fade-up-1" style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  marginBottom:28,
                }}>
                  <Link
                    to="/"
                    className="lv-icon-btn"
                    title="Back home"
                    style={{
                      width:40, height:40, borderRadius:12,
                      border:"1px solid rgba(255,255,255,.09)",
                      background:"rgba(255,255,255,.03)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#94a3b8", textDecoration:"none",
                      transition:"all .2s",
                    }}
                  >
                    <Home size={17} />
                  </Link>

                  {/* shield icon — animated ring */}
                  <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div style={{
                      position:"absolute", width:72, height:72, borderRadius:"50%",
                      border:"1px solid rgba(59,130,246,.25)",
                      animation:"hv-pulse 3s ease-in-out infinite",
                    }} />
                    <div style={{
                      position:"absolute", width:84, height:84, borderRadius:"50%",
                      border:"1px solid rgba(59,130,246,.12)",
                      animation:"hv-pulse 3s .5s ease-in-out infinite",
                    }} />
                    <div style={{
                      width:60, height:60, borderRadius:18,
                      background:"linear-gradient(135deg,rgba(59,130,246,.15),rgba(16,185,129,.1))",
                      border:"1px solid rgba(59,130,246,.3)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#60a5fa",
                      boxShadow:"0 0 24px rgba(59,130,246,.2)",
                    }}>
                      <ShieldCheck size={28} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="lv-icon-btn"
                    title="Clear form"
                    style={{
                      width:40, height:40, borderRadius:12,
                      border:"1px solid rgba(255,255,255,.09)",
                      background:"rgba(255,255,255,.03)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#94a3b8", cursor:"pointer",
                      transition:"all .2s",
                    }}
                  >
                    <RotateCcw size={17} />
                  </button>
                </div>

                {/* heading */}
                <div className="lv-fade-up-2" style={{ textAlign:"center", marginBottom:28 }}>
                  <h2 style={{
                    fontSize:28, fontWeight:800, letterSpacing:"-.5px",
                    marginBottom:6,
                  }}>
                    Welcome Back
                  </h2>
                  <p style={{ fontSize:13, color:"#64748b" }}>
                    Sign in to your HealthVerify admin account.
                  </p>
                </div>

                {/* error */}
                {error && (
                  <div style={{ marginBottom:20 }}>
                    <ErrorAlert message={error} onClose={() => setError("")} autoClose={false} />
                  </div>
                )}

                {/* FORM */}
                <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:16 }}>

                  {/* email */}
                  <div className="lv-fade-up-3">
                    <label style={{ fontSize:12, color:"#64748b", fontWeight:600, letterSpacing:".4px", textTransform:"uppercase", display:"block", marginBottom:8 }}>
                      Email Address
                    </label>
                    <div className="lv-field" style={{
                      height:50, borderRadius:14,
                      background:"rgba(255,255,255,.04)",
                      border:"1px solid rgba(255,255,255,.08)",
                      padding:"0 16px",
                      display:"flex", alignItems:"center", gap:10,
                      transition:"border-color .2s, box-shadow .2s",
                    }}>
                      <Mail size={16} color="#475569" style={{ flexShrink:0 }} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="admin@healthverify.com"
                        autoComplete="email"
                        style={{
                          background:"transparent", border:"none", outline:"none",
                          color:"#fff", width:"100%", fontSize:14,
                        }}
                      />
                    </div>
                  </div>

                  {/* password */}
                  <div className="lv-fade-up-4">
                    <label style={{ fontSize:12, color:"#64748b", fontWeight:600, letterSpacing:".4px", textTransform:"uppercase", display:"block", marginBottom:8 }}>
                      Password
                    </label>
                    <div className="lv-field" style={{
                      height:50, borderRadius:14,
                      background:"rgba(255,255,255,.04)",
                      border:"1px solid rgba(255,255,255,.08)",
                      padding:"0 16px",
                      display:"flex", alignItems:"center", gap:10,
                      transition:"border-color .2s, box-shadow .2s",
                    }}>
                      <LockKeyhole size={16} color="#475569" style={{ flexShrink:0 }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        style={{
                          background:"transparent", border:"none", outline:"none",
                          color:"#fff", width:"100%", fontSize:14, flex:1,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        title={showPassword ? "Hide" : "Show"}
                        style={{
                          background:"none", border:"none", cursor:"pointer",
                          color:"#475569", display:"flex", padding:0, flexShrink:0,
                          transition:"color .15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.color="#94a3b8"}
                        onMouseLeave={e => e.currentTarget.style.color="#475569"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* remember + demo */}
                  <div className="lv-fade-up-5" style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    flexWrap:"wrap", gap:8,
                  }}>
                    <button
                      type="button"
                      onClick={() => setRememberEmail(p => !p)}
                      style={{
                        display:"flex", alignItems:"center", gap:8,
                        background:"none", border:"none", cursor:"pointer",
                        color:"#64748b", fontSize:13, padding:0,
                        transition:"color .15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color="#94a3b8"}
                      onMouseLeave={e => e.currentTarget.style.color="#64748b"}
                    >
                      <span style={{
                        width:18, height:18, borderRadius:5,
                        border:`1px solid ${rememberEmail ? "#3b82f6" : "rgba(255,255,255,.15)"}`,
                        background: rememberEmail ? "#3b82f6" : "rgba(255,255,255,.04)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        flexShrink:0, transition:"all .2s",
                      }}>
                        {rememberEmail && <CheckCircle2 size={12} color="#fff" />}
                      </span>
                      Remember email
                    </button>

                    <button
                      type="button"
                      onClick={handleDemoFill}
                      style={{
                        background:"none", border:"none", cursor:"pointer",
                        color:"#3b82f6", fontSize:13, fontWeight:600, padding:0,
                        transition:"color .15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color="#60a5fa"}
                      onMouseLeave={e => e.currentTarget.style.color="#3b82f6"}
                    >
                      Demo admin
                    </button>
                  </div>

                  {/* submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="lv-submit lv-fade-up-6"
                    style={{
                      height:52, borderRadius:14, border:"none", cursor:"pointer",
                      background:"linear-gradient(135deg,#3b82f6,#10b981)",
                      color:"#fff", fontWeight:700, fontSize:15,
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      transition:"all .22s cubic-bezier(.22,1,.36,1)",
                      boxShadow:"0 4px 20px rgba(59,130,246,.25)",
                      marginTop:4,
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{
                          width:18, height:18,
                          border:"2px solid rgba(255,255,255,.3)",
                          borderTopColor:"#fff", borderRadius:"50%",
                          animation:"hv-spin .7s linear infinite",
                        }} />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Login
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>

                {/* divider + note */}
                <div style={{
                  marginTop:24, paddingTop:20,
                  borderTop:"1px solid rgba(255,255,255,.06)",
                }}>
                  <div style={{
                    display:"flex", alignItems:"flex-start", gap:10,
                    background:"rgba(59,130,246,.05)",
                    border:"1px solid rgba(59,130,246,.12)",
                    borderRadius:12, padding:"12px 14px",
                  }}>
                    <ShieldCheck size={14} color="#3b82f6" style={{ flexShrink:0, marginTop:1 }} />
                    <p style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>
                      Only approved administrators can access the dashboard.
                      Doctors, nurses, and pharmacists are redirected to their
                      verification status page.
                    </p>
                  </div>
                </div>

                {/* mobile footer */}
                <p className="lv-mobile-footer" style={{
                  marginTop:24, textAlign:"center", fontSize:12, color:"#334155",
                  display:"none",
                }}>
                  © {currentYear} HealthVerify System
                </p>
              </div>
            </div>
          </div>

        </div>{/* end flex row */}
      </div>

      {/* ── RESPONSIVE ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .lv-left { display: flex !important; }

        @media (max-width: 1023px) {
          .lv-left { display: none !important; }
          .lv-mobile-logo { display: flex !important; }
          .lv-mobile-footer { display: block !important; }
        }

        @media (max-width: 600px) {
          .lv-left { display: none !important; }
        }
      `}</style>
    </main>
  );
}

/* FeatureBox kept for backward compat (unused in new layout but still exported) */
function FeatureBox({ title, text }) {
  return (
    <div style={{
      minHeight:120, borderRadius:24,
      border:"1px solid rgba(255,255,255,.1)",
      background:"rgba(255,255,255,.05)",
      padding:"20px 24px",
      display:"flex", flexDirection:"column", justifyContent:"center",
      transition:"background .2s",
    }}
    onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.08)"}
    onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.05)"}
    >
      <h3 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>{title}</h3>
      <p style={{ fontSize:13, color:"#64748b" }}>{text}</p>
    </div>
  );
}

function InputField({ label, icon, ...props }) {
  return (
    <div>
      <label style={{ fontSize:12, color:"#64748b", fontWeight:600, letterSpacing:".4px", textTransform:"uppercase", display:"block", marginBottom:8 }}>
        {label}
      </label>
      <div style={{
        height:50, borderRadius:14,
        background:"rgba(255,255,255,.04)",
        border:"1px solid rgba(255,255,255,.08)",
        padding:"0 16px",
        display:"flex", alignItems:"center", gap:10,
      }}>
        <span style={{ color:"#475569", flexShrink:0 }}>{icon}</span>
        <input
          {...props}
          style={{
            background:"transparent", border:"none", outline:"none",
            color:"#fff", width:"100%", fontSize:14,
          }}
        />
      </div>
    </div>
  );
}