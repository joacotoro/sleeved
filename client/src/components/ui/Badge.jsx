export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-vault-card text-vault-muted border border-vault-border",
    success: "bg-green-950/60 text-green-400 border border-green-900/50",
    warning: "bg-amber-950/60 text-amber-400 border border-amber-900/50",
    danger:  "bg-red-950/60 text-red-400 border border-red-900/50",
    info:    "bg-blue-950/60 text-blue-400 border border-blue-900/50",
    gold:    "bg-vault-gold/10 text-vault-gold border border-vault-gold/25",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function FormatBadge({ format }) {
  const colorMap = {
    Standard:  "info",
    Pioneer:   "info",
    Modern:    "info",
    Legacy:    "warning",
    Vintage:   "gold",
    Commander: "success",
    Pauper:    "default",
    Draft:     "default",
  };
  return <Badge variant={colorMap[format] ?? "default"}>{format}</Badge>;
}
