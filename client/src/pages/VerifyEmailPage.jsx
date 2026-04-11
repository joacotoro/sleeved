import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export function VerifyEmailPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [error, setError] = useState(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setError("No verification token found in the URL.");
      return;
    }

    api.verifyEmail(token)
      .then((data) => {
        setStatus("success");
        login(data.token);
        setTimeout(() => navigate("/"), 3000);
      })
      .catch((err) => {
        setStatus("error");
        setError(err.message);
      });
  }, []);

  async function handleResend(e) {
    e.preventDefault();
    try {
      await api.resendVerification({ email: resendEmail });
      setResendSent(true);
    } catch {}
  }

  if (status === "loading") {
    return (
      <div className="min-h-dvh bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-dvh bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-gray-100 text-xl font-semibold mb-2">Email verified!</h2>
          <p className="text-gray-400 text-sm">Redirecting you to the app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-gray-100 text-xl font-semibold mb-2">Verification failed</h2>
        <p className="text-gray-400 text-sm mb-6">{error}</p>

        {!resendSent ? (
          <form onSubmit={handleResend} className="space-y-3">
            <p className="text-gray-400 text-sm">Need a new link?</p>
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-amber-500"
              placeholder="your@email.com"
              required
            />
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold text-sm py-2 rounded-lg transition-colors"
            >
              Resend verification email
            </button>
          </form>
        ) : (
          <p className="text-green-400 text-sm">
            If that email exists and is unverified, a new link was sent.
          </p>
        )}

        <Link to="/login" className="block mt-4 text-amber-400 hover:text-amber-300 text-sm">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
