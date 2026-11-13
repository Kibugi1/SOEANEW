import {
  Box,
  Container,
  Typography,
} from "@mui/material";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import { focusAreas } from "@/data/focusAreas";

export default function ThematicAreas() {
  return (
    <Box
      component="section"
      sx={{ py: { xs: 9, md: 13 }, bgcolor: "#F7F7F2" }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "flex-end" },
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
            mb: { xs: 5, md: 7 },
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "#83834B",
                fontFamily: "Space Mono, monospace",
                fontSize: "0.68rem",
                letterSpacing: "0.13em",
                mb: 2,
              }}
            >
              WHERE WE WORK
            </Typography>
            <Typography
              component="h2"
              sx={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: { xs: "2.8rem", md: "4.2rem" },
                lineHeight: 1,
                color: "#1A1A1A",
                maxWidth: 650,
              }}
            >
              Six themes. Interconnected challenges.
            </Typography>
          </Box>

          <Typography
            sx={{
              maxWidth: 390,
              color: "#5F5F55",
              lineHeight: 1.8,
              fontSize: "0.95rem",
            }}
          >
            Explore the areas through which we work with communities,
            practitioners and partners.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {focusAreas.map((area) => (
            <Box
              key={area.slug}
              component="a"
              href={`/our-focus/${area.slug}`}
              sx={{
                display: "block",
                color: "inherit",
                textDecoration: "none",
                bgcolor: "#FFFFFF",
                border: "1px solid #E5E5DD",
                overflow: "hidden",
                transition: "transform 0.35s ease, box-shadow 0.35s ease",
                "&:hover": {
                  transform: "translateY(-7px)",
                  boxShadow: "0 18px 45px rgba(30,30,20,0.10)",
                  "& .focus-image": {
                    transform: "scale(1.045)",
                  },
                  "& .focus-arrow": {
                    color: "#D9AF3F",
                    transform: "translate(3px, -3px)",
                  },
                },
                "&:focus-visible": {
                  outline: "3px solid #BA9327",
                  outlineOffset: "3px",
                },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  height: { xs: 230, md: 260 },
                  overflow: "hidden",
                  bgcolor: "#E5E5DD",
                }}
              >
                <Box
                  className="focus-image"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url("${area.image}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: "transform 0.7s ease",
                  }}
                />
                <Typography
                  sx={{
                    position: "absolute",
                    top: 18,
                    left: 18,
                    bgcolor: "#FFFFFF",
                    color: "#504624",
                    px: 1.5,
                    py: 0.8,
                    fontFamily: "Space Mono, monospace",
                    fontSize: "0.68rem",
                  }}
                >
                  {area.number}
                </Typography>
              </Box>

              <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Typography
                    component="h3"
                    sx={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: { xs: "1.75rem", md: "2rem" },
                      lineHeight: 1.08,
                      fontWeight: 600,
                      color: "#1A1A1A",
                    }}
                  >
                    {area.title}
                  </Typography>

                  <ArrowOutwardRoundedIcon
                    className="focus-arrow"
                    sx={{
                      flexShrink: 0,
                      color: "#83834B",
                      transition: "transform 0.3s ease, color 0.3s ease",
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    mt: 2,
                    color: "#83834B",
                    fontFamily: "Space Mono, monospace",
                    fontSize: "0.64rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Explore focus area
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
