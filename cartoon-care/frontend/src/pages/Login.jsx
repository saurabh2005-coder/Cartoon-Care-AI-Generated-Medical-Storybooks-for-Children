/**
 * Login — Card-centered layout on off-white background
 *
 * WHAT WAS WRONG:
 *   - Left panel was solid violet-600 — heavy, AI-generated look
 *   - Form inputs had violet focus rings matching the panel = no hierarchy
 *   - Button was violet-600 — same as everything else
 *
 * WHY THIS IS BETTER:
 *   - Removed gradient/solid-color left panel entirely
 *   - Centered white card on #F8FAFC off-white = clean SaaS feel
 *   - Left side now shows a soft illustrated info block (teal accent)
 *   - Button is solid teal #2EC4B6 — primary action stands out
 *   - Focus rings use teal, not purple
 *
 * TAILWIND CLASSES:
 *   bg-[#F8FAFC]        → off-white page background
 *   bg-white            → card background (contrast against page)
 *   rounded-2xl shadow  → card elevation without heavy gradients
 *   bg-[#2EC4B6]        → solid teal submit button
 *   hover:bg-[#25a99d]  → darken on hover (no glow/gradient)
 *   focus:ring-[#2EC4B6]→ teal focus ring on inputs
 */
import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const QUICK_FILL = {
  admin: { email: "admin@cartooncare.com", password: "Admin@123456" },
};

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    if (type === "admin") {
      setEmail(QUICK_FILL.admin.email);
      setPassword(QUICK_FILL.admin.password);
    }
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
    /* Off-white page background — not a gradient */
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">

        {/* ── Left: Brand info block (light, not heavy colored panel) ── */}
        <div className="hidden lg:block animate-fade-up opacity-0">
          {/* Teal accent bar at top */}
          <div className="w-12 h-1 bg-[#2EC4B6] rounded-full mb-8" />

          <div className="flex items-center gap-2.5 mb-8">
            <img src="/logo.png" alt="CartoonCare" className="h-32 w-auto" />
          </div>

          <h2 className="text-3xl font-bold text-[#1E293B] mb-4 leading-tight">
            Turning medical fear into<br />
            <span className="text-[#2EC4B6]">magical stories</span>
          </h2>
          <p className="text-[#64748B] leading-relaxed mb-8">
            Create personalized AI-illustrated storybooks that help children understand their health conditions with confidence.
          </p>

          {/* Feature list — teal checkmarks, no colored background */}
          <div className="space-y-3">
            {[
              "Personalized for every child",
              "Disney-style illustrations",
              "Download as PDF instantly",
              "Multi-language support",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-[#e6faf9] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#2EC4B6] text-xs font-bold">✓</span>
                </div>
                <span className="text-[#64748B] text-sm">{item}</span>
              </div>
            ))}
          </div>

          <p className="text-[#64748B] text-xs mt-10">© 2026 CartoonCare · GLA University</p>
        </div>

        {/* ── Right: Login card ── */}
        {/* White card with shadow — stands out from off-white bg */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fade-in opacity-0">

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-[#1E293B] mb-1">Welcome back</h1>
            <p className="text-[#64748B] text-sm">Sign in to your CartoonCare account</p>
          </div>

          {/* Quick fill — orange for admin (warm secondary), not purple */}
          <div className="mb-6">
            <p className="text-xs text-[#64748B] font-medium mb-2 uppercase tracking-wide">Quick demo access</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => quickFill("admin")}
                className="border border-[#6366F1]/40 rounded-lg px-3 py-2 text-xs font-semibold
                           text-[#6366F1] hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5">
                <img src="/icon-admin.png" alt="Admin" className="w-4 h-4 object-contain" />
                Admin Demo
              </button>
              <Link to="/register"
                className="border border-[#2EC4B6]/40 rounded-lg px-3 py-2 text-xs font-semibold
                           text-[#2EC4B6] hover:bg-[#e6faf9] transition-all text-center flex items-center justify-center gap-1.5">
                <img src="/icon-user.png" alt="User" className="w-4 h-4 object-contain" />
                Create Account
              </Link>
            </div>
          </div>

          {/* Google Sign In */}
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

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-[#64748B]">or sign in manually</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Enter your password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-[#1E293B]
                             bg-white focus:outline-none focus:ring-2 focus:ring-[#2EC4B6] focus:border-transparent
                             transition-all placeholder:text-gray-300"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] text-xs font-medium">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Solid teal button — no gradient */}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#2EC4B6] text-white font-semibold rounded-xl text-sm
                         hover:bg-[#25a99d] active:scale-95 transition-all
                         disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-[#64748B] mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#2EC4B6] font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
