/**
 * AdminDashboard — Admin workspace
 *
 * WHAT WAS WRONG:
 *   - Active tab used bg-purple-600 — same purple as user dashboard buttons
 *   - Role badge used bg-purple-100 text-purple-700 — purple on purple page
 *   - Story hover used hover:border-purple-300 — purple everywhere
 *   - Download link was text-purple-400 — purple on white card
 *   - Looked IDENTICAL to the user dashboard in color scheme
 *
 * WHY THIS IS BETTER:
 *   - Admin gets a DISTINCT visual identity: slate/dark header bar
 *     signals "you are in admin mode" — different from user dashboard
 *   - Active tab uses teal (primary) — consistent with brand
 *   - Admin role badge uses orange (secondary) — visually distinct from user
 *   - Stats use icon + colored number, white cards — clean grid layout
 *   - Download link uses teal — consistent interactive color
 *
 * TAILWIND CLASSES:
 *   bg-[#1E293B]        → dark slate admin header — distinct from user pages
 *   bg-[#2EC4B6]        → teal active tab
 *   bg-[#6366F1]        → orange admin role badge
 *   bg-[#F8FAFC]        → off-white page background
 *   hover:bg-[#e6faf9]  → teal tint on story hover
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, deleteUser, getAllStories, deleteStory, downloadStoryPDF } from "../api/client";

const STATUS_COLORS = {
  completed: "bg-green-100 text-green-700",
  generating: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllUsers(), getAllStories()])
      .then(([u, s]) => { setUsers(u); setStories(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDeleteUser(id) {
    if (!confirm("Delete this user and ALL their stories?")) return;
    await deleteUser(id).catch(() => {});
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setStories((prev) => prev.filter((s) => s.user_id !== id));
  }

  async function handleDeleteStory(id, e) {
    e.stopPropagation();
    if (!confirm("Delete this story?")) return;
    await deleteStory(id).catch(() => {});
    setStories((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Admin identity bar — dark slate, visually distinct from user dashboard */}
      <div className="bg-[#1E293B] text-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="CartoonCare" className="h-9 w-auto brightness-0 invert" />
            <div>
              <h2 className="text-lg font-bold">Admin Dashboard</h2>
              <p className="text-slate-400 text-xs mt-0.5">Logged in as {user?.email}</p>
            </div>
          </div>
          <span className="bg-[#6366F1] text-white text-xs font-bold px-3 py-1 rounded-full">
            ADMIN
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* Stats — white cards, colored numbers, no gradient backgrounds */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users",  value: users.length,                                          icon: "👥", color: "text-[#1E293B]"  },
            { label: "Total Stories",value: stories.length,                                        icon: "📚", color: "text-[#1E293B]"  },
            { label: "Completed",    value: stories.filter(s => s.status === "completed").length,  icon: "✅", color: "text-[#4CAF50]"  },
            { label: "Failed",       value: stories.filter(s => s.status === "failed").length,     icon: "❌", color: "text-red-500"    },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-[#64748B] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs — teal active, white inactive */}
        <div className="flex gap-2 mb-6">
          {["users", "stories"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg font-semibold text-sm capitalize transition-colors
                ${tab === t
                  ? "bg-[#2EC4B6] text-white"
                  : "bg-white text-[#64748B] border border-gray-200 hover:border-[#2EC4B6]/40 hover:text-[#2EC4B6]"
                }`}
            >
              {t === "users" ? `👥 Users (${users.length})` : `📚 Stories (${stories.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#64748B]">Loading...</div>
        ) : tab === "users" ? (
          /* Users Table */
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            {users.length === 0 ? (
              <div className="text-center py-12 text-[#64748B]">No users found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-[#64748B] font-semibold">Name</th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-semibold">Email</th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-semibold">Role</th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-semibold">Joined</th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-semibold">Stories</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#1E293B]">{u.name}</td>
                      <td className="px-4 py-3 text-[#64748B]">{u.email}</td>
                      <td className="px-4 py-3">
                        {/* Admin = orange badge, user = gray badge */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                          ${u.role === "admin"
                            ? "bg-indigo-100 text-[#6366F1]"
                            : "bg-gray-100 text-[#64748B]"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">
                        {stories.filter(s => s.user_id === u.id).length}
                      </td>
                      <td className="px-4 py-3">
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Stories List */
          <div className="grid gap-3">
            {stories.length === 0 ? (
              <div className="text-center py-12 text-[#64748B] bg-white rounded-xl border border-gray-100">
                No stories found
              </div>
            ) : stories.map((story) => (
              <div
                key={story.id}
                onClick={() => story.status === "completed" && navigate(`/storybook/${story.id}`)}
                className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm
                            flex items-center justify-between gap-4
                            ${story.status === "completed" ? "cursor-pointer hover:border-[#2EC4B6]/40 hover:shadow-md" : ""}
                            transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {story.status === "completed" ? "📖" :
                     story.status === "generating" ? "⚙️" :
                     story.status === "failed" ? "❌" : "⏳"}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1E293B]">{story.child_name}'s Story</p>
                    <p className="text-[#64748B] text-sm capitalize">
                      {story.disease} · Age {story.age} · {story.language}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {new Date(story.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                                    ${STATUS_COLORS[story.status] || "bg-gray-100 text-[#64748B]"}`}>
                    {story.status}
                  </span>
                  {story.status === "completed" && story.pdf_path && (
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadStoryPDF(story.id, story.child_name); }}
                      className="text-[#2EC4B6] hover:text-[#25a99d] p-1 transition-colors"
                      title="Download PDF"
                    >
                      <i className="fa-solid fa-download"></i>
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteStory(story.id, e)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                    title="Delete"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
