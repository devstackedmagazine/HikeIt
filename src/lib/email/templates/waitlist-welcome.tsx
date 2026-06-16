import { Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

export function WaitlistWelcome() {
  return (
    <EmailLayout preview="Jeni në listën e pritjes së HikeIt">
      <Heading style={heading}>Mirë se vini në HikeIt!</Heading>
      <Text style={text}>
        Jeni në listën tonë. Do t&apos;ju njoftojmë sapo të hapim — i pari në
        radhë për të zbuluar shtigjet dhe klubet e alpinizmit në Kosovë.
      </Text>
      <Text style={textMuted}>
        Welcome aboard! You&apos;re on the HikeIt early-access list — we&apos;ll
        email you the moment we open.
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

const textMuted: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
  margin: 0,
};
