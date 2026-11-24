import { Fragment } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * Renders the small Markdown subset the story editor asks writers to use:
 * paragraphs (blank line between), lists (lines starting "- ") and **bold**.
 * Everything else is shown as plain text. It builds React elements only, so text
 * from the dashboard can never inject HTML into the page.
 */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <Box component="strong" key={index} sx={{ fontWeight: 700 }}>
        {part.slice(2, -2)}
      </Box>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

export default function SimpleMarkdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return (
            <Box component="ul" key={index} sx={{ pl: 3, my: 2, "& li": { mb: 1, lineHeight: 1.85 } }}>
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </Box>
          );
        }
        return (
          <Typography key={index} sx={{ my: 2, lineHeight: 1.9, fontSize: { xs: "1rem", md: "1.08rem" } }}>
            {lines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {inline(line)}
              </Fragment>
            ))}
          </Typography>
        );
      })}
    </>
  );
}
