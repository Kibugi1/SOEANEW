"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import type { LiveEvent } from "@/data/events";

const ink = "#1A1A1A";
const gold = "#D9AF3F";
const cream = "#F6EBC9";

type Phase = "before" | "live" | "over";

// The clock as an external store that ticks once a second. The server (and the first
// browser render) get null, so the prerendered page and hydration match; the numbers
// show as "--" until the browser takes over.
function subscribeToClock(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
const readClock = () => Math.floor(Date.now() / 1000) * 1000;
const serverClock = () => null;

function useNow(): number | null {
  return useSyncExternalStore(subscribeToClock, readClock, serverClock);
}

function phaseAt(event: LiveEvent, now: number | null): Phase {
  if (now === null) return "before";
  if (now >= Date.parse(event.endsAt)) return "over";
  if (now >= Date.parse(event.startsAt)) return "live";
  return "before";
}

function parts(event: LiveEvent, now: number | null) {
  if (now === null) return null;
  const left = Math.max(0, Date.parse(event.startsAt) - now);
  const s = Math.floor(left / 1000);
  return [
    { label: "Days", value: Math.floor(s / 86400) },
    { label: "Hours", value: Math.floor((s % 86400) / 3600) },
    { label: "Minutes", value: Math.floor((s % 3600) / 60) },
    { label: "Seconds", value: s % 60 },
  ];
}

function Countdown({ event, now, compact = false }: { event: LiveEvent; now: number | null; compact?: boolean }) {
  const p = parts(event, now);
  const cells = p ?? ["Days", "Hours", "Minutes", "Seconds"].map((label) => ({ label, value: null }));
  return (
    <Box
      role="timer"
      aria-live="off"
      aria-label={p ? `Starts in ${p[0].value} days, ${p[1].value} hours, ${p[2].value} minutes` : "Countdown"}
      sx={{ display: "flex", gap: compact ? 1 : 1.5 }}
    >
      {cells.map(({ label, value }) => (
        <Box
          key={label}
          sx={{
            minWidth: compact ? 52 : { xs: 64, md: 78 },
            px: 1,
            py: compact ? 0.75 : 1.5,
            textAlign: "center",
            bgcolor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(217,175,63,0.35)",
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Space Mono", monospace',
              fontSize: compact ? 20 : { xs: 26, md: 34 },
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#FFFFFF",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value === null ? "--" : String(value).padStart(2, "0")}
          </Typography>
          <Typography sx={{ fontFamily: '"Space Mono", monospace', fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: cream }}>
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function LiveBadge() {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, bgcolor: "#B3261E", color: "#FFFFFF" }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: "#FFFFFF",
          "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      />
      <Typography sx={{ fontFamily: '"Space Mono", monospace', fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" }}>LIVE NOW</Typography>
    </Box>
  );
}

function AttendButton({ event, live }: { event: LiveEvent; live: boolean }) {
  return (
    <Button
      href={event.attendHref}
      target="_blank"
      rel="noopener noreferrer"
      variant="contained"
      endIcon={<ArrowOutwardRounded />}
      sx={{ bgcolor: gold, color: ink, fontWeight: 700, borderRadius: 0, px: 3, "&:hover": { bgcolor: cream } }}
    >
      {live ? "Join the live discussion" : event.attendLabel}
    </Button>
  );
}

/** Event section with the poster and a live countdown; renders nothing once the event has ended. */
export default function EventFeature({ event }: { event: LiveEvent }) {
  const now = useNow();
  const phase = phaseAt(event, now);
  if (phase === "over") return null;

  return (
    <Box id={event.id} component="section" aria-labelledby={`${event.id}-title`} sx={{ bgcolor: ink, color: "#FFFFFF", py: { xs: 8, md: 11 }, scrollMarginTop: 90 }}>
      <Container maxWidth="xl">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.25fr 1fr" }, gap: { xs: 5, md: 7 }, alignItems: "center" }}>
          <Box
            component="a"
            href={event.poster.src}
            target="_blank"
            rel="noopener"
            aria-label="Open the full poster"
            sx={{ display: "block", border: `1px solid rgba(217,175,63,0.35)`, lineHeight: 0 }}
          >
            <Image
              src={event.poster.src}
              alt={event.poster.alt}
              width={event.poster.width}
              height={event.poster.height}
              sizes="(min-width: 1200px) 55vw, 100vw"
              style={{ width: "100%", height: "auto" }}
            />
          </Box>

          <Stack spacing={3}>
            <Typography sx={{ fontFamily: '"Space Mono", monospace', fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: gold }}>
              {event.eyebrow}
            </Typography>
            <Typography
              id={`${event.id}-title`}
              component="h2"
              sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: { xs: 44, md: 64 }, lineHeight: 1, fontWeight: 500 }}
            >
              {event.title}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>{event.summary}</Typography>
            <Typography sx={{ color: cream, fontWeight: 600 }}>{event.whenLabel}</Typography>

            {phase === "live" ? <LiveBadge /> : <Countdown event={event} now={now} />}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
              <AttendButton event={event} live={phase === "live"} />
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{event.alsoLiveOn}</Typography>
            </Stack>

            <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
              Speakers: {event.speakers.map((s) => s.split(",")[0]).join(" · ")}
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
