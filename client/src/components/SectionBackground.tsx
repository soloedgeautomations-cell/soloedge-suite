import { useState, useEffect } from "react";
import { GALLERY } from "../../../shared/assets";

// All industry photos flattened into one pool for slow rotation
const ALL_PHOTOS = [
  ...GALLERY.construction,
  ...GALLERY.gym,
  ...GALLERY.massage,
  ...GALLERY.corporate,
];

interface SectionBackgroundProps {
  /** Tailwind opacity class for the overlay — controls how much the photo shows through.
   *  Defaults to "bg-white/92" (very subtle, content-first). */
  overlayClass?: string;
  /** Starting index offset so adjacent sections don't show the same photo */
  offset?: number;
}

/**
 * Subtle rotating photo background for marketing sections.
 * Photos cycle every 8 seconds with a slow 2s crossfade.
 * A heavy white overlay keeps content fully readable.
 */
export default function SectionBackground({
  overlayClass = "bg-white/92",
  offset = 0,
}: SectionBackgroundProps) {
  const [idx, setIdx] = useState(offset % ALL_PHOTOS.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % ALL_PHOTOS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {ALL_PHOTOS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[2000ms] ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* Heavy overlay so content stays fully readable */}
      <div className={`absolute inset-0 ${overlayClass}`} />
    </div>
  );
}
