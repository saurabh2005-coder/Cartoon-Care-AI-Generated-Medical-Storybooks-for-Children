/**
 * Navbar — Clean, minimal, sticky navigation
 *
 * WHAT WAS WRONG: violet-600 everywhere — logo, hover states, CTA button.
 *   Same purple as every other page element = zero visual hierarchy.
 *
 * WHY TEAL IS BETTER: #2EC4B6 (teal) is distinct from the page content,
 *   signals "interactive" without screaming, and pairs well with the
 *   warm-orange secondary used for admin accents.
 *
 * TAILWIND CLASSES USED:
 *   bg-white          → clean white bar, not colored
 *   border-b          → subtle separator instead of shadow-heavy bar
 *   text-[#2EC4B6]    → teal brand color for logo accent
 *   bg-[#2EC4B6]      → solid teal CTA (no gradient)
 *   hover:bg-[#25a99d]→ slightly darker teal on hover (darken, not glow)
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-5 h-24 flex items-center justify-between">

        {/* Logo */}
        <Link
          to={user ? (isAdmin ? "/admin" : "/dashboard") : "/"}
          className="flex items-center gap-2 group"
        >
          <img
            src="/logo.png"
            alt="CartoonCare Logo"
            className="h-24 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              {isAdmin ? (
                <Link to="/admin"
                  className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#2EC4B6] hover:bg-[#e6faf9] rounded-lg transition-all">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#2EC4B6] hover:bg-[#e6faf9] rounded-lg transition-all">
                    My Stories
                  </Link>
                  <Link to="/library"
                    className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#2EC4B6] hover:bg-[#e6faf9] rounded-lg transition-all">
                    Library
                  </Link>
                </>
              )}

              <div className="w-px h-5 bg-gray-200 mx-2" />

              <div className="flex items-center gap-3">
                {/* Avatar — teal background */}
                <div className="w-8 h-8 bg-[#e6faf9] rounded-full flex items-center justify-center">
                  <span className="text-[#2EC4B6] text-xs font-bold uppercase">
                    {user.name?.charAt(0)}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-[#1E293B] leading-none">{user.name}</p>
                  <p className="text-xs text-[#64748B] capitalize mt-0.5">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-1 px-3 py-1.5 text-sm text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all font-medium"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"
                className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#2EC4B6] hover:bg-[#e6faf9] rounded-lg transition-all">
                Sign In
              </Link>
              {/* CTA: solid teal, no gradient */}
              <Link to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-[#2EC4B6] hover:bg-[#25a99d] rounded-lg transition-colors shadow-sm">
                Get Started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg text-[#64748B] hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-5 py-4 space-y-1">
          {user ? (
            <>
              {isAdmin ? (
                <Link to="/admin" onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-[#1E293B] hover:bg-[#e6faf9] hover:text-[#2EC4B6] rounded-lg">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm font-medium text-[#1E293B] hover:bg-[#e6faf9] hover:text-[#2EC4B6] rounded-lg">
                    My Stories
                  </Link>
                  <Link to="/library" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm font-medium text-[#1E293B] hover:bg-[#e6faf9] hover:text-[#2EC4B6] rounded-lg">
                    Library
                  </Link>
                </>
              )}
              <button onClick={handleLogout}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-[#1E293B] hover:bg-[#e6faf9] hover:text-[#2EC4B6] rounded-lg">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-semibold text-[#2EC4B6] hover:bg-[#e6faf9] rounded-lg">
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
