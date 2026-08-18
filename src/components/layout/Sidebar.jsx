import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  BarChart3,
  ClipboardList,
  Clock3,
  FileCheck,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Pill,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserCircle,
  Users,
  XCircle,
  CloudSun,
  UserCheck,
} from "lucide-react";

import { auth } from "../../config/firebase";

const menu = [
  {
    group: "Main",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    ],
  },
  {
    group: "Verification",
    items: [
      {
        label: "Pending Verifications",
        icon: Clock3,
        path: "/admin/pending-verifications",
        badge: "3",
      },
      {
        label: "Pending Doctors",
        icon: UserCheck,
        path: "/admin/pending-doctors",
        badge: "5",
        badgeColor: "amber",
      },
      { label: "Verify Documents", icon: FileCheck, path: "/admin/verify-documents" },
      { label: "Approved Doctors", icon: ShieldCheck, path: "/admin/approved-doctors" },
      { label: "Rejected Doctors", icon: XCircle, path: "/admin/rejected-doctors" },
      { label: "All Doctors", icon: Stethoscope, path: "/admin/doctors" },
    ],
  },
  {
    group: "Users & Management",
    items: [
      { label: "Users", icon: Users, path: "/admin/users" },
      { label: "Health Records", icon: HeartPulse, path: "/admin/health-records" },
      { label: "Pharmacy", icon: Pill, path: "/admin/pharmacy" },
      { label: "Audit Logs", icon: ClipboardList, path: "/admin/audit-logs" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Reports", icon: BarChart3, path: "/admin/reports" },
      { label: "Weather", icon: CloudSun, path: "/admin/weather" },
      { label: "Settings", icon: Settings, path: "/admin/settings" },
      { label: "Profile", icon: UserCircle, path: "/admin/profile" },
    ],
  },
];

export default function Sidebar({ isOpen = true }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("currentUser");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <aside className={isOpen ? "admin-sidebar open" : "admin-sidebar collapsed"}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>

          {isOpen && (
            <div className="sidebar-brand">
              <h1>
                Health<span>Verify</span>
              </h1>
              <p>Healthcare Verification System</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav custom-sidebar-scroll">
          {menu.map((section) => (
            <div key={section.group} className="sidebar-section">
              {isOpen && <p className="sidebar-group">{section.group}</p>}

              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={!isOpen ? item.label : ""}
                  className={({ isActive }) =>
                    isActive ? "sidebar-link active" : "sidebar-link"
                  }
                >
                  <div className="sidebar-icon">
                    <item.icon size={18} strokeWidth={1.8} />
                  </div>

                  {isOpen && (
                    <>
                      <div className="sidebar-text">
                        <strong>{item.label}</strong>
                        <small>Open {item.label.toLowerCase()}</small>
                      </div>

                      {item.badge && (
                        <span className={`sidebar-badge ${item.badgeColor === "amber" ? "sidebar-badge--amber" : ""}`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {isOpen && (
            <div className="system-card">
              <div>
                <span className="status-dot" />
                <strong>System Status</strong>
              </div>
              <p>All Systems Operational</p>
            </div>
          )}

          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} strokeWidth={1.8} />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <style>{`
        /* ─── Sidebar shell ─────────────────────────────── */
        .admin-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 50;
          display: flex;
          flex-direction: column;
          background: rgba(7, 15, 35, 0.92);
          border-right: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .admin-sidebar.open     { width: 270px; }
        .admin-sidebar.collapsed { width: 72px; }

        /* ─── Header ─────────────────────────────────────── */
        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 16px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }

        .sidebar-logo {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 4px 20px rgba(59,130,246,0.35);
          position: relative;
          overflow: hidden;
        }
        .sidebar-logo::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%);
          border-radius: inherit;
        }

        .sidebar-brand h1 {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
          margin: 0 0 2px;
          white-space: nowrap;
        }
        .sidebar-brand h1 span {
          background: linear-gradient(90deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sidebar-brand p {
          font-size: 10.5px;
          color: rgba(148,163,184,0.7);
          margin: 0;
          white-space: nowrap;
          letter-spacing: 0.2px;
        }

        /* ─── Nav ────────────────────────────────────────── */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 10px 10px 4px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
        }

        .sidebar-section { margin-bottom: 6px; }

        .sidebar-group {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: rgba(100,116,139,0.7);
          padding: 10px 10px 4px;
          margin: 0;
          white-space: nowrap;
        }

        /* ─── Links ──────────────────────────────────────── */
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 10px;
          border-radius: 11px;
          text-decoration: none;
          color: rgba(148,163,184,0.85);
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
          position: relative;
          overflow: hidden;
          margin-bottom: 1px;
        }
        .sidebar-link::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(59,130,246,0.0), rgba(139,92,246,0.0));
          border-radius: inherit;
          transition: opacity 0.2s ease;
          opacity: 0;
        }
        .sidebar-link:hover {
          background: rgba(255,255,255,0.055);
          color: #e2e8f0;
          transform: translateX(2px);
        }
        .sidebar-link:hover::before { opacity: 1; }

        .sidebar-link.active {
          background: linear-gradient(90deg, rgba(59,130,246,0.18), rgba(139,92,246,0.12));
          color: #93c5fd;
          transform: translateX(2px);
          box-shadow: inset 0 0 0 1px rgba(59,130,246,0.2);
        }
        .sidebar-link.active::after {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: linear-gradient(180deg, #60a5fa, #a78bfa);
          border-radius: 0 3px 3px 0;
        }

        /* ─── Icon ───────────────────────────────────────── */
        .sidebar-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          transition: background 0.18s, border-color 0.18s;
        }
        .sidebar-link.active .sidebar-icon {
          background: rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.25);
          color: #60a5fa;
        }
        .sidebar-link:hover .sidebar-icon {
          background: rgba(255,255,255,0.07);
        }

        /* ─── Text ───────────────────────────────────────── */
        .sidebar-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
          flex: 1;
        }
        .sidebar-text strong {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: inherit;
        }
        .sidebar-text small {
          font-size: 10.5px;
          color: rgba(100,116,139,0.7);
          white-space: nowrap;
        }

        /* ─── Badge ──────────────────────────────────────── */
        .sidebar-badge {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(59,130,246,0.4);
          animation: badgePulse 2.5s ease-in-out infinite;
        }
        .sidebar-badge--amber {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 2px 8px rgba(245,158,11,0.4);
          animation: badgePulseAmber 2.5s ease-in-out infinite;
        }
        @keyframes badgePulseAmber {
          0%, 100% { box-shadow: 0 2px 8px rgba(245,158,11,0.4); }
          50%       { box-shadow: 0 2px 14px rgba(217,119,6,0.6); }
        }

        /* ─── Footer ─────────────────────────────────────── */
        .sidebar-footer {
          padding: 10px 10px 14px;
          border-top: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .system-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 11px;
          padding: 10px 12px;
        }
        .system-card > div {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 3px;
        }
        .system-card > div strong {
          font-size: 11.5px;
          font-weight: 600;
          color: rgba(226,232,240,0.9);
        }
        .system-card > p {
          font-size: 10.5px;
          color: rgba(100,116,139,0.7);
          margin: 0;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(34,197,94,0.6);
          animation: statusPulse 2s ease-in-out infinite;
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }

        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          padding: 9px 12px;
          border-radius: 11px;
          background: transparent;
          border: 1px solid rgba(239,68,68,0.15);
          color: rgba(252,165,165,0.75);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.18s, color 0.18s, border-color 0.18s;
        }
        .logout-btn:hover {
          background: rgba(239,68,68,0.1);
          color: #fca5a5;
          border-color: rgba(239,68,68,0.3);
        }
      `}</style>
    </>
  );
}