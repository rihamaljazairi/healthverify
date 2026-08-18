import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ShieldCheck,
  Stethoscope,
  Activity,
  FileText,
  Smartphone,
  Users,
  TrendingUp,
  Zap,
  Award,
  Menu,
  X,
  Lock,
  BrainCircuit,
  QrCode,
  BarChart3,
  CheckCircle2,
  Star,
  Building2,
  ArrowRight,
  PlayCircle,
  ChevronDown,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Motion presets
───────────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay: d, ease },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (d = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, delay: d, ease },
  }),
};

const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: (d = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, delay: d, ease },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

/* ─────────────────────────────────────────────
   ECG pulse path — the brand signature
───────────────────────────────────────────── */
function EcgLine({ className = "" }) {
  return (
    <svg
      viewBox="0 0 900 80"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ecg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1D6EFF" stopOpacity="0" />
          <stop offset="30%" stopColor="#1D6EFF" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#00E5C3" stopOpacity="1" />
          <stop offset="100%" stopColor="#00E5C3" stopOpacity="0" />
        </linearGradient>
        <filter id="ecg-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d="M0,40 L120,40 L145,40 L155,15 L165,65 L175,10 L185,70 L195,40 L220,40 L350,40 L375,40 L385,20 L395,60 L405,10 L415,68 L425,40 L450,40 L580,40 L605,40 L615,18 L625,62 L635,8 L645,70 L655,40 L680,40 L900,40"
        fill="none"
        stroke="url(#ecg-grad)"
        strokeWidth="2.5"
        filter="url(#ecg-glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.4, ease: "easeInOut", delay: 0.6 }}
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Layout primitives
───────────────────────────────────────────── */
function Container({ children, className = "" }) {
  return (
    <div className={`hv-container ${className}`.trim()}>{children}</div>
  );
}

function Section({ id, alt = false, children, className = "" }) {
  return (
    <section
      id={id}
      className={`hv-section ${alt ? "hv-section-alt" : ""} scroll-mt-24 ${className}`.trim()}
    >
      {children}
    </section>
  );
}

/* ─────────────────────────────────────────────
   UI atoms
───────────────────────────────────────────── */
function Badge({ children, variant = "blue", icon: Icon, pulse = false, motionProps = {} }) {
  const { className: mCls = "", ...restMP } = motionProps;
  return (
    <motion.div
      {...restMP}
      className={`hv-badge ${variant === "teal" ? "hv-badge-teal" : "hv-badge-blue"} ${mCls}`.trim()}
    >
      {Icon && (
        pulse ? (
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex"
          >
            <Icon size={13} />
          </motion.span>
        ) : <Icon size={13} />
      )}
      {children}
    </motion.div>
  );
}

function IconBox({ children, teal = false, className = "" }) {
  return (
    <div className={`hv-icon-box ${teal ? "hv-icon-box-teal" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}

function ProCard({ children, className = "", interactive = true, ...props }) {
  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <motion.div
      className={`hv-card ${interactive ? "hv-card-interactive" : ""} ${className}`.trim()}
      onMouseMove={interactive ? handleMove : undefined}
      {...props}
    >
      {interactive && <div className="hv-card-shine" aria-hidden />}
      {children}
    </motion.div>
  );
}

function NavBtn({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="hv-nav-link">
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────── */
function AnimatedStat({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const m = value.match(/^([<>]?)(\d+(?:\.\d+)?)(.*)$/);
  const [display, setDisplay] = useState(m ? `${m[1]}0${m[3]}` : value);

  useEffect(() => {
    if (!inView) return;
    const vm = value.match(/^([<>]?)(\d+(?:\.\d+)?)(.*)$/);
    if (!vm) { setDisplay(value); return; }
    const [, pre, numStr, suf] = vm;
    const target = parseFloat(numStr);
    const dec = numStr.includes(".");
    const dur = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const e2 = 1 - Math.pow(1 - p, 3);
      const cur = target * e2;
      setDisplay(`${pre}${dec ? cur.toFixed(1) : Math.round(cur)}${suf}`);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <motion.h3
      ref={ref}
      className="hv-stat-value"
      initial={{ opacity: 0, scale: 0.75 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.55, ease }}
    >
      {display}
    </motion.h3>
  );
}

/* ─────────────────────────────────────────────
   Section header
───────────────────────────────────────────── */
function SectionHeader({ badge, title, desc, teal = false }) {
  return (
    <motion.div
      className="hv-section-header"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={stagger}
    >
      <Badge
        icon={ShieldCheck}
        variant={teal ? "teal" : "blue"}
        motionProps={{ variants: fadeUp, custom: 0, className: "mb-5" }}
      >
        {badge}
      </Badge>
      <motion.h2 variants={fadeUp} custom={0.08} className="hv-heading text-3xl lg:text-5xl mb-5">
        {title}
      </motion.h2>
      <motion.p variants={fadeUp} custom={0.16} className="hv-section-desc">
        {desc}
      </motion.p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Hero sub-components
───────────────────────────────────────────── */
function HeroMiniCard({ label, value, delay = 0 }) {
  return (
    <motion.div variants={scaleIn} custom={delay} whileHover={{ scale: 1.04 }} className="hv-mini-stat">
      <p className="text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-widest">{label}</p>
      <p className="hv-heading text-base text-white">{value}</p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Security items
───────────────────────────────────────────── */
function SecurityItem({ text, delay = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      whileHover={{ x: 8, transition: { duration: 0.2 } }}
      className="hv-security-item"
    >
      <IconBox teal className="w-9 h-9 rounded-[10px] shrink-0">
        <CheckCircle2 size={15} />
      </IconBox>
      <span className="text-slate-300 text-sm">{text}</span>
    </motion.div>
  );
}

function SecurityBox({ title, value, delay = 0 }) {
  return (
    <motion.div
      variants={scaleIn}
      custom={delay}
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
      className="hv-security-box"
    >
      <p className="text-[10px] text-slate-500 mb-2 font-semibold uppercase tracking-widest">{title}</p>
      <h3 className="hv-heading text-xl text-white">{value}</h3>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  useEffect(() => {
    setLoaded(true);
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);
  const scrollTo = (id) => { closeMobile(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };

  const stats = [
    { value: "10K+", label: "Verified Staff", icon: Users },
    { value: "99.9%", label: "Uptime", icon: TrendingUp },
    { value: "<2s", label: "Avg Verify Time", icon: Zap },
    { value: "50+", label: "Hospitals", icon: Award },
  ];

  const features = [
    { icon: BrainCircuit, title: "AI Face Recognition", desc: "Biometric comparison between live selfie and submitted ID — flags discrepancies before admin review." },
    { icon: QrCode, title: "QR Instant Verify", desc: "Every cleared staff member receives a tamper-evident digital badge, scannable by any device." },
    { icon: BarChart3, title: "Real-time Analytics", desc: "Live approval funnels, rejection trends, role distribution, and verification velocity — all in one view." },
    { icon: Lock, title: "Secure Admin Control", desc: "Protected routes, role-based permissions, and Firestore security rules built in from day one." },
  ];

  const steps = [
    { number: "01", icon: FileText, title: "Register & Upload", desc: "Staff submit credentials, license documents, ID scan, and a live photo for identity anchoring." },
    { number: "02", icon: BrainCircuit, title: "AI Pre-screening", desc: "Automated checks flag mismatches in facial data and document authenticity before human review." },
    { number: "03", icon: ShieldCheck, title: "Admin Decision", desc: "Reviewers approve, reject, or request additional documents from a purpose-built operations dashboard." },
    { number: "04", icon: Smartphone, title: "Badge Issued", desc: "Verified staff receive a live QR profile link — publicly scannable, always up to date." },
  ];

  const testimonials = [
    { name: "Hospital Admin", role: "Verification Manager", text: "HealthVerify cut our manual review time by 70%. The dashboard gives instant visibility across every pending application." },
    { name: "Medical Supervisor", role: "Doctor Review Lead", text: "Having AI pre-screening before staff reach my queue means I only review cases that genuinely need human judgment." },
    { name: "Security Officer", role: "Access Control", text: "The QR badge system closed a real gap. One scan tells us everything we need to know at the door." },
  ];

  return (
    <div className={`hv-root ${loaded ? "hv-loaded" : ""}`}>

      {/* ── Global background ── */}
      <div className="hv-bg-canvas">
        <div className="hv-bg-mesh" />
        <div className="hv-bg-grid" />
      </div>

      {/* ── Scroll progress bar ── */}
      <motion.div
        className="hv-progress-bar"
        style={{ scaleX: scrollYProgress }}
      />

      {/* ── Ambient orbs ── */}
      <div className="hv-orbs" aria-hidden>
        <motion.div
          className="hv-orb hv-orb-blue"
          animate={{ x: [0, 32, 0], y: [0, -22, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="hv-orb hv-orb-teal"
          animate={{ x: [0, -28, 0], y: [0, 26, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="hv-orb hv-orb-indigo"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease }}
        className={`hv-nav ${navScrolled ? "hv-nav-scrolled" : ""}`}
      >
        <Container className="hv-nav-inner">
          <Link to="/" onClick={closeMobile} className="hv-logo">
            <div className="hv-logo-mark">
              <Stethoscope size={22} />
            </div>
            <div>
              <span className="hv-logo-name">HealthVerify</span>
              <span className="hv-logo-sub">AI Healthcare Verification</span>
            </div>
          </Link>

          <nav className="hv-nav-links" aria-label="Main">
            <NavBtn onClick={() => scrollTo("features")}>Features</NavBtn>
            <NavBtn onClick={() => scrollTo("workflow")}>Workflow</NavBtn>
            <NavBtn onClick={() => scrollTo("security")}>Security</NavBtn>
            <NavBtn onClick={() => scrollTo("testimonials")}>Reviews</NavBtn>
          </nav>

          <div className="hv-nav-cta">
            <Link to="/login" className="hv-btn hv-btn-ghost hv-btn-sm">Admin Login</Link>
            <Link to="/login" className="hv-btn hv-btn-primary hv-btn-sm">Get Started</Link>
          </div>

          <button
            onClick={() => setMobileOpen(p => !p)}
            className="hv-hamburger"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </Container>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease }}
              className="hv-mobile-menu"
            >
              {["features", "workflow", "security"].map(id => (
                <button key={id} onClick={() => scrollTo(id)} className="hv-mobile-link">
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              ))}
              <Link to="/login" onClick={closeMobile} className="hv-btn hv-btn-ghost hv-btn-sm text-center mt-1">Admin Login</Link>
              <Link to="/login" onClick={closeMobile} className="hv-btn hv-btn-primary hv-btn-sm text-center">Get Started</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <motion.section className="hv-hero" style={{ opacity: heroOpacity }}>
        {/* ECG signature line */}
        <div className="hv-ecg-wrap" aria-hidden>
          <EcgLine className="hv-ecg" />
        </div>

        <Container className="hv-hero-grid">
          {/* Left column */}
          <motion.div initial="hidden" animate="visible" variants={stagger} className="hv-hero-copy">
            <Badge
              icon={Activity}
              pulse
              motionProps={{ variants: fadeUp, custom: 0, className: "mb-7" }}
            >
              AI-Powered Healthcare Staff Verification
            </Badge>

            <motion.h1 variants={fadeUp} custom={0.1} className="hv-hero-heading">
              Secure Staff<br />
              <motion.span
                className="hv-hero-gradient"
                initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                transition={{ duration: 1, delay: 0.5, ease }}
              >
                Verification System
              </motion.span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={0.18} className="hv-hero-sub">
              A production-ready platform for verifying doctors, nurses, and pharmacists
              through document review, AI identity checks, and QR-based public confirmation.
            </motion.p>

            <motion.div variants={fadeUp} custom={0.26} className="hv-hero-actions">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/login" className="hv-btn hv-btn-primary hv-btn-lg">
                  Start Verification
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight size={18} />
                  </motion.span>
                </Link>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDemoOpen(p => !p)}
                className="hv-btn hv-btn-outline hv-btn-lg"
              >
                <PlayCircle size={18} />
                View Demo Flow
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} custom={0.34} className="hv-trust-row">
              {["Firebase Secured", "Role-Based Access", "Real-Time Dashboard"].map((item, i) => (
                <motion.span
                  key={item}
                  className="hv-trust-pill"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.5, ease }}
                >
                  <CheckCircle2 size={12} className="text-teal-400" />
                  {item}
                </motion.span>
              ))}
            </motion.div>

            <AnimatePresence>
              {demoOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.96 }}
                  transition={{ duration: 0.35, ease }}
                  className="mt-7"
                >
                  <ProCard className="p-6 max-w-lg" interactive={false}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="hv-heading text-base mb-1.5 text-white">Demo Flow</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          Register → Upload documents → AI pre-screen → Admin approval → QR badge issued.
                        </p>
                      </div>
                      <button
                        onClick={() => setDemoOpen(false)}
                        className="w-8 h-8 rounded-[8px] bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/10 transition shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </ProCard>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right column — hero card */}
          <motion.div
            className="hv-hero-card-wrap"
            initial="hidden"
            animate="visible"
            variants={slideRight}
            custom={0.2}
          >
            <div className="hv-hero-glow" aria-hidden />

            <ProCard
              className="hv-hero-card"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ y: -18, transition: { duration: 0.35 } }}
            >
              <div className="hv-inner-panel">
                {/* Card header */}
                <div className="hv-card-header">
                  <div className="flex items-center gap-3">
                    <IconBox teal>
                      <ShieldCheck size={20} />
                    </IconBox>
                    <div>
                      <p className="hv-card-eyebrow">Verification Result</p>
                      <h3 className="hv-heading text-lg text-white mt-0.5">Dr. Riham Al Jazairi</h3>
                    </div>
                  </div>
                  <span className="hv-status-badge">
                    <span className="hv-status-dot" />
                    Verified
                  </span>
                </div>

                {/* Mini stats grid */}
                <motion.div
                  className="grid grid-cols-2 gap-3 mb-5"
                  initial="hidden"
                  animate="visible"
                  variants={stagger}
                >
                  <HeroMiniCard label="Face Match" value="98.7%" delay={0.4} />
                  <HeroMiniCard label="License" value="Valid" delay={0.5} />
                  <HeroMiniCard label="Role" value="Doctor" delay={0.6} />
                  <HeroMiniCard label="Status" value="Verified" delay={0.7} />
                </motion.div>

                {/* QR block */}
                <motion.div
                  className="hv-qr-block"
                  animate={{
                    boxShadow: [
                      "0 4px 24px rgba(0,0,0,0.2)",
                      "0 8px 40px rgba(29,110,255,0.25)",
                      "0 4px 24px rgba(0,0,0,0.2)",
                    ],
                  }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <QrCode size={68} className="mx-auto mb-2 text-slate-800" />
                  </motion.div>
                  <p className="font-bold text-sm text-slate-800">Public QR Verification</p>
                  <p className="text-xs text-slate-500 mt-0.5">Scan to confirm identity</p>
                </motion.div>

                {/* Approved label */}
                <motion.div
                  className="hv-approved-row"
                  animate={{ opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <CheckCircle2 size={15} />
                  Approved by Admin
                </motion.div>
              </div>
            </ProCard>
          </motion.div>
        </Container>

        {/* Scroll cue */}
        <motion.button
          onClick={() => scrollTo("stats")}
          className="hv-scroll-cue"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.12 }}
          aria-label="Scroll down"
        >
          <ChevronDown size={20} className="text-slate-400" />
        </motion.button>
      </motion.section>

      {/* ══════════════════════════════════════
          STATS
      ══════════════════════════════════════ */}
      <Section id="stats" alt>
        <Container>
          <motion.div
            className="hv-stats-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <ProCard
                  key={i}
                  variants={scaleIn}
                  custom={i * 0.09}
                  whileHover={{ y: -8, transition: { duration: 0.25 } }}
                  className="hv-stat-card"
                >
                  <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.45 }}>
                    <IconBox className="mx-auto mb-5">{<Icon size={22} />}</IconBox>
                  </motion.div>
                  <AnimatedStat value={stat.value} />
                  <p className="text-slate-500 text-sm font-medium mt-1">{stat.label}</p>
                </ProCard>
              );
            })}
          </motion.div>
        </Container>
      </Section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <Section id="features">
        <Container>
          <SectionHeader
            badge="Core Features"
            title="Everything Your Hospital Needs"
            desc="Built for staff verification, document review, QR checking, and real admin control — all in one system."
          />
          <motion.div
            className="hv-feature-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <ProCard
                  key={i}
                  variants={fadeUp}
                  custom={i * 0.09}
                  whileHover={{ y: -10, transition: { duration: 0.25 } }}
                  className="hv-feature-card"
                >
                  <div className="hv-feature-number" aria-hidden>0{i + 1}</div>
                  <IconBox className="mb-5">{<Icon size={22} />}</IconBox>
                  <h3 className="hv-heading text-lg mb-3 text-white">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed flex-1">{f.desc}</p>
                </ProCard>
              );
            })}
          </motion.div>
        </Container>
      </Section>

      {/* ══════════════════════════════════════
          WORKFLOW
      ══════════════════════════════════════ */}
      <Section id="workflow" alt>
        <Container>
          <SectionHeader
            badge="How It Works"
            title="From Registration to Verified"
            desc="A complete four-stage pipeline for doctors, nurses, pharmacists, and public badge scanning."
            teal
          />
          <div className="hv-workflow-wrap">
            <div className="hv-workflow-track" aria-hidden />
            <motion.div
              className="hv-workflow-grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
            >
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <ProCard
                    key={step.number}
                    variants={fadeUp}
                    custom={i * 0.1}
                    whileHover={{ y: -8, transition: { duration: 0.25 } }}
                    className="hv-workflow-card"
                  >
                    <span className="hv-workflow-bg-num" aria-hidden>{step.number}</span>
                    <div className="flex items-center gap-3 mb-6">
                      <motion.span
                        className="hv-step-pill"
                        whileInView={{ scale: [0.75, 1.08, 1] }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15, duration: 0.45 }}
                      >
                        Step {step.number}
                      </motion.span>
                      <IconBox teal>{<Icon size={20} />}</IconBox>
                    </div>
                    <h3 className="hv-heading text-lg mb-3 text-white">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                  </ProCard>
                );
              })}
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* ══════════════════════════════════════
          SECURITY
      ══════════════════════════════════════ */}
      <Section id="security">
        <Container className="hv-security-grid">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <Badge
              variant="teal"
              icon={Lock}
              motionProps={{ variants: fadeUp, custom: 0, className: "mb-8" }}
            >
              Enterprise Security
            </Badge>
            <motion.h2 variants={fadeUp} custom={0.08} className="hv-heading text-3xl lg:text-5xl mb-6 max-w-xl">
              Built for Secure Healthcare Access
            </motion.h2>
            <motion.p variants={fadeUp} custom={0.16} className="text-base text-slate-400 leading-relaxed mb-8 max-w-lg">
              HealthVerify combines protected admin routes, Firebase authentication,
              Firestore records, document storage, and role-based dashboards to eliminate
              fake staff profiles at scale.
            </motion.p>
            <motion.div className="space-y-3" variants={stagger}>
              <SecurityItem text="Firebase Authentication for secure, verified login" delay={0.2} />
              <SecurityItem text="Admin-only dashboard with protected route guards" delay={0.28} />
              <SecurityItem text="Firestore status machine: pending → approved / rejected" delay={0.36} />
              <SecurityItem text="Public verification page served over secure ID links" delay={0.44} />
            </motion.div>
          </motion.div>

          <ProCard
            className="p-7"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={scaleIn}
            custom={0.15}
            whileHover={{ scale: 1.025 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="grid grid-cols-2 gap-4"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <SecurityBox title="Auth" value="Protected" delay={0.1} />
              <SecurityBox title="Database" value="Secured" delay={0.18} />
              <SecurityBox title="Documents" value="Reviewed" delay={0.26} />
              <SecurityBox title="QR Check" value="Public Safe" delay={0.34} />
            </motion.div>
          </ProCard>
        </Container>
      </Section>

      {/* ══════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════ */}
      <Section id="testimonials" alt>
        <Container>
          <SectionHeader
            badge="Reviews"
            title="Designed Like a Real Healthcare Platform"
            desc="Real-world scenarios that show the business value behind every feature in this system."
          />
          <motion.div
            className="hv-testimonial-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            {testimonials.map((item, i) => (
              <ProCard
                key={i}
                variants={fadeUp}
                custom={i * 0.12}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="hv-testimonial-card"
              >
                <div>
                  <div className="flex gap-0.5 text-amber-400 mb-5">
                    {[1,2,3,4,5].map(s => (
                      <motion.span
                        key={s}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 + s * 0.05, duration: 0.3 }}
                      >
                        <Star size={14} fill="currentColor" />
                      </motion.span>
                    ))}
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-6 text-sm">"{item.text}"</p>
                </div>
                <div className="hv-testimonial-footer">
                  <IconBox><Building2 size={17} /></IconBox>
                  <div>
                    <h4 className="font-semibold text-sm text-white">{item.name}</h4>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>
              </ProCard>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ══════════════════════════════════════
          CTA
      ══════════════════════════════════════ */}
      <Section>
        <Container>
          <ProCard
            className="hv-cta-card"
            interactive={false}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={scaleIn}
            custom={0}
          >
            {/* Animated gradient overlay */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden"
              aria-hidden
            >
              <motion.div
                className="absolute inset-0 opacity-30"
                style={{
                  background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(29,110,255,0.35), transparent 70%)",
                }}
                animate={{ opacity: [0.2, 0.45, 0.2] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

            <motion.div
              className="relative text-center"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div
                variants={fadeUp}
                custom={0}
                className="hv-cta-icon-wrap"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ShieldCheck size={32} />
              </motion.div>

              <motion.h2 variants={fadeUp} custom={0.08} className="hv-heading text-3xl lg:text-5xl mb-5">
                Ready to Secure Your Hospital?
              </motion.h2>

              <motion.p variants={fadeUp} custom={0.16} className="text-base text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
                Start verifying healthcare staff with document checks, AI-assisted screening,
                admin approvals, and instant QR badge generation.
              </motion.p>

              <motion.div variants={fadeUp} custom={0.24} className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/login" className="hv-btn hv-btn-primary hv-btn-lg">
                    Start Verification
                    <ArrowRight size={17} />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/login" className="hv-btn hv-btn-outline hv-btn-lg">
                    Admin Login
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </ProCard>
        </Container>
      </Section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <motion.footer
        className="hv-footer"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease }}
      >
        <Container className="hv-footer-inner">
          <Link to="/" className="hv-logo">
            <div className="hv-logo-mark hv-logo-mark-sm">
              <Stethoscope size={19} />
            </div>
            <div>
              <span className="hv-logo-name text-base">HealthVerify</span>
              <span className="hv-logo-sub">Senior Project · AI Healthcare System</span>
            </div>
          </Link>
          <p className="text-sm text-slate-500 text-center">
            © {new Date().getFullYear()} HealthVerify. AI-Based Healthcare Staff Verification System.
          </p>
        </Container>
      </motion.footer>

      {/* ══════════════════════════════════════
          STYLES
      ══════════════════════════════════════ */}
      <style>{`
        /* ── Google Fonts ── */
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

        /* ── Tokens ── */
        :root {
          --c-bg:       #050A1A;
          --c-surface:  #0C1428;
          --c-surface2: #111C35;
          --c-border:   rgba(255,255,255,0.07);
          --c-border2:  rgba(255,255,255,0.11);
          --c-blue:     #1D6EFF;
          --c-blue-dim: rgba(29,110,255,0.18);
          --c-teal:     #00E5C3;
          --c-teal-dim: rgba(0,229,195,0.15);
          --c-text:     #E8ECF4;
          --c-muted:    #6B7A99;
          --c-card-shine: rgba(255,255,255,0.04);
          --r-card:     20px;
          --r-icon:     12px;
          --shadow-blue: 0 0 40px rgba(29,110,255,0.22);
          --shadow-card: 0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04);
        }

        /* ── Reset / global ── */
        html { scroll-behavior: smooth; }
        body { margin: 0; padding: 0; width: 100%; min-height: 100vh; overflow-x: hidden; background: var(--c-bg); }
        #root { width: 100%; min-height: 100vh; }
        *, *::before, *::after { box-sizing: border-box; }

        .hv-root {
          min-height: 100vh;
          color: var(--c-text);
          overflow-x: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── Background ── */
        .hv-bg-canvas {
          position: fixed;
          inset: 0;
          z-index: -10;
          background: var(--c-bg);
        }
        .hv-bg-mesh {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 80% 10%, rgba(29,110,255,0.18), transparent 55%),
            radial-gradient(ellipse 60% 45% at 10% 90%, rgba(0,229,195,0.13), transparent 50%),
            radial-gradient(ellipse 50% 50% at 50% 50%, rgba(99,80,255,0.07), transparent 60%);
        }
        .hv-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 30%, transparent 80%);
        }

        /* ── Progress bar ── */
        .hv-progress-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--c-blue), var(--c-teal), var(--c-blue));
          transform-origin: left;
          z-index: 60;
        }

        /* ── Orbs ── */
        .hv-orbs { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
        .hv-orb { position: absolute; border-radius: 50%; filter: blur(100px); }
        .hv-orb-blue  { width: 560px; height: 560px; top: -8%; right: -4%; background: rgba(29,110,255,0.1); }
        .hv-orb-teal  { width: 500px; height: 500px; bottom: -8%; left: -4%; background: rgba(0,229,195,0.08); }
        .hv-orb-indigo { width: 420px; height: 420px; top: 38%; left: 40%; background: rgba(99,80,255,0.07); }

        /* ── Container ── */
        .hv-container { width: 100%; max-width: 1240px; margin: 0 auto; padding: 0 1.75rem; }

        /* ── Section ── */
        .hv-section { padding: 7rem 0; position: relative; }
        .hv-section-alt { background: rgba(255,255,255,0.013); border-top: 1px solid var(--c-border); border-bottom: 1px solid var(--c-border); }
        .hv-section-header { text-align: center; margin-bottom: 4rem; }
        .hv-section-desc { font-size: 1rem; color: var(--c-muted); max-width: 42rem; margin: 0 auto; line-height: 1.75; }

        /* ── Typography ── */
        .hv-heading { font-family: 'Syne', sans-serif; font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; color: var(--c-text); margin: 0; }

        /* ── Nav ── */
        .hv-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          border-bottom: 1px solid var(--c-border);
          background: rgba(5, 10, 26, 0.7);
          backdrop-filter: blur(20px) saturate(1.6);
          -webkit-backdrop-filter: blur(20px) saturate(1.6);
          transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
        }
        .hv-nav-scrolled {
          background: rgba(5, 10, 26, 0.92);
          border-color: rgba(255,255,255,0.1);
          box-shadow: 0 8px 40px rgba(0,0,0,0.5);
        }
        .hv-nav-inner { height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .hv-nav-links { display: none; align-items: center; gap: 2.5rem; }
        @media (min-width: 1024px) { .hv-nav-links { display: flex; } }
        .hv-nav-cta { display: none; align-items: center; gap: 0.75rem; }
        @media (min-width: 768px) { .hv-nav-cta { display: flex; } }
        .hv-nav-link {
          background: none; border: none; padding: 0; cursor: pointer;
          color: var(--c-muted); font-size: 0.875rem; font-weight: 500;
          transition: color 0.2s; font-family: 'Inter', sans-serif;
        }
        .hv-nav-link:hover { color: var(--c-text); }
        .hv-hamburger {
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 10px;
          border: 1px solid var(--c-border); background: rgba(255,255,255,0.03);
          color: var(--c-text); cursor: pointer; transition: background 0.2s;
        }
        .hv-hamburger:hover { background: rgba(255,255,255,0.07); }
        @media (min-width: 768px) { .hv-hamburger { display: none; } }
        .hv-mobile-menu {
          border-top: 1px solid var(--c-border);
          background: rgba(5,10,26,0.98);
          backdrop-filter: blur(24px);
          padding: 1.25rem 1.75rem;
          display: flex; flex-direction: column; gap: 0.5rem;
          overflow: hidden;
        }
        .hv-mobile-link {
          background: none; border: none; text-align: left; width: 100%;
          color: var(--c-muted); padding: 0.625rem 0.75rem;
          border-radius: 10px; font-size: 0.9375rem;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: background 0.2s, color 0.2s;
        }
        .hv-mobile-link:hover { background: rgba(255,255,255,0.04); color: var(--c-text); }

        /* ── Logo ── */
        .hv-logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
        .hv-logo-mark {
          width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, var(--c-blue) 0%, #00C6A7 100%);
          display: flex; align-items: center; justify-content: center;
          color: #fff; box-shadow: var(--shadow-blue);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .hv-logo-mark-sm { width: 38px; height: 38px; }
        .hv-logo:hover .hv-logo-mark { transform: scale(1.06); box-shadow: 0 0 32px rgba(29,110,255,0.4); }
        .hv-logo-name { display: block; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.125rem; color: var(--c-text); letter-spacing: -0.01em; }
        .hv-logo-sub { display: block; font-size: 0.6875rem; color: var(--c-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 1px; }

        /* ── Buttons ── */
        .hv-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 0.5rem; border-radius: 12px; font-weight: 600; cursor: pointer;
          text-decoration: none; font-family: 'Inter', sans-serif;
          transition: all 0.22s; border: 1px solid transparent;
          white-space: nowrap;
        }
        .hv-btn-sm  { padding: 0.5rem 1.125rem; font-size: 0.8125rem; }
        .hv-btn-lg  { padding: 0.875rem 1.75rem; font-size: 0.9375rem; }
        .hv-btn:not(.hv-btn-sm):not(.hv-btn-lg) { padding: 0.75rem 1.5rem; font-size: 0.875rem; }

        .hv-btn-primary {
          background: linear-gradient(135deg, var(--c-blue) 0%, #0FA3FF 100%);
          color: #fff;
          box-shadow: 0 4px 24px rgba(29,110,255,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .hv-btn-primary:hover {
          box-shadow: 0 6px 32px rgba(29,110,255,0.55), inset 0 1px 0 rgba(255,255,255,0.18);
          filter: brightness(1.08);
        }
        .hv-btn-ghost {
          background: rgba(255,255,255,0.05); color: var(--c-text);
          border-color: var(--c-border2);
        }
        .hv-btn-ghost:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.18); }
        .hv-btn-outline {
          background: transparent; color: var(--c-text);
          border-color: var(--c-border2);
        }
        .hv-btn-outline:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); }

        /* ── Badge / pill ── */
        .hv-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.35rem 0.875rem; border-radius: 100px;
          font-size: 0.75rem; font-weight: 600; letter-spacing: 0.03em;
          font-family: 'Inter', sans-serif;
        }
        .hv-badge-blue { background: rgba(29,110,255,0.12); border: 1px solid rgba(29,110,255,0.25); color: #7AACFF; }
        .hv-badge-teal { background: rgba(0,229,195,0.1);   border: 1px solid rgba(0,229,195,0.22); color: #00E5C3; }

        .hv-trust-pill {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.3rem 0.75rem; border-radius: 100px;
          font-size: 0.75rem; font-weight: 500;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: var(--c-muted); font-family: 'Inter', sans-serif;
        }

        /* ── Icon box ── */
        .hv-icon-box {
          width: 44px; height: 44px; border-radius: var(--r-icon);
          background: var(--c-blue-dim); border: 1px solid rgba(29,110,255,0.2);
          display: flex; align-items: center; justify-content: center;
          color: #7AACFF; flex-shrink: 0;
        }
        .hv-icon-box-teal { background: var(--c-teal-dim); border-color: rgba(0,229,195,0.2); color: var(--c-teal); }

        /* ── Cards ── */
        .hv-card {
          position: relative;
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: var(--r-card);
          box-shadow: var(--shadow-card);
          overflow: hidden;
          transition: border-color 0.3s;
        }
        .hv-card-interactive:hover { border-color: var(--c-border2); }
        .hv-card-shine {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          border-radius: inherit;
          background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.055), transparent 70%);
          transition: opacity 0.4s;
        }

        /* ── Hero ── */
        .hv-hero {
          position: relative; min-height: 100vh;
          padding-top: 7rem; padding-bottom: 7rem;
          display: flex; align-items: center; justify-content: center;
        }
        .hv-hero-grid {
          display: grid;
          align-items: center;
          gap: 4rem;
        }
        @media (min-width: 1024px) {
          .hv-hero-grid { grid-template-columns: 1fr 1fr; gap: 5rem; }
        }
        .hv-hero-copy { max-width: 100%; }
        .hv-hero-heading {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2.25rem, 5vw, 3.75rem);
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: var(--c-text);
          margin: 0 0 1.5rem;
        }
        .hv-hero-gradient {
          display: block;
          background: linear-gradient(135deg, var(--c-blue) 0%, var(--c-teal) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-top: 0.25rem;
        }
        .hv-hero-sub {
          font-size: 1.0625rem; color: var(--c-muted); line-height: 1.75;
          margin-bottom: 2.25rem; max-width: 30rem;
        }
        .hv-hero-actions { display: flex; flex-wrap: wrap; gap: 0.875rem; margin-bottom: 2rem; }
        .hv-trust-row { display: flex; flex-wrap: wrap; gap: 0.625rem; }

        /* ── ECG line ── */
        .hv-ecg-wrap {
          position: absolute;
          left: 0; right: 0;
          top: 50%;
          transform: translateY(-50%);
          height: 80px;
          pointer-events: none;
          opacity: 0.35;
          z-index: 0;
        }
        .hv-ecg { width: 100%; height: 100%; }

        /* ── Hero card ── */
        .hv-hero-card-wrap {
          position: relative;
          display: flex; justify-content: center;
          z-index: 1;
        }
        .hv-hero-glow {
          position: absolute; inset: -20%;
          background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(29,110,255,0.18), transparent 70%);
          border-radius: 50%; pointer-events: none; z-index: 0;
        }
        .hv-hero-card { position: relative; z-index: 1; width: 100%; max-width: 420px; padding: 1.5rem; }
        @media (min-width: 1024px) { .hv-hero-card { padding: 1.75rem; } }

        .hv-inner-panel {
          background: linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01));
          border: 1px solid var(--c-border);
          border-radius: 14px;
          padding: 1.5rem;
        }
        @media (min-width: 1024px) { .hv-inner-panel { padding: 1.75rem; } }

        .hv-card-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.25rem; padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--c-border);
          gap: 1rem;
        }
        .hv-card-eyebrow { font-size: 0.6875rem; color: var(--c-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }

        .hv-status-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.3rem 0.75rem; border-radius: 100px;
          background: rgba(0,229,195,0.12); border: 1px solid rgba(0,229,195,0.25);
          color: var(--c-teal); font-size: 0.75rem; font-weight: 600;
          white-space: nowrap; font-family: 'Inter', sans-serif;
        }
        .hv-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--c-teal);
          box-shadow: 0 0 6px var(--c-teal);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%,100% { opacity: 1; } 50% { opacity: 0.4; }
        }

        .hv-mini-stat {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--c-border);
          border-radius: 12px;
          padding: 0.875rem;
          text-align: left;
        }

        .hv-qr-block {
          background: linear-gradient(145deg, #f0f4ff, #e8eef8);
          border-radius: 14px;
          padding: 1.25rem;
          text-align: center;
          margin-bottom: 1.25rem;
        }

        .hv-approved-row {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          color: var(--c-teal); font-weight: 600; font-size: 0.875rem;
        }

        /* ── Scroll cue ── */
        .hv-scroll-cue {
          position: absolute; left: 50%; bottom: 2rem;
          transform: translateX(-50%);
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,0.04); border: 1px solid var(--c-border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s;
        }
        .hv-scroll-cue:hover { background: rgba(255,255,255,0.08); }

        /* ── Stats ── */
        .hv-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.125rem; }
        @media (min-width: 768px) { .hv-stats-grid { grid-template-columns: repeat(4, 1fr); } }
        .hv-stat-card { min-height: 190px; padding: 1.75rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .hv-stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 2rem; font-weight: 800; letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--c-text) 0%, var(--c-muted) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; display: block; margin: 0;
        }

        /* ── Features ── */
        .hv-feature-grid { display: grid; gap: 1.125rem; }
        @media (min-width: 768px) { .hv-feature-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1280px) { .hv-feature-grid { grid-template-columns: repeat(4, 1fr); } }
        .hv-feature-card {
          min-height: 280px; padding: 1.75rem;
          display: flex; flex-direction: column; align-items: flex-start;
          position: relative; overflow: hidden;
        }
        .hv-feature-number {
          position: absolute; top: 1rem; right: 1.25rem;
          font-family: 'Syne', sans-serif; font-size: 3.5rem; font-weight: 800;
          color: rgba(255,255,255,0.03); line-height: 1; pointer-events: none; user-select: none;
        }

        /* ── Workflow ── */
        .hv-workflow-wrap { position: relative; }
        .hv-workflow-track {
          display: none; position: absolute; top: 52px; left: 12.5%; right: 12.5%;
          height: 1px; background: linear-gradient(90deg, transparent, var(--c-border2), transparent);
        }
        @media (min-width: 1280px) { .hv-workflow-track { display: block; } }
        .hv-workflow-grid { display: grid; gap: 1.125rem; }
        @media (min-width: 768px) { .hv-workflow-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1280px) { .hv-workflow-grid { grid-template-columns: repeat(4, 1fr); } }
        .hv-workflow-card {
          min-height: 280px; padding: 1.75rem;
          display: flex; flex-direction: column; align-items: flex-start;
          position: relative; overflow: hidden;
        }
        .hv-workflow-bg-num {
          position: absolute; top: 1rem; right: 1.25rem;
          font-family: 'Syne', sans-serif; font-size: 4rem; font-weight: 800;
          color: rgba(255,255,255,0.025); line-height: 1; pointer-events: none; user-select: none;
        }
        .hv-step-pill {
          font-size: 0.6875rem; font-weight: 700;
          background: rgba(29,110,255,0.12); border: 1px solid rgba(29,110,255,0.22);
          color: #7AACFF; padding: 0.25rem 0.625rem; border-radius: 8px;
          font-family: 'Inter', sans-serif; white-space: nowrap;
        }

        /* ── Security ── */
        .hv-security-grid {
          display: grid; gap: 3.5rem; align-items: center;
        }
        @media (min-width: 1024px) { .hv-security-grid { grid-template-columns: 1fr 1fr; } }
        .hv-security-item {
          min-height: 56px; display: flex; align-items: center; gap: 0.875rem;
          border-radius: 14px; border: 1px solid var(--c-border);
          background: rgba(255,255,255,0.025); padding: 0.875rem 1rem;
        }
        .hv-security-box {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; min-height: 120px; justify-content: center;
          background: rgba(255,255,255,0.025); border: 1px solid var(--c-border);
          border-radius: 14px; padding: 1.25rem;
          transition: transform 0.2s, border-color 0.2s;
        }

        /* ── Testimonials ── */
        .hv-testimonial-grid { display: grid; gap: 1.125rem; }
        @media (min-width: 768px) { .hv-testimonial-grid { grid-template-columns: repeat(3, 1fr); } }
        .hv-testimonial-card {
          min-height: 260px; padding: 1.75rem;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .hv-testimonial-footer {
          display: flex; align-items: center; gap: 0.75rem;
          padding-top: 1.25rem; border-top: 1px solid var(--c-border); width: 100%;
        }

        /* ── CTA ── */
        .hv-cta-card { padding: 4rem 2rem; position: relative; overflow: hidden; }
        @media (min-width: 1024px) { .hv-cta-card { padding: 5.5rem 3rem; } }
        .hv-cta-icon-wrap {
          width: 68px; height: 68px; border-radius: 18px;
          background: linear-gradient(135deg, var(--c-blue), #00C6A7);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 2rem; color: #fff;
          box-shadow: 0 0 48px rgba(29,110,255,0.35), 0 0 80px rgba(0,229,195,0.15);
        }

        /* ── Footer ── */
        .hv-footer {
          border-top: 1px solid var(--c-border);
          background: rgba(255,255,255,0.012);
          backdrop-filter: blur(12px);
          padding: 3rem 0;
        }
        .hv-footer-inner {
          display: flex; flex-direction: column; align-items: center;
          gap: 1.5rem;
        }
        @media (min-width: 768px) {
          .hv-footer-inner { flex-direction: row; justify-content: space-between; }
        }

        /* ── Entrance animation ── */
        @keyframes hv-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hv-loaded { animation: hv-fade-in 0.75s ease-out both; }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}