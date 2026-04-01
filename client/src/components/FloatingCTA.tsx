import { useState, useEffect } from "react";

/**
 * FloatingCTA — a slim "Choose Your Plan →" pill fixed to the bottom-left.
 * Appears after the user scrolls past the hero (300px), so it doesn't
 * compete with the hero CTAs. Sits on the opposite side from FloatingRiley.
 */
export default function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <a
      href="#pricing"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xl shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95 animate-in slide-in-from-bottom-4 fade-in"
      aria-label="Choose your plan"
    >
      Choose Your Plan
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
      </svg>
    </a>
  );
}
