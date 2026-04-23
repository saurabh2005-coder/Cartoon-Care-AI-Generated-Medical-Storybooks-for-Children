import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="text-7xl mb-5">🎨📖✨</div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4 leading-tight">
            Cartoon Care
          </h1>
          <p className="text-gray-500 text-xl max-w-lg mx-auto leading-relaxed">
            AI-generated medical storybooks that help children understand their health conditions through magical adventures.
          </p>
        </div>

        {/* Sign in options */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-14">

          {/* User card */}
          <div className="bg-white rounded-3xl shadow-md border border-purple-100 p-7 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mb-4">
              👨‍👩‍👧
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Parent / Doctor</h2>
            <p className="text-gray-400 text-sm mb-5">
              Create personalized storybooks for your child or patient
            </p>
            <div className="flex flex-col gap-2 w-full">
              <Link
                to="/login"
                className="w-full bg-purple-600 text-white font-semibold py-2.5 rounded-xl
                           hover:bg-purple-700 active:scale-95 transition-all text-sm"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="w-full bg-purple-50 text-purple-600 font-semibold py-2.5 rounded-xl
                           hover:bg-purple-100 active:scale-95 transition-all text-sm border border-purple-200"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Admin card */}
          <div className="bg-white rounded-3xl shadow-md border border-orange-100 p-7 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl mb-4">
              ⚙️
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Administrator</h2>
            <p className="text-gray-400 text-sm mb-5">
              Manage users, view all stories, and oversee the platform
            </p>
            <div className="flex flex-col gap-2 w-full">
              <Link
                to="/login"
                state={{ prefill: "admin" }}
                className="w-full bg-orange-500 text-white font-semibold py-2.5 rounded-xl
                           hover:bg-orange-600 active:scale-95 transition-all text-sm"
              >
                Admin Sign In
              </Link>
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-xs text-orange-600">
                <span className="font-semibold">Email:</span> admin@cartooncare.com<br />
                <span className="font-semibold">Password:</span> Admin@123456
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="text-center mb-8">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-6">How it works</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: "✍️", title: "Fill the form", desc: "Child's name, age & condition" },
              { icon: "🤖", title: "AI generates", desc: "Story + Disney-style illustrations" },
              { icon: "📥", title: "Download PDF", desc: "Print or share the storybook" },
            ].map((step) => (
              <div key={step.title}
                className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
                <div className="text-3xl mb-2">{step.icon}</div>
                <div className="font-semibold text-gray-700 text-sm">{step.title}</div>
                <div className="text-gray-400 text-xs mt-1">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          🏰 Disney-style illustrations powered by custom AI · Cartoon Care v1.0
        </p>
      </div>
    </div>
  );
}
