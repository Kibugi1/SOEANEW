"use client";

import { useState } from "react";
import {
  Box,
  ButtonBase,
  Container,
  Stack,
  Typography,
} from "@mui/material";

const stages = [
  {
    number: "01",
    title: "Understand the Challenge",
    description:
      "We listen to communities, conduct assessments and document local experiences.",
    detail:
      "We begin by listening. Through community conversations, observation and assessments, we seek to understand the environmental challenges people face and how these affect their daily lives and livelihoods.",
    label: "Listen and understand",
  },
  {
    number: "02",
    title: "Assess Together",
    description:
      "We identify needs, existing skills, opportunities, barriers and possible solutions.",
    detail:
      "Communities are active contributors to the assessment process. Together, we identify existing knowledge and skills, understand barriers, and explore opportunities that can inform practical interventions.",
    label: "Identify priorities",
  },
  {
    number: "03",
    title: "Co-Design",
    description:
      "Communities, technical experts and partners develop practical solutions and learning pathways.",
    detail:
      "We bring community knowledge together with technical expertise and partner experience to shape solutions that are relevant, achievable and responsive to local realities.",
    label: "Develop solutions",
  },
  {
    number: "04",
    title: "Build Capabilities",
    description:
      "We connect participants to training, mentorship, technical skills, legal awareness, financial literacy and occupational health and safety.",
    detail:
      "We support people to develop the knowledge, confidence and practical skills they need. Learning may include technical training, mentorship, legal awareness, financial literacy and occupational health and safety.",
    label: "Develop practical skills",
  },
  {
    number: "05",
    title: "Connect to Opportunity",
    description:
      "We facilitate access to practical experience, markets, financial services, enterprise pathways and partnerships.",
    detail:
      "Skills become more valuable when they connect to opportunity. We work to strengthen pathways to practical experience, markets, financial services, enterprise development and relevant partnerships.",
    label: "Open opportunities",
  },
  {
    number: "06",
    title: "Follow Through",
    description:
      "We track progress, document learning and assess outcomes, including through three-month and six-month follow-up where applicable.",
    detail:
      "Our work does not end when training is complete. We document progress, learn from implementation and assess outcomes. Follow-up may take place at three and six months, where applicable.",
    label: "Measure and learn",
  },
];

export default function SixStageMethodology() {
  const [activeStage, setActiveStage] = useState(0);
  const active = stages[activeStage];

  return (
    <Box
      component="section"
      id="methodology"
      sx={{
        backgroundColor: "#FFFFFF",
        py: { xs: 9, md: 14 },
        scrollMarginTop: "90px",
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={2} sx={{ maxWidth: 720, mb: { xs: 6, md: 9 } }}>
          <Typography
            sx={{
              fontFamily: '"Space Mono", monospace',
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              color: "#83834B",
              fontWeight: 600,
            }}
          >
            OUR METHODOLOGY / 01—06
          </Typography>

          <Typography
            component="h2"
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: { xs: "2.8rem", md: "4rem" },
              lineHeight: 1.05,
              color: "#1A1A1A",
            }}
          >
            Six stages. <Box component="span" sx={{ color: "#83834B", fontStyle: "italic" }}>One shared journey.</Box>
          </Typography>

          <Typography
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              color: "#5F5F55",
              lineHeight: 1.8,
              fontSize: { xs: "0.98rem", md: "1.05rem" },
            }}
          >
            Our approach moves from understanding community realities to
            developing capabilities, connecting people to opportunities and
            learning from the outcomes.
          </Typography>
        </Stack>

        {/* Six connected stages */}
        <Box
          sx={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(6, minmax(0, 1fr))",
            },
            columnGap: { xs: 2, md: 2.5 },
            rowGap: { xs: 3, md: 4 },
            "&::before": {
              content: '""',
              display: { xs: "none", lg: "block" },
              position: "absolute",
              top: "22px",
              left: "7.5%",
              right: "7.5%",
              height: "1px",
              backgroundColor: "#DCDCCF",
            },
          }}
        >
          {stages.map((stage, index) => {
            const isActive = activeStage === index;

            return (
              <ButtonBase
                key={stage.number}
                onClick={() => setActiveStage(index)}
                aria-pressed={isActive}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                  width: "100%",
                  position: "relative",
                  zIndex: 1,
                  p: { xs: 2, md: 2.2 },
                  minHeight: { xs: 190, md: 220 },
                  border: "1px solid",
                  borderColor: isActive ? "#83834B" : "#E5E5DD",
                  backgroundColor: isActive ? "#F5F5EF" : "#FFFFFF",
                  transition: "all 220ms ease",
                  "&:hover": {
                    borderColor: "#83834B",
                    backgroundColor: "#F8F8F3",
                  },
                  "&:focus-visible": {
                    outline: "2px solid #83834B",
                    outlineOffset: 3,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    backgroundColor: isActive ? "#83834B" : "#FFFFFF",
                    border: "1px solid",
                    borderColor: isActive ? "#83834B" : "#DCDCCF",
                    color: isActive ? "#FFFFFF" : "#83834B",
                    fontFamily: '"Space Mono", monospace',
                    fontSize: "0.76rem",
                    mb: 2.5,
                    transition: "all 220ms ease",
                  }}
                >
                  {stage.number}
                </Box>

                <Typography
                  sx={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: { xs: "1.35rem", md: "1.55rem" },
                    fontWeight: 600,
                    lineHeight: 1.12,
                    color: "#1A1A1A",
                    mb: 1.2,
                  }}
                >
                  {stage.title}
                </Typography>

                <Typography
                  sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: "0.78rem",
                    lineHeight: 1.65,
                    color: "#68685E",
                  }}
                >
                  {stage.description}
                </Typography>

                <Typography
                  sx={{
                    mt: "auto",
                    pt: 2,
                    fontFamily: '"Space Mono", monospace',
                    fontSize: "0.59rem",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isActive ? "#83834B" : "#929285",
                  }}
                >
                  {isActive ? "Currently exploring" : "Explore stage"}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>

        {/* Selected stage detail */}
        <Box
          aria-live="polite"
          sx={{
            mt: { xs: 4, md: 5 },
            p: { xs: 3, md: 5 },
            backgroundColor: "#F5F5EF",
            borderLeft: "3px solid #83834B",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "0.35fr 1fr" },
            gap: { xs: 2, md: 6 },
          }}
        >
          <Stack spacing={1}>
            <Typography
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: "0.68rem",
                color: "#83834B",
                letterSpacing: "0.12em",
              }}
            >
              STAGE {active.number} / 06
            </Typography>

            <Typography
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: "1.9rem", md: "2.3rem" },
                lineHeight: 1.1,
                color: "#1A1A1A",
              }}
            >
              {active.label}
            </Typography>
          </Stack>

          <Typography
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: "0.94rem", md: "1.02rem" },
              lineHeight: 1.9,
              color: "#5F5F55",
              maxWidth: 760,
            }}
          >
            {active.detail}
          </Typography>
        </Box>

        {/* Stage navigation */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mt: 3,
          }}
        >

          <Stack direction="row" spacing={1}>
            <ButtonBase
              onClick={() =>
                setActiveStage((current) => Math.max(0, current - 1))
              }
              disabled={activeStage === 0}
              sx={{
                px: 2,
                py: 1,
                border: "1px solid #DCDCCF",
                color: "#504624",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "0.8rem",
                "&:disabled": { opacity: 0.35 },
              }}
            >
              Previous
            </ButtonBase>

            <ButtonBase
              onClick={() =>
                setActiveStage((current) =>
                  Math.min(stages.length - 1, current + 1)
                )
              }
              disabled={activeStage === stages.length - 1}
              sx={{
                px: 2,
                py: 1,
                border: "1px solid #83834B",
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
        </Stack>
      </Container>
    </Box>
  );
}
