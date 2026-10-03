import type { ReactNode } from "react";

/**
 * Alpine Brutalism form pieces for forms on the dark (Forest) dashboard
 * surface — the trip form and the trail proposal. Summit ink throughout;
 * accents follow the contrast rules (Sage on Forest, Moss only on Abyss).
 */

/** Text input / select / textarea. Summit tint, never pure white. */
export const BRUTAL_INPUT =
  "w-full border-2 border-summit/40 bg-summit/[0.05] px-3.5 text-[13px] font-medium text-summit placeholder:text-summit/50 placeholder:italic focus:border-sage focus:outline-none aria-[invalid=true]:border-alert";

/** Single-line height for BRUTAL_INPUT. */
export const BRUTAL_INPUT_HEIGHT = "h-10";

export function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-summit/10 bg-summit/[0.04] border p-5">
      <p className="border-summit/[0.06] text-summit/60 mb-4 border-b pb-2.5 text-[9px] font-bold tracking-[0.15em] uppercase">
        {number}. {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  errorId,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  /** Pair with the control's aria-describedby. */
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="text-summit/75 mb-1.5 block text-[10px] font-bold tracking-[0.1em] uppercase"
      >
        {label}
      </label>
      {children}
      {/* Alert, not Danger: Danger (#c0392b) is unreadable on Forest. */}
      {error ? (
        <p id={errorId} role="alert" className="text-alert mt-1 text-[11px]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
