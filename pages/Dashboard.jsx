import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StoryForm from "../components/StoryForm";
import { getAllStories, deleteStory } from "../api/client";

const STATUS_COLORS = {
  completed: "bg-green-100 text-green-700",
  generating: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getAllStories()
      .then((data) => { setStories(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleFormSubmit(storyId) {
    navigate(`/generating/${storyId}`);
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm("Delete this story?")) return;
    await deleteStory(id).catch(() => {});
    setStories((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Welcome header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome, {user?.name} 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage your child's storybooks
          </p>
        </div>

        {/* Create story button / form toggle */}
        <div className="mb-8">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold
                         hover:bg-purple-700 transition-colors"
            >
              + Create New Storybook
            </button>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-800">🌟 New Storybook</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕ Cancel
                </button>
              </div>
              <StoryForm onSubmit={handleFormSubmit} />
            </div>
          )}
        </div>

        {/* Stories list */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            📚 My Stories
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({stories.length})
            </span>
          </h3>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : stories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500">No stories yet. Create your first one!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {stories.map((story) => (
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
                      onClick={(e) => handleDelete(story.id, e)}
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
    </div>
  );
}
