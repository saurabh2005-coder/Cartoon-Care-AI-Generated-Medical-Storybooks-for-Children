/**
 * PageCard.jsx — Redesigned storybook page with dynamic layouts
 *
 * Alternates between 4 layout styles per page:
 *   0 → Full image with text overlay at bottom
 *   1 → Split: image left, speech bubble right
 *   2 → Split: speech bubble left, image right
 *   3 → Image top with comic-style text panel below
 */

const IMAGE_BASE = "http://localhost:8000";

// Soft pastel backgrounds per page (cycles)
const PAGE_THEMES = [
  { bg: "from-purple-100 to-blue-100",   bubble: "bg-purple-50  border-purple-200",  accent: "text-purple-700",  badge: "bg-purple-500" },
  { bg: "from-pink-100   to-orange-100", bubble: "bg-pink-50    border-pink-200",    accent: "text-pink-700",    badge: "bg-pink-500"   },
  { bg: "from-blue-100   to-cyan-100",   bubble: "bg-blue-50    border-blue-200",    accent: "text-blue-700",    badge: "bg-blue-500"   },
  { bg: "from-green-100  to-teal-100",   bubble: "bg-green-50   border-green-200",   accent: "text-green-700",   badge: "bg-green-500"  },
  { bg: "from-yellow-100 to-amber-100",  bubble: "bg-yellow-50  border-yellow-200",  accent: "text-yellow-700",  badge: "bg-yellow-500" },
  { bg: "from-indigo-100 to-purple-100", bubble: "bg-indigo-50  border-indigo-200",  accent: "text-indigo-700",  badge: "bg-indigo-500" },
];

// Split long text into short readable lines (max ~60 chars per line)
function splitIntoLines(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.map(s => s.trim()).filter(Boolean).slice(0, 5);
}

export default function PageCard({ page, childName, layout = 0 }) {
  const hasImage = page.image_path && !page.image_path.includes("placeholder");
  const imageUrl = hasImage
    ? `${IMAGE_BASE}/${page.image_path.replace(/\\/g, "/").replace(/^\.\//, "")}`
    : null;

  const theme = PAGE_THEMES[(page.page_number - 1) % PAGE_THEMES.length];
  const layoutType = layout % 4;
  const lines = splitIntoLines(page.text);

  const PageBadge = () => (
    <div className={`${theme.badge} text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm`}>
      Page {page.page_number}
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
