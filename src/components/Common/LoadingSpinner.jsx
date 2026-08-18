import { Loader2, ShieldCheck } from "lucide-react";

export default function LoadingSpinner({
  title = "Loading Dashboard",
  subtitle = "Preparing secure healthcare environment...",
  fullScreen = true,
}) {
  return (
    <div
      className={`
        ${
          fullScreen ? "min-h-screen" : "min-h-[300px]"
        }
        relative overflow-hidden
        flex items-center justify-center
        bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
      `}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse" />

        <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Card */}
      <div
        className="
          relative z-10
          w-full max-w-md
          rounded-3xl
          border border-white/10
          bg-white/5
          backdrop-blur-2xl
          p-10
          shadow-2xl
          text-center
        "
      >
        {/* Logo */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-blue-500/20 blur-3xl" />

          <div
            className="
              relative
              w-24 h-24
              rounded-3xl
              bg-blue-500/10
              border border-blue-500/20
              flex items-center justify-center
            "
          >
            <ShieldCheck
              className="text-blue-400"
              size={42}
            />

            <Loader2
              className="
                absolute
                -top-2 -right-2
                text-cyan-400
                animate-spin
              "
              size={24}
            />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-3xl font-black tracking-tight text-white mb-3">
          {title}
        </h2>

        <p className="text-slate-400 leading-relaxed mb-8">
          {subtitle}
        </p>

        {/* Progress */}
        <div className="space-y-3">
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-pulse" />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Secure connection established
          </div>
        </div>
      </div>
    </div>
  );
}