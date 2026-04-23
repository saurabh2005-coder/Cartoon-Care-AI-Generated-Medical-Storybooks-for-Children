/**
 * Storybook.jsx — Displays the completed storybook
 *
 * Shows all pages with text + Disney-style illustrations.
 * Provides a PDF download button.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStory } from "../api/client";
import PageCard from "../components/PageCard";

export default function Storybook() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getStory(storyId)
      .then((data) => {
        setStory(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [storyId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">📖</div>
          <p className="text-gray-500">Loading your storybook...</p>
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
          <button onClick={() => navigate("/")}
            className="bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Sort pages by page number
  const pages = [...(story.pages || [])].sort((a, b) => a.page_number - b.page_number);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Storybook header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">📖</div>
          <h2 className="text-3xl font-bold text-gray-800">
            {story.child_name}'s Adventure
          </h2>
          <p className="text-gray-500 mt-2">
            A story about <span className="text-purple-600 font-semibold capitalize">{story.disease}</span>
            {story.theme && <> · <span className="text-blue-500">{story.theme} theme</span></>}
            {" · "}<span className="text-gray-400">{story.language}</span>
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            {/* PDF download */}
            {story.pdf_path && (
              <a
                href={`http://localhost:8000/stories/${storyId}/download`}
                download={`${story.child_name}_storybook.pdf`}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500
                           text-white px-5 py-2.5 rounded-xl font-semibold shadow
                           hover:from-purple-600 hover:to-blue-600 transition-all"
              >
                📥 Download PDF
              </a>
            )}

            {/* Create another */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 bg-white border-2 border-purple-200
                         text-purple-600 px-5 py-2.5 rounded-xl font-semibold
                         hover:border-purple-400 transition-colors"
            >
              ✨ Create Another
            </button>

            {/* Library */}
            <button
              onClick={() => navigate("/library")}
              className="flex items-center gap-2 bg-white border-2 border-gray-200
                         text-gray-600 px-5 py-2.5 rounded-xl font-semibold
                         hover:border-gray-400 transition-colors"
            >
              📚 My Library
            </button>
          </div>
        </div>

        {/* Pages grid */}
        {pages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <PageCard key={page.page_number} page={page} childName={story.child_name} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📄</div>
            <p>No pages found. The story may still be generating.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-400 text-sm">
          <p>🎨 Illustrated with Disney-style AI · Made with ❤️ by Cartoon Care</p>
        </div>
      </div>
    </div>
  );
}
