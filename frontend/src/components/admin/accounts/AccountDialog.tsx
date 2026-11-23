"use client";

import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ApiError, apiData } from "@/lib/admin/api";
import type { Role } from "@/lib/admin/api";
import { Account, MIN_PASSWORD, ProfileOption, ROLE_INFO, temporaryPassword } from "@/lib/admin/accounts";
import { formatDate } from "@/lib/admin/stories";

/** What to hand to the person after creating their account or resetting their password. */
interface Handover {
  name: string;
  email: string;
  password: string;
  reason: "created" | "reset";
}

function HandoverPanel({ handover, onDone }: { handover: Handover; onDone(): void }) {
  const [copied, setCopied] = useState(false);
  const signIn = `${window.location.origin}/admin/login`;
  const text =
    `Hello ${handover.name.split(" ")[0]},\n\n` +
    (handover.reason === "created"
      ? "Your SOEA dashboard account is ready.\n\n"
      : "Your SOEA dashboard password has been reset.\n\n") +
    `Sign in at: ${signIn}\nEmail: ${handover.email}\nTemporary password: ${handover.password}\n\n` +
    "You'll be asked to choose your own password straight after signing in.";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <DialogContent dividers>
        <Alert severity="success">
          {handover.reason === "created" ? "Account created." : "Password reset."} Share these details with{" "}
          {handover.name} privately, for example by WhatsApp or in person. The password is shown only now.
        </Alert>
        <Box
          component="pre"
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "background.subtle",
            borderRadius: 1,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            fontFamily: "monospace",
            fontSize: 14,
          }}
        >
          {text}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={copy}>{copied ? "Copied" : "Copy message"}</Button>
        <Button variant="contained" onClick={onDone}>Done</Button>
      </DialogActions>
    </>
  );
}

/**
 * Create an account (account = null) or manage an existing one: name, role, linked
 * team profile, deactivate/reactivate and password reset.
 */
export default function AccountDialog({
  account,
  profiles,
  currentUserId,
  onClose,
  onSaved,
}: {
  account: Account | null;
  profiles: ProfileOption[];
  currentUserId: string;
  onClose(): void;
  onSaved(account: Account): void;
}) {
  const isNew = account === null;
  const isSelf = account?.id === currentUserId;
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState(account?.full_name ?? "");
  const [role, setRole] = useState<Role>(account?.role ?? "author");
  const [profileSlug, setProfileSlug] = useState<string | null>(account?.team_profile?.slug ?? null);
  const [password, setPassword] = useState(() => temporaryPassword());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ severity: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | "deactivate" | "reset">(null);
  const [handover, setHandover] = useState<Handover | null>(null);

  const selectedProfile = profiles.find((p) => p.slug === profileSlug) ?? null;
  const takenByOther = (p: ProfileOption) => p.linked_account !== null && p.linked_account.id !== account?.id;

  function fail(caught: unknown, fallback: string) {
    if (caught instanceof ApiError) {
      const fieldErrors: Record<string, string> = {};
      for (const [field, value] of Object.entries(caught.details)) {
        const first = Array.isArray(value) ? value[0] : Object.values(value).flat()[0];
        if (first) fieldErrors[field] = String(first);
      }
      setErrors(fieldErrors);
      setMessage({ severity: "error", text: Object.keys(fieldErrors).length ? "Please check the highlighted fields." : caught.message });
    } else {
      setMessage({ severity: "error", text: fallback });
    }
  }

  async function create() {
    const local: Record<string, string> = {};
    if (!email.trim()) local.email = "Add their email address.";
    if (!fullName.trim()) local.full_name = "Add their full name.";
    if (password.length < MIN_PASSWORD) local.temporary_password = `Use at least ${MIN_PASSWORD} characters.`;
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    setMessage(null);
    try {
      const created = await apiData<Account>("/admin/users", {
        method: "POST",
        json: {
          email: email.trim(),
          full_name: fullName.trim(),
          role,
          team_profile_slug: profileSlug,
          temporary_password: password,
        },
      });
      onSaved(created);
      setHandover({ name: created.full_name ?? created.email, email: created.email, password, reason: "created" });
    } catch (caught) {
      fail(caught, "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  async function update(patch: Record<string, unknown>, done?: string) {
    if (!account) return;
    setBusy(true);
    setMessage(null);
    try {
      const updated = await apiData<Account>(`/admin/users/${account.id}`, { method: "PATCH", json: patch });
      onSaved(updated);
      setConfirm(null);
      if (done) setMessage({ severity: "success", text: done });
    } catch (caught) {
      setConfirm(null);
      fail(caught, "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!account) return;
    const fresh = temporaryPassword();
    setBusy(true);
    setMessage(null);
    try {
      const updated = await apiData<Account>(`/admin/users/${account.id}/reset-password`, {
        method: "POST",
        json: { temporary_password: fresh },
      });
      onSaved(updated);
      setConfirm(null);
      setHandover({ name: updated.full_name ?? updated.email, email: updated.email, password: fresh, reason: "reset" });
    } catch (caught) {
      setConfirm(null);
      fail(caught, "Could not reset the password.");
    } finally {
      setBusy(false);
    }
  }

  const changed =
    !isNew &&
    (fullName.trim() !== (account.full_name ?? "") ||
      role !== account.role ||
      profileSlug !== (account.team_profile?.slug ?? null));

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" scroll="body">
      <DialogTitle sx={{ pr: 7 }}>
        {handover ? "Share the sign-in details" : isNew ? "Add an account" : account.full_name ?? account.email}
        <IconButton aria-label="Close" onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {handover ? (
        <HandoverPanel handover={handover} onDone={onClose} />
      ) : (
        <>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {message && (
                <Alert severity={message.severity}>{message.text}</Alert>
              )}
              {!isNew && !account.is_active && (
                <Alert severity="warning">This account is deactivated. The person cannot sign in.</Alert>
              )}

              {isNew ? (
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  autoComplete="off"
                  placeholder="name@sq1ecoafrica.org"
                  slotProps={{ htmlInput: { maxLength: 254 } }}
                  error={Boolean(errors.email)}
                  helperText={errors.email ?? "They sign in with this address."}
                />
              ) : (
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>Email</Typography>
                  <Typography sx={{ overflowWrap: "anywhere" }}>{account.email}</Typography>
                </Box>
              )}

              <TextField
                label="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                fullWidth
                slotProps={{ htmlInput: { maxLength: 150 } }}
                error={Boolean(errors.full_name)}
                helperText={errors.full_name}
              />

              <TextField
                select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={isSelf}
                fullWidth
                error={Boolean(errors.role)}
                helperText={errors.role ?? (isSelf ? "You cannot change your own role." : ROLE_INFO[role].can)}
              >
                {(Object.keys(ROLE_INFO) as Role[]).map((key) => (
                  <MenuItem key={key} value={key}>{ROLE_INFO[key].label}</MenuItem>
                ))}
              </TextField>

              <Autocomplete
                options={profiles}
                value={selectedProfile}
                onChange={(_, profile) => setProfileSlug(profile?.slug ?? null)}
                getOptionLabel={(p) => p.display_name}
                getOptionDisabled={takenByOther}
                isOptionEqualToValue={(a, b) => a.slug === b.slug}
                renderOption={(props, p) => {
                  const { key, ...rest } = props as typeof props & { key: string };
                  return (
                    <li key={key} {...rest}>
                      <Box>
                        <Typography>{p.display_name}</Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {takenByOther(p)
                            ? `Linked to ${p.linked_account!.full_name ?? p.linked_account!.email}`
                            : [p.role_title, p.status !== "published" ? p.status : null].filter(Boolean).join(" · ")}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Writes as (team profile)"
                    error={Boolean(errors.team_profile_slug)}
                    helperText={
                      errors.team_profile_slug ??
                      "Their published stories appear on this profile page. Optional; you can link it later."
                    }
                  />
                )}
              />

              {isNew && (
                <TextField
                  label="Temporary password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  autoComplete="off"
                  error={Boolean(errors.temporary_password)}
                  helperText={
                    errors.temporary_password ??
                    "You'll share this once. They must choose their own password when they first sign in."
                  }
                  slotProps={{
                    htmlInput: { maxLength: 256, style: { fontFamily: "monospace" } },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Make a new one">
                            <IconButton aria-label="Make a new temporary password" onClick={() => setPassword(temporaryPassword())} edge="end">
                              <RefreshIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}

              {!isNew && (
                <>
                  <Divider />
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                    {account.must_change_password && <Chip size="small" color="warning" label="Has not set their own password yet" />}
                    <Chip
                      size="small"
                      variant="outlined"
                      label={account.last_login_at ? `Last signed in ${formatDate(account.last_login_at)}` : "Never signed in"}
                    />
                    <Chip size="small" variant="outlined" label={`Added ${formatDate(account.created_at)}`} />
                  </Stack>

                  {confirm === null && (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button variant="outlined" onClick={() => setConfirm("reset")} disabled={busy || !account.is_active}>
                        Reset password
                      </Button>
                      {!isSelf &&
                        (account.is_active ? (
                          <Button color="error" onClick={() => setConfirm("deactivate")} disabled={busy}>
                            Deactivate account
                          </Button>
                        ) : (
                          <Button onClick={() => update({ is_active: true }, "Account reactivated.")} disabled={busy}>
                            Reactivate account
                          </Button>
                        ))}
                    </Stack>
                  )}

                  {confirm === "reset" && (
                    <Alert
                      severity="warning"
                      action={
                        <Stack direction="row" spacing={1}>
                          <Button color="inherit" size="small" onClick={() => setConfirm(null)}>Cancel</Button>
                          <Button color="warning" variant="contained" size="small" onClick={resetPassword} disabled={busy}>
                            Reset
                          </Button>
                        </Stack>
                      }
                    >
                      Make a new temporary password? {isSelf ? "You" : "They"} will be signed out everywhere.
                    </Alert>
                  )}
                  {confirm === "deactivate" && (
                    <Alert
                      severity="error"
                      action={
                        <Stack direction="row" spacing={1}>
                          <Button color="inherit" size="small" onClick={() => setConfirm(null)}>Cancel</Button>
                          <Button color="error" variant="contained" size="small" onClick={() => update({ is_active: false }, "Account deactivated.")} disabled={busy}>
                            Deactivate
                          </Button>
                        </Stack>
                      }
                    >
                      They will be signed out straight away and cannot sign in again. Their stories stay.
                    </Alert>
                  )}
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={onClose}>{isNew ? "Cancel" : "Close"}</Button>
            {isNew ? (
              <Button variant="contained" onClick={create} disabled={busy}>Create account</Button>
            ) : (
              <Button
                variant="contained"
                disabled={busy || !changed}
                onClick={() =>
                  update(
                    {
                      full_name: fullName.trim(),
                      ...(role !== account.role ? { role } : {}),
                      team_profile_slug: profileSlug,
                    },
                    "Changes saved.",
                  )
                }
              >
                Save changes
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
