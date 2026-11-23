"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { AdminSessionProvider, ROLE_LABELS, useAdminSession } from "@/lib/admin/session";
import AdminBrand from "./AdminBrand";
import { navFor } from "./nav";

const SIDEBAR_WIDTH = 248;
/** Screens shown without the sidebar. */
const BARE_PATHS = ["/admin/login", "/admin/change-password"];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <Guard>{children}</Guard>
    </AdminSessionProvider>
  );
}

function FullPageSpinner() {
  return (
    <Box sx={{ minHeight: "100svh", display: "grid", placeItems: "center", bgcolor: "background.subtle" }}>
      <CircularProgress aria-label="Loading" />
    </Box>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const { status, user } = useAdminSession();
  const pathname = usePathname();
  const router = useRouter();
  const onLogin = pathname === "/admin/login";
  const onChangePassword = pathname === "/admin/change-password";

  useEffect(() => {
    if (status === "signed-out" && !onLogin) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === "signed-in" && user?.must_change_password && !onChangePassword) {
      router.replace("/admin/change-password");
    } else if (status === "signed-in" && !user?.must_change_password && onLogin) {
      router.replace("/admin");
    }
  }, [status, user, onLogin, onChangePassword, pathname, router]);

  if (status === "loading") return <FullPageSpinner />;
  if (onLogin) return status === "signed-out" ? <>{children}</> : <FullPageSpinner />;
  if (status !== "signed-in" || !user) return <FullPageSpinner />;
  if (user.must_change_password && !onChangePassword) return <FullPageSpinner />;
  if (BARE_PATHS.includes(pathname)) return <>{children}</>;
  return <Frame>{children}</Frame>;
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAdminSession();
  const pathname = usePathname();
  if (!user) return null;

  return (
    <Stack sx={{ height: "100%", p: 2.5 }} spacing={2}>
      <Box component={Link} href="/admin" onClick={onNavigate} aria-label="Admin home" sx={{ textDecoration: "none" }}>
        <AdminBrand size={52} />
      </Box>
      <Typography variant="eyebrow" component="p" sx={{ color: "primary.main" }}>
        Admin dashboard
      </Typography>
      <Box>
        <Typography sx={{ fontWeight: 600 }}>{user.full_name ?? user.email}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {ROLE_LABELS[user.role]}
          {user.team_profile ? ` · ${user.team_profile.display_name}` : ""}
        </Typography>
      </Box>
      <Divider />
      <List component="nav" aria-label="Admin sections" sx={{ flex: 1, p: 0 }}>
        {navFor(user.role).map((item) => {
          const label = user.role === "author" && item.authorLabel ? item.authorLabel : item.label;
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return item.ready ? (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={active}
              onClick={onNavigate}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemText primary={label} />
            </ListItemButton>
          ) : (
            <ListItemButton key={item.href} disabled sx={{ borderRadius: 1, mb: 0.5 }}>
              <ListItemText primary={label} />
              <Chip label="Soon" size="small" variant="outlined" />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Stack spacing={1}>
        <Button component={Link} href="/" variant="text" size="small" sx={{ justifyContent: "flex-start" }}>
          View website
        </Button>
        <Button onClick={() => void signOut()} variant="outlined" size="small">
          Sign out
        </Button>
      </Stack>
    </Stack>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100svh", bgcolor: "background.subtle" }}>
      <Box
        component="aside"
        sx={{
          display: { xs: "none", md: "block" },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          bgcolor: "background.paper",
          borderRight: 1,
          borderColor: "divider",
          position: "sticky",
          top: 0,
          height: "100svh",
        }}
      >
        <Sidebar />
      </Box>
      <Drawer open={open} onClose={() => setOpen(false)} sx={{ display: { md: "none" } }}>
        <Box sx={{ width: SIDEBAR_WIDTH, height: "100%" }}>
          <Sidebar onNavigate={() => setOpen(false)} />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <IconButton aria-label="Open menu" onClick={() => setOpen(true)} edge="start">
            <MenuIcon />
          </IconButton>
          <Box component={Link} href="/admin" aria-label="Admin home" sx={{ textDecoration: "none" }}>
            <AdminBrand size={36} />
          </Box>
        </Box>
        <Box sx={{ px: { xs: 2, md: 5 }, py: { xs: 3, md: 5 }, maxWidth: 1200 }}>{children}</Box>
      </Box>
    </Box>
  );
}
