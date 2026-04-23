/**
 * Generating.jsx — Progress screen shown while the AI is working
 *
 * Polls GET /stories/{id}/status every 3 seconds.
 * When status = "completed" → navigates to /storybook/{id}
 * When status = "failed"    → shows error with retry option
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStoryStatus } from "../api/client";

// Fun messages shown while waiting — cycles through them
const WAITING_MESSAGES = [
  "🤖 The AI is writing your story...",
  "🎨 Painting Disney-style illustrations...",
  "✨ Adding magical details...",
  "🦸 Making your child the hero...",
  "🌈 Mixing colors for the pictures...",
  "📖 Putting the pages together...",
  "🏰 Almost ready — the magic is happening!",
];

export default function Generating() {
  const { storyId } = useParams(); // get storyId from URL: /generating/5
  const navigate = useNavigate();

  const [status, setStatus] = useState("pending");
  const [pagesGenerated, setPagesGenerated] = useState(0);
  const [childName, setChildName] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  // Cycle through fun messages every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % WAITING_MESSAGES.length);
      setElapsed((s) => s + 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Poll the status endpoint every 3 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await getStoryStatus(storyId);
        setStatus(data.status);
        setPagesGenerated(data.pages_generated || 0);
        setChildName(data.child_name || "");

        if (data.status === "completed") {
          // Done! Navigate to the storybook viewer
          navigate(`/storybook/${storyId}`);
        } else if (data.status === "failed") {
          setError("Story generation failed. Please try again.");
        }
      } catch (err) {
        setError("Lost connection to server. Please refresh.");
      }
    };

    // Poll immediately, then every 3 seconds
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [storyId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50
                      flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Something went wrong</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold
                       hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50
                    flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">

        {/* Animated spinner */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
          <div className="absolute inset-0 rounded-full border-4 border-purple-500
                          border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            🎨
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {childName ? `Creating ${childName}'s storybook...` : "Creating your storybook..."}
        </h2>

        {/* Cycling message */}
        <p className="text-purple-600 font-medium mb-6 min-h-[1.5rem] transition-all">
          {WAITING_MESSAGES[msgIndex]}
        </p>

        {/* Progress bar */}
        {pagesGenerated > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Pages generated</span>
              <span>{pagesGenerated} / 6</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full
                           transition-all duration-500"
                style={{ width: `${(pagesGenerated / 6) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 bg-purple-50 rounded-full
                        px-4 py-2 text-sm text-purple-600 font-medium">
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          {status === "pending" ? "Queued..." : "AI is working..."}
        </div>

        {/* Time elapsed */}
        <p className="text-gray-400 text-xs mt-4">
          ⏱️ {elapsed}s elapsed — usually takes 1-3 minutes
        </p>
      </div>
    </div>
  );
}
