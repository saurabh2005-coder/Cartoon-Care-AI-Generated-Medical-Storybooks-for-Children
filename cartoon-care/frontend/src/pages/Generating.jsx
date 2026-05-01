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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-3">Something went wrong</h2>
          <p className="text-[#64748B] mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#2EC4B6] text-white px-6 py-3 rounded-xl font-semibold
                       hover:bg-[#25a99d] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">

        {/* Animated spinner — teal, not purple */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-[#e6faf9]" />
          <div className="absolute inset-0 rounded-full border-4 border-[#2EC4B6]
                          border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            {[
              <i key="frog" className="fa-solid fa-frog text-[#2EC4B6]" />,
              <i key="dog"  className="fa-solid fa-dog text-[#6366F1]" />,
              <i key="fish" className="fa-solid fa-fish text-[#4CAF50]" />,
            ][msgIndex % 3]}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[#1E293B] mb-2">
          {childName ? `Creating ${childName}'s storybook...` : "Creating your storybook..."}
        </h2>

        {/* Cycling message — teal text */}
        <p className="text-[#2EC4B6] font-medium mb-6 min-h-[1.5rem] transition-all">
          {WAITING_MESSAGES[msgIndex]}
        </p>

        {/* Progress bar — teal, no gradient */}
        {pagesGenerated > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-[#64748B] mb-1">
              <span>Pages generated</span>
              <span>{pagesGenerated} / 6</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-[#2EC4B6] h-2 rounded-full transition-all duration-500"
                style={{ width: `${(pagesGenerated / 6) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Status badge — teal */}
        <div className="inline-flex items-center gap-2 bg-[#e6faf9] rounded-full
                        px-4 py-2 text-sm text-[#2EC4B6] font-medium">
          <span className="w-2 h-2 bg-[#2EC4B6] rounded-full animate-pulse" />
          {status === "pending" ? "Queued..." : "AI is working..."}
        </div>

        <p className="text-[#64748B] text-xs mt-4">
          <i className="fa-solid fa-alarm-clock mr-1"></i> {elapsed}s elapsed — usually takes 1-3 minutes
        </p>
      </div>
    </div>
  );
}
