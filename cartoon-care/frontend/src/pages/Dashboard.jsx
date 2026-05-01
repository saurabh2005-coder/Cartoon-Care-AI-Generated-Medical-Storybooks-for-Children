/**
 * Dashboard — User workspace
 *
 * WHAT WAS WRONG:
 *   - bg-violet-50 icon backgrounds on story cards — purple everywhere
 *   - bg-violet-600 "New Storybook" button — same as navbar, login, home
 *   - hover:border-violet-200 on cards — subtle but still purple
 *   - Empty state had bg-violet-50 icon box — violet even when no content
 *
 * WHY THIS IS BETTER:
 *   - Story card icons use status-appropriate colors (teal for completed,
 *     blue for generating, red for failed) — semantic, not brand-colored
 *   - "New Storybook" button is solid teal — consistent primary action
 *   - Stats cards use colored numbers only (not colored backgrounds)
 *   - Empty state uses teal icon box — on-brand without being heavy
 *
 * TAILWIND CLASSES:
 *   bg-[#F8FAFC]        → off-white page background
 *   bg-[#2EC4B6]        → teal primary button
 *   hover:bg-[#25a99d]  → teal darken on hover
 *   bg-[#e6faf9]        → light teal for completed story icon
 *   text-[#2EC4B6]      → teal for completed count stat
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StoryForm from "../components/StoryForm";
import { getAllStories, deleteStory, downloadStoryPDF } from "../api/client";

const STATUS = {
  completed: { label: "Completed", cls: "bg-green-50 text-green-700 border-green-200" },
  generating: { label: "Generating", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pending:   { label: "Pending",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  failed:    { label: "Failed",     cls: "bg-red-50 text-red-700 border-red-200" },
};

function StoryCard({ story, onDelete, onClick }) {
  const status = STATUS[story.status] || { label: story.status, cls: "bg-gray-50 text-gray-600 border-gray-200" };

  // Icon background: semantic color per status, not brand color
  const iconBg = story.status === "completed" ? "bg-[#e6faf9]"
               : story.status === "generating" ? "bg-blue-50"
               : story.status === "failed"     ? "bg-red-50"
               : "bg-gray-50";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4
                  transition-all duration-200 hover:border-[#2EC4B6]/40 hover:shadow-sm
                  ${story.status === "completed" ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {story.status === "completed"
            ? <img src="/icon-book.png" alt="completed" className="w-7 h-7 object-contain" />
            : story.status === "generating" ? <span className="text-xl">⚙️</span>
            : story.status === "failed"     ? <span className="text-xl">✗</span>
            : <span className="text-xl">⏳</span>
          }
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-[#1E293B] text-sm truncate">
            {story.child_name}'s Story
          </p>
          <p className="text-[#64748B] text-xs mt-0.5 capitalize truncate">
            {story.disease} · Age {story.age} · {story.language}
          </p>
          <p className="text-gray-300 text-xs mt-0.5">
            {new Date(story.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.cls}`}>
          {status.label}
        </span>
        {story.status === "completed" && story.pdf_path && (
          <button
            onClick={(e) => { e.stopPropagation(); downloadStoryPDF(story.id, story.child_name); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B]
                       hover:text-[#2EC4B6] hover:bg-[#e6faf9] transition-all"
            title="Download PDF"
          >
            <i className="fa-solid fa-download text-sm"></i>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(story.id, e); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300
                     hover:text-red-500 hover:bg-red-50 transition-all"
          title="Delete"
        >
          <i className="fa-solid fa-trash-can text-sm"></i>
        </button>
      </div>
    </div>
  );
}

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

  async function handleDelete(id) {
    if (!confirm("Delete this story?")) return;
    await deleteStory(id).catch(() => {});
    setStories((prev) => prev.filter((s) => s.id !== id));
  }

  const completed = stories.filter(s => s.status === "completed").length;
  const generating = stories.filter(s => s.status === "generating" || s.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-5 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">
              Good day, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-[#64748B] text-sm mt-1">
              Manage and create storybooks for your children
            </p>
          </div>
          {/* Solid teal — no gradient */}
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
                        ${showForm
                          ? "bg-gray-100 text-[#64748B] hover:bg-gray-200"
                          : "bg-[#2EC4B6] text-white hover:bg-[#25a99d] shadow-sm"}`}
          >
            {showForm ? "✕ Cancel" : "+ New Storybook"}
          </button>
        </div>

        {/* Stats — colored numbers, white cards, no colored backgrounds */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Stories", value: stories.length,  color: "text-[#1E293B]" },
            { label: "Completed",     value: completed,        color: "text-[#4CAF50]" },
            { label: "In Progress",   value: generating,       color: "text-blue-600"  },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[#64748B] text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 animate-fade-up opacity-0">
            <h2 className="font-semibold text-[#1E293B] mb-5 text-base">Create New Storybook</h2>
            <StoryForm onSubmit={handleFormSubmit} />
          </div>
        )}

        {/* Stories list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1E293B]">
              My Stories
              <span className="ml-2 text-sm font-normal text-[#64748B]">({stories.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gray-100 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                      <div className="h-2 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <div className="w-16 h-16 bg-[#e6faf9] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                📭
              </div>
              <h3 className="font-semibold text-[#1E293B] mb-2">No stories yet</h3>
              <p className="text-[#64748B] text-sm mb-5">Create your first storybook to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-5 py-2.5 bg-[#2EC4B6] text-white font-semibold rounded-xl text-sm hover:bg-[#25a99d] transition-colors"
              >
                Create First Story
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onDelete={handleDelete}
                  onClick={() => story.status === "completed" && navigate(`/storybook/${story.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
