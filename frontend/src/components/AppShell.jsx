import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Scan,
  Package,
  FolderOpen,
  FolderTree,
  Printer,
  ClipboardList,
  SlidersHorizontal,
  AlertTriangle,
  Banknote,
  Users,
  Truck,
  Landmark,
  Receipt,
  Wallet,
  BarChart3,
  Shield,
  Settings,
  Menu,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
} from "lucide-react";
import api from "../api/client";
import { useAuthStore, roleLabel } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import toast from "react-hot-toast";
import clsx from "clsx";
import logoSrc from "../assets/logo.png";

/* ───────────────────────── Grouped Navigation ───────────────────────── */

const navGroups = [
  {
    // Items tanpa group header (top-level)
    items: [
      {
        to: "/app/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "kasir", "owner"],
        perm: "dashboard",
      },
      {
        to: "/app/pos",
        label: "POS",
        icon: ShoppingCart,
        roles: ["admin", "kasir", "owner"],
        perm: "pos",
      },
      // {
      //   to: "/price-checker",
      //   label: "Cek Harga",
      //   icon: Scan,
      //   roles: ["admin", "kasir", "owner"],
      // },
    ],
  },
  {
    group: "Produk & Stok",
    items: [
      {
        to: "/app/products",
        label: "Barang",
        icon: Package,
        roles: ["admin", "owner"],
        perm: "products",
      },
      {
        to: "/app/categories",
        label: "Kategori",
        icon: FolderOpen,
        roles: ["admin", "owner"],
        perm: "categories",
      },
      {
        to: "/app/barcode-labels",
        label: "Cetak barcode",
        icon: Printer,
        roles: ["admin", "owner"],
        perm: "barcode_labels",
      },
      {
        to: "/app/stock-summary",
        label: "Data stok",
        icon: ClipboardList,
        roles: ["admin", "owner"],
        perm: "stock_summary",
      },
      {
        to: "/app/stock-adjust",
        label: "Penyesuaian stok",
        icon: SlidersHorizontal,
        roles: ["admin", "owner"],
        perm: "stock_adjust",
      },
      {
        to: "/app/low-stock",
        label: "Stok menipis",
        icon: AlertTriangle,
        roles: ["admin", "owner"],
        perm: "low_stock",
      },
    ],
  },
  {
    group: "Transaksi",
    items: [
      {
        to: "/app/transactions",
        label: "Transaksi",
        icon: Receipt,
        roles: ["admin", "kasir", "owner"],
        perm: "transactions",
      },
      {
        to: "/app/customers",
        label: "Pelanggan",
        icon: Users,
        roles: ["admin", "kasir", "owner"],
        perm: "customers",
      },
      {
        to: "/app/suppliers",
        label: "Supplier",
        icon: Truck,
        roles: ["admin", "owner"],
        perm: "suppliers",
      },
      {
        to: "/app/supplier-payables",
        label: "Hutang supplier",
        icon: Landmark,
        roles: ["admin", "owner"],
        perm: "suppliers",
      },
    ],
  },
  {
    group: "Keuangan",
    items: [
      {
        to: "/app/expenses",
        label: "Pengeluaran",
        icon: Banknote,
        roles: ["admin", "owner"],
        perm: "expenses",
      },
      {
        to: "/app/expense-categories",
        label: "Kat. pengeluaran",
        icon: FolderTree,
        roles: ["admin", "owner"],
        perm: "expense_categories",
      },
      {
        to: "/app/cash-flow",
        label: "Cash Flow",
        icon: Wallet,
        roles: ["admin", "owner"],
        perm: "cashflow",
      },
      {
        to: "/app/reports",
        label: "Laporan",
        icon: BarChart3,
        roles: ["admin", "owner"],
        perm: "reports",
      },
    ],
  },
  {
    group: "Pengaturan",
    items: [
      {
        to: "/app/users",
        label: "Pengguna & akses",
        icon: Shield,
        roles: ["admin"],
        perm: "users",
      },
      {
        to: "/app/settings",
        label: "Pengaturan",
        icon: Settings,
        roles: ["admin"],
        perm: "settings",
      },
    ],
  },
];

/* ─────────────────────────── Helpers ─────────────────────────── */

function canAccessNavItem(user, item) {
  if (!user?.role_name) return false;
  const perms = user.permissions || [];
  const hasAll = perms.includes("all");
  if (item.perm && (hasAll || perms.includes(item.perm))) return true;
  if (!item.roles.includes(user.role_name)) return false;
  if (!perms.length) return true;
  if (hasAll) return true;
  return item.perm ? perms.includes(item.perm) : true;
}

/** Check if any path in a group matches current location */
function isGroupActive(items, pathname) {
  return items.some((item) => pathname.startsWith(item.to));
}

/* ───────────────────── NavGroup Component ───────────────────── */

function NavGroup({ group, items, user, onNavClick }) {
  const location = useLocation();
  const filtered = items.filter((n) => canAccessNavItem(user, n));
  const hasActiveChild = isGroupActive(filtered, location.pathname);
  const [expanded, setExpanded] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setExpanded(true);
  }, [hasActiveChild]);

  if (filtered.length === 0) return null;

  if (!group) {
    return (
      <div className="space-y-1">
        {filtered.map((item) => (
          <SidebarLink key={item.to} item={item} onClick={onNavClick} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className={clsx(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
          hasActiveChild
            ? "text-brand-600 dark:text-brand-400"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
        )}
      >
        {group}
        <ChevronDown
          className={clsx(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>
      <div
        className={clsx(
          "overflow-hidden transition-all duration-200",
          expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="space-y-1 pb-1 pt-1">
          {filtered.map((item) => (
            <SidebarLink key={item.to} item={item} onClick={onNavClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── SidebarLink Component ──────────────────── */

function SidebarLink({ item, onClick }) {
  const linkCls = ({ isActive }) =>
    clsx(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
      isActive
        ? "bg-brand-600 text-white shadow-soft"
        : "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
    );

  return (
    <NavLink to={item.to} className={linkCls} onClick={onClick}>
      <item.icon className="h-[18px] w-[18px] shrink-0" />
      {item.label}
    </NavLink>
  );
}

/* ──────────────────────── AppShell ──────────────────────── */

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [loadingStoreName, setLoadingStoreName] = useState(true);
  const dark = useThemeStore((s) => s.dark);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const initTheme = useThemeStore((s) => s.init);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (!user) {
      setLoadingStoreName(false);
      return;
    }
    setLoadingStoreName(true);
    api
      .get("/api/settings", { skipToast: true })
      .then(({ data }) => {
        const n = String(data?.store_name ?? "").trim();
        setStoreName(n || "KingPOS");
      })
      .catch(() => setStoreName("KingPOS"))
      .finally(() => setLoadingStoreName(false));
  }, [user]);

  const sidebarTitle = storeName || "KingPOS";

  function handleLogout() {
    logout();
    toast.success("Keluar");
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen min-w-0 bg-slate-50 dark:bg-slate-950">
      {/* ──────── Sidebar ──────── */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo & Title */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
          <img
            src={logoSrc}
            alt="Logo"
            className="h-9 w-9 shrink-0 rounded-lg object-contain"
          />
          <div className="min-w-0 flex-1">
            {loadingStoreName ? (
              <div className="space-y-1">
                <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ) : (
              <>
                <div
                  className="truncate text-sm font-bold leading-tight tracking-tight text-slate-900 dark:text-white"
                  title={sidebarTitle}
                >
                  {sidebarTitle}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Point of Sale
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 scrollbar-thin">
          {navGroups.map((section, idx) => (
            <NavGroup
              key={section.group || idx}
              group={section.group}
              items={section.items}
              user={user}
              onNavClick={() => setOpen(false)}
            />
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
          <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800">
            <div className="font-semibold text-slate-900 dark:text-white">
              {user?.name}
            </div>
            <div className="text-slate-500">{roleLabel(user?.role_name)}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Tutup menu"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ──────── Main Content ──────── */}
      <div className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col lg:pl-64">
        <header className="fixed top-0 left-0 right-0 z-20 flex h-14 min-w-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:left-64">
          <button
            type="button"
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-slate-500 lg:block">
            {new Intl.DateTimeFormat("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </header>
        <main className="mt-14 min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
