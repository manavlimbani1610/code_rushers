"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Gamification from "@/components/Gamification";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data: usersData } = await supabase
        .from("users")
        .select("id, display_name, score, region")
        .order("score", { ascending: false })
        .limit(10);
      setUsers(usersData || []);
      const { data: badgesData } = await supabase
        .from("badges")
        .select("user_id, badge_type, awarded_at");
      setBadges(badgesData || []);
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <Gamification />
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Top Contributors</h2>
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Rank</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Score</th>
              <th className="p-2 border">Region</th>
              <th className="p-2 border">Badges</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-4">No contributors yet.</td></tr>
            ) : (
              users.map((u, i) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{i + 1}</td>
                  <td className="p-2 border">{u.display_name || "Anonymous"}</td>
                  <td className="p-2 border">{u.score}</td>
                  <td className="p-2 border">{u.region || "-"}</td>
                  <td className="p-2 border">
                    {badges.filter(b => b.user_id === u.id).map(b => (
                      <span key={b.badge_type} className="inline-block bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded mr-1 text-xs">
                        {b.badge_type}
                      </span>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
