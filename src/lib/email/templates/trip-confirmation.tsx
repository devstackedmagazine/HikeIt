import { Button, Heading, Link, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

export function TripConfirmation({
  tripTitle,
  dateLabel,
  meetingPoint,
  tripUrl,
  calendarUrl,
}: {
  tripTitle: string;
  dateLabel: string;
  meetingPoint?: string | null;
  tripUrl: string;
  calendarUrl: string;
}) {
  return (
    <EmailLayout preview={`Regjistrimi u konfirmua: ${tripTitle}`}>
      <Heading style={heading}>Regjistrimi juaj është konfirmuar!</Heading>
      <Text style={text}>
        Jeni regjistruar me sukses për <strong>{tripTitle}</strong>.
      </Text>
      <Text style={detail}>📅 {dateLabel}</Text>
      {meetingPoint ? <Text style={detail}>📍 {meetingPoint}</Text> : null}
      <Button href={tripUrl} style={button}>
        Shiko Udhëtimin
      </Button>
      <Text style={fallback}>
        <Link href={calendarUrl} style={link}>
          Shto në Google Calendar
        </Link>
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
const fallback: React.CSSProperties = {
  fontSize: "13px",
  margin: "16px 0 0",
};
const link: React.CSSProperties = { color: "#2D5F3F" };
