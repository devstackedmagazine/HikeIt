import { MailWarning, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { InvitationActions } from "@/components/features/clubs/invitation-actions";
import { AuthCardShell } from "@/components/shared/auth-card-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOptionalSession } from "@/lib/auth/helpers";
import { formatTripDate } from "@/lib/utils/datetime";
import {
  getInvitationPreview,
  invitationProblemMessages,
} from "@/server/services/club-invitations";

export const metadata: Metadata = {
  title: "Ftesë në klub",
  // The URL carries a secret token: keep it out of search engines and out of
  // the Referer sent to any link on this page.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * Landing page for an emailed club invitation. Deliberately outside the
 * /dashboard group: a brand-new invitee isn't onboarded yet, and the
 * dashboard layout would bounce them to /onboarding before they saw this.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [preview, session] = await Promise.all([
    getInvitationPreview(token),
    getOptionalSession(),
  ]);

  if (!preview.ok) {
    return (
      <AuthCardShell>
        <Card>
          <CardHeader className="items-center text-center">
            <MailWarning className="text-destructive mb-2 size-10" />
            <CardTitle>Ftesa nuk mund të përdoret</CardTitle>
            <CardDescription>
              {invitationProblemMessages[preview.problem]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              render={<Link href={session ? "/dashboard" : "/"} />}
            >
              {session ? "Shko te paneli" : "Shko te faqja kryesore"}
            </Button>
          </CardContent>
        </Card>
      </AuthCardShell>
    );
  }

  const { invitation } = preview;
  const roleLabel = invitation.role === "organizer" ? "organizator" : "anëtar";
  const here = `/invite/${encodeURIComponent(token)}`;
  const emailMatches =
    !!session && session.user.email.trim().toLowerCase() === preview.email;

  return (
    <AuthCardShell>
      <Card>
        <CardHeader className="items-center text-center">
          <Users className="text-primary mb-2 size-10" />
          <CardTitle>Ftesë nga {invitation.clubName}</CardTitle>
          <CardDescription>
            Jeni ftuar të bashkoheni me klubin si {roleLabel}. Ftesa është
            dërguar te {invitation.maskedEmail} dhe është e vlefshme deri më{" "}
            {formatTripDate(invitation.expiresAt)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!session ? (
            <>
              <p className="text-muted-foreground text-center text-sm">
                Hyni me adresën email ku e morët ftesën. Nëse nuk keni ende
                llogari, regjistrohuni me po atë adresë, konfirmoni email-in dhe
                pastaj hapni sërish linkun nga email-i i ftesës.
              </p>
              <Button
                className="w-full"
                size="lg"
                render={
                  <Link href={`/login?redirect=${encodeURIComponent(here)}`} />
                }
              >
                Hyni për ta pranuar
              </Button>
              <Button
                className="w-full"
                variant="outline"
                render={<Link href="/register" />}
              >
                Krijoni llogari
              </Button>
            </>
          ) : !emailMatches ? (
            <p className="text-destructive text-center text-sm">
              {invitationProblemMessages.wrong_email}
            </p>
          ) : (
            <InvitationActions token={token} clubName={invitation.clubName} />
          )}
          <p className="text-center text-sm">
            <Link
              href={`/clubs/${invitation.clubSlug}`}
              className="underline underline-offset-4"
            >
              Shikoni faqen e klubit
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthCardShell>
  );
}
