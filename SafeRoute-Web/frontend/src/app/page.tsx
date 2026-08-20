"use client";

import { useEffect, useState } from "react";
import api from "@/src/lib/api";

export default function Home() {
  const [message, setMessage] = useState(
    "Menghubungkan ke backend..."
  );

  useEffect(() => {
    const testBackend = async () => {
      try {
        const response = await api.get("/../");

        setMessage(response.data.message);
      } catch (error) {
        console.error(error);

        setMessage("Backend tidak dapat dihubungi.");
      }
    };

    testBackend();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="rounded-2xl border p-8 shadow-sm">
        <h1 className="text-2xl font-bold">
          SafeRoute
        </h1>

        <p className="mt-2 text-gray-500">
          {message}
        </p>
      </div>
    </main>
  );
}