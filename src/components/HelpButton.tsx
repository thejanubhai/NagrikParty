import React from "react";
import { LifeBuoy, X } from "lucide-react";

/** Floating help lifeline: FAQ + WhatsApp support, visible on every page. */
export function HelpButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        className="help-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Help band karein" : "Madad chahiye?"}
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <LifeBuoy size={22} />}
      </button>
      {open && (
        <div className="help-panel" role="dialog" aria-label="Madad">
          <strong>Samajh nahi aaya?</strong>
          <p>Koi dikkat ho toh hum seedha baat kar sakte hain.</p>
          <a className="button button-primary" style={{ width: "100%", minHeight: 48 }} href="/why-nagrik">
            📖 Pehle Padhein
          </a>
          <a
            className="button"
            style={{ width: "100%", minHeight: 48, marginTop: 8 }}
            href="https://wa.me/?text=Namaste%2C%20mujhe%20Nagrik%20Party%20ke%20baare%20mein%20jaankari%20chahiye"
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 WhatsApp par Poochein
          </a>
        </div>
      )}
    </>
  );
}
