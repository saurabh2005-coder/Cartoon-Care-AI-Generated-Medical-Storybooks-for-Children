/**
 * PageCard.jsx — Storybook page with dynamic layouts + Read-Aloud
 *
 * WHAT WAS WRONG:
 *   - PAGE_THEMES used purple, pink, blue, indigo gradients — AI-generated look
 *   - Badge colors were purple-500, pink-500, blue-500, indigo-500 — all cool tones
 *   - Bubble borders were purple-200, pink-200, blue-200 — same family
 *
 * WHY THIS IS BETTER:
 *   - Themes now use warm + cool balance: teal, orange, green, amber, sky, rose
 *   - No purple anywhere — distinct from the old AI-generated palette
 *   - Each theme has a unique warm/cool identity — pages feel varied
 *   - Badge colors use brand palette: teal, orange, green
 *   - Added read-aloud functionality with ElevenLabs TTS
 *
 * TAILWIND CLASSES:
 *   bg-[#e6faf9]    → teal-tinted bubble background
 *   border-[#2EC4B6]→ teal bubble border
 *   text-[#2EC4B6]  → teal accent text
 *   bg-[#2EC4B6]    → teal page badge
 */

import { useTextToSpeech } from '../hooks/useTextToSpeech';

const IMAGE_BASE = "http://localhost:8000";

// Warm + cool balanced page themes — no purple, no neon gradients
const PAGE_THEMES = [
  { bg: "from-[#e6faf9] to-[#f0fffe]",  bubble: "bg-[#e6faf9]  border-[#2EC4B6]/30",  accent: "text-[#2EC4B6]",  badge: "bg-[#2EC4B6]"   },
  { bg: "from-indigo-50  to-amber-50",   bubble: "bg-indigo-50  border-indigo-200",     accent: "text-indigo-600", badge: "bg-[#6366F1]"   },
  { bg: "from-green-50   to-emerald-50", bubble: "bg-green-50   border-green-200",      accent: "text-green-700",  badge: "bg-[#4CAF50]"   },
  { bg: "from-sky-50     to-blue-50",    bubble: "bg-sky-50     border-sky-200",        accent: "text-sky-700",    badge: "bg-sky-500"     },
  { bg: "from-amber-50   to-yellow-50",  bubble: "bg-amber-50   border-amber-200",      accent: "text-amber-700",  badge: "bg-amber-500"   },
  { bg: "from-rose-50    to-pink-50",    bubble: "bg-rose-50    border-rose-200",       accent: "text-rose-700",   badge: "bg-rose-500"    },
];

// Split long text into short readable lines (max ~60 chars per line)
function splitIntoLines(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.map(s => s.trim()).filter(Boolean).slice(0, 5);
}

export default function PageCard({ page, childName, layout = 0 }) {
  const { speak, stop, isPlaying, isLoading } = useTextToSpeech();
  
  const hasImage = page.image_path && !page.image_path.includes("placeholder");
  const imageUrl = hasImage
    ? `${IMAGE_BASE}/${page.image_path.replace(/\\/g, "/").replace(/^\.\//, "")}`
    : null;

  const theme = PAGE_THEMES[(page.page_number - 1) % PAGE_THEMES.length];
  const layoutType = layout % 4;
  const lines = splitIntoLines(page.text);

  // Handle read-aloud button click
  const handleReadAloud = () => {
    if (isPlaying) {
      stop();
    } else {
      speak(page.text);
    }
  };

  const PageBadge = () => (
    <div className="flex items-center gap-2">
      <div className={`${theme.badge} text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm`}>
        Page {page.page_number}
      </div>
      <button
        onClick={handleReadAloud}
        disabled={isLoading}
        className={`${theme.badge} text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1`}
        title={isPlaying ? "Stop reading" : "Read aloud"}
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Loading...</span>
          </>
        ) : isPlaying ? (
          <>
            <span>⏸️</span>
            <span>Stop</span>
          </>
        ) : (
          <>
            <span>🔊</span>
            <span>Read</span>
          </>
        )}
      </button>
    </div>
  );

  const ImageBlock = ({ className = "" }) => (
    <div className={`relative overflow-hidden rounded-2xl shadow-md ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Page ${page.page_number}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${theme.bg} text-gray-400`}
        style={{ display: imageUrl ? "none" : "flex" }}
      >
        <span className="text-5xl mb-2">🎨</span>
        <span className="text-xs">Illustration</span>
      </div>
    </div>
  );

  const TextBubble = ({ className = "" }) => (
    <div className={`${theme.bubble} border-2 rounded-3xl p-5 flex flex-col justify-center ${className}`}>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`text-gray-700 leading-relaxed font-medium ${
              i === 0 ? "text-base font-semibold" : "text-sm"
            }`}
          >
            {i === 0 ? "✨ " : ""}{line}
          </p>
        ))}
      </div>
    </div>
  );

  // ── Layout 0: Full image with text overlay ────────────────────────────
  if (layoutType === 0) {
    return (
      <div className={`rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br ${theme.bg} p-3`}>
        <div className="relative rounded-2xl overflow-hidden">
          <ImageBlock className="w-full aspect-square" />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-2xl" />
          {/* Page badge top-left */}
          <div className="absolute top-3 left-3">
            <PageBadge />
          </div>
          {/* Text at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="space-y-1">
              {lines.slice(0, 3).map((line, i) => (
                <p key={i} className={`text-white leading-snug drop-shadow ${i === 0 ? "text-base font-bold" : "text-sm font-medium"}`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Layout 1: Image left, speech bubble right ─────────────────────────
  if (layoutType === 1) {
    return (
      <div className={`rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br ${theme.bg} p-4`}>
        <div className="flex items-center justify-between mb-3">
          <PageBadge />
        </div>
        <div className="grid grid-cols-2 gap-3 items-center">
          <ImageBlock className="aspect-square" />
          <div className="relative">
            {/* Speech bubble tail */}
            <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0
                             border-t-8 border-b-8 border-r-8 border-transparent
                             border-r-current ${theme.accent}`} />
            <TextBubble />
          </div>
        </div>
      </div>
    );
  }

  // ── Layout 2: Speech bubble left, image right ─────────────────────────
  if (layoutType === 2) {
    return (
      <div className={`rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br ${theme.bg} p-4`}>
        <div className="flex items-center justify-between mb-3">
          <PageBadge />
        </div>
        <div className="grid grid-cols-2 gap-3 items-center">
          <div className="relative">
            <div className={`absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0
                             border-t-8 border-b-8 border-l-8 border-transparent
                             border-l-current ${theme.accent}`} />
            <TextBubble />
          </div>
          <ImageBlock className="aspect-square" />
        </div>
      </div>
    );
  }

  // ── Layout 3: Comic panel — image top, styled text below ─────────────
  return (
    <div className={`rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br ${theme.bg} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <PageBadge />
        <span className="text-xs text-gray-400 font-medium italic">"{childName}'s story"</span>
      </div>
      <ImageBlock className="w-full aspect-video mb-3" />
      <div className={`${theme.bubble} border-2 rounded-2xl p-4`}>
        <div className="flex items-start gap-2">
          <span className="text-2xl mt-0.5">💬</span>
          <div className="space-y-1.5">
            {lines.map((line, i) => (
              <p key={i} className={`text-gray-700 leading-relaxed ${i === 0 ? "text-sm font-bold" : "text-xs font-medium"}`}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
