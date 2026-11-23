"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
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
import { ApiError, Collection, apiData, apiFetch } from "@/lib/admin/api";
import {
  AdminProgram,
  PROGRESS_LABELS,
  PUBLICATION_COLORS,
  PUBLICATION_LABELS,
  PublicationStatus,
} from "@/lib/admin/programs";
import { formatDate } from "@/lib/admin/stories";

const PER_PAGE = 20;

type TabKey = "all" | PublicationStatus;
type Counts = Record<PublicationStatus, number> & { total: number };

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

function ProgramRow({ program }: { program: AdminProgram }) {
  return (
    <Paper
      component={Link}
      href={`/admin/programs/${program.id}`}
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
        <Chip
          size="small"
          label={PUBLICATION_LABELS[program.publication_status]}
          color={PUBLICATION_COLORS[program.publication_status]}
        />
        <Chip size="small" variant="outlined" label={PROGRESS_LABELS[program.status]} />
        {program.is_featured && <Chip size="small" variant="outlined" color="primary" label="Featured" />}
      </Stack>
      <Typography component="h2" variant="h6" sx={{ lineHeight: 1.3 }}>
        {program.short_name && program.short_name !== program.title ? `${program.short_name} · ` : ""}
        {program.title}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
        {[
          program.parent ? `Project under ${program.parent.title}` : null,
          program.sub_programs.length
            ? `${program.sub_programs.length} project${program.sub_programs.length === 1 ? "" : "s"}: ${program.sub_programs.map((p) => p.title).join(", ")}`
            : null,
          program.lead ? `Led by ${program.lead.display_name}` : null,
          `Updated ${formatDate(program.updated_at)}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </Typography>
    </Paper>
  );
}

export default function ProgramsPage() {
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Collection<AdminProgram> | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiData<{ programs?: Counts }>("/admin/dashboard")
      .then((data) => setCounts(data.programs ?? null))
      .catch(() => setCounts(null));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
    if (tab !== "all") params.set("status", tab);
    if (query) params.set("q", query);
    return `/admin/programs?${params}`;
  }, [tab, query, page]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Collection<AdminProgram>>(path)
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : "Could not load programs.");
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const loading = !result && !error;
  const countFor = (key: TabKey) => (counts ? (key === "all" ? counts.total : counts[key]) : null);

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "flex-end" } }}
      >
        <Box>
          <Typography variant="eyebrow" component="p" sx={{ color: "primary.main" }}>
            Content
          </Typography>
          <Typography component="h1" variant="h3" sx={{ mt: 1 }}>
            Programs
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1.5, maxWidth: 680 }}>
            Programs and the projects under them, such as CECI and JEET Champions. Drafts stay here until an
            admin publishes them.
          </Typography>
        </Box>
        <Button component={Link} href="/admin/programs/new" variant="contained" sx={{ flexShrink: 0 }}>
          Add a program
        </Button>
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
        {TABS.map((t) => {
          const count = countFor(t.key);
          return <Tab key={t.key} value={t.key} label={count === null ? t.label : `${t.label} (${count})`} />;
        })}
      </Tabs>

      <TextField
        size="small"
        placeholder="Search by name or short name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mt: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
          htmlInput: { "aria-label": "Search programs", maxLength: 100 },
        }}
      />

      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      <Stack spacing={1.5} sx={{ mt: 3 }}>
        {loading && [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={104} />)}
        {result?.data.map((program) => <ProgramRow key={program.id} program={program} />)}
        {result && result.data.length === 0 && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ color: "text.secondary" }}>
              {query ? "No programs match your search." : "No programs here yet."}
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
