'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  async function upload() {
    if (!file) return;

    setStatus('Requesting upload URL...');

    const res = await fetch(
      'https:/px2zpw3ube.execute-api.ap-southeast-2.amazonaws.com/prod/upload-url'
    );
    const { uploadUrl } = await res.json();

    setStatus('Uploading CSV...');

    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': 'text/csv' },
    });

    setStatus('Upload complete. Converting to Parquet...');
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

      <button onClick={upload}>Upload</button>

      <p>{status}</p>
    </main>
  );
}
