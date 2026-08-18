import { useEffect, useState } from "react";
import {
  Bell,
  Database,
  Download,
  Eye,
  Globe,
  Lock,
  Moon,
  RefreshCcw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Upload,
  X,
} from "lucide-react";

import SuccessAlert from "../components/Common/SuccessAlert";

const defaultSettings = {
  appName: "AI HealthVerify",
  emailNotifications: true,
  securityAlerts: true,
  darkMode: true,
  language: "en",
  autoApprove: false,
  twoFactorAuth: true,
};

const translations = {
  en: {
    pageTitle: "Settings",
    subtitle:
      "Manage application preferences, security controls, and notification settings.",
    save: "Save Settings",
    reset: "Reset",
    export: "Export",
    import: "Import",
    lastSaved: "Last saved",
    general: "General Settings",
    generalSub: "Basic platform configuration",
    appName: "Application Name",
    language: "Language",
    english: "English",
    arabic: "Arabic",
    notifications: "Notifications",
    notificationsSub: "Control alerts and admin notifications",
    emailNotifications: "Email Notifications",
    emailDesc: "Receive updates about new registrations and document reviews.",
    securityAlerts: "Security Alerts",
    securityDesc: "Notify admins about suspicious login or verification attempts.",
    security: "Security",
    securitySub: "Admin access and verification rules",
    twoFactor: "Two-Factor Authentication",
    twoFactorDesc: "Require additional verification for admin accounts.",
    autoApprove: "Auto Approval",
    autoApproveDesc:
      "Automatically approve users with high AI verification confidence.",
    appearance: "Appearance",
    appearanceDesc: "Control the dashboard display mode.",
    darkMode: "Dark Mode",
    darkModeDesc: "Recommended for admin dashboards.",
    systemStatus: "System Status",
    systemDesc: "All admin services are operational.",
    firebaseAuth: "Firebase Auth",
    firestore: "Firestore Database",
    storage: "Storage",
    online: "Online",
    runCheck: "Run System Check",
    dataPolicy: "Data Policy",
    dataPolicyDesc:
      "Healthcare staff verification data should only be accessed by authorized administrators. Keep Firestore rules strict before production deployment.",
    viewPolicy: "View Policy",
  },
  ar: {
    pageTitle: "الإعدادات",
    subtitle: "إدارة إعدادات التطبيق، الأمان، والتنبيهات.",
    save: "حفظ الإعدادات",
    reset: "إعادة ضبط",
    export: "تصدير",
    import: "استيراد",
    lastSaved: "آخر حفظ",
    general: "الإعدادات العامة",
    generalSub: "إعدادات المنصة الأساسية",
    appName: "اسم التطبيق",
    language: "اللغة",
    english: "الإنجليزية",
    arabic: "العربية",
    notifications: "الإشعارات",
    notificationsSub: "التحكم بتنبيهات الإدارة",
    emailNotifications: "إشعارات البريد",
    emailDesc: "استلام تحديثات التسجيلات ومراجعة المستندات.",
    securityAlerts: "تنبيهات الأمان",
    securityDesc: "تنبيه الإدارة عند وجود محاولات دخول مشبوهة.",
    security: "الأمان",
    securitySub: "صلاحيات الإدارة وقواعد التحقق",
    twoFactor: "التحقق الثنائي",
    twoFactorDesc: "طلب تحقق إضافي لحسابات الإدارة.",
    autoApprove: "الموافقة التلقائية",
    autoApproveDesc: "قبول المستخدمين تلقائياً عند ثقة تحقق عالية.",
    appearance: "المظهر",
    appearanceDesc: "التحكم بشكل لوحة التحكم.",
    darkMode: "الوضع الليلي",
    darkModeDesc: "مناسب للوحة تحكم الإدارة.",
    systemStatus: "حالة النظام",
    systemDesc: "كل خدمات الإدارة تعمل.",
    firebaseAuth: "Firebase Auth",
    firestore: "Firestore Database",
    storage: "Storage",
    online: "متصل",
    runCheck: "فحص النظام",
    dataPolicy: "سياسة البيانات",
    dataPolicyDesc:
      "يجب الوصول إلى بيانات التحقق من قبل المسؤولين المصرح لهم فقط.",
    viewPolicy: "عرض السياسة",
  },
};

export default function Settings() {
  const [success, setSuccess] = useState("");
  const [policyOpen, setPolicyOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState("Not saved yet");
  const [settings, setSettings] = useState(defaultSettings);

  const t = translations[settings.language] || translations.en;
  const isArabic = settings.language === "ar";

  const applyGlobalSettings = (nextSettings) => {
    document.documentElement.classList.toggle("dark", nextSettings.darkMode);
    document.documentElement.setAttribute(
      "data-theme",
      nextSettings.darkMode ? "dark" : "light"
    );
    document.documentElement.lang = nextSettings.language || "en";
    document.documentElement.dir = nextSettings.language === "ar" ? "rtl" : "ltr";

    document.body.classList.toggle("bg-slate-950", nextSettings.darkMode);
    document.body.classList.toggle("bg-slate-100", !nextSettings.darkMode);

    window.dispatchEvent(new Event("settingsChanged"));
  };

  const theme = settings.darkMode
    ? {
        page: "bg-slate-950 text-white",
        card: "border-white/10 bg-slate-900/70",
        softCard: "border-white/10 bg-white/5",
        title: "text-white",
        text: "text-slate-400",
        muted: "text-slate-500",
        input:
          "bg-white/5 border-white/10 text-white placeholder:text-slate-500",
        button: "bg-white/5 border-white/10 text-white hover:bg-white/10",
        modal: "bg-slate-950 border-white/10",
      }
    : {
        page: "bg-slate-100 text-slate-950",
        card: "border-slate-200 bg-white",
        softCard: "border-slate-200 bg-slate-50",
        title: "text-slate-950",
        text: "text-slate-600",
        muted: "text-slate-500",
        input:
          "bg-white border-slate-200 text-slate-950 placeholder:text-slate-400",
        button: "bg-white border-slate-200 text-slate-900 hover:bg-slate-100",
        modal: "bg-white border-slate-200",
      };

  useEffect(() => {
    const savedSettings = localStorage.getItem("healthVerifySettings");
    const savedTime = localStorage.getItem("healthVerifySettingsSavedAt");

    if (savedSettings) {
      try {
        const parsed = {
          ...defaultSettings,
          ...JSON.parse(savedSettings),
        };

        setSettings(parsed);
        applyGlobalSettings(parsed);
      } catch {
        setSettings(defaultSettings);
        applyGlobalSettings(defaultSettings);
      }
    } else {
      applyGlobalSettings(defaultSettings);
    }

    if (savedTime) {
      setLastSaved(savedTime);
    }
  }, []);

  useEffect(() => {
    applyGlobalSettings(settings);
  }, [settings.darkMode, settings.language]);

  const updateSetting = (key, value) => {
    const updated = {
      ...settings,
      [key]: value,
    };

    setSettings(updated);
    localStorage.setItem("healthVerifySettings", JSON.stringify(updated));
    applyGlobalSettings(updated);

    if (key === "language") {
      setSuccess(value === "ar" ? "تم تغيير اللغة." : "Language changed.");
    }

    if (key === "darkMode") {
      setSuccess(value ? "Dark mode enabled." : "Light mode enabled.");
    }
  };

  const handleSave = () => {
    const savedTime = new Date().toLocaleTimeString();

    localStorage.setItem("healthVerifySettings", JSON.stringify(settings));
    localStorage.setItem("healthVerifySettingsSavedAt", savedTime);
    applyGlobalSettings(settings);

    setLastSaved(savedTime);
    setSuccess(
      settings.language === "ar"
        ? "تم حفظ الإعدادات بنجاح."
        : "Settings saved successfully."
    );
  };

  const handleReset = () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset all settings?"
    );

    if (!confirmReset) return;

    setSettings(defaultSettings);
    localStorage.setItem("healthVerifySettings", JSON.stringify(defaultSettings));
    applyGlobalSettings(defaultSettings);

    const savedTime = new Date().toLocaleTimeString();
    localStorage.setItem("healthVerifySettingsSavedAt", savedTime);

    setLastSaved(savedTime);
    setSuccess("Settings reset successfully.");
  };

  const handleExport = () => {
    const fileContent = JSON.stringify(settings, null, 2);
    const blob = new Blob([fileContent], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "healthverify-settings.json";
    link.click();

    URL.revokeObjectURL(url);
    setSuccess("Settings exported successfully.");
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const importedSettings = JSON.parse(reader.result);

        const updatedSettings = {
          ...defaultSettings,
          ...importedSettings,
        };

        setSettings(updatedSettings);
        localStorage.setItem(
          "healthVerifySettings",
          JSON.stringify(updatedSettings)
        );
        applyGlobalSettings(updatedSettings);

        setSuccess("Settings imported successfully.");
      } catch {
        alert("Invalid settings file.");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div
      className={`relative p-8 max-w-[1500px] mx-auto animate-fade-in overflow-hidden min-h-screen transition-colors duration-300 ${theme.page}`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-4">
              <SettingsIcon size={16} />
              System Configuration
            </div>

            <h1 className={`text-4xl font-black mb-3 ${theme.title}`}>
              {t.pageTitle}
            </h1>

            <p className={theme.text}>{t.subtitle}</p>

            <p className={`text-xs mt-3 ${theme.muted}`}>
              {t.lastSaved}: {lastSaved}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReset}
              className={`h-14 px-6 rounded-2xl border font-bold flex items-center justify-center gap-2 transition ${theme.button}`}
            >
              <RefreshCcw size={20} />
              {t.reset}
            </button>

            <button
              onClick={handleExport}
              className={`h-14 px-6 rounded-2xl border font-bold flex items-center justify-center gap-2 transition ${theme.button}`}
            >
              <Download size={20} />
              {t.export}
            </button>

            <label
              className={`h-14 px-6 rounded-2xl border font-bold flex items-center justify-center gap-2 transition cursor-pointer ${theme.button}`}
            >
              <Upload size={20} />
              {t.import}
              <input
                type="file"
                accept="application/json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleSave}
              className="h-14 px-6 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition"
            >
              <Save size={20} />
              {t.save}
            </button>
          </div>
        </header>

        {success && (
          <SuccessAlert message={success} onClose={() => setSuccess("")} />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="xl:col-span-2 space-y-8">
            <SettingsCard
              theme={theme}
              icon={<Globe />}
              title={t.general}
              subtitle={t.generalSub}
            >
              <TextInput
                theme={theme}
                label={t.appName}
                value={settings.appName}
                onChange={(value) => updateSetting("appName", value)}
              />

              <SelectInput
                theme={theme}
                label={t.language}
                value={settings.language}
                onChange={(value) => updateSetting("language", value)}
                options={[
                  { label: t.english, value: "en" },
                  { label: t.arabic, value: "ar" },
                ]}
              />
            </SettingsCard>

            <SettingsCard
              theme={theme}
              icon={<Bell />}
              title={t.notifications}
              subtitle={t.notificationsSub}
            >
              <ToggleRow
                theme={theme}
                title={t.emailNotifications}
                desc={t.emailDesc}
                checked={settings.emailNotifications}
                onChange={() =>
                  updateSetting(
                    "emailNotifications",
                    !settings.emailNotifications
                  )
                }
              />

              <ToggleRow
                theme={theme}
                title={t.securityAlerts}
                desc={t.securityDesc}
                checked={settings.securityAlerts}
                onChange={() =>
                  updateSetting("securityAlerts", !settings.securityAlerts)
                }
              />
            </SettingsCard>

            <SettingsCard
              theme={theme}
              icon={<Lock />}
              title={t.security}
              subtitle={t.securitySub}
            >
              <ToggleRow
                theme={theme}
                title={t.twoFactor}
                desc={t.twoFactorDesc}
                checked={settings.twoFactorAuth}
                onChange={() =>
                  updateSetting("twoFactorAuth", !settings.twoFactorAuth)
                }
              />

              <ToggleRow
                theme={theme}
                title={t.autoApprove}
                desc={t.autoApproveDesc}
                checked={settings.autoApprove}
                onChange={() =>
                  updateSetting("autoApprove", !settings.autoApprove)
                }
              />
            </SettingsCard>
          </section>

          <aside className="space-y-8">
            <div
              className={`rounded-3xl border backdrop-blur-xl shadow-2xl p-6 transition-colors duration-300 ${theme.card}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
                {settings.darkMode ? <Moon /> : <Sun />}
              </div>

              <h3 className={`text-2xl font-black mb-2 ${theme.title}`}>
                {t.appearance}
              </h3>

              <p className={`mb-6 ${theme.muted}`}>{t.appearanceDesc}</p>

              <ToggleRow
                theme={theme}
                title={t.darkMode}
                desc={t.darkModeDesc}
                checked={settings.darkMode}
                onChange={() => updateSetting("darkMode", !settings.darkMode)}
              />
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl shadow-2xl p-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <ShieldCheck />
              </div>

              <h3 className={`text-2xl font-black mb-2 ${theme.title}`}>
                {t.systemStatus}
              </h3>

              <p className="text-slate-400 mb-5">{t.systemDesc}</p>

              <div className="space-y-3">
                <StatusRow title={t.firebaseAuth} value={t.online} />
                <StatusRow title={t.firestore} value={t.online} />
                <StatusRow title={t.storage} value={t.online} />
              </div>

              <button
                onClick={() =>
                  alert("System check completed. All services are online.")
                }
                className="mt-5 w-full h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold hover:bg-emerald-500/20 transition"
              >
                {t.runCheck}
              </button>
            </div>

            <div
              className={`rounded-3xl border backdrop-blur-xl shadow-2xl p-6 transition-colors duration-300 ${theme.card}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                <Database />
              </div>

              <h3 className={`text-2xl font-black mb-2 ${theme.title}`}>
                {t.dataPolicy}
              </h3>

              <p className={`text-sm leading-relaxed ${theme.muted}`}>
                {t.dataPolicyDesc}
              </p>

              <button
                onClick={() => setPolicyOpen(true)}
                className="mt-5 w-full h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold hover:bg-purple-500/20 transition flex items-center justify-center gap-2"
              >
                <Eye size={18} />
                {t.viewPolicy}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {policyOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden ${theme.modal}`}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className={`text-2xl font-black ${theme.title}`}>
                Data Policy Details
              </h2>

              <button
                onClick={() => setPolicyOpen(false)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${theme.button}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className={`p-6 space-y-4 leading-relaxed ${theme.text}`}>
              <p>
                Healthcare verification data must be protected using strict
                Firebase security rules, role-based access, and authenticated
                admin accounts only.
              </p>

              <p>
                Sensitive files such as IDs, certificates, profile images, and
                verification results should not be public.
              </p>

              <p>
                Before production deployment, review Firestore rules, Storage
                rules, user roles, and audit logs.
              </p>

              <button
                onClick={() => setPolicyOpen(false)}
                className="w-full h-12 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-bold transition"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsCard({ theme, icon, title, subtitle, children }) {
  return (
    <div
      className={`rounded-3xl border backdrop-blur-xl shadow-2xl p-8 transition-colors duration-300 ${theme.card}`}
    >
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          {icon}
        </div>

        <div>
          <h2 className={`text-2xl font-black ${theme.title}`}>{title}</h2>
          <p className={`mt-1 ${theme.muted}`}>{subtitle}</p>
        </div>
      </div>

      <div className="space-y-5">{children}</div>
    </div>
  );
}

function TextInput({ theme, label, value, onChange }) {
  return (
    <div>
      <label className={`block text-sm mb-2 ${theme.text}`}>{label}</label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-14 rounded-2xl border px-4 outline-none focus:border-blue-500/50 transition ${theme.input}`}
      />
    </div>
  );
}

function SelectInput({ theme, label, value, onChange, options }) {
  return (
    <div>
      <label className={`block text-sm mb-2 ${theme.text}`}>{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-14 rounded-2xl border px-4 outline-none focus:border-blue-500/50 transition ${theme.input}`}
      >
        {options.map((item) => (
          <option key={item.value} value={item.value} className="bg-slate-900">
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ theme, title, desc, checked, onChange }) {
  return (
    <div
      className={`flex items-center justify-between gap-5 rounded-2xl border p-5 transition-colors duration-300 ${theme.softCard}`}
    >
      <div>
        <h3 className={`font-bold mb-1 ${theme.title}`}>{title}</h3>
        <p className={`text-sm ${theme.muted}`}>{desc}</p>
      </div>

      <button
        type="button"
        onClick={onChange}
        className={`relative min-w-14 w-14 h-8 rounded-full transition ${
          checked ? "bg-blue-500" : "bg-slate-400"
        }`}
      >
        <span
          className={`absolute top-1 w-6 h-6 rounded-full bg-white transition ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function StatusRow({ title, value }) {
  return (
    <button
      onClick={() => alert(`${title}: ${value}`)}
      className="w-full flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition"
    >
      <span className="text-sm text-slate-400">{title}</span>

      <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        {value}
      </span>
    </button>
  );
}