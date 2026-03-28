import { useState, useEffect } from "react";
import { GALLERY } from "../../../shared/assets";

// Balanced pool — round-robin across all 6 industries
// Gym: now 3 women-inclusive photos + 2 male (balanced)
// Massage: massageTherapist (dark plants) and spaTherapy (candle) removed per user request
const BALANCED_PHOTOS = [
  GALLERY.construction[0], // construction workers
  GALLERY.gym[0],          // woman with dumbbells
  GALLERY.massage[0],      // massage table
  GALLERY.corporate[0],    // corporate office
  GALLERY.barber[0],       // barber cutting
  GALLERY.restaurant[0],   // restaurant POS
  GALLERY.construction[1], // construction site
  GALLERY.gym[1],          // woman with barbell
  GALLERY.massage[1],      // massage hotstone
  GALLERY.corporate[1],    // corporate meeting
  GALLERY.barber[1],       // barber shop
  GALLERY.restaurant[1],   // restaurant service
  GALLERY.construction[2], // construction crew
  GALLERY.gym[2],          // mixed group class
  GALLERY.massage[2],      // couples massage
  GALLERY.corporate[2],    // corporate team
];

interface SectionBackgroundProps {
  /** Tailwind bg opacity class for the overlay.
   *  Lower = more photo visible. "bg-white/85" is a good balance. */
  overlayClass?: string;
  /** Starting index so adjacent sections show different photos */
  offset?: number;
}

/**
 * Rotating photo background for marketing sections.
 * Photos cycle every 7 seconds with a 1.5s crossfade.
 * Balanced pool: 3 photos per industry in round-robin order.
 */
export default function SectionBackground({
  overlayClass = "bg-white/85",
  offset = 0,
}: SectionBackgroundProps) {
  const [idx, setIdx] = useState(offset % BALANCED_PHOTOS.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % BALANCED_PHOTOS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    // z-0 keeps this behind all section content (content must be relative z-10 or higher)
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {BALANCED_PHOTOS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[1500ms] ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* Overlay — 85% keeps photos visible but content stays fully readable */}
      <div className={`absolute inset-0 ${overlayClass}`} />
    </div>
  );
}
