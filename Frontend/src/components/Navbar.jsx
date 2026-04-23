import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={user ? (isAdmin ? "/admin" : "/dashboard") : "/"}
          className="flex items-center gap-2"
        >
          <span className="text-2xl">🎨</span>
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-none">Cartoon Care</h1>
            <p className="text-gray-400 text-xs">AI Medical Storybooks</p>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Role-appropriate nav links */}
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="text-sm text-gray-600 hover:text-purple-600 font-medium transition-colors"
                >
                  ⚙️ Admin
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="text-sm text-gray-600 hover:text-purple-600 font-medium transition-colors"
                >
                  📚 My Stories
                </Link>
              )}

              {/* User info + logout */}
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800 leading-none">{user.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors px-2 py-1"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-purple-600 font-medium">
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-purple-600 text-white text-sm px-4 py-1.5 rounded-lg font-medium
                           hover:bg-purple-700 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
