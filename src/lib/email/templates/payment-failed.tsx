import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

export function PaymentFailed({ billingUrl }: { billingUrl: string }) {
  return (
    <EmailLayout preview="Pagesa dështoi">
      <Heading style={heading}>Pagesa dështoi</Heading>
      <Text style={text}>
        Nuk arritëm të procesojmë pagesën e fundit për abonimin tuaj. Ju lutemi
        përditësoni metodën e pagesës për të mbajtur aktive veçoritë e klubit.
      </Text>
      <Button href={billingUrl} style={button}>
        Përditëso metodën e pagesës
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
  backgroundColor: "#E87A30",
  borderRadius: "8px",
  color: "#ffffff",
  display: "block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 20px",
  textAlign: "center",
  textDecoration: "none",
};
