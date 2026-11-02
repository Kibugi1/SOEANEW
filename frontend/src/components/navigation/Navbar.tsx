
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AppBar,
  Box,
  Button,
  ButtonBase,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";

const navigation = [
  { label: "Who We Are", href: "/who-we-are" },
  { label: "Our Approach", href: "/our-approach" },
  { label: "Our Focus", href: "/our-focus" },
  { label: "Programs", href: "/programs" },
  { label: "Where We Work", href: "/where-we-work" },
  { label: "People & Stories", href: "/people-stories" },
  { label: "Innovation", href: "/innovation" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const difference = currentScrollY - lastScrollY.current;

      if (menuOpen) {
        setHidden(false);
      } else if (currentScrollY <= 24) {
        setHidden(false);
      } else if (Math.abs(difference) > 8) {
        setHidden(difference > 0);
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          bgcolor: "rgba(255,255,255,0.96)",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(14px)",
          zIndex: (theme) => theme.zIndex.drawer - 1,
          transform: menuOpen || !hidden ? "translateY(0)" : "translateY(-110%)",
          transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 76, md: 88 },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            {/* Official SOEA logo and organisation name */}
            <Box
              component={Link}
              href="/"
              aria-label="Square One Eco Africa home"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: { xs: 1.2, md: 1.8 },
                flexShrink: 0,
                textDecoration: "none",
                color: "text.primary",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: { xs: 54, md: 66 },
                  height: { xs: 54, md: 66 },
                }}
              >
                <Image
                  src="/assets/brand/soealogo.svg"
                  alt="Square One Eco Africa logo"
                  fill
                  priority
                  sizes="66px"
                  style={{ objectFit: "contain" }}
                />
              </Box>

              <Typography
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: { xs: 12, md: 15 },
                  fontWeight: 700,
                  letterSpacing: { xs: "0.015em", md: "0.025em" },
                  lineHeight: 1.3,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Square One
                <Box component="span" sx={{ display: "block", fontWeight: 400 }}>
                  Eco Africa
                </Box>
              </Typography>
            </Box>

            {/* Menu trigger — visible on all screen sizes */}
            <ButtonBase
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="soea-navigation-drawer"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: { xs: 1, md: 1.5 },
                px: { xs: 1, md: 1.5 },
                py: 1,
                borderRadius: 1,
                transition: "background-color 180ms ease",
                "&:hover": {
                  bgcolor: "rgba(131,131,75,0.09)",
                },
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: { xs: 11, md: 12 },
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                }}
              >
                MENU
              </Typography>

              <Box
                sx={{
                  position: "relative",
                  width: { xs: 29, md: 35 },
                  height: { xs: 29, md: 35 },
                }}
              >
                <Image
                  src="/assets/brand/africa.svg"
                  alt=""
                  fill
                  sizes="35px"
                  style={{
                    objectFit: "contain",
                  }}
                />
              </Box>
            </ButtonBase>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Navigation drawer */}
      <Drawer
        anchor="right"
        open={menuOpen}
        onClose={closeMenu}
        ModalProps={{
          keepMounted: true,
        }}
        slotProps={{
          paper: {
            id: "soea-navigation-drawer",
            sx: {
              width: "min(90vw, 460px)",
              p: { xs: 2.5, md: 4 },
              bgcolor: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        {/* Drawer header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 29,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              Explore SOEA
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                fontFamily: '"Space Mono", monospace',
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              People. Skills. Solutions.
            </Typography>
          </Box>

          <IconButton
            aria-label="Close navigation menu"
            onClick={closeMenu}
            sx={{
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        {/* Navigation links */}
        <Box component="nav" aria-label="Main navigation">
          <List sx={{ py: 2 }}>
            {navigation.map((item, index) => (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  onClick={closeMenu}
                  sx={{
                    py: 1.8,
                    px: 0.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:hover": {
                      bgcolor: "transparent",
                      "& .nav-label": {
                        color: "primary.main",
                        transform: "translateX(5px)",
                      },
                    },
                  }}
                >
                  <Typography
                    sx={{
                      mr: 2.5,
                      fontFamily: '"Space Mono", monospace',
                      fontSize: 10,
                      color: "primary.main",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Typography>

                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        className: "nav-label",
                        sx: {
                          fontSize: { xs: 15, md: 17 },
                          fontWeight: 600,
                          transition: "all 180ms ease",
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Partnership CTA */}
        <Box
          sx={{
            pt: 3,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            sx={{
              mb: 2,
              fontSize: 13,
              color: "text.secondary",
              lineHeight: 1.7,
            }}
          >
            Interested in creating lasting impact with us?
          </Typography>

          <Button
            component={Link}
            href="/partner-with-us"
            onClick={closeMenu}
            variant="contained"
            endIcon={<ArrowOutwardRoundedIcon />}
            fullWidth
            sx={{
              minHeight: 52,
              justifyContent: "space-between",
              px: 2.5,
            }}
          >
            Partner with us
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
