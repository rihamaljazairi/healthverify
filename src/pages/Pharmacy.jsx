import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Eye,
  Package,
  Pencil,
  Pill,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingDown,
  X,
  Save,
} from "lucide-react";

const initialMedicines = [
  {
    id: "MED-001",
    name: "Amoxicillin",
    category: "Antibiotic",
    stock: 12,
    min: 50,
    supplier: "MediSupply Lebanon",
    expiry: "2026-09-15",
    status: "Low Stock",
  },
  {
    id: "MED-002",
    name: "Insulin Pen",
    category: "Diabetes Care",
    stock: 5,
    min: 20,
    supplier: "HealthCare Pharma",
    expiry: "2026-07-30",
    status: "Critical",
  },
  {
    id: "MED-003",
    name: "Paracetamol",
    category: "Pain Relief",
    stock: 180,
    min: 60,
    supplier: "PharmaLine",
    expiry: "2027-02-10",
    status: "Available",
  },
  {
    id: "MED-004",
    name: "Vitamin D",
    category: "Supplements",
    stock: 95,
    min: 40,
    supplier: "MedPlus",
    expiry: "2027-05-21",
    status: "Available",
  },
];

export default function Pharmacy() {
  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState(initialMedicines);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewMedicine, setViewMedicine] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);

  const [restockMedicine, setRestockMedicine] = useState(null);
  const [deleteMedicine, setDeleteMedicine] = useState(null);
  const [restockAmount, setRestockAmount] = useState("20");

  const [form, setForm] = useState({
    name: "",
    category: "",
    stock: "",
    min: "",
    supplier: "",
    expiry: "",
  });

  const getStatus = (stock, min) => {
    const currentStock = Number(stock);
    const minimumStock = Number(min);

    if (currentStock <= minimumStock / 2) return "Critical";
    if (currentStock < minimumStock) return "Low Stock";
    return "Available";
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      stock: "",
      min: "",
      supplier: "",
      expiry: "",
    });

    setEditingMedicine(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (medicine) => {
    setEditingMedicine(medicine);

    setForm({
      name: medicine.name,
      category: medicine.category,
      stock: medicine.stock,
      min: medicine.min,
      supplier: medicine.supplier,
      expiry: medicine.expiry,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.category.trim() ||
      !form.stock ||
      !form.min ||
      !form.supplier.trim() ||
      !form.expiry
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (Number(form.stock) < 0 || Number(form.min) < 1) {
      alert("Stock must be 0 or more, and minimum must be at least 1.");
      return;
    }

    if (editingMedicine) {
      setMedicines((prev) =>
        prev.map((item) =>
          item.id === editingMedicine.id
            ? {
                ...item,
                name: form.name.trim(),
                category: form.category.trim(),
                stock: Number(form.stock),
                min: Number(form.min),
                supplier: form.supplier.trim(),
                expiry: form.expiry,
                status: getStatus(form.stock, form.min),
              }
            : item
        )
      );
    } else {
      const newMedicine = {
        id: `MED-${String(medicines.length + 1).padStart(3, "0")}`,
        name: form.name.trim(),
        category: form.category.trim(),
        stock: Number(form.stock),
        min: Number(form.min),
        supplier: form.supplier.trim(),
        expiry: form.expiry,
        status: getStatus(form.stock, form.min),
      };

      setMedicines((prev) => [newMedicine, ...prev]);
    }

    closeModal();
  };

  const openRestockDialog = (medicine) => {
    setRestockMedicine(medicine);
    setRestockAmount("20");
  };

  const handleRestockConfirm = () => {
    if (!restockMedicine) return;

    const addedStock = Number(restockAmount);

    if (Number.isNaN(addedStock) || addedStock <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    setMedicines((prev) =>
      prev.map((item) => {
        if (item.id !== restockMedicine.id) return item;

        const newStock = item.stock + addedStock;

        return {
          ...item,
          stock: newStock,
          status: getStatus(newStock, item.min),
        };
      })
    );

    setRestockMedicine(null);
    setRestockAmount("20");
  };

  const handleDeleteConfirm = () => {
    if (!deleteMedicine) return;

    setMedicines((prev) =>
      prev.filter((item) => item.id !== deleteMedicine.id)
    );

    setDeleteMedicine(null);
  };

  const filteredMedicines = useMemo(() => {
    const value = search.toLowerCase().trim();

    return medicines.filter((item) => {
      return (
        item.name.toLowerCase().includes(value) ||
        item.category.toLowerCase().includes(value) ||
        item.id.toLowerCase().includes(value) ||
        item.supplier.toLowerCase().includes(value) ||
        item.status.toLowerCase().includes(value)
      );
    });
  }, [search, medicines]);

  const stats = {
    total: medicines.length,
    available: medicines.filter((m) => m.status === "Available").length,
    low: medicines.filter((m) => m.status === "Low Stock").length,
    critical: medicines.filter((m) => m.status === "Critical").length,
  };

  return (
    <div className="relative p-8 max-w-[1600px] mx-auto animate-fade-in overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-4">
              <Pill size={16} />
              Hospital Pharmacy Control
            </div>

            <h1 className="text-4xl font-black text-white mb-3">
              Pharmacy Inventory
            </h1>

            <p className="text-slate-400">
              Monitor medication stock, low inventory alerts, suppliers, and
              expiry dates.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="h-14 px-6 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold flex items-center justify-center gap-2 transition"
          >
            <Plus size={20} />
            Add New Entry
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <PharmacyStat
            title="Total Medicines"
            value={stats.total}
            icon={<Package />}
            color="blue"
          />

          <PharmacyStat
            title="Available"
            value={stats.available}
            icon={<ShieldCheck />}
            color="green"
          />

          <PharmacyStat
            title="Low Stock"
            value={stats.low}
            icon={<TrendingDown />}
            color="yellow"
          />

          <PharmacyStat
            title="Critical"
            value={stats.critical}
            icon={<AlertTriangle />}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <ClipboardList className="text-blue-400" />
                  Medicine Stock List
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Live inventory overview for hospital pharmacy operations.
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search medicine..."
                  className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-blue-500/40"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-white/[0.03] border-b border-white/10">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Medicine
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Category
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Stock
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Supplier
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Expiry
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {filteredMedicines.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-6 py-5">
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-xs text-blue-400 font-mono">
                          {item.id}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {item.category}
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-bold text-white">
                          {item.stock} units
                        </p>
                        <p className="text-xs text-slate-500">
                          Minimum: {item.min}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-slate-400">
                        {item.supplier}
                      </td>

                      <td className="px-6 py-5 text-slate-400">
                        {item.expiry}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewMedicine(item)}
                            className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition flex items-center justify-center"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => openEditModal(item)}
                            className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition flex items-center justify-center"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => openRestockDialog(item)}
                            className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition flex items-center justify-center"
                            title="Restock"
                          >
                            <RefreshCcw size={16} />
                          </button>

                          <button
                            onClick={() => setDeleteMedicine(item)}
                            className="w-9 h-9 rounded-xl bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredMedicines.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-16 text-center text-slate-500"
                      >
                        No medicines found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl p-6 shadow-2xl">
            <h3 className="font-black flex items-center gap-2 text-red-400 mb-5">
              <AlertTriangle size={20} />
              Low Stock Alerts
            </h3>

            <div className="space-y-4">
              {medicines.filter((item) => item.stock < item.min).length ===
                0 && (
                <p className="text-sm text-slate-400">
                  No low stock alerts now.
                </p>
              )}

              {medicines
                .filter((item) => item.stock < item.min)
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-sm text-red-300 mt-1">
                      Only {item.stock} remaining
                    </p>
                    <p className="text-xs text-slate-500">
                      Minimum required: {item.min}
                    </p>

                    <button
                      onClick={() => openRestockDialog(item)}
                      className="mt-4 w-full h-10 rounded-xl bg-red-500/15 text-red-200 border border-red-500/20 hover:bg-red-500/25 transition text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <RefreshCcw size={16} />
                      Restock Now
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-950 border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">
                {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
              </h2>

              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <InputField
                label="Medicine Name"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
                placeholder="Example: Panadol"
              />

              <InputField
                label="Category"
                value={form.category}
                onChange={(value) => setForm({ ...form, category: value })}
                placeholder="Example: Pain Relief"
              />

              <InputField
                label="Stock"
                type="number"
                value={form.stock}
                onChange={(value) => setForm({ ...form, stock: value })}
                placeholder="Example: 100"
              />

              <InputField
                label="Minimum Stock"
                type="number"
                value={form.min}
                onChange={(value) => setForm({ ...form, min: value })}
                placeholder="Example: 30"
              />

              <InputField
                label="Supplier"
                value={form.supplier}
                onChange={(value) => setForm({ ...form, supplier: value })}
                placeholder="Example: MediSupply"
              />

              <InputField
                label="Expiry Date"
                type="date"
                value={form.expiry}
                onChange={(value) => setForm({ ...form, expiry: value })}
              />

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-12 flex-1 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="h-12 flex-1 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {editingMedicine ? "Save Updates" : "Save Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMedicine && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-slate-950 border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">
                Medicine Details
              </h2>

              <button
                onClick={() => setViewMedicine(null)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Detail label="ID" value={viewMedicine.id} />
              <Detail label="Name" value={viewMedicine.name} />
              <Detail label="Category" value={viewMedicine.category} />
              <Detail label="Stock" value={`${viewMedicine.stock} units`} />
              <Detail label="Minimum Stock" value={viewMedicine.min} />
              <Detail label="Supplier" value={viewMedicine.supplier} />
              <Detail label="Expiry Date" value={viewMedicine.expiry} />

              <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-4">
                <span className="text-slate-400 text-sm">Status</span>
                <StatusBadge status={viewMedicine.status} />
              </div>

              <button
                onClick={() => {
                  setViewMedicine(null);
                  openEditModal(viewMedicine);
                }}
                className="w-full h-12 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition"
              >
                Edit This Medicine
              </button>
            </div>
          </div>
        </div>
      )}

      {restockMedicine && (
        <RestockDialog
          medicine={restockMedicine}
          amount={restockAmount}
          setAmount={setRestockAmount}
          onCancel={() => setRestockMedicine(null)}
          onConfirm={handleRestockConfirm}
        />
      )}

      {deleteMedicine && (
        <DeleteDialog
          medicine={deleteMedicine}
          onCancel={() => setDeleteMedicine(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

function RestockDialog({
  medicine,
  amount,
  setAmount,
  onCancel,
  onConfirm,
}) {
  const previewStock = Number(medicine.stock) + Number(amount || 0);

  return (
    <div className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-emerald-500/20 bg-slate-950 shadow-2xl p-8">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center mb-5">
          <RefreshCcw size={30} />
        </div>

        <h2 className="text-3xl font-black text-white mb-3">
          Restock Medicine
        </h2>

        <p className="text-slate-400 leading-relaxed mb-6">
          Add new stock units for{" "}
          <span className="text-white font-black">{medicine.name}</span>.
        </p>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-5">
          <p className="text-sm text-slate-400">Current Stock</p>
          <p className="text-2xl font-black text-white">
            {medicine.stock} units
          </p>
        </div>

        <label className="block text-sm font-bold text-slate-300 mb-2">
          Units to Add
        </label>

        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-500/40"
        />

        <div className="mt-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
          <p className="text-emerald-200 text-sm">
            New stock after restock:{" "}
            <span className="font-black">{previewStock || medicine.stock}</span>{" "}
            units
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onCancel}
            className="h-12 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="h-12 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black flex items-center gap-2"
          >
            <RefreshCcw size={18} />
            Confirm Restock
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteDialog({ medicine, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-red-500/20 bg-slate-950 shadow-2xl p-8">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center justify-center mb-5">
          <AlertTriangle size={30} />
        </div>

        <h2 className="text-3xl font-black text-white mb-3">
          Delete Medicine?
        </h2>

        <p className="text-slate-400 leading-relaxed">
          You are about to permanently delete{" "}
          <span className="text-white font-black">{medicine.name}</span>.
          This action cannot be undone.
        </p>

        <div className="mt-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-red-200 text-sm">
            Medicine ID: <span className="font-black">{medicine.id}</span>
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onCancel}
            className="h-12 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="h-12 px-5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black flex items-center gap-2"
          >
            <Trash2 size={18} />
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function PharmacyStat({ title, value, icon, color }) {
  const styles = {
    blue: "border-blue-500/20 text-blue-400 bg-blue-500/10",
    green: "border-emerald-500/20 text-emerald-400 bg-emerald-500/10",
    yellow: "border-amber-500/20 text-amber-400 bg-amber-500/10",
    red: "border-red-500/20 text-red-400 bg-red-500/10",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-6 shadow-2xl">
      <div
        className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${styles[color]}`}
      >
        {icon}
      </div>

      <p className="text-sm text-slate-500 mb-2">{title}</p>

      <h3 className="text-4xl font-black text-white">{value}</h3>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Available:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    "Low Stock":
      "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Critical: "bg-red-500/15 text-red-400 border-red-500/20",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${
        styles[status] || styles.Available
      }`}
    >
      {status}
    </span>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-300 mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40"
      />
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-4">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white font-bold text-sm">{value}</span>
    </div>
  );
}