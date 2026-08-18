import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function SuccessAlert({
  message,
  onClose,
  autoClose = true,
  duration = 4000,
}) {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!autoClose) return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setClosing(true);

    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 250);
  };

  if (!visible || !message) return null;

  return (
    <div
      className={`
        relative overflow-hidden
        rounded-2xl border border-emerald-500/20
        bg-emerald-500/10
        backdrop-blur-xl
        p-4 mb-6
        shadow-lg shadow-emerald-500/10
        transition-all duration-300
        ${closing ? "opacity-0 scale-95" : "opacity-100 scale-100"}
      `}
    >
      {/* Top Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500" />

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="
            w-10 h-10
            rounded-xl
            bg-emerald-500/15
            border border-emerald-500/20
            flex items-center justify-center
            flex-shrink-0
          "
        >
          <CheckCircle2
            className="text-emerald-400"
            size={20}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-emerald-300 font-bold mb-1">
            Operation Successful
          </h4>

          <p className="text-sm text-emerald-100/90 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={handleClose}
          className="
            w-9 h-9
            rounded-xl
            flex items-center justify-center
            text-emerald-300
            hover:text-white
            hover:bg-emerald-500/20
            transition-all
            flex-shrink-0
          "
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}