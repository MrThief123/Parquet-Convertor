'use client';

import { useState } from 'react';

const API_UPLOAD_URL = process.env.NEXT_PUBLIC_API_UPLOAD_URL!;
const API_DOWNLOAD_URL = process.env.NEXT_PUBLIC_API_DOWNLOAD_URL!;


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);

  async function upload() {
    if (!file) return;

    try {
      setStatus('Requesting upload URL...');

      const res = await fetch(API_UPLOAD_URL);
      if (!res.ok) throw new Error('Failed to get upload URL');

      const { uploadUrl, key } = await res.json();

      // store parquet key for download
      setUploadedKey(key.replace('.csv', '.parquet'));

      setStatus('Uploading CSV...');

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'text/csv' },
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      setStatus('Upload complete. Converting to Parquet...');
    } catch (err) {
      console.error(err);
      setStatus('Something went wrong');
    }
  }

  async function download() {
    if (!uploadedKey) return;

    setStatus('Preparing download...');

    const r = await fetch(
      `${API_DOWNLOAD_URL}?key=${encodeURIComponent(uploadedKey)}`
    );

    if (!r.ok) {
      setStatus('Parquet not ready yet');
      return;
    }

    const { downloadUrl } = await r.json();
    window.location.href = downloadUrl;
  }

  return (
    <main style={{ padding: 40 }}>
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

      <br /><br />

      <button onClick={download} disabled={!uploadedKey}>
        Download Parquet
      </button>

      <p>{status}</p>
    </main>
  );
}
