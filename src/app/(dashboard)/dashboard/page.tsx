"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Map from "@/components/Map";
import Notifications from "@/components/Notifications";
import DataViz from "../../../components/DataViz";

const STATUS = ["New", "Assigned", "In Progress", "Resolved"];

export default function DashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch reports and subscribe to realtime updates
  useEffect(() => {
    // SECURITY: Ensure RLS policies restrict report access by user role (e.g., only assigned region or own reports).
    // SECURITY: Use signed URLs for media in production (see Supabase Storage docs).
    // SECURITY: Log status changes and assignments to the audit trail (events table).
    let subscription: any;
    const fetchReports = async () => {
      setLoading(true);
      let { data, error } = await supabase.from("reports").select("*");
      if (!error) setReports(data || []);
      setLoading(false);
    };
    fetchReports();
    // Subscribe to realtime changes
    subscription = supabase
      .channel("reports-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        payload => {
          fetchReports();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Filtered reports
  const filtered = reports.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!areaFilter || (r.region && r.region.includes(areaFilter)))
  );

  return (
    <main className="p-6">
      <Notifications />
      <h1 className="text-2xl font-bold mb-4">Authority Dashboard</h1>
      <DataViz />
      <div className="mb-6">
        <Map />
      </div>
      <div className="flex gap-4 mb-4">
        <select
          className="border px-2 py-1 rounded"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          className="border px-2 py-1 rounded"
          placeholder="Filter by area/region"
          value={areaFilter}
          onChange={e => setAreaFilter(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm" aria-label="Incident Reports Table">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border" scope="col">ID</th>
              <th className="p-2 border" scope="col">Category</th>
              <th className="p-2 border" scope="col">Status</th>
              <th className="p-2 border" scope="col">Severity</th>
              <th className="p-2 border" scope="col">Region</th>
              <th className="p-2 border" scope="col">Created</th>
              <th className="p-2 border" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr aria-busy="true"><td colSpan={7} className="text-center p-4" role="status">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-4" role="alert">No reports found.</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{r.id}</td>
                  <td className="p-2 border">{r.category}</td>
                  <td className="p-2 border">{r.status || "New"}</td>
                  <td className="p-2 border">{r.severity || "-"}</td>
                  <td className="p-2 border">{r.region || "-"}</td>
                  <td className="p-2 border">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-2 border">
                    <label htmlFor={`status-${r.id}`} className="sr-only">Change status</label>
                    <select
                      id={`status-${r.id}`}
                      className="border px-1 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={r.status || "New"}
                      onChange={async e => {
                        try {
                          await supabase.from("reports").update({ status: e.target.value }).eq("id", r.id);
                        } catch {
                          alert("Failed to update status. Please try again.");
                        }
                      }}
                      aria-label="Change report status"
                    >
                      {STATUS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
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
