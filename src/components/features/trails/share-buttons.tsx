"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {
        // User dismissed the share sheet — ignore.
      }
    } else {
      await copyLink();
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="flex-1" onClick={copyLink}>
        {copied ? <Check /> : <Link2 />}
        {copied ? "Kopjuar" : "Kopjo linkun"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={nativeShare}
      >
        <Share2 />
        Ndaj
      </Button>
    </div>
  );
}
