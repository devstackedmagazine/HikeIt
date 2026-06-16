"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

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

type Status = "verifying" | "success" | "error";

function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

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
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    });
  }, [token, router]);

  async function handleResend() {
    if (!resendEmail) return;
    setResendState("sending");
    await authClient.sendVerificationEmail({
      email: resendEmail,
      callbackURL: "/dashboard",
    });
    setResendState("sent");
  }

  if (status === "verifying") {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <Loader2 className="mb-2 size-10 animate-spin text-primary" />
          <CardTitle>Verifying your email…</CardTitle>
          <CardDescription>Duke verifikuar email-in tuaj…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="mb-2 size-10 text-primary" />
          <CardTitle>Email verified!</CardTitle>
          <CardDescription>
            Redirecting to dashboard… · Po ju ridrejtojmë…
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <XCircle className="mb-2 size-10 text-destructive" />
        <CardTitle>Link expired or invalid</CardTitle>
        <CardDescription>Request a new verification link below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {resendState === "sent" ? (
          <p className="text-center text-sm text-muted-foreground">
            If that account needs verification, a new link is on its way.
          </p>
        ) : (
          <>
            <Input
              className="h-9"
              type="email"
              placeholder="you@example.com"
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
                  Sending…
                </>
              ) : (
                "Resend verification email"
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
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
