"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [files, setFiles] = useState<{ key: string; url: string }[]>([]);

  const uploadApi = process.env.NEXT_PUBLIC_UPLOAD_API!;
  const listApi = process.env.NEXT_PUBLIC_LIST_API!;

  async function fetchFiles() {
    try {
      const res = await fetch(listApi);
      const data = await res.json();
      setFiles(data);
      return data.length;
    } catch (err) {
      console.error(err);
      return 0;
    }
  }

  async function upload() {
    if (!file) return;

    setStatus("Requesting upload URL...");
    const res = await fetch(uploadApi);
    const { uploadUrl } = await res.json();

    setStatus("Uploading CSV...");
    await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "text/csv" }, body: file });

    setStatus("Upload complete! Waiting for conversion...");

    // Poll for Parquet file
    let tries = 0;
    while (tries < 10) {
      const count = await fetchFiles();
      if (count > 0) break;
      await new Promise((r) => setTimeout(r, 2000)); // wait 2 seconds
      tries++;
    }

    setStatus("Conversion complete!");
  }

  useEffect(() => { fetchFiles(); }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>CSV → Parquet Converter</h1>

      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <br /><br />
      <button onClick={upload} disabled={!file}>Upload</button>
      <p>{status}</p>

      <h2>Converted Files</h2>
      <ul>
        {files.map((f) => (
          <li key={f.key}>
            <a href={f.url} target="_blank" rel="noopener noreferrer">{f.key}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
