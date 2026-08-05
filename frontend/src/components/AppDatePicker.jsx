import { forwardRef } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { id } from "date-fns/locale/id";
import { Calendar } from "lucide-react";
import clsx from "clsx";

if (id) {
  registerLocale("id", id);
}

// Helper YYYY-MM-DD string to Date object
function parseDateString(str) {
  if (!str) return null;
  const parts = String(str).split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// Helper Date object to YYYY-MM-DD string
function formatDateString(d) {
  if (!d || isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const CustomInput = forwardRef(({ value, onClick, placeholder, className, disabled }, ref) => (
  <button
    type="button"
    ref={ref}
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 transition-all outline-none hover:border-brand-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-brand-400",
      className
    )}
  >
    <span className={clsx("truncate font-medium", !value && "text-slate-400 dark:text-slate-500")}>
      {value || placeholder || "Pilih tanggal"}
    </span>
    <Calendar className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
  </button>
));

CustomInput.displayName = "CustomInput";

export function AppDatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className = "",
  dateFormat = "d MMMM yyyy",
  disabled = false,
  minDate,
  maxDate,
  isClearable = false,
  name,
}) {
  const selectedDate = typeof value === "string" ? parseDateString(value) : value;

  const handleChange = (date) => {
    if (onChange) {
      const formatted = date ? formatDateString(date) : "";
      onChange(formatted, date);
    }
  };

  return (
    <div className="relative inline-block w-full">
      <DatePicker
        name={name}
        locale="id"
        selected={selectedDate}
        onChange={handleChange}
        dateFormat={dateFormat}
        customInput={<CustomInput placeholder={placeholder} className={className} disabled={disabled} />}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        isClearable={isClearable}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        popperClassName="app-datepicker-popper"
      />
    </div>
  );
}

export default AppDatePicker;
