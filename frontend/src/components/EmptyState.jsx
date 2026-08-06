import emptyVector from "../assets/empty-vector.png";

export function EmptyState({
  title = "Tidak ada data",
  description = "Belum ada data yang tersedia",
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}>
      <img
        src={emptyVector}
        alt="Empty state"
        className="h-36 w-auto max-w-[200px] object-contain opacity-90 transition-opacity hover:opacity-100"
      />
      <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      {description ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>
      ) : null}
    </div>
  );
}

export function EmptyTableRow({ colSpan = 1, title, description }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center">
        <EmptyState title={title} description={description} />
      </td>
    </tr>
  );
}
