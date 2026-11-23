"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MotionValue, animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Box, Button, ButtonBase, Container, Stack, Typography } from "@mui/material";
import FlightTakeoffRounded from "@mui/icons-material/FlightTakeoffRounded";
import type { JourneyMapData, ViewBox } from "@/lib/geo/journeyMap";
import { FocusCounty, SETTING_LABELS } from "@/data/counties";

const COLORS = {
  sea: "#F1EFE6",
  land: "#DDDACB",
  landStroke: "#F7F6F0",
  africa: "#C9C6AE",
  /** Neighbouring countries once the map is on Kenya: quiet, so Kenya stands out. */
  neighbour: "#E6E3D6",
  kenya: "#D9AF3F",
  county: "#E9E7DB",
  /** Kenya's other counties: warm and light, so Kenya separates from its neighbours. */
  kenyaBase: "#F7F2E1",
  countyStroke: "#FFFFFF",
  active: "#504624",
  asal: "#83834B",
  coastal: "#D9AF3F",
  marker: "#B3412E",
  ink: "#1A1A1A",
  muted: "#5F5F55",
};

const STAGES = [
  {
    key: "world",
    label: "World",
    title: "A climate challenge felt everywhere",
    text: "Square One Eco Africa works where the effects of climate change meet everyday livelihoods, starting from a base in Nairobi, Kenya.",
  },
  {
    key: "africa",
    label: "Africa",
    title: "Rooted in East Africa",
    text: "All of SOEA’s current work is in Kenya, where communities, partners and evidence come together around practical climate solutions.",
  },
  {
    key: "kenya",
    label: "Kenya",
    title: "Nine counties of focus",
    text: "Our geographic focus spans urban, arid and semi-arid, and coastal settings, from Nairobi to Samburu and the coast.",
  },
  {
    key: "counties",
    label: "Counties",
    title: "Explore the counties",
    text: "Select a county on the map or in the list to see what is happening there.",
  },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

const LEGEND = [
  { color: COLORS.active, label: "Current activity: WP-LIFT underway" },
  { color: COLORS.asal, label: "County of focus: arid & semi-arid lands" },
  { color: COLORS.coastal, label: "County of focus: coastal" },
];

/** Softer versions of the county colors, shown at the Kenya stage before they "develop". */
function countyTint(county: FocusCounty | undefined) {
  if (!county) return COLORS.kenyaBase;
  if (county.status === "active") return "#9A8F6A";
  return county.setting === "coastal" ? "#EDD9A0" : "#C8C79E";
}

function countyColor(county: FocusCounty | undefined) {
  if (!county) return COLORS.county;
  if (county.status === "active") return COLORS.active;
  return county.setting === "coastal" ? COLORS.coastal : COLORS.asal;
}

/** A county name, nudged by a fixed number of screen pixels at any zoom. */
function CountyLabel({
  x,
  y,
  offset,
  unit,
  fontSize,
  strokeWidth,
  name,
}: {
  x: number;
  y: number;
  offset: [number, number];
  unit: MotionValue<number>;
  fontSize: MotionValue<number>;
  strokeWidth: MotionValue<number>;
  name: string;
}) {
  const lx = useTransform(unit, (u) => x + offset[0] * u);
  const ly = useTransform(unit, (u) => y + offset[1] * u);
  return (
    <motion.text
      x={lx}
      y={ly}
      textAnchor="middle"
      dominantBaseline="middle"
      aria-hidden
      style={{
        fontSize,
        fontFamily: '"DM Sans", sans-serif',
        fontWeight: 700,
        fill: COLORS.ink,
        paintOrder: "stroke",
        stroke: "#FFFFFFCC",
        strokeWidth,
        strokeLinejoin: "round",
        pointerEvents: "none",
      }}
    >
      {name}
    </motion.text>
  );
}

/** Interpolates a viewBox, so the camera "flies" between stages. */
function useViewBox(target: ViewBox, instant: boolean) {
  const x = useMotionValue(target[0]);
  const y = useMotionValue(target[1]);
  const w = useMotionValue(target[2]);
  const h = useMotionValue(target[3]);
  useEffect(() => {
    const options = instant
      ? { duration: 0 }
      : { duration: 1.6, ease: [0.65, 0, 0.35, 1] as [number, number, number, number] };
    const controls = [x, y, w, h].map((value, i) => animate(value, target[i], options));
    return () => controls.forEach((c) => c.stop());
  }, [target, instant, x, y, w, h]);
  const viewBox = useTransform([x, y, w, h], ([a, b, c, d]) => `${a} ${b} ${c} ${d}`);
  return { viewBox, width: w };
}

export default function GeoJourney({ map, counties }: { map: JourneyMapData; counties: FocusCounty[] }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [stage, setStage] = useState<StageKey>("world");
  const [selected, setSelected] = useState<string>("nairobi");
  const [playing, setPlaying] = useState(false);
  /** A shared link lands directly on its stage, without the fly-in. */
  const [jumped, setJumped] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const hasPlayed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stageIndex = STAGES.findIndex((s) => s.key === stage);
  const byslug = useMemo(() => new Map(counties.map((c) => [c.slug, c])), [counties]);
  const { viewBox, width } = useViewBox(map.views[stage], reduceMotion || jumped);

  // Sizes in screen pixels, converted to map units for the current zoom and the map's
  // rendered width, so labels stay readable on phones and the marker never balloons.
  const frameRef = useRef<HTMLDivElement>(null);
  const pixelWidth = useMotionValue(1000);
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => pixelWidth.set(entry.contentRect.width || 1000));
    observer.observe(node);
    return () => observer.disconnect();
  }, [pixelWidth]);
  const unit = useTransform([width, pixelWidth], ([w, px]) => (w as number) / Math.max(px as number, 1));
  const px = (n: number) => (u: number) => u * n;
  const markerR = useTransform(unit, px(6));
  const pulseR = useTransform(unit, px(18));
  const labelSize = useTransform(unit, px(13));
  const strokeW = useTransform(unit, px(3));
  const markerLabelY = useTransform(unit, px(-14));

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    stop();
    if (reduceMotion) {
      setStage("counties");
      return;
    }
    setPlaying(true);
    setJumped(false);
    setStage("world");
    STAGES.slice(1).forEach((s, i) => {
      timers.current.push(setTimeout(() => setStage(s.key), 1900 * (i + 1)));
    });
    timers.current.push(setTimeout(() => setPlaying(false), 1900 * STAGES.length));
  }, [reduceMotion, stop]);

  // A shared link can open the map at a stage, e.g. /where-we-work?map=counties#where-soea-works
  // (read from window.location so the page itself stays static).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const match = STAGES.find((s) => s.key === params.get("map"));
    if (!match) return;
    hasPlayed.current = true;
    const frame = requestAnimationFrame(() => {
      setJumped(true);
      setStage(match.key);
      const county = params.get("county");
      if (county && byslug.has(county)) setSelected(county);
    });
    return () => cancelAnimationFrame(frame);
  }, [byslug]);

  // Fly in automatically the first time the map scrolls into view.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true;
          play();
        }
      },
      { threshold: 0.45 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [play]);

  useEffect(() => stop, [stop]);

  const chooseStage = (key: StageKey) => {
    stop();
    setJumped(false);
    setStage(key);
  };
  const chooseCounty = (slug: string) => {
    stop();
    setJumped(false);
    setSelected(slug);
    setStage("counties");
  };

  const showCounties = stageIndex >= 2;
  const colored = stage === "counties";
  const current = STAGES[stageIndex];
  const active = byslug.get(selected);

  return (
    <Box
      component="section"
      ref={sectionRef}
      id="where-soea-works"
      aria-labelledby="geo-journey-heading"
      sx={{ py: { xs: 8, md: 12 }, bgcolor: "#FBFAF6", borderTop: "1px solid #E5E5DD", borderBottom: "1px solid #E5E5DD" }}
    >
      <Container maxWidth="xl">
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ justifyContent: "space-between", alignItems: { md: "flex-end" }, mb: 4 }}>
          <Box sx={{ maxWidth: 680 }}>
            <Typography sx={{ fontFamily: '"Space Mono", monospace', fontSize: "0.68rem", letterSpacing: "0.13em", color: "#83834B" }}>
              FROM THE WORLD TO OUR COUNTIES
            </Typography>
            <Typography
              id="geo-journey-heading"
              component="h2"
              sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: { xs: 40, md: 58 }, lineHeight: 1.04, fontWeight: 500, color: COLORS.ink, mt: 1.5 }}
            >
              Where SOEA works
            </Typography>
          </Box>
          <Button
            onClick={play}
            variant="outlined"
            startIcon={<FlightTakeoffRounded />}
            disabled={playing}
            sx={{ alignSelf: { xs: "flex-start", md: "auto" } }}
          >
            {playing ? "Flying in…" : "Fly in again"}
          </Button>
        </Stack>

        {/* Stage stepper */}
        <Box
          role="group"
          aria-label="Map zoom level"
          sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, mb: 2 }}
        >
          {STAGES.map((s, i) => {
            const on = s.key === stage;
            return (
              <ButtonBase
                key={s.key}
                onClick={() => chooseStage(s.key)}
                aria-pressed={on}
                sx={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  p: { xs: 1, sm: 1.5 },
                  borderTop: "3px solid",
                  borderColor: i <= stageIndex ? "#83834B" : "#DCDACB",
                  bgcolor: on ? "#FFFFFF" : "transparent",
                  transition: "border-color 400ms ease, background-color 200ms ease",
                  "&:focus-visible": { outline: "3px solid #D9AF3F", outlineOffset: 2 },
                }}
              >
                <Typography sx={{ fontFamily: '"Space Mono", monospace', fontSize: "0.62rem", color: "#83834B" }}>
                  0{i + 1}
                </Typography>
                <Typography sx={{ fontWeight: on ? 700 : 500, fontSize: { xs: "0.85rem", sm: "1rem" }, color: COLORS.ink }}>
                  {s.label}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 380px" }, gap: 3, alignItems: "start" }}>
          {/* The map */}
          <Box ref={frameRef} sx={{ position: "relative", bgcolor: COLORS.sea, border: "1px solid #E5E5DD", overflow: "hidden" }}>
            <motion.svg
              viewBox={viewBox}
              width="100%"
              style={{ display: "block", aspectRatio: `${map.width} / ${map.height}` }}
              role="img"
              aria-label={`Map at ${current.label} level. ${current.text}`}
            >
              <path d={map.sphere} fill={COLORS.sea} />
              <path
                d={map.land}
                fill={stageIndex >= 2 ? COLORS.neighbour : COLORS.land}
                stroke={COLORS.landStroke}
                strokeWidth={0.6}
                vectorEffect="non-scaling-stroke"
                style={{ transition: "fill 700ms ease" }}
              />
              <g>
                {map.countries.map((c) => (
                  <path
                    key={c.id}
                    d={c.d}
                    fill={
                      c.region === "kenya"
                        ? showCounties
                          ? COLORS.county
                          : COLORS.kenya
                        : stageIndex === 1
                          ? COLORS.africa
                          : stageIndex >= 2
                            ? COLORS.neighbour
                            : COLORS.land
                    }
                    stroke={COLORS.landStroke}
                    strokeWidth={0.6}
                    vectorEffect="non-scaling-stroke"
                    style={{ transition: "fill 700ms ease" }}
                  />
                ))}
              </g>

              {/* Counties fade in from the Kenya stage */}
              <motion.g initial={false} animate={{ opacity: showCounties ? 1 : 0 }} transition={{ duration: reduceMotion || jumped ? 0 : 0.8, delay: reduceMotion || jumped ? 0 : 0.5 }}>
                {map.counties.map((c) => {
                  const info = byslug.get(c.slug);
                  const isSelected = colored && c.slug === selected;
                  const interactive = Boolean(info) && showCounties;
                  return (
                    <path
                      key={c.slug}
                      d={c.d}
                      fill={colored ? (info ? countyColor(info) : COLORS.kenyaBase) : countyTint(info)}
                      stroke={isSelected ? COLORS.ink : COLORS.countyStroke}
                      strokeWidth={isSelected ? 2.2 : 0.8}
                      vectorEffect="non-scaling-stroke"
                      style={{ transition: "fill 600ms ease", cursor: interactive ? "pointer" : "default", outline: "none" }}
                      {...(interactive
                        ? {
                            role: "button",
                            tabIndex: 0,
                            "aria-label": `${info!.name}: ${info!.headline}`,
                            "aria-pressed": isSelected,
                            onClick: () => chooseCounty(c.slug),
                            onKeyDown: (e: React.KeyboardEvent) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                chooseCounty(c.slug);
                              }
                            },
                          }
                        : { "aria-hidden": true })}
                    />
                  );
                })}

                {/* Labels for the nine counties */}
                {colored &&
                  map.counties
                    .filter((c) => byslug.has(c.slug) && c.slug !== "nairobi")
                    .map((c) => (
                      <CountyLabel
                        key={`label-${c.slug}`}
                        x={c.label[0]}
                        y={c.label[1]}
                        offset={byslug.get(c.slug)!.labelOffset ?? [0, 0]}
                        unit={unit}
                        fontSize={labelSize}
                        strokeWidth={strokeW}
                        name={byslug.get(c.slug)!.name}
                      />
                    ))}
                {/* Kenya's outline over the counties */}
                {map.countries
                  .filter((c) => c.region === "kenya")
                  .map((c) => (
                    <path
                      key="kenya-outline"
                      d={c.d}
                      fill="none"
                      stroke="#83834B"
                      strokeWidth={1.4}
                      vectorEffect="non-scaling-stroke"
                      aria-hidden
                      pointerEvents="none"
                    />
                  ))}
              </motion.g>

              {/* SOEA's base: Nairobi */}
              <g aria-hidden pointerEvents="none">
                {!reduceMotion && (
                  <motion.circle
                    cx={map.nairobi[0]}
                    cy={map.nairobi[1]}
                    r={pulseR}
                    fill="none"
                    stroke={COLORS.marker}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={2}
                    initial={{ opacity: 0.7, scale: 0.3 }}
                    animate={{ opacity: 0, scale: 1 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  />
                )}
                <motion.circle cx={map.nairobi[0]} cy={map.nairobi[1]} r={markerR} fill={COLORS.marker} stroke="#FFFFFF" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                <motion.text
                  x={map.nairobi[0]}
                  y={map.nairobi[1]}
                  dx={0}
                  style={{
                    fontSize: labelSize,
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 700,
                    fill: COLORS.marker,
                    paintOrder: "stroke",
                    stroke: "#FFFFFFDD",
                    strokeWidth: strokeW,
                    translateY: markerLabelY,
                  }}
                  textAnchor="middle"
                >
                  Nairobi · SOEA
                </motion.text>
              </g>
            </motion.svg>

            {/* Stage caption over the map */}
            <Box
              aria-live="polite"
              sx={{
                position: { xs: "static", sm: "absolute" },
                left: 16,
                bottom: 16,
                maxWidth: { sm: 360 },
                p: 2,
                bgcolor: "rgba(255,255,255,0.92)",
                borderLeft: "3px solid #83834B",
              }}
            >
              <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>{current.title}</Typography>
              <Typography sx={{ fontSize: "0.88rem", color: COLORS.muted, lineHeight: 1.6, mt: 0.5 }}>{current.text}</Typography>
            </Box>

            {colored && (
              <Box sx={{ position: { xs: "static", md: "absolute" }, right: 16, top: 16, p: 1.5, bgcolor: "rgba(255,255,255,0.92)" }}>
                {LEGEND.map((item) => (
                  <Stack key={item.label} direction="row" spacing={1} sx={{ alignItems: "center", py: 0.25 }}>
                    <Box sx={{ width: 14, height: 14, bgcolor: item.color, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: "0.78rem", color: COLORS.ink }}>{item.label}</Typography>
                  </Stack>
                ))}
              </Box>
            )}
          </Box>

          {/* County card and accessible list */}
          <Stack spacing={2}>
            {active && (
              <Box sx={{ bgcolor: "#FFFFFF", border: "1px solid #E5E5DD", borderTop: `5px solid ${countyColor(active)}`, p: 3 }}>
                <Typography sx={{ fontFamily: '"Space Mono", monospace', fontSize: "0.65rem", letterSpacing: "0.1em", color: "#83834B" }}>
                  {SETTING_LABELS[active.setting].toUpperCase()}
                </Typography>
                <Typography component="h3" sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 36, lineHeight: 1.05, color: COLORS.ink, mt: 1 }}>
                  {active.name} County
                </Typography>
                <Typography sx={{ fontWeight: 700, color: "#504624", mt: 1, fontSize: "0.92rem" }}>{active.headline}</Typography>
                <Typography sx={{ color: COLORS.muted, lineHeight: 1.75, mt: 1.5, fontSize: "0.95rem" }}>{active.description}</Typography>
                {active.links && (
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, mt: 2 }}>
                    {active.links.map((link) => (
                      <Link key={link.href} href={link.href} style={{ color: "#504624", fontWeight: 700, fontSize: "0.9rem" }}>
                        {link.label} →
                      </Link>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            <Box component="nav" aria-label="Counties of focus">
              <Typography sx={{ fontWeight: 700, mb: 1, color: COLORS.ink }}>Our nine counties of focus</Typography>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                {counties.map((county) => {
                  const on = county.slug === selected && colored;
                  return (
                    <li key={county.slug}>
                      <ButtonBase
                        onClick={() => chooseCounty(county.slug)}
                        aria-pressed={on}
                        sx={{
                          width: "100%",
                          justifyContent: "flex-start",
                          gap: 1,
                          px: 1.25,
                          py: 0.9,
                          bgcolor: on ? "#FFFFFF" : "transparent",
                          border: "1px solid",
                          borderColor: on ? "#83834B" : "#E5E5DD",
                          fontSize: "0.9rem",
                          "&:focus-visible": { outline: "3px solid #D9AF3F", outlineOffset: 1 },
                        }}
                      >
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: countyColor(county), flexShrink: 0 }} />
                        {county.name}
                      </ButtonBase>
                    </li>
                  );
                })}
              </Box>
            </Box>

            <Typography sx={{ fontSize: "0.72rem", color: COLORS.muted, lineHeight: 1.6 }}>
              Boundaries: county boundaries from geoBoundaries (RCMRD source, public domain); country outlines from
              Natural Earth (public domain). Boundaries are approximate and for illustration only.
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
