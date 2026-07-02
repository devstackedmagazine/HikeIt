import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

export function TripReminder({
  tripName,
  dateLabel,
  meetingPoint,
  tripUrl,
  weatherNote,
  urgent,
}: {
  tripName: string;
  dateLabel: string;
  meetingPoint?: string | null;
  tripUrl: string;
  weatherNote?: string | null;
  urgent?: boolean;
}) {
  return (
    <EmailLayout preview={`Kujtesë: ${tripName}`}>
      <Heading style={heading}>
        {urgent
          ? "Kujtesë: Udhëtimi fillon së shpejti!"
          : "Kujtesë: Udhëtimi juaj fillon nesër!"}
      </Heading>
      <Text style={text}>
        <strong>{tripName}</strong>
      </Text>
      <Text style={detail}>📅 {dateLabel}</Text>
      {meetingPoint ? <Text style={detail}>📍 {meetingPoint}</Text> : null}
      {weatherNote ? <Text style={weather}>🌤️ {weatherNote}</Text> : null}
      <Button href={tripUrl} style={button}>
        Shiko Detajet
      </Button>
      <Text style={footer}>
        Mbani me vete numrin e kontaktit të emergjencës dhe pajisjet e
        nevojshme.
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
const detail: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  margin: "0 0 6px",
};
const weather: React.CSSProperties = {
  backgroundColor: "#f3f5f3",
  borderRadius: "8px",
  color: "#374151",
  fontSize: "14px",
  margin: "12px 0",
  padding: "10px 14px",
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
