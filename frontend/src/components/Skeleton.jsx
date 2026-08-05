import { Loader2 } from "lucide-react";

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800 ${className}`} />;
}

export function TableSkeleton({ text = "Memuat data..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-7 w-7 animate-spin text-brand-600 dark:text-brand-400" />
      <span className="text-xs font-medium">{text}</span>
    </div>
  );
}
