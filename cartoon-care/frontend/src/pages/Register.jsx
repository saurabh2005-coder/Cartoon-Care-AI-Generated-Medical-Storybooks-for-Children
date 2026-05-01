/**
 * Register — Card-centered layout matching Login
 *
 * WHAT WAS WRONG:
 *   - Left panel was solid indigo-600 — different from Login's violet-600,
 *     creating inconsistency between two auth pages
 *   - focus:ring-violet-400 on inputs — purple ring on indigo page = clash
 *   - Submit button was violet-600 — yet another purple shade
 *
 * WHY THIS IS BETTER:
 *   - Consistent with Login: same off-white bg, same white card
 *   - Left info block uses teal accents — unified brand color
 *   - Password strength bar uses semantic colors (red/yellow/green) — correct
 *   - Button is solid teal — same primary action color as Login
 *
 * TAILWIND CLASSES:
 *   bg-[#F8FAFC]        → same off-white as Login page
 *   focus:ring-[#2EC4B6]→ teal focus ring (consistent with Login)
 *   bg-[#2EC4B6]        → solid teal submit button
 */
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

  const strength = password.length === 0 ? null
    : password.length < 8 ? "weak"
    : password.length < 12 ? "good"
    : "strong";

  const strengthMap = {
    weak:   { label: "Too short",  bar: "w-1/3 bg-red-400",    text: "text-red-500" },
    good:   { label: "Good",       bar: "w-2/3 bg-yellow-400", text: "text-yellow-600" },
    strong: { label: "Strong ✓",   bar: "w-full bg-[#4CAF50]", text: "text-[#4CAF50]" },
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">

        {/* ── Left: Brand info block ── */}
        <div className="hidden lg:block animate-fade-up opacity-0">
          <div className="w-12 h-1 bg-[#2EC4B6] rounded-full mb-8" />

          <div className="flex items-center gap-2.5 mb-8">
            <img src="/logo.png" alt="CartoonCare" className="h-12 w-auto" />
          </div>

          <h2 className="text-3xl font-bold text-[#1E293B] mb-4 leading-tight">
            Join thousands of parents<br />
            <span className="text-[#2EC4B6]">and doctors</span>
          </h2>
          <p className="text-[#64748B] leading-relaxed mb-8">
            Create your free account and start generating personalized medical storybooks for children today.
          </p>

          {/* What you get — teal accent, clean list */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-[#1E293B] font-semibold text-sm mb-3">What you get for free:</p>
            <div className="space-y-2.5">
              {[
                "Unlimited storybook generation",
                "AI-illustrated pages",
                "PDF download",
                "Multi-language support",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 bg-[#e6faf9] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#2EC4B6] text-xs font-bold">✓</span>
                  </div>
                  <span className="text-[#64748B] text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[#64748B] text-xs mt-8">© 2026 CartoonCare · GLA University</p>
        </div>

        {/* ── Right: Register card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fade-in opacity-0">

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-[#1E293B] mb-1">Create your account</h1>
            <p className="text-[#64748B] text-sm">Free forever · No credit card needed</p>
          </div>

          {/* Info note — teal accent instead of blue */}
          <div className="bg-[#e6faf9] border border-[#2EC4B6]/20 rounded-xl px-4 py-3 mb-6 text-sm text-[#1E293B] flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0 text-[#2EC4B6]">ℹ</span>
            <span className="text-[#64748B]">New accounts are created as <strong className="text-[#1E293B]">User</strong> role. Contact admin for admin access.</span>
          </div>

          {/* Google Sign Up */}
          <a
            href="http://localhost:8000/auth/google"
            className="w-full flex items-center justify-center gap-3 border border-gray-200
                       rounded-xl px-4 py-3 text-sm font-semibold text-[#1E293B]
                       hover:bg-gray-50 transition-all mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </a>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-[#64748B]">or register with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1E293B]
                           bg-white focus:outline-none focus:ring-2 focus:ring-[#2EC4B6] focus:border-transparent
                           transition-all placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1E293B]
                           bg-white focus:outline-none focus:ring-2 focus:ring-[#2EC4B6] focus:border-transparent
                           transition-all placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-[#1E293B]
                             bg-white focus:outline-none focus:ring-2 focus:ring-[#2EC4B6] focus:border-transparent
                             transition-all placeholder:text-gray-300"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] text-xs font-medium">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {/* Password strength — semantic colors, not brand colors */}
              {strength && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strengthMap[strength].bar}`} />
                  </div>
                  <p className={`text-xs mt-1 ${strengthMap[strength].text}`}>
                    {strengthMap[strength].label}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Solid teal — no gradient */}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#2EC4B6] text-white font-semibold rounded-xl text-sm
                         hover:bg-[#25a99d] active:scale-95 transition-all
                         disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-[#64748B] mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#2EC4B6] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
