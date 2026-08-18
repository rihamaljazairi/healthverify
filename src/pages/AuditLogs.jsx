import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck,
  Filter,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";

import { db } from "../config/firebase";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import ErrorAlert from "../components/Common/ErrorAlert";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const logsRef = query(
      collection(db, "auditLogs"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      logsRef,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(list);
        setLoading(false);
      },
      (err) => {
        console.error("Audit logs error:", err);
        setError("Failed to load audit logs.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const value = search.toLowerCase();
      const action = String(log.action || "").toLowerCase();
      const actor = String(log.actorName || log.actorEmail || "").toLowerCase();
      const target = String(log.targetName || log.targetEmail || "").toLowerCase();
      const type = String(log.type || "").toLowerCase();
      const matchSearch =
        action.includes(value) ||
        actor.includes(value) ||
        target.includes(value) ||
        type.includes(value);
      const matchType = typeFilter === "All" || type === typeFilter.toLowerCase();
      return matchSearch && matchType;
    });
  }, [logs, search, typeFilter]);

  const stats = useMemo(() => ({
    total: logs.length,
    approvals: logs.filter((l) => l.type === "approval").length,
    rejections: logs.filter((l) => l.type === "rejection").length,
    uploads: logs.filter((l) => l.type === "upload").length,
  }), [logs]);

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={false}
        title="Loading Audit Logs"
        subtitle="Fetching admin activity and security events..."
      />
    );
  }

  return (
    <div className="relative p-8 max-w-[1600px] mx-auto animate-fade-in overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {error && <ErrorAlert message={error} onClose={() => setError("")} />}

        {/* ─── Header ──────────────────────────────────────────── */}
        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-4">
              <ClipboardList size={14} />
              Admin Security Activity
            </div>
            <h1 className="text-4xl font-black text-white mb-3">Audit Logs</h1>
            <p className="text-slate-400">
              Track approvals, rejections, uploads, logins, and sensitive system actions.
            </p>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 font-bold">
            <ShieldCheck size={18} />
            Monitoring Active
          </div>
        </header>

        {/* ─── Stat Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          <AuditStat title="Total Events" value={stats.total} icon={<Activity size={24} />} color="blue" />
          <AuditStat title="Approvals" value={stats.approvals} icon={<UserCheck size={24} />} color="green" />
          <AuditStat title="Rejections" value={stats.rejections} icon={<UserX size={24} />} color="red" />
          <AuditStat title="Uploads" value={stats.uploads} icon={<FileCheck size={24} />} color="purple" />
        </div>

        {/* ─── Filters ─────────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-black uppercase tracking-widest mb-2">
                Search Logs
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search actor, target, action…"
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 text-white outline-none focus:border-blue-500/40 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 font-black uppercase tracking-widest mb-2">
                Filter by Event Type
              </label>
              <div className="relative">
                <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 text-white outline-none focus:border-blue-500/40 transition appearance-none"
                >
                  <option className="bg-slate-900">All</option>
                  <option className="bg-slate-900">approval</option>
                  <option className="bg-slate-900">rejection</option>
                  <option className="bg-slate-900">upload</option>
                  <option className="bg-slate-900">login</option>
                  <option className="bg-slate-900">security</option>
                </select>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-500 mt-4">
            Showing{" "}
            <span className="text-white font-bold">{filteredLogs.length}</span>{" "}
            of{" "}
            <span className="text-white font-bold">{logs.length}</span>{" "}
            event(s)
          </p>
        </div>

        {/* ─── Timeline ────────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-white/10">
            <h2 className="text-2xl font-black text-white mb-1">
              System Activity Timeline
            </h2>
            <p className="text-slate-500 text-sm">
              Real-time administrator actions and verification history — newest first.
            </p>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-white/10 flex items-center justify-center mx-auto mb-5">
                <ClipboardList className="text-slate-600" size={36} />
              </div>
              <h3 className="text-xl font-black text-white mb-2">No Audit Logs Found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                No events match your current search or filter. Admin activity will appear here as it occurs.
              </p>
            </div>
          ) : (
            <div className="relative p-8">
              {/* Vertical timeline line */}
              <div className="absolute left-[3.75rem] top-0 bottom-0 w-px bg-white/[0.06]" />

              <div className="space-y-0">
                {filteredLogs.map((log, index) => (
                  <TimelineItem
                    key={log.id}
                    log={log}
                    isLast={index === filteredLogs.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Item ────────────────────────────────────────────────────────────

function TimelineItem({ log, isLast }) {
  const meta = getLogMeta(log.type);

  return (
    <div className={`relative flex gap-6 ${isLast ? "pb-0" : "pb-8"}`}>
      {/* Icon node */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-lg ${meta.className}`}
        >
          {meta.icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition p-5 mt-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-white">
              {log.action || "System Event"}
            </h3>
            <span className={`px-2.5 py-1 rounded-full border text-xs font-black ${meta.className}`}>
              {log.type || "activity"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold flex-shrink-0">
            <Clock3 size={13} />
            {formatDate(log.createdAt)}
          </div>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed">
          <span className="text-blue-300 font-bold">
            {log.actorName || log.actorEmail || "System"}
          </span>{" "}
          performed this action
          {(log.targetName || log.targetEmail) ? (
            <>
              {" "}on{" "}
              <span className="text-purple-300 font-bold">
                {log.targetName || log.targetEmail}
              </span>
            </>
          ) : null}.
        </p>

        {log.details && (
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {log.details}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function AuditStat({ title, value, icon, color }) {
  const styles = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-xl p-6 hover:-translate-y-0.5 transition">
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${styles[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-2">{title}</p>
      <h3 className="text-4xl font-black text-white">{value}</h3>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLogMeta(type = "activity") {
  const value = String(type).toLowerCase();
  const map = {
    approval: {
      icon: <UserCheck size={18} />,
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    rejection: {
      icon: <UserX size={18} />,
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
    upload: {
      icon: <FileCheck size={18} />,
      className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    login: {
      icon: <CheckCircle2 size={18} />,
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    security: {
      icon: <AlertTriangle size={18} />,
      className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    },
  };

  return (
    map[value] || {
      icon: <Activity size={18} />,
      className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    }
  );
}

function formatDate(value) {
  if (!value) return "N/A";
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
  return new Date(value).toLocaleString();
}