import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Custom Add-to-Home-Screen banner: shows on 2nd visit, dismissible for 7 days. */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already installed, never show
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const dismissedAt = Number(localStorage.getItem("nagrik-a2hs-dismissed") || 0);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (dismissedAt && Date.now() - dismissedAt < sevenDays) return;

    const visits = Number(localStorage.getItem("nagrik-visit-count") || 0) + 1;
    localStorage.setItem("nagrik-visit-count", String(visits));

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (visits >= 2) setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!visible || !deferredPrompt) return null;

  async function install() {
    await deferredPrompt!.prompt();
    const choice = await deferredPrompt!.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  }

  function dismiss() {
    localStorage.setItem("nagrik-a2hs-dismissed", String(Date.now()));
    setVisible(false);
  }

  return (
    <div className="install-banner" role="dialog" aria-label="App install karein">
      <div className="install-banner-body">
        <span className="install-banner-icon">📲</span>
        <div>
          <strong>App install karein</strong>
          <span>Play Store ki zaroorat nahi, seedha home screen par</span>
        </div>
      </div>
      <div className="install-banner-actions">
        <button type="button" className="install-banner-btn" onClick={install}>
          <Download size={15} /> Install
        </button>
        <button type="button" className="install-banner-close" onClick={dismiss} aria-label="Band karein">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
