"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { ApiError, apiFetch } from "@/lib/admin/api";

type State = "ready" | "working" | "done" | "failed";

const COPY = {
  confirm: {
    eyebrow: "Newsletter",
    title: "Confirming your subscription…",
    doneTitle: "You're subscribed.",
    doneBody: "Thank you for following SOEA. We'll email you when there's news from our programs and partners.",
    failedTitle: "We couldn't confirm your subscription.",
    endpoint: "/newsletter-subscriptions/confirm",
  },
  unsubscribe: {
    eyebrow: "Newsletter",
    title: "Unsubscribe from SOEA emails?",
    doneTitle: "You've been unsubscribed.",
    doneBody: "You won't receive any more newsletters from us. Thank you for following our work so far.",
    failedTitle: "We couldn't unsubscribe you.",
    endpoint: "/newsletter-subscriptions/unsubscribe",
  },
} as const;

function failureMessage(error: unknown, action: "confirm" | "unsubscribe"): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return "We couldn't reach our server. Check your connection and try again.";
    if (error.status === 429) return "Too many attempts. Please try again in an hour.";
    if (error.code === "SUBSCRIPTION_CANCELLED") {
      return "This subscription was cancelled. To receive our updates again, please subscribe again.";
    }
  }
  return action === "confirm"
    ? "This link has expired or was replaced by a newer one. Confirmation links last 24 hours: subscribe again and we'll send a fresh link."
    : "This link is not valid, or a newer email replaced it. Use the unsubscribe link in our most recent email, or write to info@sq1ecoafrica.org and we'll remove you.";
}

/**
 * The page behind the links in our newsletter emails.
 *
 * confirm: confirms as soon as the page opens (double opt-in).
 * unsubscribe: waits for the person to press the button, so email security scanners
 * that open links cannot unsubscribe anyone. Gmail's own Unsubscribe button uses the
 * one-click API endpoint instead and never opens this page.
 */
export default function NewsletterAction({ action }: { action: "confirm" | "unsubscribe" }) {
  const token = useSearchParams().get("token") ?? "";
  const copy = COPY[action];
  const [state, setState] = useState<State>(token ? "ready" : "failed");
  const [message, setMessage] = useState<string>(token ? "" : failureMessage(null, action));
  const started = useRef(false);

  async function run() {
    setState("working");
    try {
      await apiFetch(copy.endpoint, { method: "POST", auth: false, json: { token } });
      setState("done");
    } catch (error) {
      setMessage(failureMessage(error, action));
      setState("failed");
    }
  }

  useEffect(() => {
    // Confirm once on arrival (guarded against React's double effect in development).
    if (action === "confirm" && token && !started.current) {
      started.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, token]);

  const title =
    state === "done" ? copy.doneTitle : state === "failed" ? copy.failedTitle : copy.title;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 10, md: 16 }, minHeight: "60vh" }}>
      <Typography variant="eyebrow" component="p" sx={{ color: "primary.dark" }}>
        {copy.eyebrow}
      </Typography>
      <Typography component="h1" variant="h2" sx={{ mt: 2, fontSize: { xs: "2.2rem", md: "3rem" }, lineHeight: 1.1 }}>
        {title}
      </Typography>

      <Box sx={{ mt: 3 }} aria-live="polite">
        {state === "working" && <CircularProgress size={28} aria-label="Working" />}

        {state === "ready" && action === "unsubscribe" && (
          <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
            <Typography variant="lead" component="p" sx={{ color: "text.secondary" }}>
              You&apos;ll stop receiving SOEA newsletters at this email address.
            </Typography>
            <Button variant="contained" size="large" onClick={run}>
              Yes, unsubscribe me
            </Button>
          </Stack>
        )}

        {state === "done" && (
          <Typography variant="lead" component="p" sx={{ color: "text.secondary" }}>
            {copy.doneBody}
          </Typography>
        )}

        {state === "failed" && <Alert severity="warning">{message}</Alert>}
      </Box>

      {(state === "done" || state === "failed") && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 5 }}>
          {state === "failed" && action === "confirm" && (
            <Button component={Link} href="/stay-connected" variant="contained">
              Subscribe again
            </Button>
          )}
          {state === "done" && action === "unsubscribe" && (
            <Button component={Link} href="/stay-connected" variant="outlined">
              Changed your mind? Subscribe again
            </Button>
          )}
          <Button component={Link} href="/" variant="text">
            Back to home
          </Button>
        </Stack>
      )}
    </Container>
  );
}
