"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SouthRoundedIcon from "@mui/icons-material/SouthRounded";
import { motion, useReducedMotion } from "framer-motion";
import type { TaarifaLayer } from "@/data/innovation";

type LayerDiagramProps = {
  layers: TaarifaLayer[];
  /** Community the layers are currently shown for. */
  communityName: string;
};

/** The connected Taarifa Eco layers, revealed top to bottom. */
export default function LayerDiagram({ layers, communityName }: LayerDiagramProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Box
      role="figure"
      aria-label={`Taarifa Eco's ${layers.length} connected layers, adapted for ${communityName}`}
      sx={{
        p: { xs: 3, md: 4 },
        bgcolor: "background.inverse",
        borderRadius: 1,
        color: "common.white",
      }}
    >
      <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
        Adapted for
      </Typography>
      <Box
        component={motion.p}
        key={communityName}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        sx={{ m: 0, mt: 0.5, mb: 3, fontWeight: 600, fontSize: "1.05rem" }}
      >
        {communityName}
      </Box>

      {layers.map((layer, index) => (
        <Box key={layer.number}>
          <Box
            component={motion.div}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            sx={{
              position: "relative",
              overflow: "hidden",
              p: { xs: 2.5, md: 3 },
              borderRadius: 1,
              border: 1,
              borderColor: "rgba(255,255,255,0.18)",
              bgcolor: "rgba(255,255,255,0.04)",
            }}
          >
            {!reduceMotion && (
              <Box
                component={motion.span}
                aria-hidden
                animate={{ x: ["-100%", "220%"] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  repeatDelay: 1.6,
                  delay: 1 + index * 0.8,
                  ease: "easeInOut",
                }}
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "45%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(217,175,63,0.16), transparent)",
                  pointerEvents: "none",
                }}
              />
            )}
            <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
              Layer {layer.number}
            </Typography>
            <Typography variant="h4" component="h3" sx={{ mt: 0.5, fontSize: { xs: "1.5rem", md: "1.75rem" } }}>
              {layer.title}
            </Typography>
            <Typography sx={{ mt: 1, opacity: 0.8, fontSize: "0.9rem", lineHeight: 1.7 }}>
              {layer.description}
            </Typography>
          </Box>
          {index < layers.length - 1 && (
            <Box aria-hidden sx={{ display: "grid", placeItems: "center", py: 1, color: "secondary.main" }}>
              <SouthRoundedIcon fontSize="small" />
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
