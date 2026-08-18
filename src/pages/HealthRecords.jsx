import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  Clipboard,
  Download,
  Eye,
  FileHeart,
  Filter,
  Heart,
  RefreshCcw,
  Search,
  ShieldCheck,
  Clock3,
  X,
  XCircle,
  Edit,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Activity,
} from "lucide-react";

import { db } from "../config/firebase";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import ErrorAlert from "../components/Common/ErrorAlert";
import SuccessAlert from "../components/Common/SuccessAlert";

export default function HealthRecords() {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "healthRecords"),
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setRecords(list);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
      },
      (err) => {
        console.error("Health records error:", err);
        setError("Failed to load health records. Check Firebase Rules and login authentication.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const searchValue = search.toLowerCase().trim();
      const patient = String(record.patient || record.patientName || "").toLowerCase();
      const type = String(record.type || record.recordType || "").toLowerCase();
      const recordId = String(record.recordId || record.id || "").toLowerCase();
      const status = String(record.status || "pending").toLowerCase();
      const email = String(record.patientEmail || "").toLowerCase();
      const matchSearch =
        !searchValue ||
        patient.includes(searchValue) ||
        type.includes(searchValue) ||
        recordId.includes(searchValue) ||
        email.includes(searchValue) ||
        status.includes(searchValue);
      const matchFilter = filter === "All" || status === filter.toLowerCase();
      return matchSearch && matchFilter;
    });
  }, [records, search, filter]);

  const stats = useMemo(() => ({
    total: records.length,
    verified: records.filter((r) => String(r.status || "").toLowerCase() === "verified").length,
    pending: records.filter((r) => String(r.status || "pending").toLowerCase() === "pending").length,
    rejected: records.filter((r) => String(r.status || "").toLowerCase() === "rejected").length,
  }), [records]);

  const handleRefresh = () => {
    setLastUpdated(new Date().toLocaleTimeString());
    setSuccess("Health records refreshed.");
  };

  const handleClear = () => {
    setSearch("");
    setFilter("All");
  };

  const handleCreateDemoRecord = async () => {
    try {
      await addDoc(collection(db, "healthRecords"), {
        recordId: `HR-${Date.now()}`,
        patient: "Demo Patient",
        patientName: "Demo Patient",
        patientEmail: "demo.patient@gmail.com",
        type: "Blood Test",
        recordType: "Blood Test",
        status: "pending",
        verificationStatus: "pending",
        fileUrl: "",
        documentUrl: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSuccess("Demo health record created successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to create demo record. Check Firebase Rules.");
    }
  };

  const handleOpenFile = (record) => {
    const url = record.fileUrl || record.documentUrl;
    if (!url) { setError("No document file is available."); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (record) => {
    const url = record.fileUrl || record.documentUrl;
    if (!url) { setError("No document file is available for download."); return; }
    const link = document.createElement("a");
    link.href = url;
    link.download = `${record.recordId || record.id || "health-record"}`;
    link.target = "_blank";
    link.click();
  };

  const handleCopy = async (record) => {
    const text = [
      `Record ID: ${record.recordId || record.id}`,
      `Patient: ${record.patient || record.patientName || "Unknown Patient"}`,
      `Email: ${record.patientEmail || "No email"}`,
      `Type: ${record.type || record.recordType || "Medical Record"}`,
      `Status: ${getStatus(record.status).label}`,
      `Date: ${formatDate(record.date || record.createdAt)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Record information copied.");
    } catch {
      setError("Copy failed. Please try again.");
    }
  };

  const handleExportList = () => {
    const content = filteredRecords
      .map((record) =>
        [
          `Record ID: ${record.recordId || record.id}`,
          `Patient: ${record.patient || record.patientName || "Unknown Patient"}`,
          `Email: ${record.patientEmail || "No email"}`,
          `Type: ${record.type || record.recordType || "Medical Record"}`,
          `Status: ${getStatus(record.status).label}`,
          `Date: ${formatDate(record.date || record.createdAt)}`,
          "----------------------------------------",
        ].join("\n")
      )
      .join("\n");
    const blob = new Blob([content || "No records found."], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "health-records-export.txt";
    link.click();
    URL.revokeObjectURL(url);
    setSuccess("Health records exported.");
  };

  const handleVerify = async (record) => {
    try {
      setProcessingId(record.id);
      await updateDoc(doc(db, "healthRecords", record.id), {
        status: "verified",
        verificationStatus: "verified",
        updatedAt: serverTimestamp(),
      });
      setSuccess("Health record verified successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to verify health record.");
    } finally {
      setProcessingId("");
    }
  };

  const handleReject = async (record) => {
    try {
      setProcessingId(record.id);
      await updateDoc(doc(db, "healthRecords", record.id), {
        status: "rejected",
        verificationStatus: "rejected",
        updatedAt: serverTimestamp(),
      });
      setSuccess("Health record rejected.");
    } catch (err) {
      console.error(err);
      setError("Failed to reject health record.");
    } finally {
      setProcessingId("");
    }
  };

  const openEdit = (record) => {
    setEditRecord(record);
    setEditForm({
      recordId: record.recordId || "",
      patient: record.patient || record.patientName || "",
      patientEmail: record.patientEmail || "",
      type: record.type || record.recordType || "",
      status: record.status || "pending",
      fileUrl: record.fileUrl || record.documentUrl || "",
    });
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveEdit = async () => {
    if (!editRecord?.id) return;
    try {
      setProcessingId(editRecord.id);
      await updateDoc(doc(db, "healthRecords", editRecord.id), {
        recordId: editForm.recordId,
        patient: editForm.patient,
        patientName: editForm.patient,
        patientEmail: editForm.patientEmail,
        type: editForm.type,
        recordType: editForm.type,
        status: editForm.status,
        verificationStatus: editForm.status,
        fileUrl: editForm.fileUrl,
        documentUrl: editForm.fileUrl,
        updatedAt: serverTimestamp(),
      });
      setSuccess("Health record updated successfully.");
      setEditRecord(null);
      setEditForm({});
    } catch (err) {
      console.error(err);
      setError("Failed to update health record.");
    } finally {
      setProcessingId("");
    }
  };

  const handleDelete = async () => {
    if (!deleteRecord?.id) return;
    try {
      setProcessingId(deleteRecord.id);
      await deleteDoc(doc(db, "healthRecords", deleteRecord.id));
      setSuccess("Health record deleted successfully.");
      setDeleteRecord(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete health record.");
    } finally {
      setProcessingId("");
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={false}
        title="Loading Health Records"
        subtitle="Fetching patient diagnostic documents..."
      />
    );
  }

  return (
    <div className="relative p-8 max-w-[1600px] mx-auto animate-fade-in overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {error && <ErrorAlert message={error} onClose={() => setError("")} />}
        {success && <SuccessAlert message={success} onClose={() => setSuccess("")} />}

        {/* ─── Header ──────────────────────────────────────────── */}
        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-4">
              <Heart size={14} fill="currentColor" />
              Patient Diagnostic Archive
            </div>
            <h1 className="text-4xl font-black text-white mb-3">
              Health Records
            </h1>
            <p className="text-slate-400">
              Manage, audit, and verify patient medical documents.
            </p>
            <p className="text-xs text-slate-500 mt-3">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              className="h-12 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition flex items-center justify-center gap-2"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
            <button
              onClick={handleCreateDemoRecord}
              className="h-12 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Demo Record
            </button>
            <button
              onClick={handleExportList}
              className="h-12 px-5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Export List
            </button>
          </div>
        </header>

        {/* ─── Stat Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          <StatCard
            title="Total Records"
            value={stats.total}
            icon={<FileHeart size={24} />}
            color="blue"
            active={filter === "All"}
            onClick={() => setFilter("All")}
          />
          <StatCard
            title="Verified"
            value={stats.verified}
            icon={<ShieldCheck size={24} />}
            color="green"
            active={filter === "Verified"}
            onClick={() => setFilter("Verified")}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Clock3 size={24} />}
            color="yellow"
            active={filter === "Pending"}
            onClick={() => setFilter("Pending")}
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={<XCircle size={24} />}
            color="red"
            active={filter === "Rejected"}
            onClick={() => setFilter("Rejected")}
          />
        </div>

        {/* ─── Search & Filter ─────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-2">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-blue-500/40 transition"
                placeholder="Search by patient, email, record ID, or type..."
              />
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 text-white outline-none focus:border-blue-500/40 transition appearance-none"
                >
                  <option className="bg-slate-900">All</option>
                  <option className="bg-slate-900">Verified</option>
                  <option className="bg-slate-900">Pending</option>
                  <option className="bg-slate-900">Rejected</option>
                </select>
              </div>
              <button
                onClick={handleClear}
                className="h-14 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition"
              >
                Clear
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Showing{" "}
            <span className="text-white font-bold">{filteredRecords.length}</span>{" "}
            of{" "}
            <span className="text-white font-bold">{records.length}</span>{" "}
            record(s)
          </p>
        </div>

        {/* ─── Records Table ────────────────────────────────────── */}
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                    Record ID
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                    Patient
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                    Type
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                    Date Issued
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                    Verification
                  </th>
                  <th className="px-6 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.04]">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <Activity className="mx-auto text-slate-700 mb-4" size={48} />
                      <p className="text-white font-black text-xl mb-2">
                        No health records found
                      </p>
                      <p className="text-slate-500 text-sm">
                        Try adjusting your search or add a demo record to get started.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const status = getStatus(record.status);
                    const StatusIcon = status.icon;

                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-white/[0.025] transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <span className="font-mono text-blue-400 text-sm font-bold">
                            {record.recordId || record.id}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 font-black text-sm flex-shrink-0">
                              {(record.patient || record.patientName || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-white text-sm">
                                {record.patient || record.patientName || "Unknown Patient"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {record.patientEmail || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-slate-300 font-semibold text-sm">
                            {record.type || record.recordType || "Medical Record"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-slate-400 text-sm">
                            {formatDate(record.date || record.createdAt)}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${status.className}`}
                          >
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-1.5 flex-wrap">
                            <ActionBtn
                              onClick={() => handleVerify(record)}
                              disabled={processingId === record.id}
                              title="Verify"
                              color="emerald"
                              icon={<CheckCircle2 size={16} />}
                            />
                            <ActionBtn
                              onClick={() => handleReject(record)}
                              disabled={processingId === record.id}
                              title="Reject"
                              color="red"
                              icon={<XCircle size={16} />}
                            />
                            <ActionBtn
                              onClick={() => setSelectedRecord(record)}
                              title="View"
                              color="blue"
                              icon={<Eye size={16} />}
                            />
                            <ActionBtn
                              onClick={() => openEdit(record)}
                              title="Edit"
                              color="purple"
                              icon={<Edit size={16} />}
                            />
                            <ActionBtn
                              onClick={() => handleOpenFile(record)}
                              title="Open File"
                              color="cyan"
                              icon={<FileHeart size={16} />}
                            />
                            <ActionBtn
                              onClick={() => handleDownload(record)}
                              title="Download"
                              color="slate"
                              icon={<Download size={16} />}
                            />
                            <ActionBtn
                              onClick={() => handleCopy(record)}
                              title="Copy"
                              color="yellow"
                              icon={<Clipboard size={16} />}
                            />
                            <ActionBtn
                              onClick={() => setDeleteRecord(record)}
                              disabled={processingId === record.id}
                              title="Delete"
                              color="red"
                              icon={<Trash2 size={16} />}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Modals ───────────────────────────────────────────── */}
      {selectedRecord && (
        <RecordModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onOpenFile={() => handleOpenFile(selectedRecord)}
          onDownload={() => handleDownload(selectedRecord)}
          onCopy={() => handleCopy(selectedRecord)}
        />
      )}
      {editRecord && (
        <EditModal
          editForm={editForm}
          onChange={handleEditChange}
          onClose={() => setEditRecord(null)}
          onSave={handleSaveEdit}
          saving={processingId === editRecord.id}
        />
      )}
      {deleteRecord && (
        <DeleteModal
          record={deleteRecord}
          onClose={() => setDeleteRecord(null)}
          onDelete={handleDelete}
          deleting={processingId === deleteRecord.id}
        />
      )}
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionBtn({ onClick, disabled, title, color, icon }) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/10",
    red: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/10",
    blue: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/10",
    purple: "bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border-purple-500/10",
    cyan: "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-cyan-500/10",
    slate: "bg-white/5 text-slate-300 hover:bg-white/10 border-white/10",
    yellow: "bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 border-yellow-500/10",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition disabled:opacity-40 ${colors[color] || colors.slate}`}
    >
      {icon}
    </button>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function RecordModal({ record, onClose, onOpenFile, onDownload, onCopy }) {
  const status = getStatus(record.status);
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-[2rem] bg-slate-950 border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <FileHeart size={18} />
            </div>
            <h2 className="text-xl font-black text-white">Record Details</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <Detail label="Record ID" value={record.recordId || record.id} />
          <Detail label="Patient" value={record.patient || record.patientName || "Unknown"} />
          <Detail label="Email" value={record.patientEmail || "No email"} />
          <Detail label="Type" value={record.type || record.recordType || "Medical Record"} />
          <Detail label="Date" value={formatDate(record.date || record.createdAt)} />

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider text-xs">
              Verification Status
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${getStatus(record.status).className}`}>
              <StatusIcon size={12} />
              {getStatus(record.status).label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <button onClick={onOpenFile} className="h-11 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-sm transition">
              Open File
            </button>
            <button onClick={onDownload} className="h-11 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10 transition">
              Download
            </button>
            <button onClick={onCopy} className="h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-black text-sm hover:bg-purple-500/20 transition">
              Copy Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ editForm, onChange, onClose, onSave, saving }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-[2rem] bg-slate-950 border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Edit size={18} />
            </div>
            <h2 className="text-xl font-black text-white">Edit Health Record</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditInput label="Record ID" name="recordId" value={editForm.recordId} onChange={onChange} />
          <EditInput label="Patient Name" name="patient" value={editForm.patient} onChange={onChange} />
          <EditInput label="Patient Email" name="patientEmail" value={editForm.patientEmail} onChange={onChange} />
          <EditInput label="Record Type" name="type" value={editForm.type} onChange={onChange} />
          <EditInput label="File URL" name="fileUrl" value={editForm.fileUrl} onChange={onChange} />
          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Status</label>
            <select
              name="status"
              value={editForm.status}
              onChange={onChange}
              className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-blue-500/40 transition"
            >
              <option className="bg-slate-900" value="pending">Pending</option>
              <option className="bg-slate-900" value="verified">Verified</option>
              <option className="bg-slate-900" value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="h-11 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10 disabled:opacity-50 transition">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} className="h-11 px-5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-black text-sm disabled:opacity-50 flex items-center gap-2 transition">
            <Save size={16} />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ record, onClose, onDelete, deleting }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-red-500/20 bg-slate-950 shadow-2xl p-8">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-6">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-3xl font-black text-white mb-3">Delete Record?</h2>
        <p className="text-slate-400 leading-relaxed">
          Permanently deleting{" "}
          <span className="text-white font-black">
            {record.recordId || record.patient || record.id}
          </span>
          . This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} disabled={deleting} className="h-11 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10 disabled:opacity-50 transition">
            Cancel
          </button>
          <button onClick={onDelete} disabled={deleting} className="h-11 px-5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-sm disabled:opacity-50 flex items-center gap-2 transition">
            <Trash2 size={16} />
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, color, active, onClick }) {
  const styles = {
    blue: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    green: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    yellow: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    red: "border-red-500/30 text-red-400 bg-red-500/10",
  };

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-3xl border bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl hover:-translate-y-1 transition-all duration-200 ${
        active ? "border-blue-500/50 ring-1 ring-blue-500/20" : "border-white/10"
      }`}
    >
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${styles[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">{title}</p>
      <h3 className="text-4xl font-black text-white">{value}</h3>
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-white font-semibold break-all">{value || "N/A"}</p>
    </div>
  );
}

function EditInput({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">{label}</label>
      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-blue-500/40 transition"
      />
    </div>
  );
}

function getStatus(status = "Pending") {
  const value = String(status || "Pending").toLowerCase();
  if (value === "verified" || value === "approved") {
    return { label: "Verified", icon: ShieldCheck, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
  }
  if (value === "rejected") {
    return { label: "Rejected", icon: XCircle, className: "bg-red-500/15 text-red-400 border-red-500/20" };
  }
  return { label: "Pending", icon: Clock3, className: "bg-amber-500/15 text-amber-400 border-amber-500/20" };
}

function formatDate(value) {
  if (!value) return "N/A";
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleDateString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
}