import { Button, Heading, Link, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

export function VerifyEmail({
  name,
  verificationUrl,
}: {
  name?: string | null;
  verificationUrl: string;
}) {
  return (
    <EmailLayout preview="Verify your email to get started on HikeIt">
      <Heading style={heading}>Verify your email</Heading>
      <Text style={text}>
        {name ? `Hi ${name},` : "Hi,"} welcome to HikeIt! Confirm your email
        address to activate your account and start exploring the trails of
        Kosovo.
      </Text>
      <Text style={textAl}>
        Mirë se vini në HikeIt! Konfirmoni email-in tuaj për të aktivizuar
        llogarinë.
      </Text>
      <Button href={verificationUrl} style={button}>
        Verify your email · Verifiko email-in
      </Button>
      <Text style={fallback}>
        Or paste this link into your browser:
        <br />
        <Link href={verificationUrl} style={link}>
          {verificationUrl}
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

const fallback: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 0",
  wordBreak: "break-all",
};

const link: React.CSSProperties = {
  color: "#2D5F3F",
};
