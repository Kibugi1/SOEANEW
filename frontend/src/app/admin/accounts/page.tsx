"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AccountDialog from "@/components/admin/accounts/AccountDialog";
import { ApiError, Collection, apiData, apiFetch } from "@/lib/admin/api";
import type { Role } from "@/lib/admin/api";
import { useAdminSession } from "@/lib/admin/session";
import { Account, ProfileOption, ROLE_INFO } from "@/lib/admin/accounts";
import { formatDate } from "@/lib/admin/stories";

const ROLE_ORDER: Record<Role, number> = { admin: 0, editor: 1, author: 2 };

/** Every account. Teams are small, so all pages are loaded and filtered here. */
async function loadAll(): Promise<Account[]> {
  const all: Account[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await apiFetch<Collection<Account>>(`/admin/users?page=${page}&per_page=50`);
    all.push(...result.data);
    if (page >= result.meta.pagination.pages) break;
  }
  return all;
}

function AccountRow({ account, isSelf, onOpen }: { account: Account; isSelf: boolean; onOpen(): void }) {
  return (
    <Paper
      component="button"
      type="button"
      variant="outlined"
      onClick={onOpen}
      sx={{
        display: "block",
        width: "100%",
        p: 2.5,
        textAlign: "left",
        font: "inherit",
        color: "inherit",
        bgcolor: "background.paper",
        cursor: "pointer",
        opacity: account.is_active ? 1 : 0.65,
        "&:hover": { borderColor: "primary.main" },
        "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main" },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}>
        <Chip size="small" label={ROLE_INFO[account.role].label} color={account.role === "admin" ? "primary" : "default"} />
        {!account.is_active && <Chip size="small" color="error" variant="outlined" label="Deactivated" />}
        {account.is_active && account.must_change_password && (
          <Chip size="small" color="warning" variant="outlined" label="Waiting for first sign-in" />
        )}
        {isSelf && <Chip size="small" variant="outlined" label="You" />}
      </Stack>
      <Typography component="h2" variant="h6" sx={{ lineHeight: 1.3 }}>
        {account.full_name ?? account.email}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, overflowWrap: "anywhere" }}>
        {[
          account.email,
          account.team_profile ? `Writes as ${account.team_profile.display_name}` : "No team profile linked",
          account.last_login_at ? `Last signed in ${formatDate(account.last_login_at)}` : "Never signed in",
        ].join(" · ")}
      </Typography>
    </Paper>
  );
}

export default function AccountsPage() {
  const { user } = useAdminSession();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | Role>("");
  const [showInactive, setShowInactive] = useState(false);
  const [open, setOpen] = useState<Account | "new" | null>(null);

  const loadProfiles = () =>
    apiData<ProfileOption[]>("/admin/team-profiles").then(setProfiles).catch(() => setProfiles([]));

  useEffect(() => {
    loadAll()
      .then(setAccounts)
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Could not load accounts."));
    loadProfiles();
  }, []);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (accounts ?? [])
      .filter((a) => showInactive || a.is_active)
      .filter((a) => !role || a.role === role)
      .filter((a) => !term || `${a.full_name ?? ""} ${a.email}`.toLowerCase().includes(term))
      .sort(
        (a, b) =>
          Number(b.is_active) - Number(a.is_active) ||
          ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
          (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email),
      );
  }, [accounts, search, role, showInactive]);

  const inactiveCount = (accounts ?? []).filter((a) => !a.is_active).length;
  const counts = (accounts ?? []).reduce<Record<Role, number>>(
    (acc, a) => (a.is_active ? { ...acc, [a.role]: acc[a.role] + 1 } : acc),
    { admin: 0, editor: 0, author: 0 },
  );

  const onSaved = (saved: Account) => {
    setAccounts((list) => {
      if (!list) return [saved];
      return list.some((a) => a.id === saved.id) ? list.map((a) => (a.id === saved.id ? saved : a)) : [...list, saved];
    });
    if (open !== null && open !== "new") setOpen(saved);
    loadProfiles(); // profile links may have changed
  };

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "flex-end" } }}
      >
        <Box>
          <Typography variant="eyebrow" component="p" sx={{ color: "primary.main" }}>
            Team
          </Typography>
          <Typography component="h1" variant="h3" sx={{ mt: 1 }}>
            Accounts
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1.5, maxWidth: 680 }}>
            Who can sign in to the dashboard and what they can do. Accounts are deactivated, never deleted, so the
            record of who did what is kept.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen("new")} sx={{ flexShrink: 0 }}>
          Add an account
        </Button>
      </Stack>

      {accounts && (
        <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: "wrap", rowGap: 1 }}>
          {(Object.keys(ROLE_INFO) as Role[]).map((key) => (
            <Chip key={key} variant="outlined" label={`${counts[key]} ${ROLE_INFO[key].label.toLowerCase()}${counts[key] === 1 ? "" : "s"}`} />
          ))}
        </Stack>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3, alignItems: { sm: "center" } }}>
        <TextField
          size="small"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
            htmlInput: { "aria-label": "Search accounts" },
          }}
        />
        <TextField select size="small" label="Role" value={role} onChange={(e) => setRole(e.target.value as typeof role)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All roles</MenuItem>
          {(Object.keys(ROLE_INFO) as Role[]).map((key) => (
            <MenuItem key={key} value={key}>{ROLE_INFO[key].label}</MenuItem>
          ))}
        </TextField>
        {inactiveCount > 0 && (
          <FormControlLabel
            control={<Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />}
            label={`Show deactivated (${inactiveCount})`}
          />
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      <Stack spacing={1.5} sx={{ mt: 3 }}>
        {!accounts && !error && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={96} />)}
        {shown.map((account) => (
          <AccountRow key={account.id} account={account} isSelf={account.id === user?.id} onOpen={() => setOpen(account)} />
        ))}
        {accounts && shown.length === 0 && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ color: "text.secondary" }}>No accounts match these filters.</Typography>
          </Paper>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2.5, mt: 5 }}>
        <Typography component="h2" variant="h6">What each role can do</Typography>
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {(Object.keys(ROLE_INFO) as Role[]).map((key) => (
            <Typography key={key} variant="body2">
              <Box component="span" sx={{ fontWeight: 700 }}>{ROLE_INFO[key].label}:</Box> {ROLE_INFO[key].can}
            </Typography>
          ))}
        </Stack>
      </Paper>

      {open !== null && user && (
        <AccountDialog
          key={open === "new" ? "new" : open.id}
          account={open === "new" ? null : open}
          profiles={profiles}
          currentUserId={user.id}
          onClose={() => setOpen(null)}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
