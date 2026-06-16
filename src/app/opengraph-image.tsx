import { ImageResponse } from "next/og";

export const alt = "HikeIt — Komuniteti i Alpinizmit në Kosovë";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Inline styles are required here: next/og (satori) renders this tree to an
// image and does not process Tailwind classes.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2D5F3F 0%, #06251a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
        </svg>
        <div style={{ marginTop: 32, fontSize: 96, fontWeight: 700 }}>
          HikeIt
        </div>
        <div style={{ marginTop: 8, fontSize: 36, color: "#cfe3d6" }}>
          Komuniteti i Alpinizmit në Kosovë
        </div>
      </div>
    ),
    { ...size },
  );
}
