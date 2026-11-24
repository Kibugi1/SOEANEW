import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";

/** SOEA's public channels. Edit here and every footer/contact link follows. */
export const SOCIAL = {
  linkedin: "https://www.linkedin.com/company/square-one-eco-africa/",
  whatsappNumber: "254704831331",
  whatsappDisplay: "+254 704 831 331",
} as const;

export const whatsappHref = `https://wa.me/${SOCIAL.whatsappNumber}`;

// Tabler outline brand icons (MIT), the same family BiYo Events uses.
const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function LinkedInIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} {...svgProps}>
      <path d="M8 11v5" />
      <path d="M8 8v.01" />
      <path d="M12 16v-5" />
      <path d="M16 16v-3a2 2 0 1 0 -4 0" />
      <path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4l0 -10" />
    </svg>
  );
}

function WhatsAppIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} {...svgProps}>
      <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
      <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
    </svg>
  );
}

const LINKS = [
  { label: "LinkedIn", title: "Follow Square One Eco Africa on LinkedIn", href: SOCIAL.linkedin, Icon: LinkedInIcon },
  { label: "WhatsApp", title: `Chat with us on WhatsApp (${SOCIAL.whatsappDisplay})`, href: whatsappHref, Icon: WhatsAppIcon },
];

/** Round icon links to SOEA's LinkedIn and WhatsApp. */
export default function SocialLinks({ size = 40 }: { size?: number }) {
  const iconSize = Math.round(size * 0.5);
  return (
    <Box component="ul" sx={{ display: "flex", gap: 1, p: 0, m: 0, listStyle: "none" }}>
      {LINKS.map(({ label, title, href, Icon }) => (
        <li key={label}>
          <Tooltip title={title} arrow>
            <Box
              component="a"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={title}
              sx={{
                width: size,
                height: size,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                color: "#202421",
                bgcolor: "#F1F4ED",
                border: "1px solid rgba(0,0,0,0.08)",
                transition: "transform 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease",
                "&:hover": {
                  bgcolor: "#EFF0DC",
                  color: "#504624",
                  transform: "translateY(-3px)",
                  boxShadow: "0 6px 14px rgba(80, 70, 36, 0.18)",
                },
                "&:focus-visible": { outline: "2px solid #83834B", outlineOffset: 2 },
                "@media (prefers-reduced-motion: reduce)": { transition: "none", "&:hover": { transform: "none" } },
              }}
            >
              <Icon size={iconSize} />
            </Box>
          </Tooltip>
        </li>
      ))}
    </Box>
  );
}
