"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Button, Typography } from "@mui/material";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import ReplayRounded from "@mui/icons-material/ReplayRounded";

const ink = "#141412";
const gold = "#D9AF3F";
const cream = "#F6EBC9";
const olive = "#83834B";
const CONFETTI_COLOURS = [gold, cream, olive, "#4F7A43", "#FFFFFF", "#C9A227"];

type Stage = "live" | "name" | "reveal";

/** Seconds each stage stays on screen before the next one. */
const TIMING = { live: 2800, name: 3200 };

// --- Confetti on a canvas: no library, ~4 seconds, then it stops drawing ---------------
type Piece = { x: number; y: number; vx: number; vy: number; w: number; h: number; r: number; vr: number; colour: string; life: number };

function fireConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const pieces: Piece[] = [];
  const burst = (x: number, y: number, angle: number, spread: number, count: number, speed: number) => {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const v = speed * (0.55 + Math.random() * 0.6);
      pieces.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
        life: 1,
      });
    }
  };
  const scale = Math.min(1, W / 900) * 0.6 + 0.4; // smaller bursts on phones
  // Two cannons from the bottom corners, then a shower from the top.
  burst(0, H, -Math.PI / 3, 0.7, Math.round(110 * scale), 22);
  burst(W, H, (-2 * Math.PI) / 3, 0.7, Math.round(110 * scale), 22);
  const shower = window.setTimeout(() => {
    for (let i = 0; i < 6; i++) burst((W * (i + 0.5)) / 6, -10, Math.PI / 2, 1.2, Math.round(16 * scale), 4);
  }, 450);

  let frame = 0;
  let raf = 0;
  const tick = () => {
    frame++;
    ctx.clearRect(0, 0, W, H);
    for (const p of pieces) {
      p.vy += 0.32; // gravity
      p.vx *= 0.985; // air
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (frame > 150) p.life -= 0.012;
      if (p.life <= 0 || p.y > H + 40) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.colour;
      // Flip the width as it spins so pieces "flutter".
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w * Math.cos(frame * 0.12 + p.r), p.h);
      ctx.restore();
    }
    if (frame < 330) raf = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, W, H);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    window.clearTimeout(shower);
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, W, H);
  };
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const fade = {
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -24, filter: "blur(8px)" },
};

export default function LaunchReveal({ siteHref }: { siteHref: string }) {
  const [stage, setStage] = useState<Stage>("live");
  const [run, setRun] = useState(0); // bump to replay
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Walk through the stages. Reduced-motion visitors go straight to the end, no confetti.
  useEffect(() => {
    if (prefersReducedMotion()) {
      const id = window.setTimeout(() => setStage("reveal"), 0);
      return () => window.clearTimeout(id);
    }
    const a = window.setTimeout(() => setStage("name"), TIMING.live);
    const b = window.setTimeout(() => setStage("reveal"), TIMING.live + TIMING.name);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [run]);

  useEffect(() => {
    if (stage !== "reveal" || prefersReducedMotion() || !canvasRef.current) return;
    return fireConfetti(canvasRef.current);
  }, [stage, run]);

  const skip = useCallback(() => setStage((s) => (s === "reveal" ? s : "reveal")), []);
  const replay = () => {
    setStage("live");
    setRun((n) => n + 1);
  };

  return (
    <Box
      component="main"
      onClick={stage === "reveal" ? undefined : skip}
      sx={{
        position: "relative",
        minHeight: "100svh",
        overflow: "hidden",
        bgcolor: ink,
        color: "#FFFFFF",
        display: "grid",
        placeItems: "center",
        px: 2,
        cursor: stage === "reveal" ? "default" : "pointer",
      }}
    >
      {/* The community photo, faint at first, warmer at the reveal. */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 1.15 }}
        animate={{ opacity: stage === "reveal" ? 0.32 : 0.12, scale: stage === "reveal" ? 1 : 1.1 }}
        transition={{ duration: 2.4, ease: "easeOut" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Image src="/assets/images/hero/landingpage.webp" alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
      </motion.div>
      <Box aria-hidden sx={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, rgba(20,20,18,0.35) 0%, ${ink} 78%)` }} />

      <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", width: "100%", maxWidth: 980 }}>
        <AnimatePresence mode="wait">
          {stage === "live" && (
            <motion.div key={`live-${run}`} {...fade} transition={{ duration: 0.8, ease: "easeOut" }}>
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, px: 2, py: 0.9, mb: 4, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "#E5484D",
                    boxShadow: "0 0 0 0 rgba(229,72,77,0.7)",
                    "@keyframes ping": {
                      "0%": { boxShadow: "0 0 0 0 rgba(229,72,77,0.7)" },
                      "100%": { boxShadow: "0 0 0 14px rgba(229,72,77,0)" },
                    },
                    animation: "ping 1.2s ease-out infinite",
                  }}
                />
                <Typography sx={{ fontFamily: '"Space Mono", monospace', fontSize: 13, fontWeight: 700, letterSpacing: "0.2em" }}>ON AIR</Typography>
              </Box>
              <Typography
                component="h1"
                sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: { xs: 64, sm: 96, md: 140 }, lineHeight: 0.95, fontWeight: 500 }}
              >
                We are{" "}
                <Box component="span" sx={{ color: gold, fontStyle: "italic" }}>
                  live.
                </Box>
              </Typography>
            </motion.div>
          )}

          {stage === "name" && (
            <motion.div key={`name-${run}`} {...fade} transition={{ duration: 0.9, ease: "easeOut" }}>
              <Typography sx={{ fontFamily: '"Space Mono", monospace', fontSize: { xs: 12, md: 14 }, letterSpacing: "0.3em", color: cream, mb: 2 }}>
                WE ARE
              </Typography>
              <Typography
                component="p"
                sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: { xs: 52, sm: 80, md: 116 }, lineHeight: 0.95, fontWeight: 500 }}
              >
                Square One
                <br />
                <Box component="span" sx={{ color: gold }}>
                  Eco Africa
                </Box>
              </Typography>
            </motion.div>
          )}

          {stage === "reveal" && (
            <motion.div key={`reveal-${run}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
              <motion.div
                initial={{ scale: 0.4, rotate: -25, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 12 }}
                style={{ display: "inline-block" }}
              >
                <Box
                  sx={{
                    width: { xs: 132, md: 168 },
                    height: { xs: 132, md: 168 },
                    mx: "auto",
                    borderRadius: "50%",
                    boxShadow: `0 0 0 6px rgba(217,175,63,0.25), 0 0 80px rgba(217,175,63,0.45)`,
                    position: "relative",
                  }}
                >
                  <Image src="/assets/images/launch/logo-round.png" alt="Square One Eco Africa logo" fill sizes="168px" priority />
                </Box>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}>
                <Typography
                  component="h1"
                  sx={{ mt: 4, fontFamily: '"Cormorant Garamond", serif', fontSize: { xs: 44, sm: 64, md: 84 }, lineHeight: 1, fontWeight: 500 }}
                >
                  Our new website is <Box component="span" sx={{ color: gold, fontStyle: "italic" }}>live</Box>
                </Typography>
                <Typography sx={{ mt: 2.5, mx: "auto", maxWidth: 620, color: "rgba(255,255,255,0.78)", fontSize: { xs: 16, md: 18 }, lineHeight: 1.7 }}>
                  Co-creating practical climate solutions for transformational impact. People. Skills. Solutions. Sustainable livelihoods.
                </Typography>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 14 }}>
                <Box sx={{ mt: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <Button
                    href={siteHref}
                    variant="contained"
                    size="large"
                    endIcon={<ArrowOutwardRounded />}
                    sx={{
                      bgcolor: gold,
                      color: ink,
                      borderRadius: 0,
                      px: { xs: 4, md: 6 },
                      py: 1.75,
                      fontSize: { xs: 16, md: 18 },
                      fontWeight: 700,
                      boxShadow: "0 12px 40px rgba(217,175,63,0.35)",
                      "&:hover": { bgcolor: cream },
                    }}
                  >
                    View the new website
                  </Button>
                  <Typography
                    component="a"
                    href={siteHref}
                    sx={{ fontFamily: '"Space Mono", monospace', fontSize: 13, letterSpacing: "0.08em", color: cream, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                  >
                    sq1ecoafrica.org
                  </Typography>
                  <Button onClick={replay} startIcon={<ReplayRounded />} size="small" sx={{ mt: 1, color: "rgba(255,255,255,0.55)" }}>
                    Replay
                  </Button>
                </Box>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {stage !== "reveal" && (
        <Typography
          sx={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.4)", zIndex: 1 }}
        >
          Tap to skip
        </Typography>
      )}

      <canvas ref={canvasRef} aria-hidden style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }} />
    </Box>
  );
}
