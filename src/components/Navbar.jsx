/**
 * Navbar.jsx — Top navigation bar
 */
export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + title */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-3xl">🎨</span>
          <div>
            <h1 className="text-white font-bold text-xl leading-none">Cartoon Care</h1>
            <p className="text-purple-200 text-xs">AI Medical Storybooks for Kids</p>
          </div>
        </a>

        {/* Library link */}
        <a
          href="/library"
          className="text-white text-sm font-medium hover:text-purple-200 transition-colors"
        >
          📚 My Stories
        </a>
      </div>
    </nav>
  );
}
