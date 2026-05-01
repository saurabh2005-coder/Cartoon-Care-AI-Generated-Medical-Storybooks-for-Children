import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllStories, deleteStory, downloadStoryPDF } from "../api/client";

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
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B] flex items-center gap-2">
              <img src="/icon-library.png" alt="Library" className="w-16 h-16 object-contain" />
              My Story Library
            </h2>
            <p className="text-[#64748B] text-sm mt-1">{stories.length} storybooks created</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-[#2EC4B6] text-white px-4 py-2 rounded-xl font-semibold
                       hover:bg-[#25a99d] transition-colors text-sm"
          >
            + New Story
          </button>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-[#64748B] mb-4">No stories yet!</p>
            <button onClick={() => navigate("/")}
              className="bg-[#2EC4B6] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#25a99d] transition-colors">
              Create Your First Story
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => story.status === "completed" && navigate(`/storybook/${story.id}`)}
                className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5
                            flex items-center justify-between gap-4
                            ${story.status === "completed" ? "cursor-pointer hover:border-[#2EC4B6]/40 hover:shadow-md" : ""}
                            transition-all`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {story.status === "completed"
                      ? <img src="/icon-book.png" alt="completed" className="w-10 h-10 object-contain" />
                      : story.status === "generating" ? "⚙️"
                      : story.status === "failed" ? "❌"
                      : "⏳"}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E293B]">
                      {story.child_name}'s Story
                    </h3>
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
                                    ${STATUS_COLORS[story.status] || "bg-gray-100 text-gray-600"}`}>
                    {story.status}
                  </span>
                  {story.status === "completed" && story.pdf_path && (
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadStoryPDF(story.id, story.child_name); }}
                      className="text-[#2EC4B6] hover:text-[#25a99d] transition-colors p-1"
                      title="Download PDF"
                    >
                      <i className="fa-solid fa-download"></i>
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(story.id, e)}
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
