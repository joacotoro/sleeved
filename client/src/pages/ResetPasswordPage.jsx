import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({ token, newPassword: form.password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-vault-black flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">Invalid reset link.</p>
          <Link to="/forgot-password" className="text-vault-gold hover:text-vault-gold-light text-sm transition-colors">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vault-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-10">
          <h1 className="font-cinzel text-vault-gold text-2xl tracking-[0.25em] font-semibold mb-1">
            SLEEVED
          </h1>
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-vault-gold/50 to-transparent mx-auto" />
          <p className="text-vault-muted text-xs mt-3 tracking-wider">Set a new password</p>
        </div>

        <div className="bg-vault-card border border-vault-border rounded-2xl p-7">
          {done ? (
            <div className="text-center py-2">
              <p className="text-vault-cream text-sm">Password updated. Redirecting to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs text-vault-muted font-cinzel tracking-widest uppercase mb-1.5">New password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="input-vault w-full rounded-lg px-3 py-2.5 text-sm"
                  placeholder="minimum 8 characters"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-vault-muted font-cinzel tracking-widest uppercase mb-1.5">Confirm password</label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="input-vault w-full rounded-lg px-3 py-2.5 text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-vault-gold hover:bg-vault-gold-light disabled:opacity-40 text-vault-black font-cinzel font-semibold text-sm py-2.5 rounded-lg transition-colors tracking-widest mt-2"
              >
                {loading ? "SAVING..." : "SET NEW PASSWORD"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
