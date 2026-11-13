import {
  Box,
  Container,
  Stack,
  Typography,
} from "@mui/material";

const pathway = [
  {
    number: "01",
    title: "Community Engagement",
    description: "Building relationships, listening and establishing trust.",
  },
  {
    number: "02",
    title: "Baseline",
    description: "Understanding needs, skills, challenges and opportunities.",
  },
  {
    number: "03",
    title: "Curriculum",
    description: "Developing relevant learning and training pathways.",
  },
  {
    number: "04",
    title: "Training",
    description: "Building practical knowledge, confidence and capabilities.",
  },
  {
    number: "05",
    title: "Practical Application",
    description: "Putting new knowledge and skills into practice.",
  },
  {
    number: "06",
    title: "Opportunity",
    description: "Connecting people to markets, livelihoods and partnerships.",
  },
  {
    number: "07",
    title: "Follow-Up",
    description: "Tracking progress, documenting learning and assessing outcomes.",
  },
];

const outcomes = [
  "Skills",
  "Safer Livelihoods",
  "Income Opportunities",
  "Community Leadership",
  "Climate Resilience",
];

export default function ChampionsPathway() {
  return (
    <Box
      component="section"
      sx={{
        backgroundColor: "#F5F5EF",
        py: { xs: 9, md: 14 },
        overflow: "hidden",
      }}
    >
      <Container maxWidth="xl">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "flex-end" },
            mb: { xs: 7, md: 10 },
          }}
        >
          <Box sx={{ maxWidth: 690 }}>
            <Typography
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                color: "#83834B",
                fontWeight: 600,
                mb: 2,
              }}
            >
              FROM PARTICIPANT TO CHAMPION
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: "2.8rem", md: "4.1rem" },
                lineHeight: 1.02,
                color: "#1A1A1A",
              }}
            >
              The SOEA{" "}
              <Box
                component="span"
                sx={{ color: "#83834B", fontStyle: "italic" }}
              >
                Champions Pathway.
              </Box>
            </Typography>
          </Box>

          <Typography
            sx={{
              maxWidth: 390,
              fontFamily: '"DM Sans", sans-serif',
              color: "#5F5F55",
              fontSize: "0.96rem",
              lineHeight: 1.85,
            }}
          >
            A structured journey that helps people translate community
            knowledge and learning into practical action and opportunity.
          </Typography>
        </Stack>

        {/* Pathway milestones */}
        <Box
          sx={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(7, minmax(0, 1fr))",
            },
            columnGap: { xs: 0, lg: 2 },
            rowGap: { xs: 0, sm: 3, lg: 0 },
            "&::before": {
              content: '""',
              position: "absolute",
              display: { xs: "block", lg: "block" },
              left: { xs: "21px", lg: "3.5%" },
              right: { xs: "auto", lg: "3.5%" },
              top: { xs: "22px", lg: "23px" },
              bottom: { xs: "22px", lg: "auto" },
              width: { xs: "1px", lg: "auto" },
              height: { xs: "auto", lg: "1px" },
              backgroundColor: "#CFCFBD",
            },
          }}
        >
          {pathway.map((stage, index) => (
            <Box
              key={stage.number}
              sx={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: { xs: "44px 1fr", lg: "1fr" },
                columnGap: 2,
                alignContent: "start",
                pb: { xs: 4, lg: 0 },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: index === 6 ? "#83834B" : "#F5F5EF",
                  border: "1px solid",
                  borderColor: "#83834B",
                  color: index === 6 ? "#FFFFFF" : "#83834B",
                  fontFamily: '"Space Mono", monospace',
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
              >
                {stage.number}
              </Box>

              <Box sx={{ pt: { xs: 0.5, lg: 3 }, pr: { lg: 1 } }}>
                <Typography
                  sx={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: { xs: "1.55rem", lg: "1.45rem" },
                    lineHeight: 1.1,
                    fontWeight: 600,
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
                    lineHeight: 1.75,
                    color: "#68685E",
                    maxWidth: { xs: 420, lg: "none" },
                  }}
                >
                  {stage.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Intended outcomes */}
        <Box
          sx={{
            mt: { xs: 5, md: 9 },
            pt: 4,
            borderTop: "1px solid #DCDCCF",
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Space Mono", monospace',
              fontSize: "0.67rem",
              letterSpacing: "0.13em",
              color: "#83834B",
              mb: 3,
            }}
          >
            THE INTENDED OUTCOMES
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: { xs: 1.5, md: 2 },
            }}
          >
            {outcomes.map((outcome, index) => (
              <Box
                key={outcome}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: { xs: 2, md: 2.5 },
                  py: 1.5,
                  border: "1px solid #DCDCCF",
                  backgroundColor: "rgba(255,255,255,0.55)",
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#83834B",
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: "#504624",
                  }}
                >
                  {outcome}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
