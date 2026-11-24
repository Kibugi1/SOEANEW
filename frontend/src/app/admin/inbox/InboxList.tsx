"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
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
import {
  EnquiryInbox,
  EnquiryStatus,
  EnquirySummary,
  INBOXES,
  KIND_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  optionLabel,
  timeAgo,
} from "@/lib/admin/inbox";

const PER_PAGE = 25;

type TabKey = "all" | EnquiryStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "new", label: "New" },
  { key: "in_review", label: "Being reviewed" },
  { key: "contacted", label: "Contacted" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];

const isTab = (value: string | null): value is TabKey => TABS.some((t) => t.key === value);
const isInbox = (value: string | null): value is EnquiryInbox => !!value && value in INBOXES;

function EnquiryRow({ enquiry }: { enquiry: EnquirySummary }) {
  const unread = enquiry.status === "new";
  return (
    <Paper
      component={Link}
      href={`/admin/inbox/${enquiry.id}`}
      variant="outlined"
      sx={{
        display: "block",
        p: 2.5,
        textDecoration: "none",
        color: "inherit",
        borderLeftWidth: 4,
        borderLeftColor: unread ? "error.main" : "divider",
        "&:hover": { borderColor: "primary.main" },
        "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main" },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" } }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}>
            <Chip size="small" label={STATUS_LABELS[enquiry.status]} color={STATUS_COLORS[enquiry.status]} />
            <Chip size="small" variant="outlined" label={`${INBOXES[enquiry.inbox].label} inbox`} />
            <Chip
              size="small"
              variant="outlined"
              label={
                enquiry.kind === "contact" && enquiry.topic
                  ? optionLabel("contact", "topic", enquiry.topic)
                  : KIND_LABELS[enquiry.kind]
              }
            />
          </Stack>
          <Typography component="h2" variant="h6" sx={{ lineHeight: 1.3, fontWeight: unread ? 700 : 600 }}>
            {enquiry.name}
            {enquiry.organization && (
              <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
                {" "}· {enquiry.organization}
              </Box>
            )}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, overflowWrap: "anywhere" }}>
            {[enquiry.email, enquiry.reference, enquiry.assigned_to && `Assigned to ${enquiry.assigned_to.full_name ?? enquiry.assigned_to.email}`]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "nowrap", flexShrink: 0 }}>
          {timeAgo(enquiry.created_at)}
        </Typography>
      </Stack>
    </Paper>
  );
}

export default function InboxList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Filters live in the URL so the home screen can link straight to one inbox,
  // and Back returns to the same view after opening a message.
  const statusParam = params.get("status");
  const tab: TabKey = isTab(statusParam) ? statusParam : "new";
  const inboxParam = params.get("inbox");
  const inbox: "" | EnquiryInbox = isInbox(inboxParam) ? inboxParam : "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const query = params.get("q") ?? "";

  const [search, setSearch] = useState(query);
  const [result, setResult] = useState<Collection<EnquirySummary> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in changes)) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Search after the person stops typing.
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === query) return;
    const timer = setTimeout(() => setParams({ q: trimmed || null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const path = useMemo(() => {
    const qs = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
    if (tab !== "all") qs.set("status", tab);
    if (inbox) qs.set("inbox", inbox);
    if (query) qs.set("q", query);
    return `/admin/enquiries?${qs}`;
  }, [tab, inbox, query, page]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Collection<EnquirySummary>>(path)
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : "Could not load the inbox.");
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const loading = !result && !error;
  const filtered = Boolean(query || inbox);

  return (
    <>
      <Typography variant="eyebrow" component="p" sx={{ color: "primary.main" }}>
        Website messages
      </Typography>
      <Typography component="h1" variant="h3" sx={{ mt: 1 }}>
        Inbox
      </Typography>
      <Typography sx={{ color: "text.secondary", mt: 1.5, maxWidth: 720 }}>
        Every partnership enquiry, volunteer application and message sent through the website. Each one is
        routed to an inbox, and that inbox gets an email alert.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, value: TabKey) => {
          setResult(null);
          setParams({ status: value === "new" ? null : value });
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
          placeholder="Search name, organization, email or reference"
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
            htmlInput: { "aria-label": "Search messages", maxLength: 100 },
          }}
        />
        <TextField
          select
          size="small"
          label="Inbox"
          value={inbox}
          onChange={(e) => {
            setResult(null);
            setParams({ inbox: e.target.value || null });
          }}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All inboxes</MenuItem>
          {(Object.keys(INBOXES) as EnquiryInbox[]).map((key) => (
            <MenuItem key={key} value={key}>
              {INBOXES[key].label} ({INBOXES[key].email})
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      <Stack spacing={1.5} sx={{ mt: 3 }}>
        {loading && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={104} />)}
        {result?.data.map((enquiry) => <EnquiryRow key={enquiry.id} enquiry={enquiry} />)}
        {result && result.data.length === 0 && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ color: "text.secondary" }}>
              {filtered
                ? "No messages match these filters."
                : tab === "new"
                  ? "No new messages. You're all caught up."
                  : "No messages here."}
            </Typography>
          </Paper>
        )}
      </Stack>

      {result && result.meta.pagination.pages > 1 && (
        <Stack sx={{ mt: 3, alignItems: "center" }}>
          <Pagination
            count={result.meta.pagination.pages}
            page={page}
            onChange={(_, value) => setParams({ page: value > 1 ? String(value) : null })}
            color="primary"
          />
        </Stack>
      )}
    </>
  );
}
