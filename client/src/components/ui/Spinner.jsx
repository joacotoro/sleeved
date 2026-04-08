export function Spinner({ size = "md", className = "" }) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return (
    <div className={`${sizes[size]} ${className} relative`}>
      <div className={`${sizes[size]} rounded-full border border-vault-border-light border-t-vault-gold animate-spin`} />
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
      <Spinner size="lg" />
      <p className="text-vault-faint text-xs font-cinzel tracking-widest">LOADING</p>
    </div>
  );
}
