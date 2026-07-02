import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

export interface TripChange {
  label: string;
  from: string;
  to: string;
}

export function TripUpdated({
  tripName,
  changes,
  tripUrl,
}: {
  tripName: string;
  changes: TripChange[];
  tripUrl: string;
}) {
  return (
    <EmailLayout preview={`${tripName} ka ndryshime`}>
      <Heading style={heading}>Udhëtimi ka ndryshime</Heading>
      <Text style={text}>
        Disa detaje për <strong>{tripName}</strong> u përditësuan:
      </Text>
      <ul style={list}>
        {changes.map((c) => (
          <li key={c.label} style={item}>
            <strong>{c.label}:</strong> {c.from} → {c.to}
          </li>
        ))}
      </ul>
      <Button href={tripUrl} style={button}>
        Shiko Detajet
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
const list: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 20px",
  paddingLeft: "18px",
};
const item: React.CSSProperties = { margin: "0 0 6px" };
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
