import React, { useState } from "react";
import { Volume2, Square } from "lucide-react";

interface ListenButtonProps {
  text: string;
  lang?: string;
  label?: string;
}

/** Hindi-first text-to-speech: "Suniye" for users who prefer listening. */
export function ListenButton({ text, lang = "hi-IN", label = "Suniye" }: ListenButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang.startsWith("hi"));
    if (hindiVoice) utterance.voice = hindiVoice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  if (typeof window !== "undefined" && !("speechSynthesis" in window)) return null;

  return (
    <button
      type="button"
      className={`listen-btn${speaking ? " is-speaking" : ""}`}
      onClick={speak}
      aria-label={speaking ? "Rokein" : `${label}: ${text.slice(0, 60)}`}
    >
      {speaking ? <Square size={14} /> : <Volume2 size={15} />}
      <span>{speaking ? "Rokein" : label}</span>
    </button>
  );
}
