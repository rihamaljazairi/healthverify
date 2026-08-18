import { useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import {
  Clock3,
  Loader2,
  LogOut,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { auth } from "../config/firebase";

export default function Pending() {
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
      {/* BACKGROUND */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-3xl" />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-10 lg:p-14 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500" />

          {/* HEADER */}
          <div className="text-center mb-10">
            <div className="relative w-28 h-28 mx-auto mb-8">
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl animate-pulse" />

              <div className="relative w-full h-full rounded-full border-4 border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center">
                <Clock3
                  className="text-yellow-400 animate-pulse"
                  size={48}
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm mb-6">
              <ShieldCheck size={16} />
              Verification In Progress
            </div>

            <h1 className="text-5xl font-black tracking-tight mb-5 bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
              Pending Approval
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed max-w-xl mx-auto">
              Your healthcare account is currently being reviewed by the
              administrator. Access will be granted once identity and
              professional credentials are verified.
            </p>
          </div>

          {/* STATUS BOXES */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            <StatusBox
              title="Identity Review"
              value="In Progress"
              color="yellow"
            />

            <StatusBox
              title="License Check"
              value="Pending"
              color="orange"
            />

            <StatusBox
              title="Admin Decision"
              value="Waiting"
              color="amber"
            />
          </div>

          {/* TIMELINE */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Stethoscope size={24} />
              </div>

              <div>
                <h3 className="text-xl font-black">
                  Verification Workflow
                </h3>

                <p className="text-sm text-slate-500">
                  Current account processing stage
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <TimelineItem
                active
                title="Account Created"
                desc="Your registration information was successfully submitted."
              />

              <TimelineItem
                active
                title="Document Uploaded"
                desc="Healthcare license and identification documents received."
              />

              <TimelineItem
                loading
                title="Admin Verification"
                desc="An administrator is reviewing your account."
              />

              <TimelineItem
                disabled
                title="Final Approval"
                desc="Access will be granted after successful review."
              />
            </div>
          </div>

          {/* NOTICE */}
          <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-5 mb-10">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center text-yellow-300 flex-shrink-0">
                ⏳
              </div>

              <div>
                <h4 className="font-bold text-yellow-300 mb-2">
                  Review Time
                </h4>

                <p className="text-sm text-yellow-100/80 leading-relaxed">
                  Verification usually takes between a few minutes and 24 hours,
                  depending on document quality and administrator review queue.
                </p>
              </div>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="
              w-full h-14 rounded-2xl
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
                <Loader2
                  className="animate-spin"
                  size={20}
                />
                Logging out...
              </>
            ) : (
              <>
                <LogOut size={20} />
                Logout
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

function StatusBox({ title, value, color }) {
  const colors = {
    yellow:
      "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
    orange:
      "bg-orange-500/10 border-orange-500/20 text-orange-300",
    amber:
      "bg-amber-500/10 border-amber-500/20 text-amber-300",
  };

  return (
    <div
      className={`rounded-3xl border p-5 ${colors[color]}`}
    >
      <p className="text-sm opacity-80 mb-2">{title}</p>

      <h3 className="text-xl font-black">{value}</h3>
    </div>
  );
}

function TimelineItem({
  title,
  desc,
  active,
  loading,
  disabled,
}) {
  return (
    <div className="flex gap-4">
      <div className="pt-1">
        <div
          className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${
              active
                ? "bg-green-500 border-green-400"
                : loading
                ? "bg-yellow-500 border-yellow-400 animate-pulse"
                : "bg-white/5 border-white/10"
            }
          `}
        >
          {active && (
            <div className="w-2 h-2 rounded-full bg-white" />
          )}
        </div>
      </div>

      <div>
        <h4
          className={`
            font-bold mb-1
            ${
              disabled
                ? "text-slate-500"
                : "text-white"
            }
          `}
        >
          {title}
        </h4>

        <p
          className={`
            text-sm leading-relaxed
            ${
              disabled
                ? "text-slate-600"
                : "text-slate-400"
            }
          `}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}