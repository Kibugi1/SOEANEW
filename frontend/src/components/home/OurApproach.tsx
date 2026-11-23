"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
    Box,
    Container,
    Typography,
} from "@mui/material";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import LinkButton from "@/components/ui/LinkButton";
import ImagePlaceholder, { type PhotoNeeded } from "@/components/ui/ImagePlaceholder";

const MotionBox = motion(Box);

interface Step {
    number: string;
    title: string;
    description: string;
    /** Null while the requested photo is still being chosen (see `photo`). */
    image: string | null;
    alt: string;
    photo?: PhotoNeeded;
}

// Titles and descriptions: SOEA website feedback, 19 Nov 2026, §7 (the same six
// stages as Our Approach). Photo order: same document, §2.1.
const SUPER_DAY = "Waste Pickers Super Day photo folder (10 October 2026)";

const steps: Step[] = [
    {
        number: "01",
        title: "Understand the challenge",
        description: "Listen to lived experience, community priorities and aspirations.",
        image: null,
        alt: "Nawire at the Waste Pickers Super Day, wearing SOEA branding",
        photo: {
            needed: "Nawire at the Waste Pickers Super Day: short hair, green dress/coat, visible SOEA-logo branding. The new opening image.",
            source: SUPER_DAY,
        },
    },
    {
        number: "02",
        title: "Assess together",
        description: "Gather baseline evidence, analyze opportunities and barriers, and validate findings with communities.",
        image: null,
        alt: "Nahshon Omollo facilitating a community conversation at Light Academy Hall, Dandora",
        photo: {
            needed: "Nahshon Omollo speaking at the second Dandora waste pickers community conversation, Light Academy Hall (alternative: Wairimu Maina at the same event). Show facilitation and participation.",
            source: "Dandora second community engagement photos",
        },
    },
    {
        number: "03",
        title: "Co-design",
        description: "Develop practical solutions, curriculum content and pathways with communities, technical partners and institutions.",
        // Moved here from step 01, as requested.
        image: "/assets/images/community/womanmicspeaking.jpg",
        alt: "A woman speaking during a community engagement session",
    },
    {
        number: "04",
        title: "Build capabilities",
        description: "Deliver practical skills, legal rights advocacy, safety, social skills and enterprise learning.",
        image: null,
        alt: "Rozalia Wangui Karanja at the Waste Pickers Super Day, SOEA logo on her clothing",
        photo: {
            needed: "Rozalia Wangui Karanja at the Waste Pickers Super Day, facing the camera with the SOEA logo visible on her clothing (replaces the side-on photo).",
            source: SUPER_DAY,
        },
    },
    {
        number: "05",
        title: "Connect to opportunity",
        description: "Support demonstration, market linkages, financial services and sustainable livelihoods.",
        // Moved here from step 06, as requested.
        image: "/assets/images/community/stephaniesite.jpg",
        alt: "SOEA team member during a project site visit",
    },
    {
        number: "06",
        title: "Measure, document, learn, replicate, scale & adopt",
        description: "Follow up, assess change, communicate evidence, adapt what works and support lasting community or institutional ownership.",
        image: null,
        alt: "SOEA team member speaking at the Waste Pickers Super Day",
        photo: {
            needed: "A different, clearly SOEA-branded action photo from the Waste Pickers Super Day: Nahshon Omollo, Brian Kibugi or Wairimu Maina speaking. Not the photo used in step 05.",
            source: SUPER_DAY,
        },
    },
];

export default function OurApproach() {
    const [activeStep, setActiveStep] = useState(0);

    return (
        <Box
            component="section"
            sx={{
                py: { xs: 9, md: 14 },
                overflow: "hidden",
                bgcolor: "#F5F5F0",
            }}
        >
            <Container maxWidth="xl">
                {/* Section introduction */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "1.2fr 0.8fr",
                        },
                        alignItems: "end",
                        gap: { xs: 3, md: 6 },
                        mb: { xs: 5, md: 7 },
                    }}
                >
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: '"Space Mono", monospace',
                                fontSize: 11,
                                letterSpacing: "0.08em",
                                color: "#83834B",
                                mb: 2,
                            }}
                        >
                            02 / OUR APPROACH
                        </Typography>

                        <Typography
                            component="h2"
                            sx={{
                                fontFamily: '"Cormorant Garamond", serif',
                                fontWeight: 500,
                                fontSize: {
                                    xs: "clamp(2.8rem, 9vw, 3.5rem)",
                                    md: "clamp(3.5rem, 5vw, 4.8rem)",
                                },
                                lineHeight: 0.98,
                                letterSpacing: "-0.035em",
                                maxWidth: 650,
                                color: "#1A1A1A",
                            }}
                        >
                            A pathway built around people.
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            maxWidth: 470,
                            color: "#5F5F55",
                            fontSize: { xs: 15, md: 16 },
                            lineHeight: 1.85,
                            pb: { md: 0.5 },
                        }}
                    >
                        Meaningful progress takes more than a single intervention.
                        Our six-step pathway connects community insight with skills,
                        opportunity and continued learning.
                    </Typography>
                </Box>

                {/* Six-step photographic pathway */}
                <Box
                    sx={{
                        display: "flex",
                        gap: { xs: 1.5, md: 1 },
                        height: { xs: 440, sm: 480, md: 500, lg: 540 },
                        overflowX: { xs: "auto", md: "hidden" },
                        overflowY: "hidden",
                        pb: { xs: 2, md: 0 },
                        scrollSnapType: { xs: "x mandatory", md: "none" },
                        scrollbarWidth: "thin",
                        scrollbarColor: "#A8A658 transparent",
                    }}
                >
                    {steps.map((step, index) => {
                        const isActive = activeStep === index;

                        return (
                            <MotionBox
                                key={step.number}
                                role="button"
                                tabIndex={0}
                                aria-label={`${step.number}: ${step.title}. ${isActive ? step.description : "Select to explore this step."
                                    }`}
                                aria-pressed={isActive}
                                onHoverStart={() => setActiveStep(index)}
                                onFocus={() => setActiveStep(index)}
                                onClick={() => setActiveStep(index)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setActiveStep(index);
                                    }

                                    if (event.key === "ArrowRight") {
                                        setActiveStep((current) =>
                                            Math.min(current + 1, steps.length - 1)
                                        );
                                    }

                                    if (event.key === "ArrowLeft") {
                                        setActiveStep((current) =>
                                            Math.max(current - 1, 0)
                                        );
                                    }
                                }}
                                animate={{
                                    flexGrow: isActive ? 3.2 : 1,
                                }}
                                transition={{
                                    duration: 0.55,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                style={{
                                    position: "relative",
                                    flexBasis: 0,
                                    flexShrink: 0,
                                    minWidth: 0,
                                    minHeight: 0,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    borderRadius: 3,
                                    outline: "none",
                                    scrollSnapAlign: "start",
                                }}
                                whileTap={{ scale: 0.99 }}
                                sx={{
                                    flexBasis: {
                                        xs: "78vw",
                                        sm: "55vw",
                                        md: 0,
                                    },
                                    "&:focus-visible": {
                                        outline: "3px solid #D9AF3F",
                                        outlineOffset: "-4px",
                                    },
                                }}
                            >
                                {/* Background photograph, or the photo still to be chosen */}
                                {step.image ? (
                                <Image
                                    src={step.image}
                                    alt={step.alt}
                                    fill
                                    sizes="(max-width: 600px) 78vw, (max-width: 900px) 55vw, 25vw"
                                    priority={index === 0}
                                    style={{
                                        objectFit: "cover",
                                        objectPosition: "center",
                                        filter: isActive
                                            ? "brightness(0.88) saturate(1)"
                                            : "brightness(0.58) saturate(0.65) blur(1.2px)",
                                        transform: isActive ? "scale(1.02)" : "scale(1.08)",
                                        transition:
                                            "filter 650ms ease, transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
                                    }}
                                />
                                ) : (
                                    <ImagePlaceholder
                                        {...step.photo!}
                                        compact
                                        sx={{ bottom: "auto", height: "58%", justifyContent: "flex-start", zIndex: 2 }}
                                    />
                                )}

                                {/* Dark photographic overlay */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        background: isActive
                                            ? "linear-gradient(0deg, rgba(20,25,15,0.88) 0%, rgba(20,25,15,0.15) 65%, rgba(20,25,15,0.08) 100%)"
                                            : "linear-gradient(0deg, rgba(20,25,15,0.82) 0%, rgba(20,25,15,0.35) 100%)",
                                        transition: "background 500ms ease",
                                    }}
                                />

                                {/* Card content */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        p: { xs: 2.5, md: 3 },
                                        color: "#FFFFFF",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontFamily: '"Space Mono", monospace',
                                                fontSize: 12,
                                                letterSpacing: "0.08em",
                                                color: "#FFFFFF",
                                            }}
                                        >
                                            STEP {step.number}
                                        </Typography>

                                        <Box
                                            sx={{
                                                width: 34,
                                                height: 34,
                                                border: "1px solid rgba(255,255,255,0.6)",
                                                borderRadius: "50%",
                                                display: "grid",
                                                placeItems: "center",
                                                opacity: isActive ? 1 : 0.65,
                                                transition: "all 300ms ease",
                                            }}
                                        >
                                            <ArrowOutwardRounded sx={{ fontSize: 17 }} />
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Typography
                                            component="h3"
                                            sx={{
                                                fontFamily: '"Cormorant Garamond", serif',
                                                fontWeight: 500,
                                                fontSize: {
                                                    xs: 31,
                                                    md: isActive ? 39 : 25,
                                                },
                                                lineHeight: 1.05,
                                                letterSpacing: "-0.02em",
                                                maxWidth: 290,
                                                transition: "font-size 450ms ease",
                                            }}
                                        >
                                            {step.title}
                                        </Typography>

                                        <AnimatePresence initial={false}>
                                            {isActive && (
                                                <MotionBox
                                                    key="description"
                                                    initial={{ opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 8 }}
                                                    transition={{ duration: 0.35, delay: 0.12 }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            mt: 2,
                                                            maxWidth: 330,
                                                            color: "rgba(255,255,255,0.88)",
                                                            fontSize: 13,
                                                            lineHeight: 1.8,
                                                        }}
                                                    >
                                                        {step.description}
                                                    </Typography>

                                                    <Box
                                                        sx={{
                                                            width: 38,
                                                            height: 2,
                                                            bgcolor: "#D9AF3F",
                                                            mt: 2.5,
                                                        }}
                                                    />
                                                </MotionBox>
                                            )}
                                        </AnimatePresence>
                                    </Box>
                                </Box>
                            </MotionBox>
                        );
                    })}
                </Box>

                {/* Progress indicator */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 2.5,
                        gap: 2,
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: '"Space Mono", monospace',
                            fontSize: 10,
                            color: "#83834B",
                            letterSpacing: "0.06em",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {String(activeStep + 1).padStart(2, "0")} / 06
                    </Typography>

                    <Box
                        sx={{
                            flex: 1,
                            height: 2,
                            bgcolor: "#E1E1D8",
                            overflow: "hidden",
                        }}
                    >
                        <MotionBox
                            animate={{
                                width: `${((activeStep + 1) / steps.length) * 100}%`,
                            }}
                            transition={{ duration: 0.4 }}
                            style={{
                                height: "100%",
                                background: "#83834B",
                            }}
                        />
                    </Box>

                    <Typography
                        sx={{
                            fontSize: 11,
                            color: "#77776D",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Explore our pathway
                    </Typography>
                </Box>

                <LinkButton
                    href="/our-approach"
                    variant="contained"
                    endIcon={<ArrowOutwardRounded />}
                    sx={{ mt: 4 }}
                >
                    Explore our approach
                </LinkButton>
            </Container>
        </Box>
    );
}