import { Button, Heading, Link, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

export function ResetPassword({
  name,
  resetUrl,
}: {
  name?: string | null;
  resetUrl: string;
}) {
  return (
    <EmailLayout preview="Reset your HikeIt password">
      <Heading style={heading}>Reset your password</Heading>
      <Text style={text}>
        {name ? `Hi ${name},` : "Hi,"} we received a request to reset your
        HikeIt password. Click the button below to choose a new one.
      </Text>
      <Text style={textAl}>
        Kemi marrë një kërkesë për të rivendosur fjalëkalimin tuaj. Klikoni
        butonin më poshtë.
      </Text>
      <Button href={resetUrl} style={button}>
        Reset password · Rivendos fjalëkalimin
      </Button>
      <Text style={warning}>
        This link expires in 1 hour. · Ky link skadon për 1 orë.
      </Text>
      <Text style={fallback}>
        Or paste this link into your browser:
        <br />
        <Link href={resetUrl} style={link}>
          {resetUrl}
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
  margin: "0 0 8px",
};

const textAl: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 24px",
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

const warning: React.CSSProperties = {
  color: "#E87A30",
  fontSize: "13px",
  fontWeight: 600,
  margin: "16px 0 0",
};

const fallback: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0 0",
  wordBreak: "break-all",
};

const link: React.CSSProperties = {
  color: "#2D5F3F",
};
