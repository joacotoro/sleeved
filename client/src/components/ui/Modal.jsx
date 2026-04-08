import { useEffect } from "react";

export function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-3xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-vault-dark border border-vault-border rounded-xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col animate-fade-up`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-vault-border">
            <h2 className="font-cinzel text-vault-cream text-base font-semibold tracking-wide">{title}</h2>
            <button
              onClick={onClose}
              className="text-vault-faint hover:text-vault-muted transition-colors p-1 rounded"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
