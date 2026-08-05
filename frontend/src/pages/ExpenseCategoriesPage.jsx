import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Pencil, Trash2, ArrowLeft, Plus } from "lucide-react";
import api from "../api/client";
import { PAGE_TABLE, PAGE_TABLE_WRAP, PageStack } from "../components/TableCard";
import { TableSkeleton } from "../components/Skeleton";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";

const TYPES = [
  { value: "operational", label: "Operasional" },
  { value: "alat", label: "Alat" },
  { value: "pos", label: "POS" },
  { value: "lainnya", label: "Lainnya" },
];

export default function ExpenseCategoriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", type: "operational" });
  const [delId, setDelId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/expense-categories");
      setRows(data.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm({ name: "", type: "operational", id: null });
    setModal("edit");
  }

  function openEdit(r) {
    setForm({ id: r.id, name: r.name, type: r.type || "operational" });
    setModal("edit");
  }

  async function save(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return toast.error("Nama wajib");
    const t = toast.loading("Menyimpan...");
    try {
      if (form.id) await api.put(`/api/expense-categories/${form.id}`, { name, type: form.type });
      else await api.post("/api/expense-categories", { name, type: form.type });
      toast.success("Disimpan", { id: t });
      setModal(null);
      load();
    } catch {
      toast.dismiss(t);
    }
  }

  return (
    <PageStack>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kategori pengeluaran</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/app/expenses"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <ArrowLeft className="h-4 w-4" /> Pengeluaran
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Tambah Kategori
          </button>
        </div>
      </div>

      <div className={PAGE_TABLE_WRAP}>
        {loading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : (
          <table className={PAGE_TABLE}>
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                <th className="px-4 py-3 text-left font-semibold">Tipe</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 capitalize">{r.type || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        onClick={() => openEdit(r)}
                        title="Edit kategori"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => setDelId(r.id)}
                        title="Hapus kategori"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal === "edit"} title={form.id ? "Edit kategori" : "Kategori baru"} onClose={() => setModal(null)}>
        <form className="space-y-3" onSubmit={save}>
          <div>
            <label className="text-xs text-slate-500">Nama</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Tipe</label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setModal(null)}>
              Batal
            </button>
            <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">
              Simpan
            </button>
            {form.id ? (
              <button type="button" className="rounded-xl border border-red-200 px-4 py-2 text-red-600" onClick={() => setDelId(form.id)}>
                Hapus
              </button>
            ) : null}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!delId}
        title="Hapus kategori?"
        message="Kategori yang sudah dipakai di aliran kas tetap aman di data historis; penghapusan hanya menghapus master kategori."
        danger
        onClose={() => setDelId(null)}
        onConfirm={async () => {
          await api.delete(`/api/expense-categories/${delId}`);
          toast.success("Dihapus");
          setDelId(null);
          setModal(null);
          load();
        }}
      />
    </PageStack>
  );
}
