"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          textAlign: "center",
          background: "#ffffff",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "12px",
            color: "#0f172a",
          }}
        >
          SKP CIDB Builder
        </h1>

        <p
          style={{
            color: "#475569",
            marginBottom: "20px",
          }}
        >
          Redirecting to dashboard...
        </p>

        <a
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "#0f172a",
            color: "#ffffff",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          Open Dashboard
        </a>
      </div>
    </main>
  );
}
