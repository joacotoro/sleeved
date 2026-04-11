import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.2 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.2 6.5 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.3 5.6l6.2 5.2C36.9 36.2 44 31 44 24c0-1.3-.1-2.7-.4-3.9z"/>
    </svg>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.register({ name: form.name, email: form.email, password: form.password });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-vault-black flex items-center justify-center px-4">
        <div className="text-center animate-fade-up max-w-sm">
          <div className="w-14 h-14 rounded-full bg-vault-card border border-vault-border flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">📬</span>
          </div>
          <h2 className="font-cinzel text-vault-cream text-lg font-semibold tracking-wide mb-2">Check your email</h2>
          <p className="text-vault-muted text-sm leading-relaxed">
            We sent a verification link to <span className="text-vault-cream">{form.email}</span>.
          </p>
          <Link to="/login" className="block mt-6 text-vault-gold hover:text-vault-gold-light text-xs font-cinzel tracking-widest transition-colors">
            BACK TO SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-vault-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-10">
          <h1 className="font-cinzel text-vault-gold text-2xl tracking-[0.25em] font-semibold mb-1">SLEEVED</h1>
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-vault-gold/50 to-transparent mx-auto" />
          <p className="text-vault-muted text-xs mt-3 tracking-wider">Create your collection</p>
        </div>

        <div className="bg-vault-card border border-vault-border rounded-2xl p-7 space-y-5">
          <a
            href={`${BACKEND_URL}/api/auth/google`}
            className="flex items-center justify-center gap-2.5 w-full bg-vault-raised hover:bg-vault-raised/80 border border-vault-border-light text-vault-cream text-sm py-2.5 rounded-lg transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-vault-border" />
            <span className="text-vault-faint text-xs font-cinzel tracking-widest">OR</span>
            <div className="flex-1 h-px bg-vault-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {[
              { key: "name",     label: "Full name",        type: "text",     placeholder: "Your name" },
              { key: "email",    label: "Email",            type: "email",    placeholder: "you@example.com" },
              { key: "password", label: "Password",         type: "password", placeholder: "Minimum 8 characters" },
              { key: "confirm",  label: "Confirm password", type: "password", placeholder: "••••••••" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-vault-muted font-cinzel tracking-widest uppercase mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="input-vault w-full rounded-lg px-3 py-2.5 text-sm"
                  placeholder={placeholder}
                  required
                  autoFocus={key === "name"}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-vault-gold hover:bg-vault-gold-light disabled:opacity-40 text-vault-black font-cinzel font-semibold text-sm py-2.5 rounded-lg transition-colors tracking-widest mt-2"
            >
              {loading ? "CREATING..." : "CREATE ACCOUNT"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-vault-faint mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-vault-gold hover:text-vault-gold-light transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
