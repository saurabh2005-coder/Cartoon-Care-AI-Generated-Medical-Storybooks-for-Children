/**
 * Home.jsx — Landing page with the story creation form
 */
import { useNavigate } from "react-router-dom";
import StoryForm from "../components/StoryForm";

export default function Home() {
  const navigate = useNavigate();

  function handleFormSubmit(storyId) {
    // Navigate to the generating/progress page
    navigate(`/generating/${storyId}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Hero section */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">🦸‍♀️📖✨</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Create a Magical Storybook
          </h2>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Turn any medical condition into a fun adventure story where
            <span className="text-purple-600 font-semibold"> your child is the hero!</span>
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: "✍️", title: "Fill the form", desc: "Name, age & condition" },
            { icon: "🤖", title: "AI creates", desc: "Story + illustrations" },
            { icon: "📥", title: "Download PDF", desc: "Keep it forever" },
          ].map((step) => (
            <div key={step.title}
              className="bg-white rounded-2xl p-4 text-center shadow-sm border border-purple-100">
              <div className="text-3xl mb-2">{step.icon}</div>
              <div className="font-semibold text-gray-700 text-sm">{step.title}</div>
              <div className="text-gray-400 text-xs mt-1">{step.desc}</div>
            </div>
          ))}
        </div>

        {/* The form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-purple-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>🌟</span> Tell us about your child
          </h3>
          <StoryForm onSubmit={handleFormSubmit} />
        </div>

        {/* Disney style badge */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2
                           shadow-sm border border-purple-100 text-sm text-gray-600">
            <span>🏰</span>
            <span>Disney-style illustrations powered by custom AI</span>
          </span>
        </div>
      </div>
    </div>
  );
}
