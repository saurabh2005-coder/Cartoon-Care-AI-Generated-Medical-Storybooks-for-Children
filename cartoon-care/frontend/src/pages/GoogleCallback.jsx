/**
 * GoogleCallback — Handles the redirect from Google OAuth
 * Reads token from URL, saves to localStorage, redirects to dashboard
 */
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error || !token) {
      navigate("/login?error=google_failed", { replace: true });
      return;
    }

    try {
      // Decode user info from JWT payload
      const payload = JSON.parse(atob(token.split(".")[1]));
      const user = {
        id: payload.sub,
        role: payload.role,
        name: params.get("name") || "User",
        email: params.get("email") || "",
      };

      // Try to parse user from URL param
      const userParam = params.get("user");
      if (userParam) {
        try {
          // Python dict format — convert to JSON
          const jsonStr = userParam
            .replace(/'/g, '"')
            .replace(/True/g, "true")
            .replace(/False/g, "false");
          const parsedUser = JSON.parse(jsonStr);
          Object.assign(user, parsedUser);
        } catch {}
      }

      localStorage.setItem("cc_token", token);
      localStorage.setItem("cc_user", JSON.stringify(user));

      // Redirect based on role
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (e) {
      navigate("/login?error=parse_failed", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2EC4B6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64748B] font-medium">Signing you in with Google...</p>
      </div>
    </div>
  );
}
