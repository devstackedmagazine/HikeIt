import { Button, Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

export function SubscriptionActivated({
  planName,
  dashboardUrl,
}: {
  planName: string;
  dashboardUrl: string;
}) {
  return (
    <EmailLayout preview={`Abonimi ${planName} është aktiv`}>
      <Heading style={heading}>Abonimi juaj HikeIt {planName} është aktiv!</Heading>
      <Text style={text}>
        Faleminderit! Klubi juaj tani ka qasje në të gjitha veçoritë{" "}
        {planName}: anëtarë të pakufizuar, udhëtime të pakufizuara, pagesa online
        dhe dashboard analitike.
      </Text>
      <Button href={dashboardUrl} style={button}>
        Shko te Paneli
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
