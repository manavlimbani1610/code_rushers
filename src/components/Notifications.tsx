import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Placeholder: Listen for new notifications (e.g., from Supabase Realtime or API)
    // In production, integrate with push/email/SMS providers
    const channel = supabase
      .channel("notifications")
      .on("broadcast", { event: "new-notification" }, payload => {
        setNotifications(n => [payload, ...n]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {notifications.map((n, i) => (
        <div key={i} className="bg-white shadow-lg rounded p-4 border border-blue-200 animate-fade-in">
          <div className="font-semibold">{n.title || "Notification"}</div>
          <div className="text-sm">{n.body || JSON.stringify(n)}</div>
        </div>
      ))}
    </div>
  );
}
