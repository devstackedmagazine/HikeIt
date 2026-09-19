import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

/**
 * Sent 7 days before a club's free Pro trial ends.
 *
 * Warm and factual. Something *is* being taken away this time — the club drops
 * to the free tier's limits — so the copy says exactly which limits return and
 * offers the upgrade, without manufacturing urgency.
 */
export function TrialEnding({
  clubName,
  endDateLabel,
  billingUrl,
}: {
  clubName: string;
  endDateLabel: string;
  billingUrl: string;
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
        Prej asaj date klubi kalon në planin falas: deri në{" "}
        <strong>3 udhëtime në muaj</strong> dhe <strong>50 anëtarë</strong>.
        Udhëtimet dhe anëtarët që keni tashmë nuk preken.
      </Text>

      <Text style={text}>
        Nuk keni nevojë të bëni asgjë — kalimi bëhet automatikisht. Nëse doni
        të vazhdoni pa kufij, mund të kaloni në Pro në çdo moment.
      </Text>

      <Button href={billingUrl} style={button}>
        Shiko planet
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
