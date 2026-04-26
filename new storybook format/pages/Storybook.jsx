import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStory } from "../api/client";
import PageCard from "../components/PageCard";

const IMAGE_BASE = "http://localhost:8000";

export default function Storybook() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState("reader"); // "reader" | "grid"
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    getStory(storyId)
      .then((data) => { setStory(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [storyId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📖</div>
          <p className="text-gray-500 font-medium">Opening your storybook...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <p className="text-gray-600 mb-4">{error || "Story not found"}</p>
          <button onClick={() => navigate("/dashboard")}
            className="bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const pages = [...(story.pages || [])].sort((a, b) => a.page_number - b.page_number);
  const totalPages = pages.length;
  const page = pages[currentPage];

  function goTo(index) {
    if (index < 0 || index >= totalPages || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentPage(index);
      setTransitioning(false);
    }, 200);
  }

  // Cover page component
  const CoverPage = () => (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8 text-center min-h-[420px] flex flex-col items-center justify-center">
      {/* Stars decoration */}
      <div className="absolute inset-0 overflow-hidden">
        {["top-4 left-6", "top-8 right-10", "top-16 left-1/4", "bottom-12 right-8", "bottom-6 left-12"].map((pos, i) => (
          <span key={i} className={`absolute text-white/20 text-2xl ${pos}`}>✦</span>
        ))}
      </div>
      <div className="text-6xl mb-4">📖</div>
      <h1 className="text-3xl font-bold text-white mb-2 drop-shadow">
        {story.child_name}'s Adventure
      </h1>
      <p className="text-white/80 text-lg mb-1 capitalize">
        A story about <span className="text-yellow-300 font-semibold">{story.disease}</span>
      </p>
      {story.theme && (
        <p className="text-white/60 text-sm mb-4">{story.theme} theme</p>
      )}
      <div className="mt-6 bg-white/20 rounded-2xl px-5 py-2 text-white/90 text-sm font-medium">
        {totalPages} pages · {story.language}
      </div>
      <button
        onClick={() => goTo(0)}
        className="mt-6 bg-white text-purple-700 font-bold px-8 py-3 rounded-2xl
                   hover:bg-yellow-300 hover:text-purple-800 transition-all shadow-lg active:scale-95"
      >
        Start Reading →
      </button>
    </div>
  );

  // End page component
  const EndPage = () => (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 p-8 text-center min-h-[420px] flex flex-col items-center justify-center">
      <div className="text-6xl mb-4">🌟</div>
      <h2 className="text-3xl font-bold text-white mb-3 drop-shadow">The End!</h2>
      <p className="text-white/90 text-lg font-medium mb-2">
        {story.child_name} is a true hero! 🦸
      </p>
      <p className="text-white/70 text-sm mb-8">
        You finished the story about <span className="font-semibold capitalize">{story.disease}</span>
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {story.pdf_path && (
          <a
            href={`${IMAGE_BASE}/stories/${storyId}/download`}
            download
            className="bg-white text-orange-600 font-bold px-6 py-3 rounded-2xl
                       hover:bg-yellow-100 transition-all shadow active:scale-95 text-sm"
          >
            📥 Download PDF
          </a>
        )}
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-white/20 text-white font-bold px-6 py-3 rounded-2xl
                     hover:bg-white/30 transition-all border border-white/40 text-sm"
        >
          ✨ Create Another
        </button>
      </div>
    </div>
  );

  const isOnCover = currentPage === -1;
  const isOnEnd = currentPage === totalPages;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <button
              onClick={() => setViewMode(viewMode === "reader" ? "grid" : "reader")}
              className="text-xs bg-white border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg
                         hover:border-purple-300 hover:text-purple-600 transition-colors font-medium"
            >
              {viewMode === "reader" ? "🔲 All Pages" : "📖 Reader"}
            </button>
            {story.pdf_path && (
              <a
                href={`${IMAGE_BASE}/stories/${storyId}/download`}
                download
                className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg
                           hover:bg-purple-700 transition-colors font-medium"
              >
                📥 PDF
              </a>
            )}
          </div>
        </div>

        {/* ── READER MODE ── */}
        {viewMode === "reader" && (
          <>
            {/* Page content with fade transition */}
            <div className={`transition-opacity duration-200 ${transitioning ? "opacity-0" : "opacity-100"}`}>
              {currentPage === -1 ? <CoverPage /> :
               currentPage === totalPages ? <EndPage /> :
               page ? <PageCard page={page} childName={story.child_name} layout={currentPage} /> :
               null}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => goTo(currentPage - 1)}
                disabled={currentPage <= -1}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-600
                           px-5 py-2.5 rounded-2xl font-semibold text-sm
                           hover:border-purple-300 hover:text-purple-600 transition-all
                           disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              >
                ← Prev
              </button>

              {/* Page dots */}
              <div className="flex items-center gap-1.5">
                {/* Cover dot */}
                <button
                  onClick={() => goTo(-1)}
                  className={`w-2 h-2 rounded-full transition-all ${currentPage === -1 ? "bg-purple-500 w-4" : "bg-gray-300 hover:bg-gray-400"}`}
                />
                {pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all ${
                      i === currentPage
                        ? "bg-purple-500 w-4 h-2"
                        : "bg-gray-300 hover:bg-gray-400 w-2 h-2"
                    }`}
                  />
                ))}
                {/* End dot */}
                <button
                  onClick={() => goTo(totalPages)}
                  className={`w-2 h-2 rounded-full transition-all ${currentPage === totalPages ? "bg-yellow-400 w-4" : "bg-gray-300 hover:bg-gray-400"}`}
                />
              </div>

              <button
                onClick={() => goTo(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-2 bg-purple-600 text-white
                           px-5 py-2.5 rounded-2xl font-semibold text-sm
                           hover:bg-purple-700 transition-all
                           disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
              >
                Next →
              </button>
            </div>

            {/* Page counter */}
            {currentPage >= 0 && currentPage < totalPages && (
              <p className="text-center text-xs text-gray-400 mt-3">
                Page {currentPage + 1} of {totalPages}
              </p>
            )}
          </>
        )}

        {/* ── GRID MODE ── */}
        {viewMode === "grid" && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{story.child_name}'s Adventure</h2>
              <p className="text-gray-400 text-sm mt-1 capitalize">{story.disease} · {totalPages} pages</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {pages.map((p, i) => (
                <div
                  key={p.page_number}
                  onClick={() => { setCurrentPage(i); setViewMode("reader"); }}
                  className="cursor-pointer hover:scale-[1.02] transition-transform"
                >
                  <PageCard page={p} childName={story.child_name} layout={i} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 mt-10">
          🎨 Disney-style AI illustrations · Cartoon Care
        </p>
      </div>
    </div>
  );
}
