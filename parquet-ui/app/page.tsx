"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  async function upload() {
    if (!file) return;

    setStatus("Requesting upload URL...");

    const res = await fetch(process.env.NEXT_PUBLIC_UPLOAD_API!);
    const { uploadUrl } = await res.json();

    setStatus("Uploading CSV...");

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "text/csv" },
      body: file,
    });

    setStatus("Upload complete. Conversion started!");
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>CSV → Parquet Converter</h1>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <br /><br />
      <button onClick={upload} disabled={!file}>
        Upload
      </button>
      <p>{status}</p>
    </main>
  );
}
