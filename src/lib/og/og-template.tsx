import type { ReactElement } from "react";

import { LOGO_DATA_URI } from "@/lib/pwa/logo";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** Shared Open Graph artwork: forest-green panel, brand, title + subtitle. */
export function ogTemplate({
  title,
  subtitle,
  eyebrow = "HikeIt",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "linear-gradient(135deg, #2D5F3F 0%, #06251a 100%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_DATA_URI}
          width={56}
          height={56}
          alt=""
          style={{ width: 56, height: 56 }}
        />
        <span style={{ fontSize: 32, fontWeight: 700 }}>{eyebrow}</span>
      </div>
      <div
        style={{
          marginTop: 40,
          fontSize: 68,
          fontWeight: 700,
          lineHeight: 1.1,
          maxWidth: 1000,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div style={{ marginTop: 24, fontSize: 34, color: "#cfe3d6" }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
