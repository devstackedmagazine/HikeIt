import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

export function TripCancellation({
  tripTitle,
  reason,
  tripsUrl,
}: {
  tripTitle: string;
  reason: string;
  tripsUrl: string;
}) {
  return (
    <EmailLayout preview={`Udhëtimi u anulua: ${tripTitle}`}>
      <Heading style={heading}>Udhëtimi u anulua</Heading>
      <Text style={text}>
        Na vjen keq, por <strong>{tripTitle}</strong> është anuluar.
      </Text>
      <Text style={reasonStyle}>Arsyeja: {reason}</Text>
      <Button href={tripsUrl} style={button}>
        Gjej Udhëtime të Tjera
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
  margin: "0 0 12px",
};
const reasonStyle: React.CSSProperties = {
  backgroundColor: "#f3f5f3",
  borderRadius: "8px",
  color: "#374151",
  fontSize: "14px",
  padding: "12px 16px",
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
