import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Menu,
  Search,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  UserCircle,
  Settings,
  LayoutDashboard,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const [searchValue, setSearchValue] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchRoutes = [
    { keywords: ["dashboard", "home", "main"],                  path: "/admin/dashboard" },
    { keywords: ["pending", "pending verification", "waiting", "review"], path: "/admin/pending-verifications" },
    { keywords: ["verify", "verify document", "documents", "document"],   path: "/admin/verify-documents" },
    { keywords: ["approved", "approved doctor", "verified"],              path: "/admin/approved-doctors" },
    { keywords: ["rejected", "reject", "denied"],                         path: "/admin/rejected-doctors" },
    { keywords: ["doctor", "doctors", "all doctors", "staff"],            path: "/admin/doctors" },
    { keywords: ["user", "users", "management"],                          path: "/admin/users" },
    { keywords: ["record", "records", "health", "health records"],        path: "/admin/health-records" },
    { keywords: ["pharmacy", "medicine", "drug"],                         path: "/admin/pharmacy" },
    { keywords: ["audit", "logs", "audit logs", "activity"],             path: "/admin/audit-logs" },
    { keywords: ["report", "reports", "analytics"],                       path: "/admin/reports" },
    { keywords: ["weather", "forecast"],                                  path: "/admin/weather" },
    { keywords: ["setting", "settings", "system"],                        path: "/admin/settings" },
    { keywords: ["profile", "admin profile", "account"],                  path: "/admin/profile" },
  ];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
      if (e.key === "Escape") {
        setNotificationOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setNotificationOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getMatchedRoute = (value) => {
    const query = value.trim().toLowerCase();
    if (!query) return null;
    return searchRoutes.find((route) =>
      route.keywords.some((keyword) => query.includes(keyword))
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchValue.trim().toLowerCase();
    if (!query) return;
    const matched = getMatchedRoute(query);
    if (matched) {
      navigate(matched.path);
    } else {
      navigate(`/admin/users?search=${encodeURIComponent(query)}`);
    }
    setSearchValue("");
  };

  const handleQuickSearch = (value) => {
    setSearchValue(value);
    const matched = getMatchedRoute(value);
    if (matched) navigate(matched.path);
    setSearchValue("");
  };

  const clearSearch = () => {
    setSearchValue("");
    if (location.search) navigate(location.pathname);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("currentUser");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const userInitial = (user?.email || user?.displayName || "R").charAt(0).toUpperCase();
  const userName = user?.displayName || "Riham";

  return (
    <>
      <header className="hv-navbar">
        <div className="hv-navbar__left">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="hv-icon-btn"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="hv-search-wrap">
            <div className={`hv-search ${searchFocused ? "hv-search--focused" : ""}`}>
              <Search size={16} className="hv-search__icon" strokeWidth={1.8} />

              <input
                id="global-search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Search doctors, users, records…"
                className="hv-search__input"
              />

              {searchValue && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="hv-search__clear"
                  title="Clear search"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              )}

              <kbd className="hv-search__kbd">⌘K</kbd>
            </div>

            {/* Dropdown suggestions */}
            {searchValue && (
              <div className="hv-search-dropdown">
                {searchRoutes
                  .filter((route) =>
                    route.keywords.some((kw) => kw.includes(searchValue.toLowerCase()))
                  )
                  .slice(0, 5)
                  .map((route) => (
                    <button
                      type="button"
                      key={route.path}
                      onClick={() => handleQuickSearch(route.keywords[0])}
                      className="hv-search-dropdown__item"
                    >
                      <Search size={13} strokeWidth={1.8} style={{ opacity: 0.4, flexShrink: 0 }} />
                      <div>
                        <p className="hv-search-dropdown__label">{route.keywords[0]}</p>
                        <p className="hv-search-dropdown__path">{route.path}</p>
                      </div>
                    </button>
                  ))}

                <button type="submit" className="hv-search-dropdown__submit">
                  Search for &ldquo;{searchValue}&rdquo;
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right actions */}
        <div className="hv-navbar__right">
          {/* Dashboard shortcut */}
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="hv-icon-btn hv-icon-btn--xl"
            title="Dashboard"
          >
            <LayoutDashboard size={18} strokeWidth={1.8} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hv-icon-btn"
            title="Toggle theme"
          >
            {theme === "dark"
              ? <Sun size={18} strokeWidth={1.8} />
              : <Moon size={18} strokeWidth={1.8} />}
          </button>

          {/* Notifications */}
          <div className="hv-dropdown-anchor" ref={notificationRef}>
            <button
              onClick={() => { setNotificationOpen((p) => !p); setProfileOpen(false); }}
              className="hv-icon-btn hv-icon-btn--notif"
              title="Notifications"
            >
              <Bell size={18} strokeWidth={1.8} />
              <span className="hv-notif-badge">8</span>
            </button>

            {notificationOpen && (
              <div className="hv-panel hv-panel--notif">
                <div className="hv-panel__head">
                  <p>Notifications</p>
                  <span className="hv-panel__badge">8 new</span>
                </div>

                <button
                  onClick={() => { setNotificationOpen(false); navigate("/admin/pending-verifications"); }}
                  className="hv-notif-item hv-notif-item--warn"
                >
                  <div className="hv-notif-item__dot" />
                  <div>
                    <p>3 pending verifications</p>
                    <small>Review new healthcare staff requests</small>
                  </div>
                </button>

                <button
                  onClick={() => { setNotificationOpen(false); navigate("/admin/settings"); }}
                  className="hv-notif-item hv-notif-item--ok"
                >
                  <div className="hv-notif-item__dot hv-notif-item__dot--green" />
                  <div>
                    <p>System running normally</p>
                    <small>All services operational</small>
                  </div>
                </button>

                <button
                  onClick={() => { setNotificationOpen(false); navigate("/admin/pending-verifications"); }}
                  className="hv-panel__cta"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="hv-dropdown-anchor" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen((p) => !p); setNotificationOpen(false); }}
              className="hv-profile-btn"
            >
              <div className="hv-avatar">
                {userInitial}
              </div>
              <div className="hv-profile-info">
                <p>{userName}</p>
                <small>Administrator</small>
              </div>
              <ChevronDown
                size={14}
                strokeWidth={2}
                style={{
                  color: "rgba(100,116,139,0.7)",
                  transition: "transform 0.2s",
                  transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {profileOpen && (
              <div className="hv-panel hv-panel--profile">
                {/* Mini profile header */}
                <div className="hv-panel-profile-head">
                  <div className="hv-avatar hv-avatar--lg">{userInitial}</div>
                  <div>
                    <p>{userName}</p>
                    <small>{user?.email || "admin@healthverify.com"}</small>
                  </div>
                </div>

                <div className="hv-panel__divider" />

                <button
                  onClick={() => { setProfileOpen(false); navigate("/admin/profile"); }}
                  className="hv-panel-item"
                >
                  <UserCircle size={16} strokeWidth={1.8} />
                  Profile
                </button>

                <button
                  onClick={() => { setProfileOpen(false); navigate("/admin/settings"); }}
                  className="hv-panel-item"
                >
                  <Settings size={16} strokeWidth={1.8} />
                  Settings
                </button>

                <div className="hv-panel__divider" />

                <button onClick={handleLogout} className="hv-panel-item hv-panel-item--danger">
                  <LogOut size={16} strokeWidth={1.8} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <style>{`
        /* ─── Navbar shell ─────────────────────────── */
        .hv-navbar {
          height: 68px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 20px 0 18px;
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(7, 15, 35, 0.88);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .hv-navbar__left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        .hv-navbar__right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        /* ─── Icon button ──────────────────────────── */
        .hv-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(148,163,184,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.16s, color 0.16s, border-color 0.16s, transform 0.16s;
          flex-shrink: 0;
        }
        .hv-icon-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #e2e8f0;
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-1px);
        }
        .hv-icon-btn:active { transform: translateY(0) scale(0.96); }

        /* Hide dashboard shortcut on smaller screens */
        .hv-icon-btn--xl { display: none; }
        @media (min-width: 1280px) { .hv-icon-btn--xl { display: flex; } }

        /* ─── Notification badge ───────────────────── */
        .hv-icon-btn--notif { position: relative; }
        .hv-notif-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 16px;
          height: 16px;
          border-radius: 6px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          animation: badgePop 2.5s ease-in-out infinite;
          border: 2px solid rgba(7,15,35,0.9);
        }
        @keyframes badgePop {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.12); }
        }

        /* ─── Search ───────────────────────────────── */
        .hv-search-wrap {
          position: relative;
          flex: 1;
          max-width: 520px;
          min-width: 0;
        }
        .hv-search {
          display: flex;
          align-items: center;
          height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          transition: border-color 0.2s, background 0.2s;
          position: relative;
        }
        .hv-search--focused,
        .hv-search:focus-within {
          border-color: rgba(59,130,246,0.4);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .hv-search__icon {
          position: absolute;
          left: 11px;
          color: rgba(100,116,139,0.6);
          pointer-events: none;
        }
        .hv-search__input {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          outline: none;
          padding: 0 80px 0 36px;
          font-size: 13px;
          color: #e2e8f0;
        }
        .hv-search__input::placeholder { color: rgba(100,116,139,0.55); }
        .hv-search__clear {
          position: absolute;
          right: 40px;
          background: none;
          border: none;
          color: rgba(100,116,139,0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.15s;
        }
        .hv-search__clear:hover { color: #e2e8f0; }
        .hv-search__kbd {
          position: absolute;
          right: 10px;
          font-size: 10px;
          color: rgba(100,116,139,0.5);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 5px;
          padding: 2px 5px;
          font-family: ui-monospace, monospace;
          pointer-events: none;
        }

        /* Suggestions dropdown */
        .hv-search-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #0c1829;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          padding: 6px;
          z-index: 999;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
          animation: dropdownIn 0.15s ease;
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hv-search-dropdown__item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          text-align: left;
          padding: 8px 10px;
          border-radius: 9px;
          background: none;
          border: none;
          color: rgba(148,163,184,0.85);
          cursor: pointer;
          transition: background 0.15s;
          margin-bottom: 1px;
        }
        .hv-search-dropdown__item:hover { background: rgba(255,255,255,0.05); }
        .hv-search-dropdown__label {
          font-size: 12.5px;
          font-weight: 500;
          color: #e2e8f0;
          margin: 0 0 1px;
          text-transform: capitalize;
        }
        .hv-search-dropdown__path {
          font-size: 10.5px;
          color: rgba(100,116,139,0.6);
          margin: 0;
          font-family: ui-monospace, monospace;
        }
        .hv-search-dropdown__submit {
          width: 100%;
          margin-top: 5px;
          height: 36px;
          border-radius: 9px;
          background: linear-gradient(90deg, rgba(59,130,246,0.85), rgba(139,92,246,0.85));
          border: none;
          color: #fff;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
        }
        .hv-search-dropdown__submit:hover { opacity: 0.9; transform: translateY(-1px); }

        /* ─── Profile button ───────────────────────── */
        .hv-profile-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 5px 10px 5px 5px;
          border-radius: 11px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer;
          transition: background 0.16s, border-color 0.16s;
          color: inherit;
        }
        .hv-profile-btn:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.12);
        }
        .hv-profile-info {
          display: none;
          flex-direction: column;
          gap: 1px;
          text-align: left;
        }
        @media (min-width: 768px) { .hv-profile-info { display: flex; } }
        .hv-profile-info p {
          font-size: 13px;
          font-weight: 500;
          color: #e2e8f0;
          margin: 0;
          white-space: nowrap;
        }
        .hv-profile-info small {
          font-size: 10.5px;
          color: rgba(100,116,139,0.65);
        }

        /* ─── Avatar ───────────────────────────────── */
        .hv-avatar {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: 0 2px 10px rgba(59,130,246,0.3);
        }
        .hv-avatar--lg {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          font-size: 15px;
        }

        /* ─── Dropdown panels ──────────────────────── */
        .hv-dropdown-anchor { position: relative; }

        .hv-panel {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          background: #0c1829;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px;
          padding: 8px;
          z-index: 999;
          box-shadow: 0 20px 50px rgba(0,0,0,0.55);
          animation: dropdownIn 0.15s ease;
        }
        .hv-panel--notif  { width: 300px; }
        .hv-panel--profile { width: 230px; }

        .hv-panel__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 8px 10px;
        }
        .hv-panel__head p {
          font-size: 13.5px;
          font-weight: 600;
          color: #e2e8f0;
          margin: 0;
        }
        .hv-panel__badge {
          font-size: 10px;
          font-weight: 600;
          background: rgba(59,130,246,0.15);
          color: #93c5fd;
          border: 1px solid rgba(59,130,246,0.2);
          border-radius: 6px;
          padding: 2px 7px;
        }

        .hv-panel__divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 6px 0;
        }

        /* Notification items */
        .hv-notif-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          text-align: left;
          padding: 10px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 5px;
          cursor: pointer;
          color: inherit;
          transition: background 0.15s;
        }
        .hv-notif-item:hover { background: rgba(255,255,255,0.06); }
        .hv-notif-item p {
          font-size: 12.5px;
          font-weight: 500;
          color: #e2e8f0;
          margin: 0 0 2px;
        }
        .hv-notif-item small {
          font-size: 11px;
          color: rgba(100,116,139,0.65);
        }
        .hv-notif-item__dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #f59e0b;
          margin-top: 4px;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(245,158,11,0.5);
        }
        .hv-notif-item__dot--green {
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34,197,94,0.5);
        }

        .hv-panel__cta {
          width: 100%;
          margin-top: 6px;
          height: 36px;
          border-radius: 9px;
          background: linear-gradient(90deg, rgba(59,130,246,0.85), rgba(139,92,246,0.85));
          border: none;
          color: #fff;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
        }
        .hv-panel__cta:hover { opacity: 0.9; transform: translateY(-1px); }

        /* Profile panel */
        .hv-panel-profile-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 6px 10px;
        }
        .hv-panel-profile-head > div p {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
          margin: 0 0 2px;
        }
        .hv-panel-profile-head > div small {
          font-size: 11px;
          color: rgba(100,116,139,0.6);
        }

        .hv-panel-item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 9px 10px;
          border-radius: 9px;
          background: none;
          border: none;
          color: rgba(148,163,184,0.85);
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          text-align: left;
          margin-bottom: 1px;
        }
        .hv-panel-item:hover {
          background: rgba(255,255,255,0.055);
          color: #e2e8f0;
        }
        .hv-panel-item--danger { color: rgba(252,165,165,0.75); }
        .hv-panel-item--danger:hover {
          background: rgba(239,68,68,0.1);
          color: #fca5a5;
        }
      `}</style>
    </>
  );
}