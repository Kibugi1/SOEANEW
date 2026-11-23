
"use client";

import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import EastRounded from "@mui/icons-material/EastRounded";
import LinkButton from "../ui/LinkButton";

const MotionBox = motion(Box);

const pillars = [
    {
        number: "01",
        title: "Eco-Sustainable Development",
        description:
            "Community-centred responses that connect environmental sustainability with practical livelihood opportunities.",
        href: "/our-focus",
        image: "/assets/images/community/womensmiles.jpg",
    },
    {
        number: "02",
        title: "EcoTech Innovation Hubs",
        description:
            "Exploring how technology, skills and local innovation can help communities respond to environmental challenges.",
        href: "/innovation",
        image: "/assets/images/community/taarifaecoapp.webp",
    },
    {
        number: "03",
        title: "Eco-Storytelling & Advocacy",
        description:
            "Making community experiences, practical knowledge and climate solutions more visible through storytelling.",
        href: "/people-stories",
        image: "/assets/images/community/matharedreamras.jpg",
    },
];

export default function Pillars() {
    return (
        <Container maxWidth="xl">
            <Box sx={{ py: { xs: 9, md: 13 } }}>
                <Grid container spacing={4} sx={{ mb: 5 }}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Typography
                            sx={{
                                fontFamily: '"Space Mono", monospace',
                                fontSize: 11,
                                letterSpacing: 1.5,
                                color: "text.secondary",
                                mb: 2,
                            }}
                        >
                            03 / WHAT GUIDES OUR WORK
                        </Typography>

                        <Typography
                            component="h2"
                            variant="h2"
                            sx={{
                                fontSize: { xs: 43, md: 60, lg: 68 },
                                maxWidth: 680,
                            }}
                        >
                            Three pillars. A shared purpose.
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                        <Typography
                            sx={{
                                color: "text.secondary",
                                lineHeight: 1.8,
                                maxWidth: 460,
                            }}
                        >
                            Our work connects sustainable development, technology and
                            storytelling to support practical, community-centred change.
                        </Typography>
                    </Grid>
                </Grid>

                <Grid container spacing={2}>
                    {pillars.map((pillar) => (
                        <Grid key={pillar.number} size={{ xs: 12, md: 4 }}>
                            <MotionBox
                                initial="rest"
                                whileHover="hover"
                                animate="rest"
                                sx={{
                                    position: "relative",
                                    minHeight: { xs: 390, md: 480 },
                                    height: "100%",
                                    overflow: "hidden",
                                    isolation: "isolate",
                                    bgcolor: "#504624",
                                    color: "#fff",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    p: { xs: 3, md: 3.5 },
                                    cursor: "pointer",
                                }}
                            >
                                {/* Background image */}
                                <MotionBox
                                    variants={{
                                        rest: {
                                            filter: "blur(3px)",
                                            scale: 1.04,
                                            opacity: 0.65,
                                        },
                                        hover: {
                                            filter: "blur(0px)",
                                            scale: 1.1,
                                            opacity: 1,
                                        },
                                    }}
                                    transition={{ duration: 0.55, ease: "easeOut" }}
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: -2,
                                        backgroundImage: `url("${pillar.image}")`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                />

                                {/* Contrast overlay */}
                                <MotionBox
                                    variants={{
                                        rest: { opacity: 0.58 },
                                        hover: { opacity: 0.38 },
                                    }}
                                    transition={{ duration: 0.4 }}
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: -1,
                                        background:
                                            "linear-gradient(180deg, rgba(20,20,15,0.45) 0%, rgba(20,20,15,0.18) 35%, rgba(20,20,15,0.85) 100%)",
                                    }}
                                />

                                <Stack
                                    direction="row"
                                    sx={{
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontFamily: '"Space Mono", monospace',
                                            fontSize: 11,
                                            letterSpacing: 1,
                                            color: "rgba(255,255,255,0.85)",
                                        }}
                                    >
                                        PILLAR {pillar.number}
                                    </Typography>

                                    <Typography
                                        aria-hidden="true"
                                        sx={{ fontSize: 28, color: "#fff" }}
                                    >
                                        ↗
                                    </Typography>
                                </Stack>

                                <Box>
                                    <Typography
                                        component="h3"
                                        sx={{
                                            fontFamily: '"Cormorant Garamond", serif',
                                            fontSize: { xs: 35, md: 39 },
                                            lineHeight: 1.08,
                                            fontWeight: 600,
                                            maxWidth: 300,
                                            color: "#fff",
                                        }}
                                    >
                                        {pillar.title}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            mt: 2,
                                            mb: 3,
                                            fontSize: 13,
                                            lineHeight: 1.85,
                                            maxWidth: 340,
                                            color: "rgba(255,255,255,0.88)",
                                        }}
                                    >
                                        {pillar.description}
                                    </Typography>

                                    <LinkButton
                                        href={pillar.href}
                                        variant="text"
                                        endIcon={<EastRounded />}
                                        sx={{
                                            px: 0,
                                            color: "#fff",
                                            "&:hover": {
                                                color: "#D9AF3F",
                                                backgroundColor: "transparent",
                                            },
                                        }}
                                    >
                                        Learn more
                                    </LinkButton>
                                </Box>
                            </MotionBox>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Container>
    );
}
