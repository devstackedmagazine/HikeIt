"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useCallback, useRef } from "react";

import { env } from "@/config/env";

/**
 * Lazy Paddle.js loader for the checkout overlay.
 *
 * Paddle.js is initialised on first use rather than on mount, so a club that
 * never clicks an upgrade button never loads it. The instance is cached in a
 * ref — `initializePaddle` injects a script tag, and calling it per click
 * would inject it repeatedly.
 *
 * The environment comes from `NEXT_PUBLIC_PADDLE_ENV`, which must be set
 * separately from the server-side `PADDLE_ENV`: this runs in the browser and
 * cannot see server variables. It falls back to sandbox, so a missing variable
 * can never mean "charge real cards".
 */
export function usePaddle() {
  const paddleRef = useRef<Paddle | null>(null);
  const loadingRef = useRef<Promise<Paddle | undefined> | null>(null);

  return useCallback(async (): Promise<Paddle | null> => {
    if (paddleRef.current) return paddleRef.current;

    const token = env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return null;

    // Two rapid clicks must not start two loads.
    loadingRef.current ??= initializePaddle({
      environment: env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox",
      token,
    });

    try {
      const instance = await loadingRef.current;
      paddleRef.current = instance ?? null;
      return paddleRef.current;
    } catch {
      // Let the next click try again rather than staying permanently broken.
      loadingRef.current = null;
      return null;
    }
  }, []);
}
