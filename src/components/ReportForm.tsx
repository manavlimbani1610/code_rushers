"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import exifr from "exifr";

const CATEGORIES = [
  "cutting",
  "dumping",
  "encroachment",
  "fire",
  "other",
];

export default function ReportForm() {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Get GPS location
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        err => setMessage("Could not get location: " + err.message)
      );
    } else {
      setMessage("Geolocation not supported.");
    }
  };


  // Offline queue
  const queueOffline = (data: any) => {
    const queue = JSON.parse(localStorage.getItem("reportQueue") || "[]");
    queue.push(data);
    localStorage.setItem("reportQueue", JSON.stringify(queue));
  };

  // Simple hash for duplicate detection (pHash placeholder)
  async function getFileHash(file: File) {
    const buffer = await file.arrayBuffer();
    let hash = 0, i, chr;
    const str = String.fromCharCode.apply(null, new Uint8Array(buffer) as any);
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
  }

  // Severity scoring (simple rule-based)
  function scoreSeverity(cat: string, desc: string) {
    if (cat === "fire") return 5;
    if (cat === "cutting" && desc.toLowerCase().includes("large")) return 4;
    if (cat === "dumping") return 3;
    return 2;
  }

  // SECURITY: Ensure Supabase RLS policies restrict report creation and access by role.
  // SECURITY: Only store minimal PII; use anonymous mode and never store phone/email in reports.
  // SECURITY: Use signed URLs for media access (see Supabase Storage docs).
  // SECURITY: Consider logging all report submissions to an audit trail (events table).
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const created_at = new Date().toISOString();
    let uploadedMediaPath = null;
    let exifLat = null, exifLng = null, hash = null, severity = null, ai_flags = [];
    try {
      // AI validation: EXIF check
      if (media && media.type.startsWith("image")) {
        try {
          const exif = await exifr.gps(media);
          exifLat = exif?.latitude || null;
          exifLng = exif?.longitude || null;
          if (exifLat && exifLng && (lat && lng)) {
            const dist = Math.sqrt(Math.pow(exifLat - lat, 2) + Math.pow(exifLng - lng, 2));
            if (dist > 0.01) ai_flags.push("EXIF/location mismatch");
          }
        } catch {}
      }
      // Duplicate detection (hash)
      if (media) {
        hash = await getFileHash(media);
        // Check for duplicate in DB
        const { data: dup } = await supabase.from("media").select("id").eq("hash", hash);
        if (dup && dup.length > 0) ai_flags.push("Duplicate media");
      }
      // Severity scoring
      severity = scoreSeverity(category, description);

      if (media) {
        const { data, error } = await supabase.storage
          .from("media")
          .upload(`reports/${created_at}_${media.name}`, media);
        if (error) throw error;
        uploadedMediaPath = data?.path;
      }
      const report = {
        category,
        description,
        lat,
        lng,
        anonymous,
        created_at,
        media_path: uploadedMediaPath,
        exif_lat: exifLat,
        exif_lng: exifLng,
        severity,
        ai_flags,
      };
      // Insert report
      const { data: inserted, error: dbError } = await supabase.from("reports").insert([report]).select();
      if (dbError) throw dbError;
      // Insert media metadata
      if (media && inserted && inserted[0]) {
        await supabase.from("media").insert([
          {
            report_id: inserted[0].id,
            storage_path: uploadedMediaPath,
            exif_lat: exifLat,
            exif_lng: exifLng,
            captured_at: created_at,
            hash,
          },
        ]);
      }
      setMessage(
        ai_flags.length > 0
          ? `Report submitted with AI flags: ${ai_flags.join(", ")}`
          : "Report submitted successfully!"
      );
    } catch (err: any) {
      setMessage("Offline: report queued for sync.");
      queueOffline({ category, description, lat, lng, anonymous, created_at, media });
    }
    setLoading(false);
  };

  return (
  <form className="space-y-4" onSubmit={handleSubmit} aria-label="Incident Report Form">
      <h2 className="text-xl font-semibold">Incident Report Form</h2>
      <div>
        <label className="block mb-1" htmlFor="category">Category</label>
        <select
          id="category"
          className="w-full border px-3 py-2 rounded"
          value={category}
          onChange={e => setCategory(e.target.value)}
          required
          aria-required="true"
        >
          <option value="">Select category</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1" htmlFor="description">Description</label>
        <textarea
          id="description"
          className="w-full border px-3 py-2 rounded"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          aria-required="true"
        />
      </div>
      <div>
        <label className="block mb-1" htmlFor="media">Photo/Video</label>
        <input
          id="media"
          type="file"
          accept="image/*,video/*"
          onChange={e => setMedia(e.target.files?.[0] || null)}
          required
          aria-required="true"
        />
      </div>
      <div>
        <button type="button" className="bg-blue-500 text-white px-3 py-1 rounded" onClick={getLocation}>
          Get Current Location
        </button>
        {lat && lng && (
          <span className="ml-2 text-sm text-gray-700">Lat: {lat}, Lng: {lng}</span>
        )}
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="anonymous"
          checked={anonymous}
          onChange={e => setAnonymous(e.target.checked)}
        />
        <label htmlFor="anonymous" className="ml-2">Submit anonymously</label>
      </div>
      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? (
          <span role="status" aria-live="polite">Submitting...</span>
        ) : "Submit Report"}
      </button>
  {message && <div className="text-center text-sm text-gray-700 mt-2" role="alert">{message}</div>}
    </form>
  );
}
