"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const ROLES = [
  { value: "community_reporter", label: "Community Reporter" },
  { value: "ngo", label: "NGO" },
  { value: "gov_officer", label: "Gov Officer" },
  { value: "researcher", label: "Researcher" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (selected: string) => {
    setRole(selected);
    setStep(1);
  };

  const handleFinish = async () => {
    setLoading(true);
    setError("");
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setError("Not authenticated. Please log in again.");
      setLoading(false);
      return;
    }
    // Set role in user metadata (or upsert to users table in production)
    const { error: metaError } = await supabase.auth.updateUser({ data: { role } });
    if (metaError) setError(metaError.message);
    setLoading(false);
    if (!metaError) {
      // Redirect to dashboard or home
      window.location.href = "/dashboard/dashboard";
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Welcome to Mangrove Watch!</h1>
        {step === 0 && (
          <>
            <p className="mb-4">Select your role to get started:</p>
            <div className="space-y-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  className={`w-full py-2 rounded border ${role === r.value ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                  onClick={() => handleRoleSelect(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold mb-2">How to Submit a High-Quality Report</h2>
            <ul className="list-disc pl-6 mb-4 text-sm text-gray-700">
              <li>Take clear, close-up photos or videos of the incident.</li>
              <li>Allow location access for accurate geotagging.</li>
              <li>Describe what happened, when, and where.</li>
              <li>Choose the correct category (cutting, dumping, etc.).</li>
              <li>Submit as soon as possible for rapid response.</li>
            </ul>
            <button
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              onClick={handleFinish}
              disabled={loading}
            >
              Finish & Go to Dashboard
            </button>
            {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
          </>
        )}
      </div>
    </main>
  );
}
