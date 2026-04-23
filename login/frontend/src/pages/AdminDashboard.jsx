import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, deleteUser, getAllStories, deleteStory } from "../api/client";

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">⚙️ Admin Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage users and stories · Logged in as {user?.email}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: users.length, icon: "👥" },
            { label: "Total Stories", value: stories.length, icon: "📚" },
            { label: "Completed", value: stories.filter(s => s.status === "completed").length, icon: "✅" },
            { label: "Failed", value: stories.filter(s => s.status === "failed").length, icon: "❌" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["users", "stories"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg font-semibold text-sm capitalize transition-colors
                ${tab === t
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
                }`}
            >
              {t === "users" ? `👥 Users (${users.length})` : `📚 Stories (${stories.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : tab === "users" ? (
          /* Users Table */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {users.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No users found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Email</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Role</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Joined</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Stories</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                          ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {stories.filter(s => s.user_id === u.id).length}
                      </td>
                      <td className="px-4 py-3">
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-400 hover:text-red-600 text-xs font-medium"
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
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
                No stories found
              </div>
            ) : stories.map((story) => (
              <div
                key={story.id}
                onClick={() => story.status === "completed" && navigate(`/storybook/${story.id}`)}
                className={`bg-white rounded-xl border border-gray-200 p-4
                            flex items-center justify-between gap-4
                            ${story.status === "completed" ? "cursor-pointer hover:border-purple-300 hover:shadow-sm" : ""}
                            transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {story.status === "completed" ? "📖" :
                     story.status === "generating" ? "⚙️" :
                     story.status === "failed" ? "❌" : "⏳"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{story.child_name}'s Story</p>
                    <p className="text-gray-500 text-sm capitalize">
                      {story.disease} · Age {story.age} · {story.language}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {new Date(story.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                                    ${STATUS_COLORS[story.status] || "bg-gray-100 text-gray-600"}`}>
                    {story.status}
                  </span>
                  {story.status === "completed" && story.pdf_path && (
                    <a
                      href={`http://localhost:8000/stories/${story.id}/download`}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="text-purple-400 hover:text-purple-600 p-1"
                      title="Download PDF"
                    >
                      📥
                    </a>
                  )}
                  <button
                    onClick={(e) => handleDeleteStory(story.id, e)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                    title="Delete"
                  >
                    🗑️
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
