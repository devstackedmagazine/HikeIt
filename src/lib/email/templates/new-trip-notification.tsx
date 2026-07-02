import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

export function NewTripNotification({
  clubName,
  tripTitle,
  dateLabel,
  tripUrl,
}: {
  clubName: string;
  tripTitle: string;
  dateLabel: string;
  tripUrl: string;
}) {
  return (
    <EmailLayout preview={`${clubName} ka një udhëtim të ri`}>
      <Heading style={heading}>Klubi juaj ka një udhëtim të ri!</Heading>
      <Text style={text}>
        <strong>{clubName}</strong> sapo publikoi <strong>{tripTitle}</strong>.
      </Text>
      <Text style={detail}>📅 {dateLabel}</Text>
      <Button href={tripUrl} style={button}>
        Shiko & Regjistrohu
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
const detail: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  margin: "0 0 6px",
};
const button: React.CSSProperties = {
  backgroundColor: "#2D5F3F",
  borderRadius: "8px",
  color: "#ffffff",
  display: "block",
  fontSize: "15px",
  fontWeight: 600,
  marginTop: "20px",
  padding: "12px 20px",
  textAlign: "center",
  textDecoration: "none",
};
