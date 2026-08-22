import type { ReactElement } from "react";

import { LOGO_DATA_URI } from "@/lib/pwa/logo";

/**
 * Shared HikeIt app-icon artwork. When `maskable` is true, adds ~10% padding
 * so the logo sits within the safe zone Android uses for adaptive icons.
 */
export function iconElement(
  size: number,
  options?: { maskable?: boolean },
): ReactElement {
  const maskable = options?.maskable ?? false;
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const innerSize = size - padding * 2;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#0D1F14",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_DATA_URI}
        width={innerSize}
        height={innerSize}
        alt=""
        style={{ width: innerSize, height: innerSize }}
      />
    </div>
  );
}
