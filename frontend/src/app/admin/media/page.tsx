"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
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
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdfOutlined";
import UploadIcon from "@mui/icons-material/FileUploadOutlined";
import MediaDetailsDialog from "@/components/admin/media/MediaDetailsDialog";
import { ApiError, Collection, apiData, apiFetch } from "@/lib/admin/api";
import { useAdminSession } from "@/lib/admin/session";
import { ACCEPTED_TYPES, MediaAsset, formatBytes, needsDescription } from "@/lib/admin/media";
import { formatDate } from "@/lib/admin/stories";

const PER_PAGE = 24;

type TabKey = "all" | "image" | "document" | "missing_alt";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "image", label: "Photos" },
  { key: "document", label: "Documents" },
  { key: "missing_alt", label: "Needs a description" },
];

function Tile({ asset, onOpen }: { asset: MediaAsset; onOpen(): void }) {
  return (
    <Paper
      component="button"
      type="button"
      variant="outlined"
      onClick={onOpen}
      aria-label={`${asset.original_filename}${needsDescription(asset) ? ", needs a description" : ""}. Open details.`}
      sx={{
        p: 0,
        textAlign: "left",
        overflow: "hidden",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        bgcolor: "background.paper",
        "&:hover": { borderColor: "primary.main" },
        "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main" },
      }}
    >
      <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "background.subtle", display: "grid", placeItems: "center" }}>
        {asset.kind === "image" ? (
          <Image src={asset.url} alt="" fill sizes="(max-width: 600px) 50vw, 240px" style={{ objectFit: "cover" }} unoptimized />
        ) : (
          <PictureAsPdfIcon sx={{ fontSize: 48, color: "error.main" }} />
        )}
        {needsDescription(asset) && (
          <Chip
            size="small"
            color="warning"
            label="Needs a description"
            sx={{ position: "absolute", left: 8, top: 8 }}
          />
        )}
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {asset.original_filename}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatBytes(asset.file_size)} · {formatDate(asset.created_at)}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function MediaPage() {
  const { user } = useAdminSession();
  const isAuthor = user?.role === "author";
  const input = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<Collection<MediaAsset> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
    if (tab === "image" || tab === "document") params.set("kind", tab);
    if (tab === "missing_alt") params.set("missing_alt", "true");
    if (query) params.set("q", query);
    return `/admin/media?${params}`;
  }, [tab, query, page]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Collection<MediaAsset>>(path)
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : "Could not load files.");
      });
    return () => {
      cancelled = true;
    };
  }, [path, reload]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    const problems: string[] = [];
    const added: MediaAsset[] = [];
    setUploadErrors([]);
    setUploading({ done: 0, total: list.length });
    for (const file of list) {
      const form = new FormData();
      form.append("file", file);
      try {
        added.push(await apiData<MediaAsset>("/admin/media", { method: "POST", body: form }));
      } catch (caught) {
        problems.push(`${file.name}: ${caught instanceof ApiError ? caught.fieldError("file") ?? caught.message : "upload failed."}`);
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    setUploadErrors(problems);
    if (input.current) input.current.value = "";
    // Show the newest files first, and ask for a description of a single new photo straight away.
    setTab("all");
    setQuery("");
    setSearch("");
    setPage(1);
    setReload((n) => n + 1);
    if (added.length === 1 && added[0].kind === "image") setOpen(added[0]);
  }

  const onChanged = (updated: MediaAsset | null) => {
    if (updated === null) {
      setOpen(null);
      setReload((n) => n + 1);
      return;
    }
    setOpen(updated);
    setResult((r) => (r ? { ...r, data: r.data.map((a) => (a.id === updated.id ? updated : a)) } : r));
  };

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
            {isAuthor ? "Your uploads" : "Library"}
          </Typography>
          <Typography component="h1" variant="h3" sx={{ mt: 1 }}>
            Photos & files
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1.5, maxWidth: 680 }}>
            {isAuthor
              ? "Photos and documents you have uploaded for your stories."
              : "Every photo and document uploaded to the dashboard: logos, program covers and story photos."}{" "}
            Location data is removed from photos automatically.
          </Typography>
        </Box>
        <Button variant="contained" component="label" startIcon={<UploadIcon />} disabled={!!uploading} sx={{ flexShrink: 0 }}>
          Upload
          <input ref={input} hidden multiple type="file" accept={ACCEPTED_TYPES} onChange={(e) => upload(e.target.files)} />
        </Button>
      </Stack>

      <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
        JPEG, PNG or WebP photos up to 10 MB, and PDF documents up to 25 MB. SVG and GIF are not accepted.
      </Typography>

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">Uploading {Math.min(uploading.done + 1, uploading.total)} of {uploading.total}…</Typography>
          <LinearProgress variant="determinate" value={(uploading.done / uploading.total) * 100} sx={{ mt: 1 }} />
        </Box>
      )}
      {uploadErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setUploadErrors([])}>
          {uploadErrors.length === 1 ? "One file was not uploaded:" : `${uploadErrors.length} files were not uploaded:`}
          <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
            {uploadErrors.map((problem) => <li key={problem}>{problem}</li>)}
          </Box>
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_, value: TabKey) => {
          setTab(value);
          setPage(1);
          setResult(null);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mt: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {TABS.map((t) => <Tab key={t.key} value={t.key} label={t.label} />)}
      </Tabs>

      <TextField
        size="small"
        placeholder="Search by file name or description"
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
          htmlInput: { "aria-label": "Search files", maxLength: 100 },
        }}
      />

      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      <Box
        sx={{
          mt: 3,
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        {loading && Array.from({ length: 8 }, (_, i) => <Skeleton key={i} variant="rounded" sx={{ aspectRatio: "4 / 4" }} height="auto" />)}
        {result?.data.map((asset) => <Tile key={asset.id} asset={asset} onOpen={() => setOpen(asset)} />)}
      </Box>

      {result && result.data.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", mt: 1 }}>
          <Typography sx={{ color: "text.secondary" }}>
            {query
              ? "No files match your search."
              : tab === "missing_alt"
                ? "Every photo has a description. Thank you!"
                : "Nothing uploaded yet."}
          </Typography>
        </Paper>
      )}

      {result && result.meta.pagination.pages > 1 && (
        <Stack sx={{ mt: 3, alignItems: "center" }}>
          <Pagination count={result.meta.pagination.pages} page={page} onChange={(_, value) => setPage(value)} color="primary" />
        </Stack>
      )}

      <MediaDetailsDialog asset={open} onClose={() => setOpen(null)} onChanged={onChanged} />
    </>
  );
}
