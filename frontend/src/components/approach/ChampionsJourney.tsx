"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Box,
  ButtonBase,
  Container,
  Stack,
  Typography,
} from "@mui/material";

type Scene = {
  number: string;
  title: string;
  caption: string;
  description: string;
  image: string;
  /** Describes the photo itself, for screen readers. */
  alt: string;
  /** CSS object-position, to keep people in frame when the photo is cropped. */
  imagePosition?: string;
};

const scenes: Scene[] = [
  {
    number: "01",
    title: "Understand the Challenge",
    caption: "Listen to the community",
    description:
      "We listen to communities, conduct assessments and document local experiences. Every meaningful solution begins with understanding the people and places involved.",
    image: "/assets/images/championsjourney/understandthechallenge.jpg",
    alt: "A waste picker weighs a sack of collected materials on a hanging scale while community members and SOEA team members record the reading.",
  },
  {
    number: "02",
    title: "Assess Together",
    caption: "Identify priorities together",
    description:
      "We identify needs, existing skills, opportunities, barriers and possible solutions alongside the communities we work with.",
    image: "/assets/images/championsjourney/assesstogether.jpeg",
    alt: "Community members and SOEA staff sit in a circle with worksheets, discussing priorities together.",
  },
  {
    number: "03",
    title: "Co-Design",
    caption: "Develop practical solutions",
    description:
      "Communities, technical experts and partners work together to develop practical solutions and learning pathways that respond to local realities.",
    image: "/assets/images/championsjourney/codesign.jpeg",
    alt: "SOEA team members and partners stand together in front of SOEA and Mathare banners after a co-design session.",
    imagePosition: "center 40%",
  },
  {
    number: "04",
    title: "Build Capabilities",
    caption: "Learn, practise and grow",
    description:
      "We connect participants to training, mentorship, technical skills, legal awareness, financial literacy and occupational health and safety.",
    image: "/assets/images/championsjourney/buildcapabilities.jpeg",
    alt: "A facilitator speaks to participants during a training session in a community hall, beside an SOEA banner.",
    imagePosition: "center 35%",
  },
  {
    number: "05",
    title: "Connect to Opportunity",
    caption: "Turn skills into opportunity",
    description:
      "We facilitate access to practical experience, markets, financial services, enterprise pathways and partnerships.",
    image: "/assets/images/championsjourney/connecttoopportunity.jpg",
    alt: "A sack of sorted plastics and other recyclable materials collected by waste pickers.",
  },
  {
    number: "06",
    title: "Follow Through",
    caption: "Learn, measure and improve",
    description:
      "We track progress, document learning and assess outcomes, including through three-month and six-month follow-up where applicable.",
    image: "/assets/images/championsjourney/followthrough.jpg",
    alt: "SOEA team members review survey forms with community members during a field follow-up.",
  },
];

export default function ChampionsJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeScene, setActiveScene] = useState(0);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const landscapeX = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const roadProgress = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "100%"]
  );

  // Scene transitions follow the visitor's scroll position.
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const index = Math.min(
      scenes.length - 1,
      Math.floor(progress * scenes.length)
    );

    setActiveScene((current) => (current === index ? current : index));
  });

  const active = scenes[activeScene];

  const goToScene = (index: number) => {
    if (!sectionRef.current) return;

    const sectionTop =
      sectionRef.current.getBoundingClientRect().top + window.scrollY;

    const scrollableDistance =
      sectionRef.current.offsetHeight - window.innerHeight;

    const targetProgress = (index + 0.08) / scenes.length;

    window.scrollTo({
      top: sectionTop + scrollableDistance * targetProgress,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <>
      {/* DESKTOP: immersive scrolling landscape */}
      <Box
        component="section"
        ref={sectionRef}
        sx={{
          display: { xs: "none", md: "block" },
          position: "relative",
          height: "600vh",
          backgroundColor: "#F1EBDD",
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            height: "100svh",
            minHeight: 650,
            overflow: "hidden",
            backgroundColor: "#E9E5CE",
          }}
        >
          {/* Moving illustrated landscape */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              width: "145%",
              height: "100%",
              x: landscapeX,
            }}
          >
            <Image
              src="/assets/images/approach/champions-journey-landscape.svg"
              alt=""
              fill
              priority
              sizes="145vw"
              style={{ objectFit: "fill" }}
            />

            <Image
              src="/assets/images/approach/champions-journey-road-overlay.svg"
              alt=""
              fill
              sizes="145vw"
              style={{ objectFit: "fill", pointerEvents: "none" }}
            />
          </motion.div>

          {/* Soft overlay for legibility */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(247,244,233,.92) 0%, rgba(247,244,233,.82) 35%, rgba(247,244,233,.12) 75%, rgba(247,244,233,.05) 100%)",
              pointerEvents: "none",
            }}
          />

          <Container
            maxWidth="xl"
            sx={{
              position: "relative",
              height: "100%",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "0.9fr 1.1fr",
                alignItems: "center",
                gap: 7,
              }}
            >
              {/* Stage copy */}
              <Stack spacing={3} sx={{ maxWidth: 540 }}>
                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: "0.7rem",
                    letterSpacing: "0.16em",
                    color: "#83834B",
                    fontWeight: 600,
                  }}
                >
                  THE SOEA CHAMPIONS JOURNEY
                </Typography>

                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  {scenes.map((scene, index) => (
                    <Box
                      key={scene.number}
                      sx={{
                        height: 3,
                        flex: 1,
                        backgroundColor:
                          index <= activeScene ? "#83834B" : "#D6D1BE",
                        transition: "background-color 300ms ease",
                      }}
                    />
                  ))}
                </Stack>

                <Box sx={{ minHeight: 280 }}>
                  <motion.div
                    key={active.number}
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, y: 18 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Space Mono", monospace',
                        color: "#83834B",
                        fontSize: "0.75rem",
                        letterSpacing: "0.12em",
                        mb: 2,
                      }}
                    >
                      STAGE {active.number} / 06
                    </Typography>

                    <Typography
                      component="h2"
                      sx={{
                        fontFamily: '"Cormorant Garamond", serif',
                        fontSize: {
                          md: "3.8rem",
                          lg: "4.8rem",
                        },
                        lineHeight: 0.98,
                        letterSpacing: "-0.025em",
                        color: "#1A1A1A",
                        mb: 2.5,
                      }}
                    >
                      {active.title}
                    </Typography>

                    <Typography
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: "#504624",
                        mb: 1.5,
                      }}
                    >
                      {active.caption}
                    </Typography>

                    <Typography
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        color: "#5F5F55",
                        lineHeight: 1.9,
                        fontSize: "0.98rem",
                        maxWidth: 480,
                      }}
                    >
                      {active.description}
                    </Typography>
                  </motion.div>
                </Box>

                <Stack direction="row" spacing={1.5}>
                  <ButtonBase
                    onClick={() => goToScene(Math.max(0, activeScene - 1))}
                    disabled={activeScene === 0}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      border: "1px solid #83834B",
                      color: "#504624",
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: "0.8rem",
                      "&:disabled": { opacity: 0.35 },
                    }}
                  >
                    ← Previous
                  </ButtonBase>

                  <ButtonBase
                    onClick={() =>
                      goToScene(
                        Math.min(scenes.length - 1, activeScene + 1)
                      )
                    }
                    disabled={activeScene === scenes.length - 1}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      backgroundColor: "#83834B",
                      color: "#FFFFFF",
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: "0.8rem",
                      "&:hover": { backgroundColor: "#6F703E" },
                      "&:disabled": { opacity: 0.35 },
                    }}
                  >
                    Next stage →
                  </ButtonBase>
                </Stack>

                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    color: "#85836F",
                    fontSize: "0.63rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  SCROLL TO EXPLORE THE JOURNEY
                </Typography>
              </Stack>

              {/* Scene illustration */}
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 680,
                  justifySelf: "end",
                }}
              >
                <motion.div
                  key={active.image}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, scale: 0.96, y: 16 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "900 / 650",
                      overflow: "hidden",
                      boxShadow: "0 24px 70px rgba(70, 61, 39, 0.14)",
                      border: "10px solid rgba(255,255,255,.7)",
                    }}
                  >
                    <Image
                      src={active.image}
                      alt={active.alt}
                      fill
                      sizes="(max-width: 1200px) 50vw, 680px"
                      style={{ objectFit: "cover", objectPosition: active.imagePosition ?? "center" }}
                      priority
                    />
                  </Box>
                </motion.div>

                <Box
                  sx={{
                    position: "absolute",
                    right: -12,
                    bottom: -22,
                    backgroundColor: "#83834B",
                    color: "#FFFFFF",
                    px: 3,
                    py: 1.5,
                    boxShadow: "0 8px 24px rgba(40,40,25,.12)",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Space Mono", monospace',
                      fontSize: "0.68rem",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {active.number} — 06
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Container>

          {/* Bottom journey progress */}
          <Box
            sx={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: "100%",
              height: 5,
              backgroundColor: "rgba(131,131,75,.16)",
              zIndex: 4,
            }}
          >
            <motion.div
              style={{
                width: roadProgress,
                height: "100%",
                backgroundColor: "#83834B",
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* MOBILE: accessible vertical journey */}
      <Box
        component="section"
        sx={{
          display: { xs: "block", md: "none" },
          backgroundColor: "#F5F5EF",
          py: 9,
        }}
      >
        <Container maxWidth="sm">
          <Stack spacing={2} sx={{ mb: 6 }}>
            <Typography
              sx={{
                fontFamily: '"Space Mono", monospace',
                color: "#83834B",
                fontSize: "0.68rem",
                letterSpacing: "0.13em",
              }}
            >
              THE SOEA CHAMPIONS JOURNEY
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: "3rem",
                lineHeight: 1,
                color: "#1A1A1A",
              }}
            >
              From knowledge to{" "}
              <Box component="span" sx={{ color: "#83834B", fontStyle: "italic" }}>
                lasting change.
              </Box>
            </Typography>

            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                color: "#5F5F55",
                lineHeight: 1.8,
              }}
            >
              Explore how we work alongside communities through six connected
              stages.
            </Typography>
          </Stack>

          <Stack spacing={5}>
            {scenes.map((scene) => (
              <Box
                key={scene.number}
                sx={{
                  position: "relative",
                  pl: 3,
                  borderLeft: "2px solid #D6D1BE",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    left: -14,
                    top: 0,
                    width: 25,
                    height: 25,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: "#83834B",
                    color: "#FFFFFF",
                    fontFamily: '"Space Mono", monospace',
                    fontSize: "0.58rem",
                  }}
                >
                  {scene.number}
                </Box>

                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "900 / 650",
                    mb: 2,
                    overflow: "hidden",
                    border: "5px solid #FFFFFF",
                    boxShadow: "0 10px 30px rgba(70,61,39,.09)",
                  }}
                >
                  <Image
                    src={scene.image}
                    alt={scene.alt}
                    fill
                    sizes="(max-width: 600px) 90vw, 500px"
                    style={{ objectFit: "cover", objectPosition: scene.imagePosition ?? "center" }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    color: "#83834B",
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    mb: 1,
                  }}
                >
                  STAGE {scene.number}
                </Typography>

                <Typography
                  component="h3"
                  sx={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: "2rem",
                    lineHeight: 1.05,
                    color: "#1A1A1A",
                    mb: 1,
                  }}
                >
                  {scene.title}
                </Typography>

                <Typography
                  sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 600,
                    color: "#504624",
                    fontSize: "0.9rem",
                    mb: 1,
                  }}
                >
                  {scene.caption}
                </Typography>

                <Typography
                  sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    color: "#5F5F55",
                    fontSize: "0.9rem",
                    lineHeight: 1.8,
                  }}
                >
                  {scene.description}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>
    </>
  );
}
