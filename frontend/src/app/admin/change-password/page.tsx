"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Stack, TextField } from "@mui/material";
import AuthCard from "@/components/admin/AuthCard";
import { ApiError } from "@/lib/admin/api";
import { useAdminSession } from "@/lib/admin/session";

const MIN_LENGTH = 12;

export default function ChangePasswordPage() {
  const { user, changePassword, signOut } = useAdminSession();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const forced = Boolean(user?.must_change_password);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const local: Record<string, string> = {};
    if (next.length < MIN_LENGTH) local.new_password = `Use at least ${MIN_LENGTH} characters.`;
    if (next !== confirm) local.confirm = "The two new passwords do not match.";
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      await changePassword(current, next);
      router.replace("/admin");
    } catch (caught) {
      setErrors(
        caught instanceof ApiError
          ? {
              current_password: caught.fieldError("current_password") ?? "",
              new_password: caught.fieldError("new_password") ?? "",
              form: caught.fieldError("current_password") || caught.fieldError("new_password") ? "" : caught.message,
            }
          : { form: "Something went wrong. Please try again." },
      );
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={forced ? "Choose your password" : "Change password"}
      intro={
        forced
          ? "You signed in with a temporary password. Choose your own to continue. Use at least 12 characters; a short phrase is easy to remember and hard to guess."
          : "Use at least 12 characters."
      }
    >
      {errors.form && <Alert severity="error">{errors.form}</Alert>}
      <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
        <TextField
          label={forced ? "Temporary password" : "Current password"}
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={Boolean(errors.current_password)}
          helperText={errors.current_password || " "}
          required
          fullWidth
        />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={Boolean(errors.new_password)}
          helperText={errors.new_password || `At least ${MIN_LENGTH} characters`}
          required
          fullWidth
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={Boolean(errors.confirm)}
          helperText={errors.confirm || " "}
          required
          fullWidth
        />
        <Button type="submit" variant="contained" size="large" disabled={busy || !current || !next}>
          {busy ? "Saving…" : "Save password"}
        </Button>
        {forced ? (
          <Button onClick={() => void signOut()} variant="text">
            Sign out
          </Button>
        ) : (
          <Button onClick={() => router.back()} variant="text">
            Cancel
          </Button>
        )}
      </Stack>
    </AuthCard>
  );
}
