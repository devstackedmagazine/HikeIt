"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCardShell } from "@/components/shared/auth-card-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import {
  type ForgotPasswordInput,
  forgotPasswordSchema,
} from "@/lib/validations/auth";

function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    // Fire-and-forget: never reveal whether the email exists.
    await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="text-primary mb-2 size-10" />
          <CardTitle>Kontrolloni email-in tuaj</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-center text-sm">
          Nëse ka një llogari me këtë adresë, ju kemi dërguar një link për të
          ndryshuar fjalëkalimin. Kontrolloni edhe dosjen e spam-it.
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-primary text-sm underline-offset-4 hover:underline"
          >
            Kthehuni te hyrja
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keni harruar fjalëkalimin?</CardTitle>
        <CardDescription>
          Shkruani email-in tuaj dhe do t&apos;ju dërgojmë një link për ta
          ndryshuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      className="h-9"
                      type="email"
                      placeholder="adresa@email.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Duke dërguar…
                </>
              ) : (
                "Dërgoni linkun"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href="/login"
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          Kthehuni te hyrja
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthCardShell>
      <ForgotPasswordForm />
    </AuthCardShell>
  );
}
