"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  service: string;
};

export default function Home() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    fetch(`${baseUrl}/health`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as HealthResponse;
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">AI Support / DevOps Copilot</h1>
      <p className="mt-2 text-gray-600">
        Day 1: Frontend + Backend wiring
      </p>

      <div className="mt-6 rounded-xl border p-4">
        <h2 className="text-lg font-semibold">Backend Health</h2>

        {!data && !error && <p className="mt-2">Checking...</p>}

        {data && (
          <pre className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}

        {error && (
          <p className="mt-3 text-red-600">
            Error: {error} (is backend running on port 8000?)
          </p>
        )}
      </div>
    </main>
  );
}
