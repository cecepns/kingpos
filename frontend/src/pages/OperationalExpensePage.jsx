import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Pencil, Trash2, FolderTree, Plus } from "lucide-react";
import api from "../api/client";
import { fetchAllPages } from "../api/fetchAllPages";
import { PAGE_SIZE } from "../constants/pagination";
import { formatIDR, formatReportDateCell } from "../utils/format";
import { PAGE_TABLE, PAGE_TABLE_WRAP, PageStack } from "../components/TableCard";
import { TableSkeleton } from "../components/Skeleton";
import { PaginationBar } from "../components/PaginationBar";
import { EmptyTableRow } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import AppDatePicker from "../components/AppDatePicker";

function splitDescription(desc) {
  const s = String(desc || "");
  const i = s.indexOf(" — ");
  if (i === -1) return { purpose: s, keterangan: "" };
  return { purpose: s.slice(0, i), keterangan: s.slice(i + 3) };
}

export default function OperationalExpensePage() {
  const [nextCode, setNextCode] = useState("000001");
  const [accounts, setAccounts] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [purposeName, setPurposeName] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [flowDate, setFlowDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState("");
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cashAccountId, setCashAccountId] = useState("");
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newAccountModalOpen, setNewAccountModalOpen] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({ name: "", type: "kas", balance: "0" });

  const [editRow, setEditRow] = useState(null);
  const [editPurpose, setEditPurpose] = useState("");
  const [editKeterangan, setEditKeterangan] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editFlowDate, setEditFlowDate] = useState("");
  const [editCashAccountId, setEditCashAccountId] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  async function refreshPreview() {
    try {
      const { data } = await api.get("/api/cash-flows/next-code");
      if (data?.code) setNextCode(data.code);
    } catch {
      /* */
    }
  }

  async function reloadAccounts() {
    try {
      const acc = await fetchAllPages("/api/cash-accounts");
      setAccounts(acc);
      if (acc.length && !cashAccountId) setCashAccountId(String(acc[0].id));
      return acc;
    } catch {
      return [];
    }
  }

  async function loadRecent() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/cash-flows", { params: { page, limit: PAGE_SIZE, type: "out" } });
      setRows(data.data || []);
      setTotal(Number(data.total ?? 0));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await reloadAccounts();
      try {
        const cats = await fetchAllPages("/api/expense-categories");
        setExpenseCats(cats);
        if (cats.length) setExpenseCategoryId(String(cats[0].id));
      } catch {
        /* */
      }
      refreshPreview();
    })();
  }, []);

  useEffect(() => {
    loadRecent();
  }, [page]);

  function openCreateModal() {
    setPurposeName("");
    setAmount("");
    setKeterangan("");
    setFlowDate(new Date().toISOString().slice(0, 10));
    setCreateModalOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    const num = Number.parseInt(amount.replace(/\D/g, ""), 10);
    if (!purposeName.trim()) return toast.error("Nama keperluan wajib diisi");
    if (!expenseCategoryId) return toast.error("Pilih jenis pengeluaran");
    if (!Number.isFinite(num) || num <= 0) return toast.error("Biaya harus lebih dari 0");
    const fullDesc = keterangan.trim() ? `${purposeName.trim()} — ${keterangan.trim()}` : purposeName.trim();

    const t = toast.loading("Menyimpan pengeluaran...");
    try {
      await api.post("/api/cash-flows", {
        type: "out",
        cash_account_id: Number(cashAccountId || accounts[0]?.id),
        expense_category_id: Number(expenseCategoryId),
        amount: num,
        flow_date: flowDate,
        description: fullDesc,
      });
      toast.success("Pengeluaran disimpan", { id: t });
      setCreateModalOpen(false);
      setPurposeName("");
      setAmount("");
      setKeterangan("");
      refreshPreview();
      loadRecent();
      await reloadAccounts();
    } catch {
      toast.dismiss(t);
    }
  }

  async function createNewAccount(e) {
    e.preventDefault();
    const name = newAccountForm.name.trim();
    if (!name) return toast.error("Nama rekening/kas wajib diisi");
    const bal = Number(newAccountForm.balance.replace(/\D/g, "") || 0);
    const t = toast.loading("Menambah rekening kas...");
    try {
      const { data } = await api.post("/api/cash-accounts", {
        name,
        type: newAccountForm.type,
        balance: bal,
      });
      toast.success("Rekening baru berhasil dibuat", { id: t });
      setNewAccountModalOpen(false);
      setNewAccountForm({ name: "", type: "kas", balance: "0" });
      const updatedAcc = await reloadAccounts();
      if (data?.id) {
        setCashAccountId(String(data.id));
        setEditCashAccountId(String(data.id));
      }
    } catch {
      toast.dismiss(t);
    }
  }

  function openEdit(r) {
    if (r.reference && String(r.reference).startsWith("trx:")) {
      toast.error("Pengeluaran dari penjualan tidak bisa diubah di sini");
      return;
    }
    if (r.type && r.type !== "out") {
      toast.error("Hanya pengeluaran (keluar) yang bisa diedit di halaman ini");
      return;
    }
    const { purpose, keterangan } = splitDescription(r.description);
    setEditRow(r);
    setEditPurpose(purpose);
    setEditKeterangan(keterangan);
    setEditCategoryId(r.category_id ? String(r.category_id) : "");
    setEditAmount(String(Math.round(Number(r.amount) || 0)));
    setEditFlowDate(String(r.flow_date || "").slice(0, 10));
    setEditCashAccountId(String(r.cash_account_id));
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editRow) return;
    const name = editPurpose.trim();
    if (!name) return toast.error("Nama keperluan wajib");
    const amt = Number(editAmount);
    if (!amt || amt <= 0) return toast.error("Biaya tidak valid");
    const accId = Number(editCashAccountId || accounts[0]?.id);
    if (!accId) return toast.error("Belum ada rekening kas");
    const desc = editKeterangan.trim() ? `${name} — ${editKeterangan.trim()}` : name;
    const t = toast.loading("Menyimpan...");
    try {
      await api.put(`/api/cash-flows/${editRow.id}`, {
        cash_account_id: accId,
        amount: amt,
        expense_category_id: editCategoryId ? Number(editCategoryId) : null,
        description: desc,
        flow_date: editFlowDate,
      });
      toast.success("Diperbarui", { id: t });
      setEditRow(null);
      loadRecent();
      await reloadAccounts();
    } catch {
      toast.dismiss(t);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const t = toast.loading("Menghapus...");
    try {
      await api.delete(`/api/cash-flows/${deleteId}`);
      toast.success("Pengeluaran dihapus", { id: t });
      setDeleteId(null);
      refreshPreview();
      loadRecent();
      await reloadAccounts();
    } catch {
      toast.dismiss(t);
    }
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageStack>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengeluaran operasional</h1>
          <p className="text-sm text-slate-500">Catat dan kelola pengeluaran operasional toko</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/app/expense-categories"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FolderTree className="h-4 w-4" /> Kelola kategori
          </Link>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Catat Pengeluaran
          </button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Riwayat pengeluaran terbaru (global kas)</h2>
        <div className={PAGE_TABLE_WRAP}>
          {!loading ? (
            <table className={PAGE_TABLE}>
              <thead className="bg-slate-50 dark:bg-slate-800/80">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Kategori</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Jumlah</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Keterangan</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.length === 0 ? (
                  <EmptyTableRow
                    colSpan={5}
                    title="Belum ada pengeluaran"
                    description="Pengeluaran operasional toko yang dicatat akan muncul di sini"
                  />
                ) : (
                  rows.map((r) => {
                    const trxLocked = r.reference && String(r.reference).startsWith("trx:");
                    return (
                      <tr key={r.id}>
                        <td className="px-4 py-3">{formatReportDateCell(r.flow_date)}</td>
                        <td className="px-4 py-3 text-sm">{r.expense_category_name || "—"}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">{formatIDR(r.amount)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{r.description}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {!trxLocked ? (
                              <button
                                type="button"
                                className="rounded-lg p-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30"
                                title="Edit"
                                onClick={() => openEdit(r)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Hapus"
                              onClick={() => setDeleteId(r.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <TableSkeleton rows={5} cols={5} />
          )}
        </div>
        <div className="flex items-center justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
          <PaginationBar page={page} pages={pages} setPage={setPage} variant="compact" />
        </div>
      </div>

      <Modal open={createModalOpen} title="Catat Pengeluaran Operasional" onClose={() => setCreateModalOpen(false)} wide>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500">Kode Pratinjau</label>
            <input readOnly className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950" value={nextCode} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-500">Akun Kas / Rekening</label>
              <button
                type="button"
                onClick={() => setNewAccountModalOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Rekening
              </button>
            </div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={cashAccountId || ""}
              onChange={(e) => setCashAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatIDR(a.balance)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Nama Keperluan</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={purposeName}
              onChange={(e) => setPurposeName(e.target.value)}
              placeholder="Misal: Bayar listrik toko / Pembelian ATK"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Kategori Biaya</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={expenseCategoryId}
              onChange={(e) => setExpenseCategoryId(e.target.value)}
              required
            >
              <option value="">— Pilih Kategori —</option>
              {expenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">Jumlah Biaya (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 14))}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Tanggal Pengeluaran</label>
              <div className="mt-1">
                <AppDatePicker value={flowDate} onChange={(val) => setFlowDate(val)} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Keterangan Tambahan</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Opsional"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700" onClick={() => setCreateModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700">
              Simpan Pengeluaran
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={newAccountModalOpen} title="Tambah Rekening Kas Baru" onClose={() => setNewAccountModalOpen(false)}>
        <form onSubmit={createNewAccount} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Nama Rekening / Kas</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={newAccountForm.name}
              onChange={(e) => setNewAccountForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Misal: Kas Utama / BCA Toko"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Tipe Akun</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={newAccountForm.type}
              onChange={(e) => setNewAccountForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="kas">Kas Tunai</option>
              <option value="bank">Bank / Transfer</option>
              <option value="ewallet">E-Wallet / QRIS</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Saldo Awal (Rp)</label>
            <input
              type="text"
              inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={newAccountForm.balance}
              onChange={(e) => setNewAccountForm((f) => ({ ...f, balance: e.target.value.replace(/\D/g, "") }))}
              placeholder="0"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => setNewAccountModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft">
              Simpan Rekening
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editRow} title="Edit Pengeluaran" onClose={() => setEditRow(null)} wide>
        <form className="grid max-w-xl gap-3" onSubmit={saveEdit}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-500">Akun Kas</label>
              <button
                type="button"
                onClick={() => setNewAccountModalOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Rekening
              </button>
            </div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={editCashAccountId}
              onChange={(e) => setEditCashAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatIDR(a.balance)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Nama Keperluan</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={editPurpose}
              onChange={(e) => setEditPurpose(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Jenis Pengeluaran</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
            >
              <option value="">— Pilih —</option>
              {expenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">Biaya</label>
              <input
                type="text"
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, "").slice(0, 14))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Tanggal</label>
              <div className="mt-1">
                <AppDatePicker value={editFlowDate} onChange={(val) => setEditFlowDate(val)} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Keterangan</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={editKeterangan}
              onChange={(e) => setEditKeterangan(e.target.value)}
              placeholder="Opsional"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => setEditRow(null)}>
              Batal
            </button>
            <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Hapus pengeluaran?"
        message="Entri akan dihapus dan saldo kas dikembalikan sesuai jumlah ini."
        danger
        confirmText="Hapus"
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </PageStack>
  );
}
