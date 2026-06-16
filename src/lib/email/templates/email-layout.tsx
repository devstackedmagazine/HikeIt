import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Shared shell for all HikeIt transactional emails: brand header, white card on
 * a tinted background, and the standard footer. Individual templates only
 * supply the body content.
 */
export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>⛰️ HikeIt</Text>
          </Section>
          <Section style={card}>{children}</Section>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn&apos;t request this, you can safely ignore this email.
            <br />
            Nëse nuk e keni kërkuar këtë, mund ta injoroni këtë email.
          </Text>
          <Text style={footerMuted}>
            HikeIt · Hiking clubs of Kosovo ·{" "}
            <Link href="https://hikeit.app" style={footerLink}>
              hikeit.app
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const FOREST = "#2D5F3F";

const body: React.CSSProperties = {
  backgroundColor: "#f3f5f3",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "32px 0",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  maxWidth: "480px",
  padding: "0 16px",
};

const header: React.CSSProperties = {
  textAlign: "center",
  paddingBottom: "16px",
};

const brand: React.CSSProperties = {
  color: FOREST,
  fontSize: "24px",
  fontWeight: 700,
  margin: 0,
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e4e9e4",
  borderRadius: "12px",
  padding: "32px",
};

const hr: React.CSSProperties = {
  borderColor: "#e4e9e4",
  margin: "24px 0 16px",
};

const footer: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "18px",
  textAlign: "center",
  margin: "0 0 8px",
};

const footerMuted: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  textAlign: "center",
  margin: 0,
};

const footerLink: React.CSSProperties = {
  color: FOREST,
  textDecoration: "underline",
};
