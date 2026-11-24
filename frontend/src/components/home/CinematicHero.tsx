
"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import EastRounded from "@mui/icons-material/EastRounded";

export default function CinematicHero() {
    const sectionRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    });

    // The photograph first becomes vivid, then recedes behind the gradient.
    const imageOpacity = useTransform(
        scrollYProgress,
        [0, 0.22, 0.40, 0.58, 0.78, 1],
        [0.38, 0.38, 1, 1, 0.38, 0.38]
    );

    const gradientOpacity = useTransform(
        scrollYProgress,
        [0, 0.22, 0.40, 0.58, 0.78, 1],
        [1, 1, 0, 0, 1, 1]
    );

    // Opening statement exits as the second statement enters.
    const openingOpacity = useTransform(
        scrollYProgress,
        [0, 0.18, 0.34, 0.43],
        [1, 1, 0, 0]
    );

    const openingY = useTransform(
        scrollYProgress,
        [0, 0.34, 0.43],
        [0, -100, -140]
    );

    const secondOpacity = useTransform(
        scrollYProgress,
        [0.43, 0.55, 0.95, 1],
        [0, 1, 1, 1]
    );

    const secondY = useTransform(
        scrollYProgress,
        [0.43, 0.60],
        [-100, 0]
    );

    const contentOpacity = useTransform(
        scrollYProgress,
        [0.57, 0.72],
        [0, 1]
    );

    return (
        <Box
            ref={sectionRef}
            component="section"
            sx={{
                position: "relative",
                height: "300vh",
                bgcolor: "#504624",
            }}
        >
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    height: "100svh",
                    minHeight: 600,
                    overflow: "hidden",
                    bgcolor: "#504624",
                }}
            >
                {/* Background photograph */}
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: imageOpacity,
                    }}
                >
                    <Image
                        src="/assets/images/hero/landingpage.webp"
                        alt="Square One Eco Africa environmental and community work"
                        fill
                        priority
                        sizes="100vw"
                        style={{ objectFit: "cover" }}
                    />
                </motion.div>

                {/* SOEA gradient overlay */}
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: gradientOpacity,
                        background:
                            "linear-gradient(115deg, rgba(40,48,25,0.94) 0%, rgba(80,70,36,0.78) 48%, rgba(131,131,75,0.58) 100%)",
                    }}
                />

                {/* Additional image contrast */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(0deg, rgba(20,25,15,0.22), transparent 65%)",
                        pointerEvents: "none",
                    }}
                />

                {/* Scene one: organisation statement */}
                <Container
                    maxWidth="xl"
                    sx={{
                        position: "relative",
                        zIndex: 2,
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 1.1,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{
                            opacity: openingOpacity,
                            y: openingY,
                            width: "100%",
                        }}
                    >
                        <Box sx={{ width: "100%", maxWidth: 900, mx: "auto", textAlign: "center" }}>
                            <Typography
                                sx={{
                                    mb: 3,
                                    fontFamily: '"Space Mono", monospace',
                                    fontSize: 11,
                                    letterSpacing: "0.2em",
                                    color: "#E0C56E",
                                    textTransform: "uppercase",
                                }}
                            >
                                People. Skills. Solutions. Sustainable Livelihoods.
                            </Typography>

                            <Typography
                                component="h1"
                                sx={{
                                    maxWidth: 900,
                                    mx: "auto",
                                    color: "#FFFFFF",
                                    fontFamily: '"Cormorant Garamond", serif',
                                    fontSize: "clamp(3.25rem, 6.4vw, 6.5rem)",
                                    fontWeight: 700,
                                    lineHeight: 0.88,
                                    letterSpacing: "-0.045em",
                                    textTransform: "uppercase",
                                }}
                            >
                                {/* A quiet lead-in, so the name carries the weight. */}
                                <Box
                                    component="span"
                                    sx={{
                                        display: "block",
                                        mb: { xs: 1.5, md: 2 },
                                        fontSize: "0.42em",
                                        fontWeight: 400,
                                        fontStyle: "italic",
                                        letterSpacing: "0.04em",
                                        textTransform: "none",
                                        color: "rgba(255, 255, 255, 0.82)",
                                    }}
                                >
                                    We are
                                </Box>
                                <Box component="span" sx={{ display: "block" }}>
                                    Square One
                                </Box>
                                <Box component="span" sx={{ display: "block", color: "#E0C56E" }}>
                                    Eco Africa.
                                </Box>
                            </Typography>
                        </Box>
                    </motion.div>

                    {/* Scene two: main proposition */}
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            opacity: secondOpacity,
                            y: secondY,
                            pointerEvents: "none",
                        }}
                    >
                        <Container maxWidth="xl">
                            <Box sx={{ width: "100%", maxWidth: 920 }}>
                                <Typography
                                    sx={{
                                        mb: 2,
                                        fontFamily: '"Space Mono", monospace',
                                        fontSize: 10,
                                        letterSpacing: "0.16em",
                                        color: "#E0C56E",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    People. Skills. Solutions. Sustainable Livelihoods.
                                </Typography>

                                <Typography
                                    component="h2"
                                    sx={{
                                        maxWidth: 920,
                                        color: "#FFFFFF",
                                        fontSize: "clamp(2.7rem, 5.4vw, 5.8rem)",
                                        fontWeight: 600,
                                        lineHeight: 0.94,
                                        letterSpacing: "-0.045em",
                                    }}
                                >
                                    Co-creating practical{" "}
                                    <Box
                                        component="span"
                                        sx={{ color: "#E0C56E", fontStyle: "italic" }}
                                    >
                                        climate solutions
                                    </Box>{" "}
                                    for transformational impact.
                                </Typography>

                                <motion.div style={{ opacity: contentOpacity }}>
                                    <Typography
                                        sx={{
                                            maxWidth: 580,
                                            mt: 3,
                                            color: "rgba(255,255,255,0.88)",
                                            fontSize: { xs: 14, md: 17 },
                                            lineHeight: 1.85,
                                        }}
                                    >
                                        We bring people, skills and practical solutions together to
                                        support sustainable livelihoods and community-centred
                                        environmental action.
                                    </Typography>

                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={1.5}
                                        sx={{ mt: 3, pointerEvents: "auto" }}
                                    >
                                        <Button
                                            component={Link}
                                            href="/our-approach"
                                            variant="contained"
                                            endIcon={<ArrowOutwardRounded />}
                                            sx={{
                                                minHeight: 50,
                                                px: 3,
                                                alignSelf: "flex-start",
                                                bgcolor: "#D9AF3F",
                                                color: "#292719",
                                                "&:hover": { bgcolor: "#E5C35F" },
                                            }}
                                        >
                                            Discover our approach
                                        </Button>

                                        <Button
                                            component={Link}
                                            href="/programs"
                                            variant="outlined"
                                            endIcon={<EastRounded />}
                                            sx={{
                                                minHeight: 50,
                                                px: 2,
                                                alignSelf: "flex-start",
                                                color: "#FFFFFF",
                                                borderColor: "rgba(255,255,255,0.6)",
                                                "&:hover": {
                                                    borderColor: "#FFFFFF",
                                                    bgcolor: "rgba(255,255,255,0.08)",
                                                },
                                            }}
                                        >
                                            Explore our programs
                                        </Button>
                                    </Stack>
                                </motion.div>
                            </Box>
                        </Container>
                    </motion.div>
                </Container>

                {/* Scroll indicator */}
                <Box
                    sx={{
                        position: "absolute",
                        zIndex: 3,
                        bottom: { xs: 20, md: 30 },
                        right: { xs: 22, md: 60 },
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: '"Space Mono", monospace',
                            fontSize: 9,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                        }}
                    >
                        Scroll to explore
                    </Typography>
                    <Box
                        component={motion.div}
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        sx={{ fontSize: 20 }}
                    >
                        ↓
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
