import type { ReactElement } from "react";

import { LOGO_DATA_URI } from "@/lib/pwa/logo";

/** Shared HikeIt app-icon artwork — the mountain mark logo, scaled to `size`. */
export function iconElement(size: number): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_DATA_URI}
        width={size}
        height={size}
        alt=""
        style={{ width: size, height: size }}
      />
    </div>
  );
}
