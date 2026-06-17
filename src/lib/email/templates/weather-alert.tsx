import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

type Level = "warning" | "alert" | "danger";

const LEVEL_META: Record<
  Level,
  { color: string; label: string; advice: string }
> = {
  warning: {
    color: "#D97706",
    label: "⚠️ Paralajmërim",
    advice: "Kini kujdes, kontrolloni pajisjet tuaja.",
  },
  alert: {
    color: "#EA580C",
    label: "🟠 Alarm",
    advice: "Rekomandojmë të rivlerësoni vendimin për udhëtim.",
  },
  danger: {
    color: "#DC2626",
    label: "🔴 RREZIK",
    advice: "Udhëtimi NUK rekomandohet. Prisni vendimin e klubit.",
  },
};

export function WeatherAlert({
  tripName,
  date,
  alertLevel,
  message,
  tripUrl,
}: {
  tripName: string;
  date: string;
  alertLevel: Level;
  message: string;
  tripUrl: string;
}) {
  const meta = LEVEL_META[alertLevel];
  return (
    <EmailLayout preview={`Alarm moti: ${tripName}`}>
      <Text style={{ ...badge, backgroundColor: meta.color }}>
        {meta.label}
      </Text>
      <Heading style={heading}>{tripName}</Heading>
      <Text style={detail}>📅 {date}</Text>
      <Text style={{ ...messageStyle, color: meta.color }}>{message}</Text>
      <Text style={advice}>{meta.advice}</Text>
      <Button href={tripUrl} style={{ ...button, backgroundColor: meta.color }}>
        Shiko Udhëtimin
      </Button>
      <Text style={footer}>
        Do të njoftoheni nëse kushtet ndryshojnë.
      </Text>
    </EmailLayout>
  );
}

const badge: React.CSSProperties = {
  borderRadius: "9999px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "13px",
  fontWeight: 700,
  margin: "0 0 12px",
  padding: "4px 12px",
};
const heading: React.CSSProperties = {
  color: "#1a2e22",
  fontSize: "22px",
  fontWeight: 700,
  margin: "0 0 8px",
};
const detail: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  margin: "0 0 12px",
};
const messageStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  margin: "0 0 8px",
};
const advice: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  margin: "0 0 20px",
};
const button: React.CSSProperties = {
  borderRadius: "8px",
  color: "#ffffff",
  display: "block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 20px",
  textAlign: "center",
  textDecoration: "none",
};
const footer: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "16px 0 0",
};
