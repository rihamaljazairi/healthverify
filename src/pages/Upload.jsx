import { useState } from "react";
import { storage, auth, db } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import "../styles/styles.css";

// Same Flask backend the Flutter app calls (services/ai_service.dart -> AiService.verifyFace)
const AI_BASE_URL = "http://127.0.0.1:5000";

export default function Upload() {
  const [documentFile, setDocumentFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [faceResult, setFaceResult] = useState(null);
  const navigate = useNavigate();

  const onDoc = e => {
    const f = e.target.files[0];
    if (f) {
      setDocumentFile(f);
      setDocPreview(URL.createObjectURL(f));
    }
  };

  const onSelfie = e => {
    const f = e.target.files[0];
    if (f) {
      setSelfieFile(f);
      setSelfiePreview(URL.createObjectURL(f));
    }
  };

  // Calls the real Flask/DeepFace backend (mirrors AiService.verifyFace in the Flutter app).
  // This is the single source of truth for faceMatch/confidence/riskLevel/recommendation —
  // we do NOT recompute thresholds on the client, same rule as ai_service.py and the
  // Flutter UploadDocumentsScreen follow.
  const verifyFaceWithBackend = async ({ userId, documentFile, selfieFile }) => {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("document", documentFile, documentFile.name || "document.jpg");
    formData.append("selfie", selfieFile, selfieFile.name || "selfie.jpg");

    const response = await fetch(`${AI_BASE_URL}/verify-face`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "AI verification failed.");
    }

    return data;
  };

  const handleUpload = async () => {
    setError("");
    setSuccess("");
    setFaceResult(null);

    if (!documentFile) return setError("Please upload your ID document.");
    if (!selfieFile) return setError("Please upload your selfie.");

    const user = auth.currentUser;
    if (!user) return setError("You are not logged in.");

    setLoading(true);

    try {
      // Upload document
      const docRef = ref(storage, `documents/${user.uid}/${documentFile.name}`);
      await uploadBytes(docRef, documentFile);
      const documentURL = await getDownloadURL(docRef);

      // Upload selfie
      const selfieRef = ref(storage, `selfies/${user.uid}/${selfieFile.name}`);
      await uploadBytes(selfieRef, selfieFile);
      const selfieURL = await getDownloadURL(selfieRef);

      const userRef = doc(db, "users", user.uid);

      // Save URLs immediately so they're not lost if AI call fails
      await updateDoc(userRef, { documentURL, selfieURL });

      // Real AI call — same backend, same multipart fields ("document", "selfie")
      // that the Flutter app sends.
      let aiResult;
      try {
        aiResult = await verifyFaceWithBackend({
          userId: user.uid,
          documentFile,
          selfieFile,
        });
      } catch (aiError) {
        console.error("AI VERIFY ERROR:", aiError);
        // Fall back to a safe "needs manual review" state instead of faking success
        aiResult = {
          faceMatch: false,
          confidence: 0,
          aiScore: 0,
          documentConfidence: 0,
          aiProcessingStatus: "failed",
          faceMatchStatus: "failed",
          ocrStatus: "not_applicable",
          documentCheckStatus: "failed",
          verificationStatus: "ai_failed",
          recommendation: "manual_review",
          riskLevel: "unknown",
        };
        setError(
          "AI verification service could not be reached. Your documents were saved and will need manual admin review."
        );
      }

      const isMatch = aiResult.faceMatch === true;

      // Write the SAME fields the Flutter app writes, so PendingVerifications.jsx
      // (admin dashboard) sees identical data regardless of upload platform.
      await updateDoc(userRef, {
        documentURL,
        selfieURL,

        status: "pending",
        verificationStatus: aiResult.verificationStatus || "ai_checked",
        approved: false,
        rejected: false,

        documentsUploaded: true,
        profileCompleted: true,

        documentUploadedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        faceMatch: isMatch,
        confidence: aiResult.confidence ?? 0,
        aiScore: aiResult.aiScore ?? 0,
        documentConfidence: aiResult.documentConfidence ?? 0,

        aiProcessingStatus: aiResult.aiProcessingStatus || "completed",
        documentCheckStatus: aiResult.documentCheckStatus || "passed",
        ocrStatus: aiResult.ocrStatus || "not_applicable",
        faceMatchStatus: aiResult.faceMatchStatus || (isMatch ? "passed" : "failed"),

        // Read directly from Flask's response — never recomputed on the client,
        // matching ai_service.py's _build_decision() as the single source of truth.
        riskLevel: aiResult.riskLevel || "unknown",
        verificationRecommendation: aiResult.recommendation || "manual_review",
      });

      setFaceResult({
        isMatch,
        confidence: aiResult.confidence ?? 0,
      });

      setSuccess(
        "Documents uploaded successfully! Your verification is now pending admin review."
      );
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
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
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/upload" className="nav-link active">Documents</Link>
        </div>
        <Link to="/dashboard">
          <button className="btn btn-ghost btn-sm">← Back</button>
        </Link>
      </nav>

      <div className="page-wrap page-wrap-md animate-fadeUp">
        <div className="page-header">
          <div className="page-title">Upload Verification Documents</div>
          <div className="page-subtitle">
            Submit your ID and selfie for AI-powered identity verification
          </div>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}
        {success && <div className="alert alert-success">✓ {success}</div>}

        {faceResult && (
          <div className={`alert ${faceResult.isMatch ? "alert-success" : "alert-error"}`}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 3 }}>
                {faceResult.isMatch ? "✓ Face Match Successful" : "✗ Face Match Failed"}
              </div>
              <div style={{ fontSize: 13 }}>
                AI confidence score: <strong>{faceResult.confidence}%</strong>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          
          {/* ID Document */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><div className="card-icon">🪪</div> ID Document</div>
            </div>

            <label htmlFor="doc-input">
              <div className={`dropzone ${documentFile ? "active" : ""}`}>
                {docPreview
                  ? <img src={docPreview} alt="preview" className="preview-img" />
                  : <>
                      <div className="dropzone-icon">📄</div>
                      <div className="dropzone-text">Click to select document</div>
                    </>
                }
              </div>
            </label>

            <input id="doc-input" type="file" accept="image/*,.pdf" onChange={onDoc} style={{ display: "none" }} />
          </div>

          {/* Selfie */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><div className="card-icon">📸</div> Verification Selfie</div>
            </div>

            <label htmlFor="selfie-input">
              <div className={`dropzone ${selfieFile ? "active" : ""}`}>
                {selfiePreview
                  ? <img src={selfiePreview} alt="preview" className="preview-img" />
                  : <>
                      <div className="dropzone-icon">🤳</div>
                      <div className="dropzone-text">Click to select selfie</div>
                    </>
                }
              </div>
            </label>

            <input id="selfie-input" type="file" accept="image/*" onChange={onSelfie} style={{ display: "none" }} />
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Submit for Verification →"}
        </button>
      </div>
    </div>
  );
}