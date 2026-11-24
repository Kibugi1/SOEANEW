"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { ApiError, Collection, apiFetch } from "@/lib/admin/api";
import { useAdminSession } from "@/lib/admin/session";
import {
  AdminStory,
  STATUS_COLORS,
  STATUS_LABELS,
  StoryStatus,
  eventDates,
  formatDate,
} from "@/lib/admin/stories";

const PER_PAGE = 20;

type TabKey = "ALL" | StoryStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "IN_REVIEW", label: "Waiting for review" },
  { key: "CHANGES_REQUESTED", label: "Changes requested" },
  { key: "DRAFT", label: "Drafts" },
  { key: "PUBLISHED", label: "Published" },
  { key: "ARCHIVED", label: "Unpublished" },
  { key: "ALL", label: "All" },
];

function StoryRow({ story }: { story: AdminStory }) {
  const people = story.team.length ? story.team : story.authors;
  return (
    <Paper
      component={Link}
      href={`/admin/stories/${story.id}`}
      variant="outlined"
      sx={{
        display: "block",
        p: 2.5,
        textDecoration: "none",
        color: "inherit",
        "&:hover": { borderColor: "primary.main" },
        "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main" },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}>
        <Chip size="small" label={STATUS_LABELS[story.status]} color={STATUS_COLORS[story.status]} />
        <Chip size="small" variant="outlined" label={story.story_type === "event" ? "Event" : "Story"} />
        {story.story_type === "event" && !story.activity_date && (
          <Chip size="small" color="warning" variant="outlined" label="Date to confirm" />
        )}
        {story.consent_status === "unreviewed" && (
          <Chip size="small" color="warning" variant="outlined" label="Consent not checked" />
        )}
      </Stack>
      <Typography component="h2" variant="h6" sx={{ lineHeight: 1.3 }}>
        {story.title}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75 }}>
        {[
          story.story_type === "event" ? eventDates(story) : formatDate(story.activity_date),
          people.map((p) => p.display_name).join(", "),
          story.created_by?.full_name ? `Written by ${story.created_by.full_name}` : null,
          `Updated ${formatDate(story.updated_at)}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </Typography>
    </Paper>
  );
}

export default function StoriesPage() {
  const { user } = useAdminSession();
  const isAdmin = user?.role === "admin";
  const isAuthor = user?.role === "author";
  const [tab, setTab] = useState<TabKey>(isAdmin ? "IN_REVIEW" : "ALL");
  const [type, setType] = useState<"" | "story" | "event">("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Collection<AdminStory> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search after the person stops typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
    if (tab !== "ALL") params.set("status", tab);
    if (type) params.set("type", type);
    if (query) params.set("q", query);
    return `/admin/stories?${params}`;
  }, [tab, type, query, page]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Collection<AdminStory>>(path)
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : "Could not load stories.");
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const loading = !result && !error;

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "flex-end" } }}
      >
        <Box>
          <Typography variant="eyebrow" component="p" sx={{ color: "primary.main" }}>
            {isAuthor ? "Your work" : "Content"}
          </Typography>
          <Typography component="h1" variant="h3" sx={{ mt: 1 }}>
            {isAuthor ? "My stories" : "Stories & events"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/admin/stories/new" variant="contained">
            Write a story
          </Button>
          <Button component={Link} href="/admin/stories/new?type=event" variant="outlined">
            Record an event
          </Button>
        </Stack>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, value: TabKey) => {
          setTab(value);
          setPage(1);
          setResult(null);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mt: 4, borderBottom: 1, borderColor: "divider" }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
        <TextField
          size="small"
          placeholder="Search titles and summaries"
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
            htmlInput: { "aria-label": "Search stories" },
          }}
        />
        <TextField
          select
          size="small"
          label="Type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as typeof type);
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Stories and events</MenuItem>
          <MenuItem value="story">Stories only</MenuItem>
          <MenuItem value="event">Events only</MenuItem>
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      <Stack spacing={1.5} sx={{ mt: 3 }}>
        {loading && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={104} />)}
        {result?.data.map((story) => <StoryRow key={story.id} story={story} />)}
        {result && result.data.length === 0 && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ color: "text.secondary" }}>
              {tab === "IN_REVIEW" && isAdmin
                ? "Nothing is waiting for your review."
                : "No stories here yet."}
            </Typography>
          </Paper>
        )}
      </Stack>

      {result && result.meta.pagination.pages > 1 && (
        <Stack sx={{ mt: 3, alignItems: "center" }}>
          <Pagination
            count={result.meta.pagination.pages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Stack>
      )}
    </>
  );
}
