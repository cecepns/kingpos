import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Trash2, ShieldCheck, Shield, Save, Lock } from "lucide-react";
import api from "../api/client";
import { fetchAllPages } from "../api/fetchAllPages";
import { PAGE_SIZE } from "../constants/pagination";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PAGE_TABLE, PAGE_TABLE_WRAP, PageStack } from "../components/TableCard";
import { PaginationBar } from "../components/PaginationBar";
import { EmptyTableRow } from "../components/EmptyState";
import { useAuthStore } from "../store/authStore";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roles, setRoles] = useState([]);
  const [allPerms, setAllPerms] = useState([]);
  const [roleTab, setRoleTab] = useState("");
  const [roleCodes, setRoleCodes] = useState([]);
  const [userModal, setUserModal] = useState(null);
  const [delId, setDelId] = useState(null);
  const [uf, setUf] = useState({ name: "", email: "", password: "", role_id: "", store_id: "", is_active: true });
  const currentUserId = useAuthStore((s) => s.user?.id);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function loadUsers() {
    const { data } = await api.get("/api/users", { params: { page, limit: PAGE_SIZE } });
    setUsers(data.data || []);
    setTotal(Number(data.total ?? 0));
  }

  useEffect(() => {
    loadUsers().catch(() => {});
  }, [page]);

  useEffect(() => {
    (async () => {
      const r = await fetchAllPages("/api/roles");
      setRoles(r);
      const { data } = await api.get("/api/permissions");
      setAllPerms(data.data || []);
    })();
  }, []);

  const roleIdNum = Number(roleTab) || 0;
  useEffect(() => {
    if (!roleIdNum) return;
    api
      .get(`/api/roles/${roleIdNum}/permissions`)
      .then(({ data }) => setRoleCodes((data.data || []).map((x) => x.code)))
      .catch(() => setRoleCodes([]));
  }, [roleIdNum]);

  useEffect(() => {
    if (!roleTab && roles.length) setRoleTab(String(roles[0].id));
  }, [roles, roleTab]);

  async function saveRolePerms() {
    if (!roleIdNum) return;
    const t = toast.loading("Menyimpan hak akses...");
    try {
      await api.put(`/api/roles/${roleIdNum}/permissions`, { codes: roleCodes });
      toast.success("Hak akses diperbarui", { id: t });
    } catch {
      toast.dismiss(t);
    }
  }

  function openCreate() {
    setUf({ name: "", email: "", password: "", role_id: roles[0] ? String(roles[0].id) : "", store_id: "", is_active: true });
    setUserModal("create");
  }

  function openEdit(u) {
    setUf({
      id: u.id,
      name: u.name,
      email: u.email,
      password: "",
      role_id: String(u.role_id),
      store_id: u.store_id ? String(u.store_id) : "",
      is_active: !!u.is_active,
    });
    setUserModal("edit");
  }

  async function saveUser(e) {
    e.preventDefault();
    const t = toast.loading("Menyimpan...");
    try {
      if (userModal === "create") {
        if (!uf.password || uf.password.length < 4) {
          toast.error("Password minimal 4 karakter", { id: t });
          return;
        }
        await api.post("/api/users", {
          name: uf.name,
          email: uf.email,
          password: uf.password,
          role_id: Number(uf.role_id),
          store_id: uf.store_id ? Number(uf.store_id) : null,
        });
      } else {
        await api.put(`/api/users/${uf.id}`, {
          name: uf.name,
          email: uf.email,
          role_id: Number(uf.role_id),
          store_id: uf.store_id ? Number(uf.store_id) : null,
          is_active: uf.is_active,
          ...(uf.password ? { password: uf.password } : {}),
        });
      }
      toast.success("Disimpan", { id: t });
      setUserModal(null);
      loadUsers();
    } catch {
      toast.dismiss(t);
    }
  }

  const permRows = useMemo(() => allPerms.filter((p) => p.code !== "all"), [allPerms]);
  const isAdminRole = roleIdNum === 1;

  return (
    <PageStack>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengguna & hak akses</h1>
        <p className="text-sm text-slate-500">Kelola akun pengguna dan hak akses role</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900 dark:text-white">Daftar pengguna</h2>
          <button type="button" onClick={openCreate} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            Pengguna baru
          </button>
        </div>
        <div className={PAGE_TABLE_WRAP}>
          <table className={PAGE_TABLE}>
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="px-3 py-2 text-left">Nama</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Aktif</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.length === 0 ? (
                <EmptyTableRow
                  colSpan={5}
                  title="Belum ada akun pengguna"
                  description="Akun pengguna sistem akan muncul di sini"
                />
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                    <td className="px-3 py-2">{u.role_name}</td>
                    <td className="px-3 py-2">{u.is_active ? "Ya" : "Tidak"}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <button type="button" className="rounded-lg px-2 py-1 text-brand-600 hover:bg-slate-100 hover:underline dark:hover:bg-slate-800" onClick={() => openEdit(u)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          title={String(u.id) === String(currentUserId) ? "Tidak dapat menghapus akun sendiri" : "Hapus pengguna"}
                          disabled={String(u.id) === String(currentUserId)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/30"
                          onClick={() => setDelId(u.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
          <PaginationBar page={page} pages={pages} setPage={setPage} variant="compact" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Hak Akses Menu per Role</h2>
              <p className="text-xs text-slate-500">
                Atur dan sesuaikan izin navigasi menu yang dapat diakses oleh setiap peran (role).
              </p>
            </div>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="mb-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pilih Role
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {roles.map((r) => {
              const isActive = String(r.id) === String(roleTab);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoleTab(String(r.id))}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-600 text-white shadow-md shadow-brand-600/20 dark:bg-brand-500"
                      : "border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Shield className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{r.name}</span>
                  {r.description && (
                    <span className={`text-xs ${isActive ? "text-brand-100" : "text-slate-400"}`}>
                      ({r.description})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isAdminRole ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <h4 className="text-sm font-semibold">Role Admin Memiliki Izin Akses Penuh</h4>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                Pengguna dengan role Admin secara otomatis memiliki semua hak akses menu sistem dan tidak memerlukan konfigurasi izin terpisah di sini.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Daftar Izin Menu ({roleCodes.length} dari {permRows.length} dipilih)
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRoleCodes(permRows.map((p) => p.code))}
                  className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setRoleCodes([])}
                  className="text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
                >
                  Hapus Semua
                </button>
              </div>
            </div>

            <div className="grid max-h-80 grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
              {permRows.map((p) => {
                const isChecked = roleCodes.includes(p.code);
                return (
                  <label
                    key={p.id}
                    className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-all ${
                      isChecked
                        ? "border-brand-500/50 bg-brand-50/40 dark:border-brand-500/40 dark:bg-brand-950/20"
                        : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:checked:bg-brand-600"
                      onChange={(e) => {
                        setRoleCodes((prev) =>
                          e.target.checked ? [...new Set([...prev, p.code])] : prev.filter((c) => c !== p.code)
                        );
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{p.description}</span>
                      </div>
                      <span className="mt-0.5 inline-block font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {p.code}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={saveRolePerms}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition-all hover:bg-brand-700 active:scale-[0.98] dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                <Save className="h-4 w-4" />
                Simpan Hak Akses Role
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!delId}
        title="Hapus pengguna?"
        message="Akun login akan dihapus permanen. Tidak bisa jika pengguna punya riwayat transaksi POS."
        danger
        confirmText="Hapus"
        onConfirm={async () => {
          if (!delId) return;
          const t = toast.loading("Menghapus...");
          try {
            await api.delete(`/api/users/${delId}`, { skipToast: true });
            toast.success("Pengguna dihapus", { id: t });
            setDelId(null);
            loadUsers();
          } catch (err) {
            toast.dismiss(t);
            const msg = err.response?.data?.error || "Gagal menghapus";
            toast.error(msg);
            setDelId(null);
          }
        }}
        onClose={() => setDelId(null)}
      />

      <Modal open={!!userModal} title={userModal === "create" ? "Pengguna baru" : "Edit pengguna"} onClose={() => setUserModal(null)}>
        <form className="space-y-3" onSubmit={saveUser}>
          <div>
            <label className="text-xs text-slate-500">Nama</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={uf.name}
              onChange={(e) => setUf((x) => ({ ...x, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={uf.email}
              onChange={(e) => setUf((x) => ({ ...x, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">{userModal === "create" ? "Password" : "Password baru (opsional)"}</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={uf.password}
              onChange={(e) => setUf((x) => ({ ...x, password: e.target.value }))}
              placeholder={userModal === "create" ? "Wajib" : "Kosongkan jika tidak diubah"}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Role</label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={uf.role_id}
              onChange={(e) => setUf((x) => ({ ...x, role_id: e.target.value }))}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          {userModal === "edit" ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={uf.is_active} onChange={(e) => setUf((x) => ({ ...x, is_active: e.target.checked }))} />
              Akun aktif
            </label>
          ) : null}
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setUserModal(null)}>
              Batal
            </button>
            <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </PageStack>
  );
}
