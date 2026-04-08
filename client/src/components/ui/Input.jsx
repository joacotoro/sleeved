const inputBase = "input-vault w-full rounded-lg px-3 py-2 text-sm";
const labelBase = "block text-xs text-vault-muted font-cinzel tracking-widest uppercase mb-1.5";

export function Input({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className={labelBase}>{label}</label>}
      <input
        className={`${inputBase} ${error ? "border-red-800" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className = "", children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className={labelBase}>{label}</label>}
      <select
        className={`input-vault w-full rounded-lg px-3 py-2 text-sm ${error ? "border-red-800" : ""} ${className}`}
        style={{ colorScheme: "dark" }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className={labelBase}>{label}</label>}
      <textarea
        className={`${inputBase} resize-none ${error ? "border-red-800" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}
