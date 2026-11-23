import Link from "next/link";
import { Box, Container, Stack, Typography } from "@mui/material";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import StoryTimeline from "@/components/people/StoryTimeline";
import { FocusCounty, SETTING_LABELS, focusCounties } from "@/data/counties";
import type { Story } from "@/data/stories";
import { COUNTY_MAP, CountyPageGeo, LOCATOR } from "@/lib/geo/countyMaps";

const INK = "#1A1A1A";
const MUTED = "#5F5F55";

/** County colour, its lighter tint, and whether text on it should be dark. */
export function countyPalette(county: FocusCounty) {
  if (county.status === "active") return { main: "#504624", tint: "#8C7F55", soft: "#EDE8DA", darkText: false };
  if (county.setting === "coastal") return { main: "#D9AF3F", tint: "#EFD58A", soft: "#FBF3DC", darkText: true };
  return { main: "#83834B", tint: "#B4B37A", soft: "#F0F0E2", darkText: false };
}

const STATUS_LABELS = { active: "Current activity", focus: "County of focus" } as const;

function Eyebrow({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <Typography sx={{ fontFamily: '"Space Mono", monospace', fontSize: "0.68rem", letterSpacing: "0.13em", textTransform: "uppercase", color }}>
      {children}
    </Typography>
  );
}

/** The county, large, with its neighbours around it. Static SVG rendered on the server. */
function CountyMap({ county, geo }: { county: FocusCounty; geo: CountyPageGeo }) {
  const palette = countyPalette(county);
  const neighbours = new Set(geo.neighbours.map((n) => n.slug));
  const focus = geo.map.shapes.find((s) => s.slug === geo.slug)!;
  const id = `county-${geo.slug}`;
  const inView = ([x, y]: [number, number]) => x > 40 && y > 20 && x < COUNTY_MAP.width - 40 && y < COUNTY_MAP.height - 20;
  // Keep the county name clear of the Nairobi marker label when they would collide.
  const marker = geo.map.nairobi;
  const nameY =
    marker && Math.abs(marker[0] - focus.label[0]) < 160 && Math.abs(marker[1] - focus.label[1]) < 50
      ? marker[1] + 60
      : focus.label[1];

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${COUNTY_MAP.width} ${COUNTY_MAP.height}`}
      role="img"
      aria-label={`Map of ${county.name} County and the counties around it: ${geo.neighbours.map((n) => n.name).join(", ")}.`}
      sx={{
        display: "block",
        width: "100%",
        height: "auto",
        bgcolor: "#F7F4EA",
        "& .county-outline": { strokeDasharray: 1, strokeDashoffset: 1, animation: "county-draw 2.2s ease-out 0.2s forwards" },
        "& .county-fill": { opacity: 0, animation: "county-fill 900ms ease-out 1.2s forwards" },
        "@keyframes county-draw": { to: { strokeDashoffset: 0 } },
        // The SVG scales down on phones; enlarge its text so it stays readable (~14px).
        "& .neighbour-label, & .marker-label": { fontSize: "15px" },
        "& .county-name": { fontSize: "30px" },
        "@media (max-width: 600px)": {
          "& .neighbour-label": { fontSize: "30px" },
          "& .marker-label": { fontSize: "30px" },
          "& .county-name": { fontSize: "56px" },
        },
        "@keyframes county-fill": { to: { opacity: 1 } },
        "@media (prefers-reduced-motion: reduce)": {
          "& .county-outline": { animation: "none", strokeDashoffset: 0 },
          "& .county-fill": { animation: "none", opacity: 1 },
        },
      }}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.tint} />
          <stop offset="100%" stopColor={palette.main} />
        </linearGradient>
        <pattern id={`${id}-hatch`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="3" />
        </pattern>
      </defs>

      {/* Every county, so the neighbours frame the focus county */}
      {geo.map.shapes.map((shape) => (
        <path
          key={shape.slug}
          d={shape.d}
          fill={neighbours.has(shape.slug) ? "#E9E3CF" : "#F1ECDC"}
          stroke="#FFFFFF"
          strokeWidth={1.5}
        />
      ))}

      {/* The county: gradient, texture, then an outline that draws itself */}
      <g className="county-fill">
        <path d={focus.d} fill={`url(#${id}-fill)`} />
        <path d={focus.d} fill={`url(#${id}-hatch)`} />
      </g>
      <path className="county-outline" d={focus.d} pathLength={1} fill="none" stroke={palette.main} strokeWidth={3} strokeLinejoin="round" />

      {/* Neighbour names */}
      {geo.map.shapes
        .filter((s) => neighbours.has(s.slug) && s.visibleArea > 2500 && inView(s.label))
        // The Nairobi marker already names its spot; skip neighbour labels on top of it.
        .filter((s) => !marker || Math.hypot(s.label[0] - marker[0], s.label[1] - marker[1]) > 170)
        .map((s) => (
          <text
            key={`label-${s.slug}`}
            x={s.label[0]}
            y={s.label[1]}
            textAnchor="middle"
            dominantBaseline="middle"
            className="neighbour-label"
            style={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600, fill: "#77745F", paintOrder: "stroke", stroke: "#F7F4EA", strokeWidth: 4 }}
          >
            {s.name}
          </text>
        ))}

      {/* SOEA's base, where it falls inside the frame */}
      {geo.map.nairobi && (
        <g aria-hidden>
          <circle cx={geo.map.nairobi[0]} cy={geo.map.nairobi[1]} r={9} fill="#B3412E" stroke="#FFFFFF" strokeWidth={3} />
          <text
            x={geo.map.nairobi[0] + 14}
            y={geo.map.nairobi[1] + 5}
            className="marker-label"
            style={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fill: "#B3412E", paintOrder: "stroke", stroke: "#FFFFFF", strokeWidth: 4 }}
          >
            Nairobi · SOEA
          </text>
        </g>
      )}

      {/* County name */}
      <text
        x={focus.label[0]}
        y={nameY}
        textAnchor="middle"
        dominantBaseline="middle"
        className="county-name"
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 600,
          fill: palette.darkText ? INK : "#FFFFFF",
          paintOrder: "stroke",
          stroke: palette.darkText ? "#FFFFFF99" : "#00000033",
          strokeWidth: 3,
        }}
      >
        {county.name}
      </text>

      {/* Compass */}
      <g transform={`translate(${COUNTY_MAP.width - 44}, 48)`} aria-hidden>
        <path d="M0,-22 L7,6 L0,1 L-7,6 Z" fill={palette.main} />
        <text y={24} textAnchor="middle" style={{ font: '700 13px "Space Mono", monospace', fill: MUTED }}>
          N
        </text>
      </g>
    </Box>
  );
}

function KenyaLocator({ county, geo }: { county: FocusCounty; geo: CountyPageGeo }) {
  const palette = countyPalette(county);
  return (
    <svg viewBox={`0 0 ${LOCATOR.width} ${LOCATOR.height}`} width="100%" role="img" aria-label={`${county.name} County's location in Kenya`} style={{ display: "block", maxWidth: 220 }}>
      {geo.locator.shapes.map((shape) => (
        <path
          key={shape.slug}
          d={shape.d}
          fill={shape.slug === geo.slug ? palette.main : "#E6E1CD"}
          stroke="#FFFFFF"
          strokeWidth={0.6}
        />
      ))}
    </svg>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ bgcolor: "#FFFFFF", border: "1px solid #E5E5DD", p: 2.5, height: "100%" }}>
      <Eyebrow color="#83834B">{label}</Eyebrow>
      <Box sx={{ mt: 1, color: INK, lineHeight: 1.6 }}>{children}</Box>
    </Box>
  );
}

export default function CountyDetail({
  county,
  geo,
  stories,
}: {
  county: FocusCounty;
  geo: CountyPageGeo;
  stories: Story[];
}) {
  const palette = countyPalette(county);
  const heroText = palette.darkText ? INK : "#FFFFFF";
  const focusSlugs = new Set(focusCounties.map((c) => c.slug));
  const others = focusCounties.filter((c) => c.slug !== county.slug);

  return (
    <>
      {/* Hero */}
      <Box
        component="section"
        sx={{
          background: `linear-gradient(120deg, ${palette.main} 0%, ${palette.tint} 100%)`,
          color: heroText,
          pt: { xs: 12, md: 16 },
          pb: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="xl">
          <Box component="a" href="/where-we-work#where-soea-works" sx={{ color: heroText, opacity: 0.85, fontSize: 14, textDecoration: "none" }}>
            ← Where we work
          </Box>
          <Box sx={{ mt: 3 }}>
            <Eyebrow color={heroText}>
              {STATUS_LABELS[county.status]} · {SETTING_LABELS[county.setting]}
            </Eyebrow>
          </Box>
          <Typography
            component="h1"
            sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: { xs: 52, md: 88 }, lineHeight: 0.98, fontWeight: 500, mt: 2 }}
          >
            {county.name} County
          </Typography>
          <Typography sx={{ fontSize: { xs: 17, md: 20 }, mt: 2, maxWidth: 720, fontWeight: 600 }}>{county.headline}</Typography>
        </Container>
      </Box>

      {/* Map and locator */}
      <Box component="section" sx={{ py: { xs: 6, md: 9 }, bgcolor: palette.soft }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 300px" }, gap: 3, alignItems: "start" }}>
            <Box sx={{ border: "1px solid #E5E5DD", bgcolor: "#FFFFFF" }}>
              <CountyMap county={county} geo={geo} />
            </Box>
            <Stack spacing={3}>
              <Box sx={{ bgcolor: "#FFFFFF", border: "1px solid #E5E5DD", p: 2.5 }}>
                <Eyebrow color="#83834B">Where it is in Kenya</Eyebrow>
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <KenyaLocator county={county} geo={geo} />
                </Box>
              </Box>
              <Typography sx={{ fontSize: "0.72rem", color: MUTED, lineHeight: 1.6 }}>
                Boundaries from geoBoundaries (RCMRD source, public domain), simplified for the web. Areas are
                approximate, calculated from these boundaries.
              </Typography>
            </Stack>
          </Box>

          {/* Facts derived from the boundary data */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2, mt: 3 }}>
            <Fact label="Setting">{SETTING_LABELS[county.setting]}</Fact>
            <Fact label="Approximate area">about {geo.areaKm2.toLocaleString("en-GB")} km²</Fact>
            <Fact label="Borders">
              {geo.neighbours.map((n, i) => (
                <span key={n.slug}>
                  {i > 0 && ", "}
                  {focusSlugs.has(n.slug) ? (
                    <Link href={`/where-we-work/${n.slug}`} style={{ color: "#504624", fontWeight: 700 }}>
                      {n.name}
                    </Link>
                  ) : (
                    n.name
                  )}
                </span>
              ))}
            </Fact>
            <Fact label="SOEA status">{STATUS_LABELS[county.status]}</Fact>
          </Box>
        </Container>
      </Box>

      {/* What's happening */}
      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 4, md: 8 } }}>
            <Box>
              <Eyebrow color="#83834B">What&rsquo;s happening</Eyebrow>
              <Typography component="h2" sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: { xs: 36, md: 48 }, lineHeight: 1.05, color: INK, mt: 1.5 }}>
                SOEA in {county.name}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ color: MUTED, lineHeight: 1.9, fontSize: "1.05rem" }}>{county.description}</Typography>
              {county.links && (
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2.5, mt: 3 }}>
                  {county.links.map((link) => (
                    <Box
                      key={link.href}
                      component="a"
                      href={link.href}
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, color: "#504624", fontWeight: 700, textDecoration: "none" }}
                    >
                      {link.label}
                      <ArrowOutwardRounded sx={{ fontSize: 16 }} />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Stories from this county */}
      <Box component="section" sx={{ py: { xs: 7, md: 10 }, bgcolor: "#F5F5EF" }}>
        <Container maxWidth="lg">
          <Eyebrow color="#83834B">Stories &amp; events</Eyebrow>
          <Typography component="h2" sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: { xs: 36, md: 48 }, lineHeight: 1.05, color: INK, mt: 1.5, mb: 5 }}>
            From {county.name}
          </Typography>
          {stories.length > 0 ? (
            <StoryTimeline stories={stories} />
          ) : (
            <Box sx={{ bgcolor: "#FFFFFF", border: `2px dashed ${palette.main}`, p: { xs: 3, md: 5 }, maxWidth: 760 }}>
              <Typography sx={{ fontWeight: 700, color: INK }}>No stories from {county.name} yet.</Typography>
              <Typography sx={{ color: MUTED, lineHeight: 1.8, mt: 1 }}>
                As SOEA&rsquo;s work develops here, stories, events and partners will appear on this page. If your
                organization works in {county.name}, we would like to hear from you.
              </Typography>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2.5, mt: 2.5 }}>
                <Link href="/partner-with-us" style={{ color: "#504624", fontWeight: 700 }}>
                  Partner with us →
                </Link>
                <Link href="/stay-connected" style={{ color: "#504624", fontWeight: 700 }}>
                  Get updates →
                </Link>
              </Stack>
            </Box>
          )}
        </Container>
      </Box>

      {/* Other counties */}
      <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Eyebrow color="#83834B">Our other counties of focus</Eyebrow>
          <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 2.5, p: 0, display: "flex", flexWrap: "wrap", gap: 1.25 }}>
            {others.map((c) => {
              const p = countyPalette(c);
              return (
                <li key={c.slug}>
                  <Box
                    component="a"
                    href={`/where-we-work/${c.slug}`}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2,
                      py: 1,
                      border: `1px solid ${p.main}`,
                      color: INK,
                      textDecoration: "none",
                      fontWeight: 600,
                      "&:hover": { bgcolor: p.soft },
                    }}
                  >
                    <Box component="span" sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: p.main }} />
                    {c.name}
                  </Box>
                </li>
              );
            })}
          </Box>
          <Box sx={{ mt: 4 }}>
            <Link href={`/where-we-work?map=counties&county=${county.slug}#where-soea-works`} style={{ color: "#504624", fontWeight: 700 }}>
              See {county.name} on the Kenya map →
            </Link>
          </Box>
        </Container>
      </Box>
    </>
  );
}
