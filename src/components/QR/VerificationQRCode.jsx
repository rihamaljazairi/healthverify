import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, QrCode } from "lucide-react";
import { useRef, useState } from "react";

export default function VerificationQRCode({ uid, name = "Healthcare Staff" }) {
  const qrRef = useRef(null);
  const [copied, setCopied] = useState(false);

  if (!uid) return null;

  const verifyUrl = `${window.location.origin}/verify/${uid}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");

    link.href = pngUrl;
    link.download = `${name.replace(/\s+/g, "_")}_verification_qr.png`;
    link.click();
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <QrCode size={24} />
        </div>

        <div>
          <h3 className="text-xl font-black text-white">
            Public Verification QR
          </h3>
          <p className="text-sm text-slate-500">
            Scan to verify this healthcare profile.
          </p>
        </div>
      </div>

      <div
        ref={qrRef}
        className="bg-white rounded-3xl p-5 flex justify-center mb-5"
      >
        <QRCodeCanvas
          value={verifyUrl}
          size={220}
          level="H"
          includeMargin
        />
      </div>

      <p className="text-xs text-slate-500 break-all mb-5">
        {verifyUrl}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={copyLink}
          className="h-12 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition flex items-center justify-center gap-2"
        >
          <Copy size={18} />
          {copied ? "Copied" : "Copy"}
        </button>

        <button
          onClick={downloadQR}
          className="h-12 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-400 transition flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Download
        </button>
      </div>
    </div>
  );
}