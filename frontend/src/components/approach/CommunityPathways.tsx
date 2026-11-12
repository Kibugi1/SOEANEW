import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

const pathways = [
  { number: "01", title: "Waste Pickers" },
  { number: "02", title: "Smallholder Farmers" },
  { number: "03", title: "Pastoralists" },
  { number: "04", title: "Coastal Communities" },
  { number: "05", title: "Energy Practitioners" },
];

export default function CommunityPathways() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 10, md: 16 },
        backgroundColor: "#F5F5EF",
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={2} sx={{ maxWidth: 760, mb: 7 }}>
          <Typography
            sx={{
              fontFamily: '"Space Mono", monospace',
              fontSize: "0.7rem",
              letterSpacing: "0.14em",
              color: "#83834B",
              textTransform: "uppercase",
            }}
          >
            A shared methodology
          </Typography>

          <Typography
            component="h2"
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: { xs: "2.8rem", md: "4.5rem" },
              lineHeight: 1,
              color: "#1A1A1A",
            }}
          >
            One Methodology.
            <br />
            Different Community Pathways.
          </Typography>

          <Typography
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: "1rem",
              lineHeight: 1.9,
              color: "#5F5F55",
              maxWidth: 650,
            }}
          >
            SOEA applies a consistent, community-led methodology while
            adapting its pathways to the contexts and experiences of
            different communities and practitioners.
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          {pathways.map((pathway) => (
            <Grid key={pathway.number} size={{ xs: 12, sm: 6, md: 4 }}>
              <Box
                sx={{
                  minHeight: 190,
                  p: { xs: 3, md: 4 },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E5DD",
                  transition: "transform 250ms ease, box-shadow 250ms ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 16px 35px rgba(70,61,39,0.09)",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: "0.7rem",
                    color: "#A8A658",
                    letterSpacing: "0.12em",
                  }}
                >
                  PATHWAY / {pathway.number}
                </Typography>

                <Typography
                  component="h3"
                  sx={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: { xs: "2rem", md: "2.4rem" },
                    lineHeight: 1.1,
                    color: "#504624",
                  }}
                >
                  {pathway.title}
                </Typography>

                <Box
                  sx={{
                    width: 42,
                    height: 3,
                    backgroundColor: "#D9AF3F",
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mt: 7 }}
        >
          <Button
            component="a"
            href="/programs/ceci"
            variant="contained"
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 0,
              backgroundColor: "#83834B",
              color: "#FFFFFF",
              "&:hover": { backgroundColor: "#6F703E" },
            }}
          >
            Explore CECI
          </Button>

          <Button
            component="a"
            href="/our-focus"
            variant="outlined"
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 0,
              borderColor: "#83834B",
              color: "#504624",
            }}
          >
            Explore Our Thematic Areas
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
