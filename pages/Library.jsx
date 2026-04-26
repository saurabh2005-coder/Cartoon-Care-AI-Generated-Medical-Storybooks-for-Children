/**
 * Library.jsx — Shows all previously generated storybooks
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllStories, deleteStory } from "../api/client";

const STATUS_COLORS = {
  completed: "bg-green-100 text-green-700",
  generating: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
};

export default function Library() {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllStories()
      .then((data) => { setStories(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id, e) {
    e.stopPropagation(); // don't navigate when clicking delete
    if (!confirm("Delete this story?")) return;
    await deleteStory(id).catch(() => {});
    setStories((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-5xl animate-bounce">📚</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📚 My Story Library</h2>
            <p className="text-gray-500 text-sm mt-1">{stories.length} storybooks created</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-purple-500 text-white px-4 py-2 rounded-xl font-semibold
                       hover:bg-purple-600 transition-colors text-sm"
          >
            + New Story
          </button>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 mb-4">No stories yet!</p>
            <button onClick={() => navigate("/")}
              className="bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold">
              Create Your First Story
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => story.status === "completed" && navigate(`/storybook/${story.id}`)}
                className={`bg-white rounded-2xl shadow-sm border border-purple-100 p-5
                            flex items-center justify-between gap-4
                            ${story.status === "completed" ? "cursor-pointer hover:shadow-md" : ""}
                            transition-shadow`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {story.status === "completed" ? "📖" :
                     story.status === "generating" ? "⚙️" :
                     story.status === "failed" ? "❌" : "⏳"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {story.child_name}'s Story
                    </h3>
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
                      className="text-purple-400 hover:text-purple-600 transition-colors p-1"
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
  );
}
