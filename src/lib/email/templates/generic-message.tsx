import { Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/email-layout";

/** Free-form club → registrants broadcast. Preserves line breaks. */
export function GenericMessage({
  heading,
  message,
}: {
  heading: string;
  message: string;
}) {
  return (
    <EmailLayout preview={heading}>
      <Heading style={headingStyle}>{heading}</Heading>
      {message.split("\n").map((line, i) => (
        <Text key={i} style={text}>
          {line || " "}
        </Text>
      ))}
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
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
