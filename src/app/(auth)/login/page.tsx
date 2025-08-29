"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) setMessage(error.message);
    setLoading(false);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage(error.message);
    else setMessage("Check your email for a login link.");
    setLoading(false);
  };

  const handleSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) setMessage(error.message);
    else setMessage("Check your SMS for a login code.");
    setLoading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <div className="space-y-4 w-full max-w-xs">
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          onClick={() => handleOAuth("google")}
          disabled={loading}
        >
          Continue with Google
        </button>
        <button
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-900"
          onClick={() => handleOAuth("apple")}
          disabled={loading}
        >
          Continue with Apple
        </button>
        <form onSubmit={handleEmail} className="space-y-2">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            disabled={loading}
          >
            Continue with Email
          </button>
        </form>
        <form onSubmit={handleSMS} className="space-y-2">
          <input
            type="tel"
            placeholder="Phone (e.g. +1234567890)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700"
            disabled={loading}
          >
            Continue with SMS
          </button>
        </form>
        {message && <div className="text-center text-sm text-gray-700 mt-2">{message}</div>}
      </div>
    </main>
  );
}
