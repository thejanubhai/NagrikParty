import React, { useEffect, useState } from "react";

const SLIDES = [
  {
    icon: "🏛️",
    title: "Nagrik Party kya hai?",
    body: "Delhi ke liye ban rahi ek nayi political party, Formation Phase me hai. Kaam pehle, power baad me. Sab kuch khula aur verified.",
  },
  {
    icon: "🪪",
    title: "Member kaise banein?",
    body: "Bas 5 minute: apna Voter ID rakhein, form bharein, aur digital membership card paayein. Koi fees nahi, koi cash nahi.",
  },
  {
    icon: "👀",
    title: "Kya milega?",
    body: "Party ka har rupaya, har faisala aapke saamne. Hisaab page par live account. Crime tracker par Delhi ka sach.",
  },
];

/** First-visit 3-slide intro, skippable, never shows again. */
export function OnboardingCarousel() {
  const [show, setShow] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (localStorage.getItem("nagrik-onboarded")) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    setShow(true);
  }, []);

  if (!show) return null;

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  function finish() {
    localStorage.setItem("nagrik-onboarded", "1");
    setShow(false);
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Parichay">
      <button type="button" className="onboarding-skip" onClick={finish}>
        Skip →
      </button>
      <div className="onboarding-slide-icon" aria-hidden="true">{slide.icon}</div>
      <h2 className="onboarding-title">{slide.title}</h2>
      <p className="onboarding-body">{slide.body}</p>
      <div className="onboarding-dots" aria-hidden="true">
        {SLIDES.map((_, i) => (
          <span key={i} className={`onboarding-dot${i === index ? " is-active" : ""}`} />
        ))}
      </div>
      <button
        type="button"
        className="button button-primary"
        style={{ minWidth: 200, minHeight: 52, fontSize: 16 }}
        onClick={() => (isLast ? finish() : setIndex(index + 1))}
      >
        {isLast ? "Shuru Karein ✓" : "Aage →"}
      </button>
    </div>
  );
}
