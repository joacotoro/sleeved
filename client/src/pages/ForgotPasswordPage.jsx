import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword({ email });
    } catch {}
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-dvh bg-vault-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-10">
          <h1 className="font-cinzel text-vault-gold text-2xl tracking-[0.25em] font-semibold mb-1">
            SLEEVED
          </h1>
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-vault-gold/50 to-transparent mx-auto" />
          <p className="text-vault-muted text-xs mt-3 tracking-wider">Reset your password</p>
        </div>

        <div className="bg-vault-card border border-vault-border rounded-2xl p-7">
          {sent ? (
            <div className="text-center py-2 space-y-2">
              <p className="text-vault-cream text-sm">
                If that email exists in our system, you'll receive reset instructions shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-vault-muted text-sm">
                Enter your email and we'll send you a link to reset your password.
              </p>
              <div>
                <label className="block text-xs text-vault-muted font-cinzel tracking-widest uppercase mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-vault w-full rounded-lg px-3 py-2.5 text-sm"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-vault-gold hover:bg-vault-gold-light disabled:opacity-40 text-vault-black font-cinzel font-semibold text-sm py-2.5 rounded-lg transition-colors tracking-widest mt-2"
              >
                {loading ? "SENDING..." : "SEND RESET LINK"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-vault-faint mt-5">
          <Link to="/login" className="text-vault-gold hover:text-vault-gold-light transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
