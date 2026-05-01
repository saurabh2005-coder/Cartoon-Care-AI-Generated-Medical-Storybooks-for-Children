/**
 * Home — Landing page
 *
 * WHAT WAS WRONG:
 *   - Hero visual used bg-gradient-to-br from-violet-50 to-indigo-50 — AI look
 *   - Feature cards had bg-violet-50 icon backgrounds — same purple everywhere
 *   - Step circles were bg-violet-600 — same as buttons, no hierarchy
 *   - Footer logo was bg-violet-600 — same as CTA buttons
 *   - "Get started" cards had hover:border-violet-300 — purple on purple
 *
 * WHY THIS IS BETTER:
 *   - Hero visual uses a clean white card with teal border accent
 *   - Feature icons use teal bg (#e6faf9) — distinct from page bg
 *   - Step circles use teal — consistent primary color
 *   - Admin card uses warm orange (#6366F1) — secondary color, clear role distinction
 *   - CTA buttons: primary = solid teal, secondary = white with border
 *
 * TAILWIND CLASSES:
 *   bg-[#F8FAFC]        → off-white section backgrounds
 *   bg-[#2EC4B6]        → teal primary buttons and step circles
 *   bg-[#6366F1]        → orange admin button (secondary color)
 *   hover:bg-[#25a99d]  → teal darken on hover
 *   hover:bg-[#4f46e5]  → orange darken on hover
 *   border-[#2EC4B6]/20 → subtle teal border on hero card
 */
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function FeatureCard({ icon, title, desc, delay = "" }) {
  return (
    <div className={`group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm
                     hover:shadow-md hover:-translate-y-1 transition-all duration-300
                     animate-fade-up opacity-0 ${delay}`}>
      {/* Image icon — teal tinted background */}
      <div className="w-12 h-12 bg-[#e6faf9] rounded-xl flex items-center justify-center mb-4
                      group-hover:bg-[#d0f5f3] transition-colors overflow-hidden">
        <img src={icon} alt={title} className="w-8 h-8 object-contain" />
      </div>
      <h3 className="font-semibold text-[#1E293B] mb-2 text-base">{title}</h3>
      <p className="text-[#64748B] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ number, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Teal step circle — primary color, not violet */}
      <div className="w-12 h-12 bg-[#2EC4B6] text-white rounded-full flex items-center justify-center
                      font-bold text-lg mb-4 shadow-sm">
        {number}
      </div>
      <h4 className="font-semibold text-[#1E293B] mb-1.5">{title}</h4>
      <p className="text-[#64748B] text-sm leading-relaxed max-w-[180px]">{desc}</p>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="bg-white">

      {/* ── HERO SECTION ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-24 grid md:grid-cols-2 gap-12 items-center">

        {/* Left: Text */}
        <div className="animate-fade-up opacity-0">
          {/* Teal pill badge — not violet */}
          <span className="inline-block bg-[#e6faf9] text-[#2EC4B6] text-xs font-semibold
                           px-3 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            AI-Powered Medical Storybooks
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1E293B] leading-tight mb-5">
            Help children understand
            <span className="text-[#2EC4B6]"> their health</span> through stories
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed mb-8 max-w-md">
            Cartoon Care creates personalized, illustrated storybooks that explain medical conditions to children in a fun, friendly, and age-appropriate way.
          </p>
          <div className="flex flex-wrap gap-3">
            {/* Primary CTA — solid teal */}
            <Link to="/register"
              className="px-6 py-3 bg-[#2EC4B6] text-white font-semibold rounded-xl
                         hover:bg-[#25a99d] transition-colors shadow-sm active:scale-95">
              Create Your Story →
            </Link>
            {/* Secondary CTA — white with border */}
            <Link to="/login"
              className="px-6 py-3 bg-white text-[#64748B] font-semibold rounded-xl border border-gray-200
                         hover:border-[#2EC4B6] hover:text-[#2EC4B6] transition-all">
              Sign In
            </Link>
          </div>
          <p className="text-[#64748B] text-xs mt-5">
            Free to use · No credit card required · Instant PDF download
          </p>
        </div>

        {/* Right: Visual — clean white card, no gradient background */}
        <div className="animate-fade-up opacity-0 delay-200">
          <div className="relative">
            {/* Main card — white with subtle teal border, not gradient */}
            <div className="bg-white rounded-3xl p-8 border-2 border-[#2EC4B6]/20 shadow-md">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <img src="/icon-book.png" alt="Storybook" className="w-24 h-24 object-contain" />
                </div>
                <p className="font-semibold text-[#1E293B] text-lg">Emma's Adventure</p>
                <p className="text-[#64748B] text-sm">A story about Asthma</p>
              </div>
              {/* Mock page cards — warm pastels, no purple */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { bg: "bg-[#e6faf9]",  emoji: "🐉", text: "The wind dragons..." },
                  { bg: "bg-indigo-50",  emoji: "✨", text: "Emma was brave..." },
                  { bg: "bg-green-50",   emoji: "🌟", text: "She used her..." },
                  { bg: "bg-amber-50",   emoji: "🎉", text: "And won the day!" },
                ].map((card, i) => (
                  <div key={i} className={`${card.bg} rounded-xl p-3 text-center`}>
                    <div className="text-2xl mb-1">{card.emoji}</div>
                    <p className="text-xs text-[#64748B] font-medium">{card.text}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating badges — teal and orange (brand colors) */}
            <div className="absolute -top-3 -right-3 bg-white rounded-xl shadow-md px-3 py-2 border border-gray-100">
              <p className="text-xs font-semibold text-[#1E293B]">✅ PDF Ready</p>
            </div>
            <div className="absolute -bottom-3 -left-3 bg-[#2EC4B6] rounded-xl shadow-md px-3 py-2">
              <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                <img src="/icon-ai.png" alt="AI" className="w-7 h-7 object-contain brightness-0 invert" />
                AI Illustrated
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ─────────────────────────────────────────── */}
      <section className="bg-[#F8FAFC] py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
              Everything you need
            </h2>
            <p className="text-[#64748B] max-w-md mx-auto">
              A complete toolkit for creating meaningful medical storybooks for children
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard
              icon="/icon-ai.png"
              title="AI Story Generation"
              desc="Powered by advanced LLMs that write age-appropriate, engaging stories tailored to each child."
              delay="delay-100"
            />
            <FeatureCard
              icon="/icon-illustrations.png"
              title="Custom Illustrations"
              desc="Disney-inspired cartoon images generated for every page using Stable Diffusion with custom LoRA."
              delay="delay-200"
            />
            <FeatureCard
              icon="/icon-language.png"
              title="Multi-Language"
              desc="Stories can be translated into multiple languages so every child can read in their native tongue."
              delay="delay-300"
            />
            <FeatureCard
              icon="/icon-download.png"
              title="PDF Download"
              desc="Download a beautifully formatted PDF storybook to print, share, or keep forever."
              delay="delay-400"
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1E293B] mb-3">How it works</h2>
            <p className="text-[#64748B]">Three simple steps to a magical storybook</p>
          </div>

          <div className="relative">
            {/* Connector line — teal, not violet */}
            <div className="hidden md:block absolute top-6 left-1/4 right-1/4 h-px bg-[#2EC4B6]/30" />
            <div className="grid md:grid-cols-3 gap-10">
              <Step number="1" title="Fill the form" desc="Enter your child's name, age, and medical condition" />
              <Step number="2" title="AI creates" desc="Our AI writes the story and generates custom illustrations" />
              <Step number="3" title="Download & share" desc="Get a beautiful PDF storybook instantly" />
            </div>
          </div>
        </div>
      </section>

      {/* ── GET STARTED CARDS ─────────────────────────────────────────── */}
      <section className="bg-[#F8FAFC] py-20">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#1E293B] mb-3">Get started today</h2>
            <p className="text-[#64748B]">Choose your role to continue</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* User card — teal accent */}
            <div className="bg-white rounded-2xl border border-gray-200 p-7 hover:border-[#2EC4B6] hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-[#e6faf9] rounded-xl flex items-center justify-center mb-4 overflow-hidden">
                <img src="/icon-parent.png" alt="Parent/Doctor" className="w-8 h-8 object-contain" />
              </div>
              <h3 className="font-semibold text-[#1E293B] text-lg mb-1">Parent / Doctor</h3>
              <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                Create personalized storybooks for your child or patient
              </p>
              <div className="space-y-2">
                <Link to="/register"
                  className="block w-full text-center py-2.5 bg-[#2EC4B6] text-white font-semibold
                             rounded-xl hover:bg-[#25a99d] transition-colors text-sm">
                  Create Free Account
                </Link>
                <Link to="/login"
                  className="block w-full text-center py-2.5 bg-white text-[#64748B] font-medium
                             rounded-xl border border-gray-200 hover:border-[#2EC4B6] hover:text-[#2EC4B6]
                             transition-all text-sm">
                  Sign In
                </Link>
              </div>
            </div>

            {/* Admin card — orange accent (secondary color) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-7 hover:border-[#6366F1] hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
                <img src="/icon-admin.png" alt="Administrator" className="w-8 h-8 object-contain" />
              </div>
              <h3 className="font-semibold text-[#1E293B] text-lg mb-1">Administrator</h3>
              <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
                Manage users, view all stories, and oversee the platform
              </p>
              <div className="space-y-2">
                {/* Orange button for admin — secondary color, visually distinct */}
                <Link to="/login" state={{ prefill: "admin" }}
                  className="block w-full text-center py-2.5 bg-[#6366F1] text-white font-semibold
                             rounded-xl hover:bg-[#4f46e5] transition-colors text-sm">
                  Admin Sign In
                </Link>
                <div className="bg-indigo-50 rounded-xl px-4 py-2.5 text-xs text-[#64748B] space-y-0.5">
                  <p><span className="font-semibold text-[#1E293B]">Email:</span> admin@cartooncare.com</p>
                  <p><span className="font-semibold text-[#1E293B]">Password:</span> Admin@123456</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="CartoonCare" className="h-8 w-auto" />
          </div>
          <p className="text-[#64748B] text-xs text-center">
            AI-powered medical storybooks for children · Built with ❤️ · v1.0
          </p>
          <div className="flex gap-4 text-xs text-[#64748B]">
            <span>GLA University</span>
            <span>·</span>
            <span>B.Tech Project 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
