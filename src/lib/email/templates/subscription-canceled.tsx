import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

export function SubscriptionCanceled({
  billingUrl,
}: {
  billingUrl: string;
}) {
  return (
    <EmailLayout preview="Abonimi juaj ka përfunduar">
      <Heading style={heading}>Abonimi juaj ka përfunduar</Heading>
      <Text style={text}>
        Qasja juaj vazhdon deri në fund të periudhës aktuale të faturimit. Pas
        kësaj, klubi kalon në planin falas.
      </Text>
      <Button href={billingUrl} style={button}>
        Riaktivizo Abonimin
      </Button>
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
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 20px",
};
const button: React.CSSProperties = {
  backgroundColor: "#2D5F3F",
  borderRadius: "8px",
  color: "#ffffff",
  display: "block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 20px",
  textAlign: "center",
  textDecoration: "none",
};
