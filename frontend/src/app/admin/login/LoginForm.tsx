"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Stack, TextField } from "@mui/material";
import AuthCard from "@/components/admin/AuthCard";
import { ApiError } from "@/lib/admin/api";
import { useAdminSession } from "@/lib/admin/session";

/** Only return to a dashboard path, never to another site. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

export default function LoginForm() {
  const { signIn, notice } = useAdminSession();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await signIn(email.trim(), password);
      router.replace(user.must_change_password ? "/admin/change-password" : next);
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 429
          ? "Too many attempts. Please wait a minute and try again."
          : caught instanceof ApiError
            ? caught.message
            : "Something went wrong. Please try again.",
      );
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Sign in" intro="For SOEA staff and volunteers.">
      {notice && !error && <Alert severity="info">{notice}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />
        <Button type="submit" variant="contained" size="large" disabled={busy || !email || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </Stack>
    </AuthCard>
  );
}
