"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { AuthCardShell } from "@/components/shared/auth-card-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { carriedRedirect } from "@/lib/utils/safe-redirect";

type Status = "verifying" | "success" | "error";

function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  // Where to land after verifying (e.g. back on an invite). Checked: only a
  // safe internal path, otherwise the dashboard.
  const next = carriedRedirect(searchParams.get("redirect")) ?? "/dashboard";

  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [resendEmail, setResendEmail] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );
  // Guard against double-invocation in React Strict Mode.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !token) return;
    ran.current = true;

    void authClient.verifyEmail({ query: { token } }).then(({ error }) => {
      if (error) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setTimeout(() => {
        router.push(next);
        router.refresh();
      }, 1500);
    });
  }, [token, router, next]);

  async function handleResend() {
    if (!resendEmail) return;
    setResendState("sending");
    await authClient.sendVerificationEmail({
      email: resendEmail,
      callbackURL: next,
    });
    setResendState("sent");
  }

  if (status === "verifying") {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <Loader2 className="text-primary mb-2 size-10 animate-spin" />
          <CardTitle>Duke verifikuar email-in tuaj…</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="text-primary mb-2 size-10" />
          <CardTitle>Email-i u verifikua!</CardTitle>
          <CardDescription>Po ju dërgojmë te paneli…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <XCircle className="text-destructive mb-2 size-10" />
        <CardTitle>Linku ka skaduar ose është i pavlefshëm</CardTitle>
        <CardDescription>
          Shkruani email-in tuaj dhe do t&apos;ju dërgojmë një link të ri.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {resendState === "sent" ? (
          <p className="text-muted-foreground text-center text-sm">
            Nëse kjo llogari ka nevojë për verifikim, një link i ri është
            rrugës. Kontrolloni edhe dosjen e spam-it.
          </p>
        ) : (
          <>
            <Input
              className="h-9"
              type="email"
              placeholder="adresa@email.com"
              autoComplete="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
            />
            <Button
              className="w-full"
              size="lg"
              onClick={handleResend}
              disabled={resendState === "sending" || !resendEmail}
            >
              {resendState === "sending" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Duke dërguar…
                </>
              ) : (
                "Dërgoni sërish linkun"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCardShell>
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </AuthCardShell>
  );
}
