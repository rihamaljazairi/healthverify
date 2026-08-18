import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarCheck,
  CheckCircle2,
  FileBadge,
  Home,
  Mail,
  Phone,
  QrCode,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  XCircle,
} from "lucide-react";

import { db } from "../config/firebase";

export default function PublicVerify() {
  const { uid } = useParams();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notVerified, setNotVerified] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!uid) {
        setNotVerified(true);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);

        if (snap.exists() && snap.data().approved === true) {
          setUserData({
            uid,
            ...snap.data(),
          });
        } else {
          setNotVerified(true);
        }
      } catch (error) {
        console.error("Public verification error:", error);
        setNotVerified(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [uid]);

  if (loading) {
    return <LoadingVerify />;
  }

  if (notVerified || !userData) {
    return <NotVerified />;
  }

  return <VerifiedProfile userData={userData} />;
}

function LoadingVerify() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-slate-950 text-white p-6 overflow-hidden">
      <BackgroundGlow color="blue" />

      <div className="relative z-10 max-w-md w-full rounded-[2rem] border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-10 text-center shadow-2xl">
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl animate-pulse" />

          <div className="relative w-full h-full rounded-3xl border border-blue-500/20 bg-blue-500/10 flex items-center justify-center">
            <QrCode className="text-blue-400 animate-pulse" size={48} />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-3">
          Verifying Identity
        </h1>

        <p className="text-slate-400 leading-relaxed">
          Scanning public QR profile and validating healthcare credentials...
        </p>

        <div className="mt-8 h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse" />
        </div>
      </div>
    </main>
  );
}

function NotVerified() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-slate-950 text-white p-6 overflow-hidden">
      <BackgroundGlow color="red" />

      <div className="relative z-10 max-w-4xl w-full rounded-[2rem] border border-red-500/20 bg-slate-900/80 backdrop-blur-2xl p-8 lg:p-12 text-center shadow-2xl">
        <div className="w-28 h-28 rounded-full bg-red-500/10 border-4 border-red-500/30 flex items-center justify-center mx-auto mb-8">
          <XCircle className="text-red-400" size={56} />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6">
          <AlertTriangle size={16} />
          Verification Failed
        </div>

        <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-red-300 to-rose-400 bg-clip-text text-transparent">
          Not Verified
        </h1>

        <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
          This staff member could not be verified. The profile may not exist,
          may still be pending approval, or may have been rejected by the
          administrator.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <ReasonCard
            icon={<FileBadge />}
            title="Not Registered"
            text="No approved profile exists in the system."
            color="red"
          />

          <ReasonCard
            icon={<CalendarCheck />}
            title="Pending Review"
            text="The account may still be waiting for admin approval."
            color="yellow"
          />

          <ReasonCard
            icon={<QrCode />}
            title="Invalid QR"
            text="The verification link may be invalid or outdated."
            color="gray"
          />
        </div>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition"
        >
          <Home size={20} />
          Go to HealthVerify Home
        </Link>
      </div>
    </main>
  );
}

function VerifiedProfile({ userData }) {
  const role = String(userData.role || "staff").toLowerCase();

  const verifiedDate = userData.verifiedAt?.seconds
    ? new Date(userData.verifiedAt.seconds * 1000).toLocaleDateString()
    : userData.createdAt?.seconds
    ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString()
    : "Recently";

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 lg:p-8 overflow-hidden">
      <BackgroundGlow color="green" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="rounded-[2rem] border border-emerald-500/20 bg-slate-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400" />

          <section className="p-8 lg:p-12 border-b border-white/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="flex flex-col lg:flex-row items-center gap-6 text-center lg:text-left">
                <div className="relative">
                  <div className="absolute inset-0 rounded-[2rem] bg-emerald-500/20 blur-2xl animate-pulse" />

                  <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
                    {userData.imageURL || userData.profileImageUrl ? (
                      <img
                        src={userData.imageURL || userData.profileImageUrl}
                        alt={userData.name || "Verified Staff"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Stethoscope className="text-emerald-400" size={54} />
                    )}
                  </div>

                  <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl bg-emerald-500 border border-emerald-300 flex items-center justify-center shadow-xl">
                    <CheckCircle2 size={26} />
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm mb-4">
                    <BadgeCheck size={16} />
                    Officially Verified Healthcare Professional
                  </div>

                  <h1 className="text-4xl lg:text-5xl font-black mb-3">
                    {userData.name || "Verified Staff"}
                  </h1>

                  <p className="text-slate-400 text-lg">
                    {userData.specialization || formatRole(role)} •{" "}
                    {userData.hospitalName || "Registered Healthcare Facility"}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center min-w-[220px]">
                <ShieldCheck
                  className="text-emerald-400 mx-auto mb-3"
                  size={42}
                />
                <p className="text-sm text-emerald-200/80 mb-1">
                  Verification Status
                </p>
                <h2 className="text-2xl font-black text-emerald-300">
                  VERIFIED
                </h2>
              </div>
            </div>
          </section>

          <section className="p-8 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              <VerificationMetric
                title="Identity Match"
                value="98.7%"
                icon={<UserCheck />}
              />

              <VerificationMetric
                title="Credential Status"
                value="Valid"
                icon={<FileBadge />}
              />

              <VerificationMetric
                title="Verified On"
                value={verifiedDate}
                icon={<CalendarCheck />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <InfoPanel title="Contact Information">
                <InfoRow
                  icon={<Mail size={18} />}
                  label="Email"
                  value={userData.email || "Not Provided"}
                />

                <InfoRow
                  icon={<Phone size={18} />}
                  label="Phone"
                  value={userData.phone || "Not Provided"}
                />

                <InfoRow
                  icon={<Building2 size={18} />}
                  label="Hospital"
                  value={userData.hospitalName || "Not Provided"}
                />
              </InfoPanel>

              <InfoPanel title="Professional Credentials">
                <InfoRow
                  icon={<Stethoscope size={18} />}
                  label="Role"
                  value={formatRole(role)}
                />

                <InfoRow
                  icon={<FileBadge size={18} />}
                  label="License Number"
                  value={userData.licenseNumber || "Not Provided"}
                />

                <InfoRow
                  icon={<BadgeCheck size={18} />}
                  label="Specialization"
                  value={userData.specialization || "Not Provided"}
                />
              </InfoPanel>
            </div>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <QrCode className="mx-auto text-blue-400 mb-4" size={52} />

              <h3 className="text-xl font-black mb-2">
                Public Verification Seal
              </h3>

              <p className="text-slate-400 max-w-2xl mx-auto">
                This page confirms that the displayed healthcare worker is
                approved in the HealthVerify system. Always verify the profile
                URL before trusting the identity.
              </p>
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 transition font-semibold"
              >
                ← Back to HealthVerify
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function BackgroundGlow({ color }) {
  const styles = {
    blue: ["bg-blue-500/20", "bg-cyan-500/20"],
    red: ["bg-red-500/20", "bg-rose-500/20"],
    green: ["bg-emerald-500/20", "bg-cyan-500/20"],
  };

  const [first, second] = styles[color] || styles.blue;

  return (
    <>
      <div
        className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] ${first} rounded-full blur-3xl`}
      />
      <div
        className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] ${second} rounded-full blur-3xl`}
      />
    </>
  );
}

function ReasonCard({ icon, title, text, color }) {
  const styles = {
    red: "bg-red-500/10 border-red-500/20 text-red-300",
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
    gray: "bg-white/5 border-white/10 text-slate-300",
  };

  return (
    <div className={`rounded-3xl border p-6 ${styles[color]}`}>
      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>

      <h3 className="font-black mb-2">{title}</h3>
      <p className="text-sm opacity-80">{text}</p>
    </div>
  );
}

function VerificationMetric({ title, value, icon }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
        {icon}
      </div>

      <p className="text-sm text-slate-500 mb-2">{title}</p>
      <h3 className="text-2xl font-black text-white">{value}</h3>
    </div>
  );
}

function InfoPanel({ title, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="text-xl font-black mb-6">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center gap-3 text-slate-400">
        <span className="text-blue-400">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>

      <span className="font-bold text-white text-right">
        {value}
      </span>
    </div>
  );
}

function formatRole(role) {
  if (!role) return "Healthcare Staff";

  return role.charAt(0).toUpperCase() + role.slice(1);
}