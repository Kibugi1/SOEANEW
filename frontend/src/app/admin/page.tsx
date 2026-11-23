"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { ApiError, apiData } from "@/lib/admin/api";
import { useAdminSession } from "@/lib/admin/session";

type Counts = Record<string, number> & { total: number };

interface Dashboard {
  role: "admin" | "editor" | "author";
  my_stories: Counts;
  programs?: Counts;
  stories?: Counts;
  stories_awaiting_review?: number;
  partners?: Counts;
  enquiries?: { by_status: Counts; open_by_inbox: Counts };
  subscribers?: Counts;
}

const INBOX_LABELS: Record<string, string> = {
  partnerships: "Partnerships",
  volunteers: "Volunteers",
  info: "General",
};

function Stat({ value, label, hint }: { value: number | string; label: string; hint?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
      <Typography component="p" variant="h3" sx={{ lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography sx={{ mt: 1, fontWeight: 600 }}>{label}</Typography>
      {hint && (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section" sx={{ mt: 5 }}>
      <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

const cell = { xs: 12, sm: 6, md: 3 } as const;

export default function AdminHome() {
  const { user } = useAdminSession();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiData<Dashboard>("/admin/dashboard")
      .then(setData)
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Could not load the dashboard."));
  }, []);

  const firstName = user?.full_name?.split(" ")[0] ?? "";

  return (
    <>
      <Typography variant="eyebrow" component="p" sx={{ color: "primary.main" }}>
        Dashboard
      </Typography>
      <Typography component="h1" variant="h3" sx={{ mt: 1 }}>
        {firstName ? `Welcome, ${firstName}` : "Welcome"}
      </Typography>

      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
      {!data && !error && (
        <Grid container spacing={2} sx={{ mt: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <Grid key={i} size={cell}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      )}

      {data && (
        <>
          {data.role === "admin" && (data.stories_awaiting_review ?? 0) > 0 && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              {data.stories_awaiting_review === 1
                ? "1 story or event is waiting for your review."
                : `${data.stories_awaiting_review} stories and events are waiting for your review.`}{" "}
              Reviewing opens with the Stories screen, coming next.
            </Alert>
          )}

          {data.role === "author" && !user?.team_profile && (
            <Alert severity="info" sx={{ mt: 3 }}>
              Your account is not linked to a team profile yet, so your stories will not show on a profile
              page. Ask an admin to link it.
            </Alert>
          )}

          <Section title={data.role === "author" ? "Your stories" : "Your own stories"}>
            <Grid container spacing={2}>
              <Grid size={cell}><Stat value={data.my_stories.DRAFT ?? 0} label="Drafts" /></Grid>
              <Grid size={cell}><Stat value={data.my_stories.CHANGES_REQUESTED ?? 0} label="Changes requested" /></Grid>
              <Grid size={cell}><Stat value={data.my_stories.IN_REVIEW ?? 0} label="In review" /></Grid>
              <Grid size={cell}><Stat value={data.my_stories.PUBLISHED ?? 0} label="Published" /></Grid>
            </Grid>
          </Section>

          {data.enquiries && (
            <Section title="Inbox: open messages">
              <Grid container spacing={2}>
                {Object.keys(INBOX_LABELS).map((inbox) => (
                  <Grid key={inbox} size={cell}>
                    <Stat value={data.enquiries!.open_by_inbox[inbox] ?? 0} label={INBOX_LABELS[inbox]} hint="New or being reviewed" />
                  </Grid>
                ))}
                <Grid size={cell}>
                  <Stat value={data.enquiries.by_status.total} label="All messages" hint={`${data.enquiries.by_status.closed ?? 0} closed`} />
                </Grid>
              </Grid>
            </Section>
          )}

          {data.stories && data.programs && data.partners && (
            <Section title="Website content">
              <Grid container spacing={2}>
                <Grid size={cell}>
                  <Stat value={data.stories.PUBLISHED ?? 0} label="Published stories & events"
                        hint={`${data.stories.IN_REVIEW ?? 0} in review · ${data.stories.DRAFT ?? 0} drafts`} />
                </Grid>
                <Grid size={cell}>
                  <Stat value={data.programs.published} label="Published programs"
                        hint={`${data.programs.draft} draft · ${data.programs.archived} archived`} />
                </Grid>
                <Grid size={cell}>
                  <Stat value={data.partners.published} label="Published partners"
                        hint={`${data.partners.draft} draft · ${data.partners.archived} archived`} />
                </Grid>
                {data.subscribers && (
                  <Grid size={cell}>
                    <Stat value={data.subscribers.active ?? 0} label="Newsletter subscribers"
                          hint={`${data.subscribers.pending ?? 0} awaiting confirmation`} />
                  </Grid>
                )}
              </Grid>
            </Section>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 5 }}>
            <Button component={Link} href="/admin/change-password" variant="outlined">
              Change my password
            </Button>
          </Stack>
        </>
      )}
    </>
  );
}
