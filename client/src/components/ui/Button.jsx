export function Button({ children, variant = "primary", size = "md", className = "", disabled, ...props }) {
  const base = "inline-flex items-center justify-center font-body font-medium rounded-lg transition-all duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary:   "bg-vault-gold hover:bg-vault-gold-light text-vault-black focus:ring-2 focus:ring-vault-gold/40",
    secondary: "bg-vault-card hover:bg-vault-raised text-vault-cream border border-vault-border hover:border-vault-border-light",
    danger:    "bg-red-900/60 hover:bg-red-800/70 text-red-300 border border-red-900/50",
    ghost:     "hover:bg-vault-card text-vault-muted hover:text-vault-cream",
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs gap-1",
    md: "px-4 py-2 text-sm gap-1.5",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
