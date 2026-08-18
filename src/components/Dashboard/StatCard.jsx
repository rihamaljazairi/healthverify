import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const colorStyles = {
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: "text-blue-400",
    glow: "shadow-blue-500/10",
    trend: "text-blue-400",
  },

  green: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "text-emerald-400",
    glow: "shadow-emerald-500/10",
    trend: "text-emerald-400",
  },

  yellow: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "text-amber-400",
    glow: "shadow-amber-500/10",
    trend: "text-amber-400",
  },

  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: "text-purple-400",
    glow: "shadow-purple-500/10",
    trend: "text-purple-400",
  },

  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: "text-red-400",
    glow: "shadow-red-500/10",
    trend: "text-red-400",
  },
};

export default function StatCard({
  title,
  value,
  icon,
  color = "blue",
  trend,
}) {
  const styles = colorStyles[color] || colorStyles.blue;

  const isNegative =
    trend?.toLowerCase()?.includes("-") ||
    trend?.toLowerCase()?.includes("decline");

  return (
    <div
      className={`
        relative overflow-hidden
        rounded-3xl border
        ${styles.border}
        bg-slate-900/70
        backdrop-blur-xl
        p-6
        shadow-2xl
        ${styles.glow}
        transition-all duration-300
        hover:scale-[1.02]
        hover:border-white/20
      `}
    >
      {/* Background Glow */}
      <div
        className={`
          absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20
          ${styles.bg}
        `}
      />

      <div className="relative z-10">
        {/* Top */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-sm text-slate-400 font-medium mb-2">
              {title}
            </p>

            <h2 className="text-4xl font-black tracking-tight text-white">
              {typeof value === "number"
                ? value.toLocaleString()
                : value}
            </h2>
          </div>

          <div
            className={`
              w-14 h-14 rounded-2xl flex items-center justify-center
              ${styles.bg}
              border ${styles.border}
              ${styles.icon}
            `}
          >
            {icon}
          </div>
        </div>

        {/* Bottom */}
        {trend && (
          <div className="flex items-center gap-2">
            <div
              className={`
                flex items-center gap-1 text-sm font-semibold
                ${styles.trend}
              `}
            >
              {isNegative ? (
                <ArrowDownRight size={16} />
              ) : (
                <ArrowUpRight size={16} />
              )}

              {trend}
            </div>

            <span className="text-xs text-slate-500">
              from last period
            </span>
          </div>
        )}
      </div>
    </div>
  );
}