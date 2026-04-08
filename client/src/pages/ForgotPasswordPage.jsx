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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-amber-400 font-bold text-2xl tracking-tight">Sleeved</h1>
          <p className="text-gray-400 text-sm mt-1">Reset your password</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          {sent ? (
            <div className="text-center py-2">
              <div className="text-3xl mb-3">📬</div>
              <p className="text-gray-300 text-sm">
                If that email exists in our system, you'll receive reset instructions shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-400 text-sm">
                Enter your email and we'll send you a link to reset your password.
              </p>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-amber-500"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 font-semibold text-sm py-2 rounded-lg transition-colors"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/login" className="text-amber-400 hover:text-amber-300">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
