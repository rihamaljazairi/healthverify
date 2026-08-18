import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const defaultSettings = {
  darkMode: true,
  language: "en",
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appSettings, setAppSettings] = useState(defaultSettings);
  const [mounted, setMounted] = useState(false);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem("healthVerifySettings");

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);

        setAppSettings({
          ...defaultSettings,
          ...parsed,
        });

        document.documentElement.classList.toggle("dark", parsed.darkMode ?? true);
        document.documentElement.setAttribute(
          "data-theme",
          parsed.darkMode ? "dark" : "light"
        );

        document.documentElement.lang = parsed.language || "en";
        document.documentElement.dir = parsed.language === "ar" ? "rtl" : "ltr";
      } else {
        setAppSettings(defaultSettings);

        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
        document.documentElement.lang = "en";
        document.documentElement.dir = "ltr";
      }
    } catch (error) {
      console.error("Failed to load layout settings:", error);
    }
  };

  useEffect(() => {
    loadSettings();
    const timer = setTimeout(() => setMounted(true), 50);

    const handleSettingsChange = () => {
      loadSettings();
    };

    window.addEventListener("storage", handleSettingsChange);
    window.addEventListener("settingsChanged", handleSettingsChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", handleSettingsChange);
      window.removeEventListener("settingsChanged", handleSettingsChange);
    };
  }, []);

  const isDark = appSettings.darkMode !== false;
  const isArabic = appSettings.language === "ar";

  return (
    <div
      className={`admin-shell ${isDark ? "theme-dark" : "theme-light"} ${
        isArabic ? "lang-ar" : "lang-en"
      } ${mounted ? "shell-mounted" : ""}`}
      data-theme={isDark ? "dark" : "light"}
      data-language={appSettings.language}
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Ambient background orbs — purely decorative depth */}
      <div className="ambient-orb ambient-orb--1" aria-hidden="true" />
      <div className="ambient-orb ambient-orb--2" aria-hidden="true" />
      <div className="ambient-orb ambient-orb--3" aria-hidden="true" />

      <Sidebar isOpen={sidebarOpen} />

      <main className={sidebarOpen ? "admin-main open" : "admin-main collapsed"}>
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <section className="admin-scroll-area">
          <div className="admin-page-container">
            <Outlet />
          </div>
        </section>
      </main>

      <style>{`
        .admin-shell {
          position: relative;
          overflow: hidden;
        }

        /* Fade-in on mount */
        .admin-shell.shell-mounted .admin-main {
          animation: shellFadeIn 0.4s ease both;
        }

        @keyframes shellFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Ambient depth orbs */
        .ambient-orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(90px);
          opacity: 0.07;
          animation: orbDrift 20s ease-in-out infinite alternate;
        }
        .ambient-orb--1 {
          width: 600px; height: 600px;
          background: #3b82f6;
          top: -200px; left: -100px;
          animation-duration: 22s;
        }
        .ambient-orb--2 {
          width: 400px; height: 400px;
          background: #8b5cf6;
          bottom: -100px; right: 200px;
          animation-duration: 18s;
          animation-delay: -8s;
        }
        .ambient-orb--3 {
          width: 300px; height: 300px;
          background: #06b6d4;
          top: 40%; left: 40%;
          animation-duration: 25s;
          animation-delay: -14s;
          opacity: 0.04;
        }

        @keyframes orbDrift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(40px, 30px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}