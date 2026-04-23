/**
 * PageCard.jsx — Displays one page of the storybook
 *
 * Each page shows:
 *   - Page number badge
 *   - The AI-generated illustration (or a placeholder if still generating)
 *   - The story text
 */

const IMAGE_BASE = "http://localhost:8000"; // FastAPI serves images here

export default function PageCard({ page, childName }) {
  const hasImage = page.image_path && !page.image_path.includes("placeholder");

  // Convert the file path to a URL the browser can load
  // e.g. "./outputs/story_1/page_1.png" → "http://localhost:8000/outputs/story_1/page_1.png"
  const imageUrl = hasImage
    ? `${IMAGE_BASE}/${page.image_path.replace(/\\/g, "/").replace(/^\.\//, "")}`
    : null;

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-purple-100
                    hover:shadow-xl transition-shadow">

      {/* Page number badge */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 flex items-center gap-2">
        <span className="bg-white text-purple-600 font-bold text-sm rounded-full
                         w-7 h-7 flex items-center justify-center">
          {page.page_number}
        </span>
        <span className="text-white text-sm font-medium">
          Page {page.page_number}
        </span>
      </div>

      {/* Illustration */}
      <div className="aspect-square bg-gradient-to-br from-purple-50 to-blue-50
                      flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Page ${page.page_number} illustration`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // If image fails to load, show placeholder
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        {/* Placeholder shown when no image or image fails */}
        <div
          className="w-full h-full flex flex-col items-center justify-center text-purple-300"
          style={{ display: imageUrl ? "none" : "flex" }}
        >
          <span className="text-6xl mb-2">🎨</span>
          <span className="text-sm">Illustration coming soon</span>
        </div>
      </div>

      {/* Story text */}
      <div className="p-5">
        <p className="text-gray-700 text-base leading-relaxed font-medium">
          {page.text}
        </p>
      </div>
    </div>
  );
}
