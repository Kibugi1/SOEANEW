
import {
    Box,
    Container,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import SocialLinks from "@/components/ui/SocialLinks";

const exploreLinks = [
    ["Who We Are", "/who-we-are"],
    ["Our Approach", "/our-approach"],
    ["Our Focus", "/our-focus"],
    ["Programs", "/programs"],
    ["People & Stories", "/people-stories"],
];

const footerLinks = [
    { label: "Privacy", href: "/privacy" },
    { label: "Contact", href: "/contact" },
];

function FooterHeading({ children }: { children: React.ReactNode }) {
    return (
        <Typography
            sx={{
                mb: 2.5,
                fontFamily: '"Space Mono", monospace',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#83834B",
            }}
        >
            {children}
        </Typography>
    );
}

function FooterLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Typography
            component="a"
            href={href}
            sx={{
                display: "block",
                width: "fit-content",
                fontSize: 13,
                color: "#5F5F55",
                textDecoration: "none",
                transition: "color 0.2s ease",
                "&:hover": {
                    color: "#83834B",
                },
            }}
        >
            {children}
        </Typography>
    );
}

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: "#FFFFFF",
                borderTop: "1px solid",
                borderColor: "divider",
                pt: { xs: 5, md: 6 },
                pb: 3,
            }}
        >
            <Container maxWidth="xl">
                <Grid container spacing={{ xs: 4, md: 5 }}>
                    {/* Brand */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Typography
                            sx={{
                                fontFamily: '"Cormorant Garamond", serif',
                                fontSize: 33,
                                fontWeight: 700,
                                lineHeight: 1,
                                color: "#1A1A1A",
                            }}
                        >
                            square one
                        </Typography>

                        <Typography
                            sx={{
                                mt: 0.7,
                                fontFamily: '"Space Mono", monospace',
                                fontSize: 9,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: "text.secondary",
                            }}
                        >
                            Eco Africa
                        </Typography>

                        <Typography
                            sx={{
                                mt: 2.5,
                                maxWidth: 360,
                                color: "#5F5F55",
                                fontSize: 13,
                                lineHeight: 1.8,
                            }}
                        >
                            Co-creating practical climate solutions for transformational
                            impact.
                        </Typography>
                    </Grid>

                    {/* Explore */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FooterHeading>Explore</FooterHeading>

                        <Stack spacing={1.5}>
                            {exploreLinks.map(([label, href]) => (
                                <FooterLink key={href} href={href}>
                                    {label}
                                </FooterLink>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Contact */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FooterHeading>Get in touch</FooterHeading>

                        <Stack spacing={1.5}>
                            <FooterLink href="mailto:info@sq1ecoafrica.org">
                                info@sq1ecoafrica.org
                            </FooterLink>

                            <FooterLink href="mailto:partnerships@sq1ecoafrica.org">
                                partnerships@sq1ecoafrica.org
                            </FooterLink>

                            <Typography
                                sx={{
                                    fontSize: 13,
                                    color: "#5F5F55",
                                }}
                            >
                                Nairobi, Kenya
                            </Typography>
                        </Stack>

                        <Box sx={{ mt: 2.5 }}>
                            <SocialLinks size={38} />
                        </Box>
                    </Grid>
                </Grid>

                {/* Bottom bar */}
                <Box
                    sx={{
                        mt: 6,
                        pt: 2.5,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 1.5,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 11,
                            color: "text.secondary",
                        }}
                    >
                        © 2026 Square One Eco Africa
                    </Typography>

                    <Stack direction="row" spacing={2.5}>
                        {footerLinks.map((link) => (
                            <FooterLink key={link.href} href={link.href}>
                                {link.label}
                            </FooterLink>
                        ))}
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
}
