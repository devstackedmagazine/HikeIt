"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="sq">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "16px",
          padding: "24px",
          color: "#171717",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Ndodhi një gabim</h1>
        <p style={{ color: "#6b7280" }}>
          Diçka shkoi keq. Ju lutemi provoni përsëri.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: "#2D5F3F",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Provo Përsëri
        </button>
      </body>
    </html>
  );
}
