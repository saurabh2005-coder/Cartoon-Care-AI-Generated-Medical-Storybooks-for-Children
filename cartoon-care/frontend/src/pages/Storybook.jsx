/**
 * Storybook — Single page flipbook: IMAGE LEFT | TEXT RIGHT
 * One page per view. Clean, symmetric, book-like.
 * Now with Read-Aloud functionality using ElevenLabs TTS
 */
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStory, downloadStoryPDF } from "../api/client";
import { useTextToSpeech } from "../hooks/useTextToSpeech";

const IMAGE_BASE = "http://localhost:8000";

const PAGE_THEMES = [
  { bg: "bg-[#e6faf9]",  badge: "bg-[#2EC4B6]",  accent: "text-[#2EC4B6]",  border: "border-[#2EC4B6]/20"  },
  { bg: "bg-indigo-50",  badge: "bg-[#6366F1]",   accent: "text-[#6366F1]",  border: "border-indigo-200"    },
  { bg: "bg-green-50",   badge: "bg-[#4CAF50]",   accent: "text-[#4CAF50]",  border: "border-green-200"     },
  { bg: "bg-sky-50",     badge: "bg-sky-500",      accent: "text-sky-600",    border: "border-sky-200"       },
  { bg: "bg-amber-50",   badge: "bg-amber-500",    accent: "text-amber-600",  border: "border-amber-200"     },
  { bg: "bg-rose-50",    badge: "bg-rose-500",     accent: "text-rose-600",   border: "border-rose-200"      },
];

// Real book page-turn sound from audio file
const pageTurnAudio = new Audio("/page-flip.mp3");
pageTurnAudio.volume = 0.6;

function playPageTurn() {
  try {
    pageTurnAudio.currentTime = 0;
    pageTurnAudio.play().catch(() => {});
  } catch (e) {}
}

export default function Storybook() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { speak, stop, isPlaying, isLoading: ttsLoading } = useTextToSpeech();
  
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(-1); // -1 = cover
  const [transitioning, setTransitioning] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    getStory(storyId)
      .then((data) => { setStory(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [storyId]);

  // Handle read current page - reads ALL text displayed on the page
  const handleReadCurrentPage = () => {
    if (isPlaying) {
      stop();
    } else {
      // Get the current page
      const pages = [...(story.pages || [])].sort((a, b) => a.page_number - b.page_number);
      const page = pages[currentPage];
      
      if (page && page.text) {
        // Read the entire page text (which should be 3-4 short sentences)
        const textToRead = page.text.trim();
        
        if (textToRead) {
          // Detect language and set appropriate voice settings
          const isHindi = /[\u0900-\u097F।]/.test(textToRead);
          
          speak(textToRead, {
            rate: isHindi ? 0.85 : 0.9,  // Slightly slower for Hindi
            pitch: 1.2,
            volume: 1
          });
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <img src="/icon-book.png" alt="loading" className="w-20 h-20 object-contain mx-auto mb-4 animate-bounce" />
          <p className="text-[#64748B] font-medium">Opening your storybook...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8FAFC]">
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <p className="text-[#64748B] mb-4">{error || "Story not found"}</p>
          <button onClick={() => navigate("/dashboard")}
            className="bg-[#2EC4B6] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#25a99d] transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const pages = [...(story.pages || [])].sort((a, b) => a.page_number - b.page_number);
  const totalPages = pages.length;
  const isOnCover = currentPage === -1;
  const isOnEnd = currentPage === totalPages;

  function goTo(index) {
    if (transitioning) return;
    if (index < -1 || index > totalPages) return;
    
    // Stop reading when changing pages
    if (isPlaying) {
      stop();
    }
    
    playPageTurn();
    setTransitioning(true);
    setTimeout(() => { setCurrentPage(index); setTransitioning(false); }, 220);
  }

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 50) dx < 0 ? goTo(currentPage + 1) : goTo(currentPage - 1);
  }

  // ── Cover ─────────────────────────────────────────────────────────────
  const CoverPage = () => (
    <div className="w-full bg-[#1E293B] rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row" style={{minHeight: 520}}>
      {/* Left — decorative */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#2EC4B6]/20 to-transparent flex items-center justify-center p-10 min-h-[260px]">
        <img src="/logo.png" alt="CartoonCare" className="w-48 h-48 object-contain drop-shadow-xl" />
      </div>
      {/* Right — info */}
      <div className="md:w-1/2 flex flex-col justify-center p-10">
        <span className="inline-block bg-[#2EC4B6]/20 text-[#2EC4B6] text-xs font-semibold px-3 py-1 rounded-full mb-5 w-fit">
          AI-Illustrated Storybook
        </span>
        <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
          {story.child_name}'s Adventure
        </h1>
        <p className="text-white/70 mb-1 capitalize">
          A story about <span className="text-[#2EC4B6] font-semibold">{story.disease}</span>
        </p>
        <p className="text-white/40 text-sm mb-8">{totalPages} pages · {story.language}</p>
        <button onClick={() => goTo(0)}
          className="bg-[#2EC4B6] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#25a99d] transition-colors w-fit active:scale-95">
          Start Reading →
        </button>
      </div>
    </div>
  );

  // ── End ───────────────────────────────────────────────────────────────
  const EndPage = () => (
    <div className="w-full bg-[#1E293B] rounded-3xl overflow-hidden shadow-xl flex flex-col items-center justify-center p-12 text-center" style={{minHeight: 520}}>
      <img src="/logo.png" alt="CartoonCare" className="w-44 h-44 object-contain mb-4 drop-shadow-lg" />
      <h2 className="text-3xl font-bold text-white mb-3">The End!</h2>
      <p className="text-white/90 text-lg font-medium mb-2">{story.child_name} is a true hero! 🦸</p>
      <p className="text-white/70 text-sm mb-8 capitalize">
        You finished the story about <span className="font-semibold">{story.disease}</span>
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {story.pdf_path && (
          <button onClick={() => downloadStoryPDF(storyId, story.child_name)}
            className="bg-white text-[#1E293B] font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors shadow text-sm">
            <i className="fa-solid fa-download mr-2"></i>Download PDF
          </button>
        )}
        <button onClick={() => navigate("/dashboard")}
          className="bg-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/30 border border-white/40 text-sm">
          ✨ Create Another
        </button>
      </div>
    </div>
  );

  // ── Story Page: IMAGE LEFT | TEXT RIGHT ───────────────────────────────
  const StoryPage = ({ page }) => {
    const theme = PAGE_THEMES[(page.page_number - 1) % PAGE_THEMES.length];
    const hasImage = page.image_path && !page.image_path.includes("placeholder");
    const imageUrl = hasImage
      ? `${IMAGE_BASE}/${page.image_path.replace(/\\/g, "/").replace(/^\.\//, "")}`
      : null;

    // Split text into sentences - support both English and Hindi punctuation
    const sentences = page.text
      ? (page.text.match(/[^.!?।]+[.!?।]+/g) || [page.text]).map(s => s.trim()).filter(Boolean)
      : [];

    // Detect if text contains Hindi characters
    const isHindi = /[\u0900-\u097F]/.test(page.text || '');

    return (
      <div className="w-full flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-xl bg-white border border-gray-100" style={{minHeight: 520}}>

        {/* ── LEFT: Full image ── */}
        <div className="md:w-1/2 relative bg-gray-900 min-h-[300px] md:min-h-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Page ${page.page_number}`}
              className="w-full h-full object-cover object-top absolute inset-0"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#2EC4B6]/20">
              <img src="/icon-book.png" alt="illustration" className="w-24 h-24 object-contain opacity-20" />
            </div>
          )}
          {/* Page badge over image */}
          <div className={`absolute top-4 left-4 ${theme.badge} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow`}>
            Page {page.page_number}
          </div>
        </div>

        {/* ── RIGHT: Text ── */}
        <div className={`md:w-1/2 ${theme.bg} flex flex-col justify-center items-center px-8 py-10`}>
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <span className={`text-xs font-semibold ${theme.accent} uppercase tracking-wide`}>
                {story.child_name}'s Story
              </span>
              <span className="text-xs text-gray-400">{page.page_number} / {totalPages}</span>
            </div>

            {/* Story text — display all sentences (should be 3-4 short ones) */}
            <div className="space-y-4">
              {sentences.map((sentence, idx) => (
                <p
                  key={idx}
                  style={{ 
                    fontFamily: isHindi ? "'Noto Sans Devanagari', 'Poppins', sans-serif" : "'LittleMonster', 'Poppins', sans-serif",
                    lineHeight: isHindi ? '1.8' : '1.6'
                  }}
                  className={`${idx === 0 ? 'text-2xl font-bold' : 'text-lg'} text-[#1E293B] text-center w-full`}
                >
                  {sentence}
                </p>
              ))}
            </div>
          </div>

          {/* Bottom decoration */}
          <div className="mt-8 flex items-center gap-2">
            <div className={`h-1 w-8 rounded-full ${theme.badge}`} />
            <div className={`h-1 w-4 rounded-full ${theme.badge} opacity-50`} />
            <div className={`h-1 w-2 rounded-full ${theme.badge} opacity-25`} />
          </div>
        </div>
      </div>
    );
  };

  const page = pages[currentPage];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/dashboard")}
            className="text-[#64748B] hover:text-[#1E293B] text-sm font-medium flex items-center gap-1.5 transition-colors">
            ← Back
          </button>
          <div className="text-center hidden sm:block">
            <h2 className="font-bold text-[#1E293B] text-base">{story.child_name}'s Adventure</h2>
            <p className="text-[#64748B] text-xs capitalize">{story.disease} · {totalPages} pages</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReadCurrentPage}
              disabled={ttsLoading || currentPage < 0 || currentPage >= totalPages}
              className="text-xs bg-[#6366F1] text-white px-3 py-1.5 rounded-lg hover:bg-[#5558E3] transition-colors font-medium flex items-center gap-1.5 disabled:opacity-50"
              title={isPlaying ? "Stop reading" : "Read current page"}
            >
              {ttsLoading ? (
                <>
                  <span className="animate-spin">⏳</span> Loading...
                </>
              ) : isPlaying ? (
                <>
                  <i className="fa-solid fa-stop"></i> Stop
                </>
              ) : (
                <>
                  <i className="fa-solid fa-volume-high"></i> Read Page
                </>
              )}
            </button>
            {story.pdf_path && (
              <button onClick={() => downloadStoryPDF(storyId, story.child_name)}
                className="text-xs bg-[#2EC4B6] text-white px-3 py-1.5 rounded-lg hover:bg-[#25a99d] transition-colors font-medium flex items-center gap-1.5">
                <i className="fa-solid fa-download"></i> PDF
              </button>
            )}
          </div>
        </div>

        {/* ── Page content ── */}
        <div
          className={`transition-opacity duration-200 ${transitioning ? "opacity-0" : "opacity-100"}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isOnCover  ? <CoverPage /> :
           isOnEnd    ? <EndPage />  :
           page       ? <StoryPage page={page} /> : null}
        </div>

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= -1}
            className="flex items-center gap-2 bg-white border-2 border-gray-200 text-[#64748B]
                       px-6 py-2.5 rounded-xl font-semibold text-sm
                       hover:border-[#2EC4B6] hover:text-[#2EC4B6] transition-all
                       disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            ← Prev
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => goTo(-1)}
              className={`h-2 rounded-full transition-all ${currentPage === -1 ? "bg-[#2EC4B6] w-5" : "bg-gray-300 hover:bg-gray-400 w-2"}`} />
            {pages.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${i === currentPage ? "bg-[#2EC4B6] w-5" : "bg-gray-300 hover:bg-gray-400 w-2"}`} />
            ))}
            <button onClick={() => goTo(totalPages)}
              className={`h-2 rounded-full transition-all ${currentPage === totalPages ? "bg-[#6366F1] w-5" : "bg-gray-300 hover:bg-gray-400 w-2"}`} />
          </div>

          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-2 bg-[#2EC4B6] text-white
                       px-6 py-2.5 rounded-xl font-semibold text-sm
                       hover:bg-[#25a99d] transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
          >
            Next →
          </button>
        </div>

        {/* Page counter */}
        {!isOnCover && !isOnEnd && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Page {currentPage + 1} of {totalPages}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 mt-8">
          <img src="/logo.png" alt="CartoonCare" className="w-8 h-8 object-contain" />
          <p className="text-xs text-gray-300">Disney-style AI illustrations · Cartoon Care</p>
        </div>
      </div>
    </div>
  );
}
