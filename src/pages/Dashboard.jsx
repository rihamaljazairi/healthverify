import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

/* ─────────────────────────────────────────
   Static trend data
───────────────────────────────────────── */
const trendData = [
  { day: "May 5",  approved: 10, pending: 4, rejected: 1 },
  { day: "May 6",  approved: 15, pending: 7, rejected: 1 },
  { day: "May 7",  approved: 12, pending: 5, rejected: 2 },
  { day: "May 8",  approved: 12, pending: 5, rejected: 2 },
  { day: "May 9",  approved: 15, pending: 9, rejected: 3 },
  { day: "May 10", approved: 12, pending: 7, rejected: 3 },
  { day: "May 11", approved: 15, pending: 9, rejected: 3 },
];

/* ─────────────────────────────────────────
   Custom tooltip
───────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-tooltip">
      <p className="db-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="db-tooltip-row">
          <span className="db-tooltip-key">{p.dataKey}</span>
          <span className="db-tooltip-val">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main dashboard
───────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    const total    = users.length;
    const approved = users.filter((u) => u.approved === true || u.status === "verified").length;
    const rejected = users.filter((u) => u.rejected === true || u.status === "rejected").length;
    const pending  = users.filter((u) => u.approved !== true && u.rejected !== true).length;
    const rate     = total ? Math.round((approved / total) * 100) : 0;
    return { total, approved, rejected, pending, rate };
  }, [users]);

  const pieData = [
    { name: "Approved", value: stats.approved },
    { name: "Pending",  value: stats.pending  },
    { name: "Rejected", value: stats.rejected },
    { name: "Active",   value: Math.max(stats.total - stats.approved, 0) },
  ];

  const PIE_COLORS = ["#00E5C3", "#F59E0B", "#EF4444", "#1D6EFF"];

  return (
    <div className={`db-root ${mounted ? "db-mounted" : ""}`}>

      {/* ── Page header ── */}
      <header className="db-page-header">
        <div className="db-page-title-group">
          <div className="db-page-eyebrow">
            <span className="db-live-dot" />
            Live Dashboard
          </div>
          <h1 className="db-page-title">
            Welcome back, <span className="db-name-accent">{user?.displayName || "Admin"}</span>
          </h1>
          <p className="db-page-sub">
            Real-time overview of your staff verification pipeline.
          </p>
        </div>

        <div className="db-date-chip">
          <CalendarDays size={15} className="text-slate-500" />
          <span className="db-date-text">{new Date().toDateString()}</span>
          <span className="db-date-sep" />
          <span className="db-time-text">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </header>

      {/* ── Metric cards ── */}
      <section className="db-metrics-grid">
        <MetricCard title="Total Staff"           value={stats.total}          trend="12%" icon={<Users size={18}/>}     color="blue"   index={0} />
        <MetricCard title="Pending Review"        value={stats.pending}        trend="25%" icon={<Clock3 size={18}/>}    color="amber"  index={1} />
        <MetricCard title="Approved"              value={stats.approved}       trend="18%" icon={<ShieldCheck size={18}/>} color="teal" index={2} />
        <MetricCard title="Rejected"              value={stats.rejected}       trend="8%"  icon={<XCircle size={18}/>}   color="red"    index={3} />
        <MetricCard title="Verification Rate"     value={`${stats.rate}%`}    trend="15%" icon={<UserCheck size={18}/>}  color="violet" index={4} />
      </section>

      {/* ── Main chart + activity ── */}
      <div className="db-mid-grid">
        {/* Line chart */}
        <section className="db-panel db-chart-panel">
          <div className="db-panel-header">
            <div>
              <h2 className="db-panel-title">Verification Overview</h2>
              <p className="db-panel-sub">Approval, pending & rejection trends</p>
            </div>
            <span className="db-range-chip">May 5 – May 11, 2026</span>
          </div>

          <div className="db-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#3D4F70" tick={{ fontSize: 11, fill: "#4A5C80", fontFamily: "Inter" }} />
                <YAxis stroke="#3D4F70" tick={{ fontSize: 11, fill: "#4A5C80", fontFamily: "DM Mono, monospace" }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="approved" stroke="#00E5C3" strokeWidth={2.5} dot={{ r: 4, fill: "#00E5C3", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="pending"  stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4, fill: "#F59E0B", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: "#EF4444", strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart legend row */}
          <div className="db-chart-legend">
            <MiniStat value={stats.approved} label="Approved" color="teal"  />
            <MiniStat value={stats.pending}  label="Pending"  color="amber" />
            <MiniStat value={stats.rejected} label="Rejected" color="red"   />
            <MiniStat value={stats.total}    label="Total"    color="blue"  />
          </div>
        </section>

        {/* Activity feed */}
        <section className="db-panel db-activity-panel">
          <div className="db-panel-header">
            <div>
              <h2 className="db-panel-title">Recent Activity</h2>
              <p className="db-panel-sub">Latest verification events</p>
            </div>
            <button className="db-view-all-btn">View All</button>
          </div>

          <div className="db-activity-list">
            <ActivityItem icon={<CheckCircle2 size={16}/>} color="teal"  title="Doctor approved"             subtitle="Cardiology · City Hospital"    time="2h ago" />
            <ActivityItem icon={<Clock3 size={16}/>}       color="amber" title="New submission received"     subtitle="Neurology"                     time="4h ago" />
            <ActivityItem icon={<XCircle size={16}/>}      color="red"   title="Application rejected"        subtitle="Invalid license document"      time="6h ago" />
            <ActivityItem icon={<Users size={16}/>}        color="blue"  title="New doctor registered"       subtitle="Pediatrics"                    time="1d ago" />
          </div>
        </section>
      </div>

      {/* ── Bottom row ── */}
      <div className="db-bottom-grid">
        {/* Pie chart */}
        <section className="db-panel">
          <div className="db-panel-header">
            <div>
              <h2 className="db-panel-title">Status Distribution</h2>
              <p className="db-panel-sub">All staff by verification state</p>
            </div>
          </div>
          <div className="db-pie-area">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={58} outerRadius={88} dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ color: "#6B7A99", fontSize: 12, fontFamily: "Inter" }}>{v}</span>}
                />
                <Tooltip
                  contentStyle={{ background: "#0D1733", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Specializations */}
        <section className="db-panel">
          <div className="db-panel-header">
            <div>
              <h2 className="db-panel-title">Top Specializations</h2>
              <p className="db-panel-sub">Verified staff by department</p>
            </div>
          </div>
          <div className="db-spec-list">
            <Specialization name="Cardiology"        value="75%" count="3 doctors" color="teal"   />
            <Specialization name="Neurology"         value="50%" count="2 doctors" color="blue"   />
            <Specialization name="Pediatrics"        value="50%" count="2 doctors" color="violet" />
            <Specialization name="Internal Medicine" value="45%" count="2 doctors" color="red"    />
          </div>
        </section>

        {/* System health */}
        <section className="db-panel">
          <div className="db-panel-header">
            <div>
              <h2 className="db-panel-title">System Health</h2>
              <p className="db-panel-sub">All services operational</p>
            </div>
            <span className="db-all-good-chip">All Good</span>
          </div>
          <div className="db-health-list">
            <HealthRow label="Database"       uptime="99.99%" />
            <HealthRow label="Authentication" uptime="100%"   />
            <HealthRow label="Storage"        uptime="99.9%"  />
            <HealthRow label="Email Service"  uptime="98.7%"  />
          </div>
        </section>
      </div>

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700&display=swap');

        /* ── Tokens ── */
        .db-root {
          --bg:          #060D1F;
          --surface:     #0D1733;
          --surface2:    #111E3A;
          --surface3:    #162040;
          --border:      rgba(255,255,255,0.065);
          --border2:     rgba(255,255,255,0.11);
          --blue:        #1D6EFF;
          --teal:        #00E5C3;
          --amber:       #F59E0B;
          --red:         #EF4444;
          --violet:      #8B5CF6;
          --text:        #E8EDF8;
          --muted:       #5A6A8A;
          --muted2:      #3D4F70;
          --r:           14px;
          --r-sm:        10px;
          --shadow:      0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);

          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text);
          background: var(--bg);
          min-height: 100vh;
          padding: 2rem 2rem 3rem;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .db-mounted { opacity: 1; transform: translateY(0); }

        * { box-sizing: border-box; }

        /* ── Page header ── */
        .db-page-header {
          display: flex; flex-wrap: wrap; align-items: flex-start;
          justify-content: space-between; gap: 1.25rem;
          margin-bottom: 2.25rem;
        }
        .db-page-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--muted);
          margin-bottom: 0.5rem;
        }
        .db-live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--teal);
          box-shadow: 0 0 8px var(--teal);
          animation: live-pulse 2s ease-in-out infinite;
        }
        @keyframes live-pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
        .db-page-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 700; letter-spacing: -0.025em;
          color: var(--text); margin: 0 0 0.375rem;
        }
        .db-name-accent {
          background: linear-gradient(120deg, var(--blue), var(--teal));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .db-page-sub { font-size: 0.875rem; color: var(--muted); margin: 0; }

        .db-date-chip {
          display: inline-flex; align-items: center; gap: 0.625rem;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r-sm); padding: 0.625rem 1rem;
          font-size: 0.8125rem; white-space: nowrap;
          box-shadow: var(--shadow);
        }
        .db-date-text { color: var(--muted); }
        .db-date-sep { width: 1px; height: 14px; background: var(--border2); }
        .db-time-text { font-family: 'DM Mono', monospace; font-size: 0.8125rem; color: var(--text); font-weight: 500; }

        /* ── Metrics ── */
        .db-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        @media (min-width: 768px)  { .db-metrics-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1280px) { .db-metrics-grid { grid-template-columns: repeat(5, 1fr); } }

        /* ── Panel base ── */
        .db-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r);
          box-shadow: var(--shadow);
          padding: 1.5rem;
          transition: border-color 0.2s;
        }
        .db-panel:hover { border-color: var(--border2); }
        .db-panel-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; margin-bottom: 1.375rem;
        }
        .db-panel-title {
          font-size: 0.9375rem; font-weight: 600; letter-spacing: -0.01em;
          color: var(--text); margin: 0 0 0.2rem;
        }
        .db-panel-sub { font-size: 0.75rem; color: var(--muted); margin: 0; }

        /* ── Mid grid ── */
        .db-mid-grid {
          display: grid; gap: 1rem; margin-bottom: 1.25rem;
        }
        @media (min-width: 1280px) { .db-mid-grid { grid-template-columns: 1fr 360px; } }

        .db-chart-panel { display: flex; flex-direction: column; }
        .db-chart-area  { flex: 1; height: 280px; margin: 0 -0.25rem; }
        .db-chart-legend {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem; margin-top: 1.25rem;
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          padding: 1rem;
        }

        .db-range-chip {
          font-size: 0.6875rem; font-family: 'DM Mono', monospace;
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          border-radius: 8px; padding: 0.3rem 0.7rem; color: var(--muted);
          white-space: nowrap; align-self: flex-start;
        }

        /* ── Metric card ── */
        .db-metric-card {
          position: relative; overflow: hidden;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r);
          padding: 1.375rem 1.375rem 1rem;
          box-shadow: var(--shadow);
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
          display: flex; flex-direction: column;
        }
        .db-metric-card:hover {
          transform: translateY(-3px);
          border-color: var(--border2);
          box-shadow: 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .db-metric-glow {
          position: absolute; inset: 0; pointer-events: none;
          opacity: 0; border-radius: inherit;
          transition: opacity 0.3s;
        }
        .db-metric-card:hover .db-metric-glow { opacity: 1; }

        .db-metric-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.625rem; }
        .db-metric-label { font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.5rem; }
        .db-metric-value { font-family: 'DM Mono', monospace; font-size: 2rem; font-weight: 500; letter-spacing: -0.03em; color: var(--text); line-height: 1; }
        .db-metric-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .db-metric-trend { font-size: 0.6875rem; color: var(--muted); margin-bottom: 0.75rem; }
        .db-metric-trend strong { color: #34D399; }
        .db-metric-spark { height: 44px; margin: 0 -0.25rem; }

        /* ── Mini stat ── */
        .db-mini-stat { text-align: center; }
        .db-mini-val {
          font-family: 'DM Mono', monospace;
          font-size: 1.25rem; font-weight: 500; letter-spacing: -0.02em;
          display: block; margin-bottom: 0.2rem;
        }
        .db-mini-label { font-size: 0.6875rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }
        .db-mini-teal   { color: var(--teal); }
        .db-mini-amber  { color: var(--amber); }
        .db-mini-red    { color: var(--red); }
        .db-mini-blue   { color: var(--blue); }
        .db-mini-violet { color: var(--violet); }

        /* ── Activity ── */
        .db-activity-panel { display: flex; flex-direction: column; }
        .db-activity-list { display: flex; flex-direction: column; gap: 0.125rem; }
        .db-activity-item {
          display: flex; align-items: center; gap: 0.875rem;
          padding: 0.75rem 0.875rem;
          border-radius: var(--r-sm);
          transition: background 0.15s;
          cursor: default;
        }
        .db-activity-item:hover { background: rgba(255,255,255,0.035); }
        .db-activity-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .db-activity-body { flex: 1; min-width: 0; }
        .db-activity-title { font-size: 0.8125rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .db-activity-sub   { font-size: 0.75rem; color: var(--muted); margin-top: 1px; }
        .db-activity-time  { font-size: 0.6875rem; font-family: 'DM Mono', monospace; color: var(--muted); white-space: nowrap; }

        .db-view-all-btn {
          font-size: 0.75rem; font-weight: 500; font-family: 'Inter', sans-serif;
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          border-radius: 8px; padding: 0.3rem 0.75rem; color: var(--muted);
          cursor: pointer; transition: background 0.15s, color 0.15s; white-space: nowrap;
        }
        .db-view-all-btn:hover { background: rgba(255,255,255,0.08); color: var(--text); }

        /* ── Bottom grid ── */
        .db-bottom-grid {
          display: grid; gap: 1rem;
        }
        @media (min-width: 1280px) { .db-bottom-grid { grid-template-columns: repeat(3, 1fr); } }

        /* ── Pie ── */
        .db-pie-area { height: 220px; }

        /* ── Specialization ── */
        .db-spec-list { display: flex; flex-direction: column; gap: 1.125rem; }
        .db-spec-item {}
        .db-spec-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem; }
        .db-spec-name { font-size: 0.8125rem; font-weight: 500; color: var(--text); }
        .db-spec-count { font-size: 0.6875rem; font-family: 'DM Mono', monospace; color: var(--muted); }
        .db-spec-track { height: 4px; border-radius: 4px; background: rgba(255,255,255,0.07); overflow: hidden; }
        .db-spec-fill  { height: 100%; border-radius: 4px; transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }
        .db-spec-teal   { background: var(--teal); box-shadow: 0 0 10px rgba(0,229,195,0.4); }
        .db-spec-blue   { background: var(--blue); box-shadow: 0 0 10px rgba(29,110,255,0.4); }
        .db-spec-violet { background: var(--violet); box-shadow: 0 0 10px rgba(139,92,246,0.4); }
        .db-spec-red    { background: var(--red); box-shadow: 0 0 10px rgba(239,68,68,0.4); }

        /* ── System health ── */
        .db-all-good-chip {
          font-size: 0.6875rem; font-weight: 600;
          background: rgba(0,229,195,0.1); border: 1px solid rgba(0,229,195,0.22);
          color: var(--teal); padding: 0.25rem 0.625rem; border-radius: 100px;
          white-space: nowrap; align-self: flex-start;
        }
        .db-health-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .db-health-row {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.03); border: 1px solid var(--border);
          border-radius: var(--r-sm); padding: 0.75rem 1rem;
          transition: background 0.15s;
        }
        .db-health-row:hover { background: rgba(255,255,255,0.055); }
        .db-health-left  { display: flex; align-items: center; gap: 0.625rem; }
        .db-health-label { font-size: 0.8125rem; font-weight: 500; color: var(--text); }
        .db-health-right { display: flex; align-items: center; gap: 0.5rem; }
        .db-health-uptime { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--teal); }
        .db-health-status { font-size: 0.6875rem; color: var(--muted); }
        .db-health-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 6px var(--teal); animation: live-pulse 2.4s ease-in-out infinite; }

        /* ── Tooltip ── */
        .db-tooltip {
          background: var(--surface2); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 0.625rem 0.875rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          min-width: 130px;
        }
        .db-tooltip-label { font-size: 0.6875rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.375rem; }
        .db-tooltip-row { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.75rem; margin: 0.15rem 0; }
        .db-tooltip-key { text-transform: capitalize; opacity: 0.8; }
        .db-tooltip-val { font-family: 'DM Mono', monospace; font-weight: 500; }

        /* ── Color shorthands for icon backgrounds ── */
        .db-icon-blue   { background: rgba(29,110,255,0.14); color: #6AA3FF; }
        .db-icon-amber  { background: rgba(245,158,11,0.14); color: #FBB040; }
        .db-icon-teal   { background: rgba(0,229,195,0.12);  color: var(--teal); }
        .db-icon-red    { background: rgba(239,68,68,0.14);  color: #F87171; }
        .db-icon-violet { background: rgba(139,92,246,0.14); color: #A78BFA; }

        .db-glow-blue   { background: radial-gradient(ellipse at top right, rgba(29,110,255,0.1), transparent 70%); }
        .db-glow-amber  { background: radial-gradient(ellipse at top right, rgba(245,158,11,0.1), transparent 70%); }
        .db-glow-teal   { background: radial-gradient(ellipse at top right, rgba(0,229,195,0.09), transparent 70%); }
        .db-glow-red    { background: radial-gradient(ellipse at top right, rgba(239,68,68,0.1),  transparent 70%); }
        .db-glow-violet { background: radial-gradient(ellipse at top right, rgba(139,92,246,0.1), transparent 70%); }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────
   MetricCard
───────────────────────────────────────── */
function MetricCard({ title, value, trend, icon, color, index }) {
  return (
    <div
      className="db-metric-card"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className={`db-metric-glow db-glow-${color}`} />

      <div className="db-metric-top">
        <div>
          <p className="db-metric-label">{title}</p>
          <p className="db-metric-value">{value}</p>
        </div>
        <div className={`db-metric-icon db-icon-${color}`}>
          {icon}
        </div>
      </div>

      <p className="db-metric-trend">↗ <strong>{trend}</strong> vs last month</p>

      <div className="db-metric-spark">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <Line
              type="monotone"
              dataKey="approved"
              stroke={
                color === "teal"   ? "#00E5C3" :
                color === "amber"  ? "#F59E0B" :
                color === "red"    ? "#EF4444" :
                color === "violet" ? "#8B5CF6" :
                "#1D6EFF"
              }
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MiniStat
───────────────────────────────────────── */
function MiniStat({ value, label, color }) {
  return (
    <div className="db-mini-stat">
      <span className={`db-mini-val db-mini-${color}`}>{value}</span>
      <span className="db-mini-label">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   ActivityItem
───────────────────────────────────────── */
function ActivityItem({ icon, color, title, subtitle, time }) {
  return (
    <div className="db-activity-item">
      <div className={`db-activity-icon db-icon-${color}`}>{icon}</div>
      <div className="db-activity-body">
        <p className="db-activity-title">{title}</p>
        <p className="db-activity-sub">{subtitle}</p>
      </div>
      <span className="db-activity-time">{time}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Specialization
───────────────────────────────────────── */
function Specialization({ name, value, count, color }) {
  return (
    <div className="db-spec-item">
      <div className="db-spec-row">
        <span className="db-spec-name">{name}</span>
        <span className="db-spec-count">{count}</span>
      </div>
      <div className="db-spec-track">
        <div className={`db-spec-fill db-spec-${color}`} style={{ width: value }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   HealthRow
───────────────────────────────────────── */
function HealthRow({ label, uptime }) {
  return (
    <div className="db-health-row">
      <div className="db-health-left">
        <Activity size={14} className="text-slate-500" />
        <span className="db-health-label">{label}</span>
      </div>
      <div className="db-health-right">
        <span className="db-health-uptime">{uptime}</span>
        <span className="db-health-status">Operational</span>
        <span className="db-health-dot" />
      </div>
    </div>
  );
}