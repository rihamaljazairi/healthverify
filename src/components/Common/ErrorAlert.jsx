import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function ErrorAlert({
  message,
  onClose,
  autoClose = true,
  duration = 5000,
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
        rounded-2xl border border-red-500/20
        bg-red-500/10 backdrop-blur-xl
        p-4 mb-6
        shadow-lg shadow-red-500/10
        transition-all duration-300
        ${closing ? "opacity-0 scale-95" : "opacity-100 scale-100"}
      `}
    >
      {/* Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-rose-400 to-red-500" />

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="text-red-400" size={20} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h4 className="text-red-300 font-bold mb-1">
            Authentication Error
          </h4>

          <p className="text-sm text-red-200/90 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={handleClose}
          className="
            w-9 h-9 rounded-xl
            flex items-center justify-center
            text-red-300 hover:text-white
            hover:bg-red-500/20
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