import { useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  FileX,
  HelpCircle,
  Loader2,
  LogOut,
  Mail,
  ShieldX,
  XCircle,
} from "lucide-react";

import { auth } from "../config/firebase";

export default function Rejected() {
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
      setLoggingOut(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white flex items-center justify-center px-6 py-12">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-red-500/20 bg-slate-900/80 backdrop-blur-2xl p-10 lg:p-14 shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-400 to-red-500" />

          <div className="text-center mb-10">
            <div className="relative w-28 h-28 mx-auto mb-8">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse" />

              <div className="relative w-full h-full rounded-full border-4 border-red-500/30 bg-red-500/10 flex items-center justify-center">
                <ShieldX className="text-red-400" size={52} />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6">
              <AlertTriangle size={16} />
              Verification Failed
            </div>

            <h1 className="text-5xl font-black tracking-tight mb-5 bg-gradient-to-r from-red-300 via-rose-300 to-red-400 bg-clip-text text-transparent">
              Account Rejected
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed max-w-xl mx-auto">
              Your healthcare account registration was not approved. Please
              contact the administrator or review your submitted documents.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            <ReasonBox
              icon={<FileX />}
              title="Documents"
              value="Not Accepted"
            />

            <ReasonBox
              icon={<ShieldX />}
              title="Identity"
              value="Not Verified"
            />

            <ReasonBox
              icon={<HelpCircle />}
              title="Action"
              value="Contact Admin"
            />
          </div>

          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 mb-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-300 flex-shrink-0">
                <XCircle size={24} />
              </div>

              <div>
                <h3 className="text-lg font-black text-red-300 mb-2">
                  Why was this rejected?
                </h3>

                <p className="text-sm text-red-100/80 leading-relaxed">
                  This may happen if the uploaded documents are unclear,
                  expired, incomplete, or do not match the submitted identity
                  information.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 mb-10">
            <h3 className="text-xl font-black mb-5">
              Recommended Next Steps
            </h3>

            <div className="space-y-4">
              <StepItem text="Review your uploaded identification and license documents." />
              <StepItem text="Make sure your name, role, and license number are correct." />
              <StepItem text="Contact the administrator for manual review or resubmission." />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="
                h-14 rounded-2xl
                bg-gradient-to-r from-slate-700 to-slate-800
                hover:from-slate-600 hover:to-slate-700
                text-white font-bold
                shadow-xl
                transition-all duration-300
                hover:scale-[1.02]
                disabled:opacity-60
                disabled:hover:scale-100
                flex items-center justify-center gap-3
              "
            >
              {loggingOut ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut size={20} />
                  Return to Login
                </>
              )}
            </button>

            <a
              href="mailto:admin@healthverify.com"
              className="
                h-14 rounded-2xl
                bg-red-500/10 border border-red-500/20
                text-red-300 font-bold
                hover:bg-red-500/20
                transition-all duration-300
                flex items-center justify-center gap-3
              "
            >
              <Mail size={20} />
              Contact Admin
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

function ReasonBox({ icon, title, value }) {
  return (
    <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-red-300">
      <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
        {icon}
      </div>

      <p className="text-sm opacity-80 mb-1">{title}</p>

      <h3 className="text-lg font-black">{value}</h3>
    </div>
  );
}

function StepItem({ text }) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
      <span>{text}</span>
    </div>
  );
}