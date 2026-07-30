import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

/**
 * Sent 7 days before a club's free-commission trial ends.
 *
 * Warm and factual: nothing is being taken away, nothing needs to be done, and
 * there's no re-acceptance step. It's a heads-up, not a sales pitch.
 */
export function TrialEnding({
  clubName,
  endDateLabel,
  settingsUrl,
}: {
  clubName: string;
  endDateLabel: string;
  settingsUrl: string;
}) {
  return (
    <EmailLayout preview={`Prova falas e ${clubName} mbaron pas 7 ditësh`}>
      <Heading style={heading}>Prova juaj falas mbaron pas 7 ditësh</Heading>

      <Text style={text}>Përshëndetje,</Text>
      <Text style={text}>
        Prova falas e klubit <strong>{clubName}</strong> mbaron më{" "}
        <strong>{endDateLabel}</strong>.
      </Text>

      <Text style={box}>
        Prej asaj date, për çdo udhëtim me pagesë aplikohet një komision
        platforme prej <strong>2.5%</strong>. Udhëtimet falas mbeten falas —
        pa asnjë komision.
      </Text>

      <Text style={text}>
        Nuk keni nevojë të bëni asgjë. Kalimi bëhet automatikisht dhe klubi juaj
        vazhdon të funksionojë normalisht.
      </Text>

      <Button href={settingsUrl} style={button}>
        Shiko cilësimet e klubit
      </Button>

      <Text style={footer}>
        Keni pyetje? Na shkruani në hello@hikeit.app — jemi këtu.
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  color: "#1a2e22",
  fontSize: "22px",
  fontWeight: 700,
  margin: "0 0 16px",
};
const text: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  margin: "0 0 12px",
};
const box: React.CSSProperties = {
  backgroundColor: "#f3f5f3",
  borderRadius: "8px",
  color: "#374151",
  fontSize: "15px",
  margin: "16px 0",
  padding: "12px 16px",
};
const button: React.CSSProperties = {
  backgroundColor: "#2D5F3F",
  borderRadius: "8px",
  color: "#ffffff",
  display: "block",
  fontSize: "15px",
  fontWeight: 600,
  marginTop: "16px",
  padding: "12px 20px",
  textAlign: "center",
  textDecoration: "none",
};
const footer: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "16px 0 0",
};
