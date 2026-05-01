/**
 * StoryForm.jsx — The main input form for creating a storybook
 *
 * Collects:
 *   - Child's name
 *   - Age (5–11)
 *   - Disease
 *   - Language
 *   - Optional theme/superhero
 *
 * On submit → calls generateStory() API → navigates to /generating/{id}
 */

import { useState, useEffect } from "react";
import { generateStory, getDiseases, getLanguages } from "../api/client";

// Common diseases shown as quick-select buttons
const QUICK_DISEASES = [
  { label: "Asthma", value: "asthma" },
  { label: "Diabetes", value: "diabetes" },
  { label: "Fever", value: "fever" },
  { label: "Allergies", value: "allergies" },
  { label: "Epilepsy", value: "epilepsy" },
  { label: "Heart", value: "heart disease" },
  { label: "Anxiety", value: "anxiety" },
  { label: "Cancer", value: "cancer" },
];

export default function StoryForm({ onSubmit }) {
  // Form state — one piece of state per field
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState(7);
  const [disease, setDisease] = useState("");
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState("");
  const [languages, setLanguages] = useState(["English"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load supported languages from backend on mount
  useEffect(() => {
    getLanguages()
      .then((data) => setLanguages(data.languages || ["English"]))
      .catch(() => {}); // silently fail — English is the default
  }, []);

  async function handleSubmit(e) {
    e.preventDefault(); // prevent page reload on form submit
    setError("");

    // Basic validation
    if (!childName.trim()) return setError("Please enter the child's name");
    if (!disease.trim()) return setError("Please select or enter a disease");

    setLoading(true);
    try {
      const result = await generateStory({
        child_name: childName.trim(),
        age: Number(age),
        disease: disease.trim(),
        language,
        theme: theme.trim() || null,
      });
      // result = { story_id, status, message }
      onSubmit(result.story_id); // tell parent to navigate to /generating/{id}
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Child's Name */}
      <div>
        <label className="block text-sm font-semibold text-[#1E293B] mb-1">
          Child's Name
        </label>
        <input
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="e.g. Emma"
          maxLength={50}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#1E293B]
                     focus:outline-none focus:border-[#2EC4B6] transition-colors text-lg"
        />
      </div>

      {/* Age slider */}
      <div>
        <label className="block text-sm font-semibold text-[#1E293B] mb-1">
          Age: <span className="text-[#2EC4B6] text-lg font-bold">{age}</span> years old
        </label>
        <input
          type="range"
          min={5} max={11} step={1}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full accent-[#2EC4B6]"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>5</span><span>6</span><span>7</span><span>8</span>
          <span>9</span><span>10</span><span>11</span>
        </div>
      </div>

      {/* Disease — quick select + custom input */}
      <div>
        <label className="block text-sm font-semibold text-[#1E293B] mb-2">
          Medical Condition
        </label>
        {/* Quick-select buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_DISEASES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDisease(d.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all
                ${disease === d.value
                  ? "bg-[#2EC4B6] border-[#2EC4B6] text-white"
                  : "bg-white border-gray-200 text-[#64748B] hover:border-[#2EC4B6]"
                }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        {/* Custom input for unlisted diseases */}
        <input
          type="text"
          value={disease}
          onChange={(e) => setDisease(e.target.value)}
          placeholder="Or type any condition..."
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-[#1E293B]
                     focus:outline-none focus:border-[#2EC4B6] transition-colors"
        />
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-semibold text-[#1E293B] mb-1">
          Story Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#1E293B]
                     focus:outline-none focus:border-[#2EC4B6] transition-colors bg-white"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      {/* Optional theme — commented out
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Favorite Superhero / Theme{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g. Spider-Man, Frozen, Dinosaurs..."
          maxLength={100}
          className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 text-gray-800
                     focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>
      */}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Submit button — solid teal, NO gradient */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2EC4B6] text-white
                   font-bold text-lg py-4 rounded-2xl shadow-sm
                   hover:bg-[#25a99d] transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed
                   active:scale-95"
      >
        {loading ? "Creating your story..." : "Create My Storybook!"}
      </button>
    </form>
  );
}
