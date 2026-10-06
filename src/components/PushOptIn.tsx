import React, { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY as string | undefined;

// Typed as Uint8Array<ArrayBuffer> (not ArrayBufferLike) so it satisfies the
// PushSubscriptionOptions applicationServerKey: BufferSource requirement.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/**
 * Push opt-in toggle for logged-in members.
 * Active only when PUBLIC_VAPID_PUBLIC_KEY is configured; otherwise renders nothing.
 */
export function PushOptIn() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      Boolean(VAPID_PUBLIC_KEY) &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok || !supabase) return;

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => {});
  }, []);

  if (!supported) return null;

  async function toggle() {
    if (!supabase) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData.session?.user?.id;
          await sub.unsubscribe();
          if (userId) {
            await supabase.from("push_subscriptions").delete().match({ user_id: userId, endpoint: sub.endpoint });
          }
        }
        setSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
        });
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        if (!userId) return;
        const key = sub.getKey("p256dh");
        const auth = sub.getKey("auth");
        await supabase.from("push_subscriptions").upsert(
          {
            user_id: userId,
            endpoint: sub.endpoint,
            p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : "",
            auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : "",
            user_agent: navigator.userAgent,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "user_id,endpoint" }
        );
        setSubscribed(true);
      }
    } catch {
      // Permission denied or network error, stay quiet
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="listen-btn" onClick={toggle} disabled={busy} aria-pressed={subscribed}>
      {subscribed ? <BellOff size={15} /> : <Bell size={15} />}
      <span>{busy ? "Ek second..." : subscribed ? "Alerts Band Karein" : "🔔 Status Alerts On Karein"}</span>
    </button>
  );
}
