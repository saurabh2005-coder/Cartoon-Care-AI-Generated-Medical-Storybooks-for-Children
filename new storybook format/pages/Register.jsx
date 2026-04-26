import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    return null;
  }

  const passwordStrength = password.length === 0 ? null
    : password.length < 8 ? "weak"
    : password.length < 12 ? "good"
    : "strong";

  const strengthConfig = {
    weak:   { label: "Too short", color: "bg-red-400",    text: "text-red-500" },
    good:   { label: "Good",      color: "bg-yellow-400", text: "text-yellow-600" },
    strong: { label: "Strong",    color: "bg-green-400",  text: "text-green-600" },
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name");
    if (!email.trim()) return setError("Please enter your email");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    setLoading(true);
    try {
      const newUser = await register(name, email, password);
      navigate(newUser.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-purple-100">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="text-5xl mb-3">✨</div>
            <h1 className="text-2xl font-bold text-gray-800">Create your account</h1>
            <p className="text-gray-400 text-sm mt-1">Join Cartoon Care — it's free</p>
          </div>

          {/* Role info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 text-sm text-blue-700 flex items-start gap-2">
            <span className="mt-0.5">ℹ️</span>
            <span>New accounts are created as <strong>User</strong> (parent/doctor). Contact admin to get admin access.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white focus:border-transparent
                           transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
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
                  placeholder="Min 8 characters"
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
              {/* Password strength bar */}
              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {["weak", "good", "strong"].map((level, i) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          ["weak", "good", "strong"].indexOf(passwordStrength) >= i
                            ? strengthConfig[passwordStrength].color
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strengthConfig[passwordStrength].text}`}>
                    {strengthConfig[passwordStrength].label}
                  </p>
                </div>
              )}
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
                  Creating account...
                </span>
              ) : "Create Account →"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
