import { useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import "../styles/styles.css";

export default function Verify() {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleIcons = {
    doctor: "🩺",
    nurse: "💉",
    pharmacist: "💊",
    technician: "🔬",
    admin: "🛡️",
  };

  const normalizedSearch = useMemo(() => {
    return search.trim().toLowerCase();
  }, [search]);

  const getVerificationLevel = (staff) => {
    if (!staff) return "Not Verified";

    if (staff.approved === true && staff.faceMatch === true) {
      return "Fully Verified";
    }

    if (staff.approved === true) {
      return "Approved";
    }

    return "Not Verified";
  };

  const getConfidenceValue = (staff) => {
    if (!staff) return "—";

    if (staff.confidence !== undefined && staff.confidence !== null) {
      return `${staff.confidence}%`;
    }

    if (staff.faceMatch === true) {
      return "Passed";
    }

    return "Not available";
  };

  const handleSearch = async () => {
    if (!normalizedSearch) {
      setError("Please enter a name, email, or license number to search.");
      setSearched(false);
      setResult(null);
      return;
    }

    setError("");
    setLoading(true);
    setSearched(false);
    setResult(null);

    try {
      const snap = await getDocs(collection(db, "users"));
      let found = null;

      snap.forEach((docSnap) => {
        const data = docSnap.data();

        const name = data.name?.toLowerCase() || "";
        const email = data.email?.toLowerCase() || "";
        const license = data.licenseNumber?.toLowerCase() || "";

        const isApproved = data.approved === true;

        const isMatch =
          name === normalizedSearch ||
          email === normalizedSearch ||
          license === normalizedSearch ||
          name.includes(normalizedSearch);

        if (isMatch && isApproved && !found) {
          found = {
            id: docSnap.id,
            ...data,
          };
        }
      });

      setResult(found);
      setSearched(true);
    } catch (err) {
      console.error(err);
      setError("Search failed. Please check Firebase connection and try again.");
      setSearched(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearch("");
    setResult(null);
    setSearched(false);
    setError("");
  };

  const handleCopyVerification = async () => {
    if (!result) {
      setError("No verification result to copy.");
      return;
    }

    const text = `
HealthVerify Staff Verification Result

Name: ${result.name || "—"}
Role: ${result.role || "—"}
Department: ${result.department || "—"}
Email: ${result.email || "—"}
Hospital: ${result.hospitalName || "—"}
License Number: ${result.licenseNumber || "—"}
Approval Status: ${result.approved ? "Approved" : "Not Approved"}
Face Verification: ${
      result.faceMatch !== undefined
        ? result.faceMatch
          ? `Passed (${result.confidence || "—"}%)`
          : "Failed"
        : "Not available"
    }
Verification Level: ${getVerificationLevel(result)}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      setError("");
      alert("Verification result copied successfully.");
    } catch {
      setError("Copy failed. Please try again.");
    }
  };

  return (
    <div className="bg-app">
      <nav className="navbar">
        <Link to="/dashboard" className="navbar-brand">
          <div className="navbar-logo">🏥</div>
          <span className="navbar-name">HealthVerify</span>
        </Link>

        <div className="navbar-nav">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>

          <Link to="/verify" className="nav-link active">
            Verify Staff
          </Link>
        </div>

        <Link to="/dashboard">
          <button className="btn btn-ghost btn-sm">← Back</button>
        </Link>
      </nav>

      <div className="page-wrap page-wrap-md animate-fadeUp">
        <div className="page-header">
          <div className="page-title">Verify Healthcare Staff</div>

          <div className="page-subtitle">
            Search by full name, email, or license number to confirm a healthcare
            staff member&apos;s verified status.
          </div>
        </div>

        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-header">
            <div className="card-title">
              <div className="card-icon">🔍</div>
              Staff Lookup
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>

              <input
                className="search-input"
                type="text"
                placeholder="Enter full name, email, or license number"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearched(false);
                  setResult(null);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <button
              className="btn btn-outline"
              onClick={handleSearch}
              disabled={loading}
              style={{ width: "auto" }}
            >
              {loading ? "Searching…" : "Search"}
            </button>

            {search && (
              <button
                className="btn btn-ghost"
                onClick={handleClear}
                disabled={loading}
                style={{ width: "auto" }}
              >
                Clear
              </button>
            )}
          </div>

          <p
            style={{
              fontSize: 12,
              color: "var(--gray-400)",
              marginTop: 8,
            }}
          >
            Enter the healthcare professional&apos;s exact name, email, or license
            number to verify their credentials.
          </p>
        </div>

        {loading && (
          <div
            className="card animate-fadeUp"
            style={{
              textAlign: "center",
              padding: "3rem",
            }}
          >
            <div style={{ fontSize: 42, marginBottom: "1rem" }}>⏳</div>

            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--blue-900)",
                marginBottom: "0.5rem",
              }}
            >
              Searching verification database...
            </div>

            <div style={{ fontSize: 14, color: "var(--gray-500)" }}>
              Please wait while HealthVerify checks the staff record.
            </div>
          </div>
        )}

        {searched && result && !loading && (
          <div
            className="card animate-fadeUp"
            style={{
              border: "1.5px solid rgba(5,150,105,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--success-bg)",
                    border: "1px solid rgba(5,150,105,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  ✓
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--blue-900)",
                    }}
                  >
                    Identity Verified
                  </div>

                  <div style={{ fontSize: 12, color: "var(--success)" }}>
                    Officially registered healthcare staff member
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span className="badge badge-approved">✓ Approved</span>

                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleCopyVerification}
                  style={{ width: "auto" }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="divider" />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--blue-50)",
                  border: "2px solid var(--blue-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {result.imageURL ? (
                  <img
                    src={result.imageURL}
                    alt={result.name || "Staff profile"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  roleIcons[result.role?.toLowerCase()] || "🏥"
                )}
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--blue-900)",
                    marginBottom: 2,
                  }}
                >
                  {result.name || "Unnamed Staff"}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "var(--gray-500)",
                    textTransform: "capitalize",
                  }}
                >
                  {result.role || "Healthcare Staff"}
                  {result.department ? ` · ${result.department}` : ""}
                </div>
              </div>
            </div>

            <div className="info-grid" style={{ marginBottom: "1.5rem" }}>
              {[
                { label: "Email", value: result.email || "—" },
                { label: "Hospital", value: result.hospitalName || "—" },
                {
                  label: "Verification Level",
                  value: getVerificationLevel(result),
                },
                {
                  label: "AI Face Confidence",
                  value: getConfidenceValue(result),
                },
                result.faceMatch !== undefined && {
                  label: "Face Verified",
                  value: result.faceMatch
                    ? `✅ Passed (${result.confidence || "—"}%)`
                    : "❌ Failed",
                },
                result.licenseNumber && {
                  label: "License",
                  value: result.licenseNumber,
                },
              ]
                .filter(Boolean)
                .map((item, i) => (
                  <div className="info-item" key={i}>
                    <div className="info-label">{item.label}</div>

                    <div className="info-value" style={{ fontSize: 14 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
            </div>

            <div
              className="alert"
              style={{
                background: "rgba(5,150,105,0.08)",
                border: "1px solid rgba(5,150,105,0.18)",
                color: "var(--success)",
              }}
            >
              This staff member exists in the Firestore users collection and is
              marked as approved by the administrator.
            </div>
          </div>
        )}

        {searched && !result && !loading && (
          <div
            className="card animate-fadeUp"
            style={{
              border: "1.5px solid rgba(220,38,38,0.2)",
              textAlign: "center",
              padding: "3rem",
            }}
          >
            <div style={{ fontSize: 44, marginBottom: "1rem" }}>🔎</div>

            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--blue-900)",
                marginBottom: "0.5rem",
              }}
            >
              No verified staff found
            </div>

            <div style={{ fontSize: 14, color: "var(--gray-500)" }}>
              No approved staff member matching <strong>&quot;{search}&quot;</strong>{" "}
              was found.
              <br />
              Check the spelling, email, license number, or contact your
              administrator.
            </div>
          </div>
        )}

        {!searched && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon">🏥</div>

            <div className="empty-state-text">
              Enter a staff member&apos;s full name, email, or license number above
              to verify their credentials.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}