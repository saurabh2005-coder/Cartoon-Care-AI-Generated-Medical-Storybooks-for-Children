import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Quick-fill credentials for demo
const QUICK_FILL = {
  admin: { email: "admin@cartooncare.com", password: "Admin@123456", label: "⚙️ Admin Login", color: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" },
  user:  { email: "user@example.com",      password: "User@12345",   label: "👤 User Login",  color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" },
};

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill if coming from admin card on home page
  const prefill = location.state?.prefill;
  const [email, setEmail] = useState(prefill === "admin" ? QUICK_FILL.admin.email : "");
  const [password, setPassword] = useState(prefill === "admin" ? QUICK_FILL.admin.password : "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    return null;
  }

  function quickFill(type) {
    setEmail(QUICK_FILL[type].email);
    setPassword(QUICK_FILL[type].password);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Please fill in all fields");
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      navigate(loggedIn.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-purple-100">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="text-5xl mb-3">🎨</div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome back!</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to Cartoon Care</p>
          </div>

          {/* Quick login buttons */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 text-center mb-3 font-medium uppercase tracking-wide">
              Quick Sign In
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(QUICK_FILL).map(([type, info]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => quickFill(type)}
                  className={`border rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${info.color}`}
                >
                  {info.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-5 mb-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or enter manually</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white focus:border-transparent
                           transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-800 bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white focus:border-transparent
                             transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl
                         hover:bg-purple-700 active:scale-95 transition-all
                         disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In →"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-purple-600 font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>

        {/* Credentials hint */}
        <div className="mt-4 bg-white/70 rounded-2xl border border-gray-200 p-4 text-xs text-gray-500">
          <p className="font-semibold text-gray-600 mb-2">🔑 Demo Credentials</p>
          <div className="space-y-1">
            <p><span className="font-medium text-orange-600">Admin:</span> admin@cartooncare.com / Admin@123456</p>
            <p><span className="font-medium text-blue-600">User:</span> Register a new account or use the quick fill above</p>
          </div>
        </div>
      </div>
    </div>
  );
}
