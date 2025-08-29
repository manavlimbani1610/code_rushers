import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DataViz() {
  const [kpis, setKpis] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      // Example: Fetch KPIs from Supabase (incidents by category, response times, etc.)
      const { data: reports } = await supabase.from("reports").select("category, status, severity, created_at");
      if (reports) {
        const byCategory = reports.reduce((acc: any, r: any) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {});
        setKpis({ byCategory, total: reports.length });
      }
      setLoading(false);
    };
    fetchKPIs();
  }, []);

  return (
    <div className="my-6 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Key Performance Indicators</h2>
      {loading ? (
        <div>Loading KPIs...</div>
      ) : (
        <div className="flex gap-8">
          <div>
            <div className="text-2xl font-bold">{kpis.total}</div>
            <div className="text-sm text-gray-600">Total Incidents</div>
          </div>
          <div>
            <div className="font-semibold mb-1">By Category:</div>
            <ul className="text-sm">
              {Object.entries(kpis.byCategory || {}).map(([cat, count]) => (
                <li key={cat}>{cat}: <span className="font-bold">{String(count)}</span></li>
              ))}
            </ul>
          </div>
          {/* Heatmap and trend indicators can be added here */}
        </div>
      )}
    </div>
  );
}
