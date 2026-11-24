"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import { ApiError, Collection, apiData, apiFetch } from "@/lib/admin/api";
import { AdminPartner, PARTNER_TYPE_LABELS, PartnerType } from "@/lib/admin/partners";
import { PUBLICATION_COLORS, PUBLICATION_LABELS, PublicationStatus } from "@/lib/admin/programs";

const PER_PAGE = 20;

type TabKey = "all" | PublicationStatus;
type Counts = Record<PublicationStatus, number> & { total: number };

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

function Logo({ partner }: { partner: AdminPartner }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: 96,
        height: 64,
        flexShrink: 0,
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        bgcolor: "#fff",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      {partner.logo ? (
        <Image
          src={partner.logo.url}
          alt=""
          fill
          sizes="96px"
          style={{ objectFit: "contain", padding: 8 }}
          unoptimized
        />
      ) : (
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 700 }} aria-hidden>
          {partner.name
            .split(/\s+/)
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase()}
        </Typography>
      )}
    </Box>
  );
}

function PartnerRow({ partner }: { partner: AdminPartner }) {
  return (
    <Paper
      component={Link}
      href={`/admin/partners/${partner.id}`}
      variant="outlined"
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "center",
        p: 2,
        textDecoration: "none",
        color: "inherit",
        "&:hover": { borderColor: "primary.main" },
        "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main" },
      }}
    >
      <Logo partner={partner} />
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 0.75, flexWrap: "wrap", rowGap: 1 }}>
          <Chip
            size="small"
            label={PUBLICATION_LABELS[partner.publication_status]}
            color={PUBLICATION_COLORS[partner.publication_status]}
          />
          <Chip size="small" variant="outlined" label={PARTNER_TYPE_LABELS[partner.partner_type]} />
          {!partner.logo && <Chip size="small" variant="outlined" color="warning" label="No logo" />}
        </Stack>
        <Typography component="h2" variant="h6" sx={{ lineHeight: 1.3, overflowWrap: "anywhere" }}>
          {partner.name}
        </Typography>
        {(partner.programs.length > 0 || partner.areas.length > 0) && (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {[
              partner.programs.map((p) => p.title).join(", "),
              partner.areas.map((a) => a.name).join(", "),
            ]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default function PartnersPage() {
  const [tab, setTab] = useState<TabKey>("all");
  const [type, setType] = useState<"" | PartnerType>("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Collection<AdminPartner> | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiData<{ partners?: Counts }>("/admin/dashboard")
      .then((data) => setCounts(data.partners ?? null))
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
    if (type) params.set("type", type);
    if (query) params.set("q", query);
    return `/admin/partners?${params}`;
  }, [tab, type, query, page]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Collection<AdminPartner>>(path)
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : "Could not load partners.");
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
            Partners
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1.5, maxWidth: 680 }}>
            Organizations SOEA works with. Only publish a partner once SOEA has agreed to show the
            relationship publicly.
          </Typography>
        </Box>
        <Button component={Link} href="/admin/partners/new" variant="contained" sx={{ flexShrink: 0 }}>
          Add a partner
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

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
        <TextField
          size="small"
          placeholder="Search partners"
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
            htmlInput: { "aria-label": "Search partners", maxLength: 100 },
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
            setResult(null);
          }}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">All types</MenuItem>
          {(Object.keys(PARTNER_TYPE_LABELS) as PartnerType[]).map((key) => (
            <MenuItem key={key} value={key}>{PARTNER_TYPE_LABELS[key]}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      <Stack spacing={1.5} sx={{ mt: 3 }}>
        {loading && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={96} />)}
        {result?.data.map((partner) => <PartnerRow key={partner.id} partner={partner} />)}
        {result && result.data.length === 0 && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ color: "text.secondary" }}>
              {query || type ? "No partners match these filters." : "No partners yet. Add the first one."}
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
