"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCardShell } from "@/components/shared/auth-card-shell";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authClient } from "@/lib/auth/client";
import {
  type ResetPasswordInput,
  resetPasswordSchema,
} from "@/lib/validations/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    if (!token) {
      setFormError("Linku është i paplotë. Kërkoni një link të ri.");
      return;
    }
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });
    if (error) {
      setFormError(
        "Fjalëkalimi nuk u ndryshua. Linku mund të ketë skaduar — kërkoni një link të ri.",
      );
      return;
    }
    router.push("/login?reset=success");
  }

  if (!token || linkError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linku ka skaduar ose është i pavlefshëm</CardTitle>
        </CardHeader>
        <CardFooter>
          <Link
            href="/forgot-password"
            className="text-primary text-sm underline-offset-4 hover:underline"
          >
            Kërkoni një link të ri
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendosni një fjalëkalim të ri</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fjalëkalimi i ri</FormLabel>
                  <FormControl>
                    <PasswordInput
                      className="h-9"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmoni fjalëkalimin</FormLabel>
                  <FormControl>
                    <PasswordInput
                      className="h-9"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError ? (
              <p className="text-destructive text-sm">{formError}</p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Duke ruajtur…
                </>
              ) : (
                "Ruani fjalëkalimin"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCardShell>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCardShell>
  );
}
