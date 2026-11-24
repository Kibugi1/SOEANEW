"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { ApiError, apiData, apiFetch } from "@/lib/admin/api";
import { MediaAsset, MediaDetail, formatBytes } from "@/lib/admin/media";
import { formatDate } from "@/lib/admin/stories";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>{label}</Typography>
      <Typography sx={{ overflowWrap: "anywhere" }}>{children}</Typography>
    </Box>
  );
}

/**
 * One file: preview, description (alt text), facts, where it is used, delete.
 * Calls onChanged with the updated file after a save, or with null after a delete.
 */
export default function MediaDetailsDialog({
  asset,
  onClose,
  onChanged,
}: {
  asset: MediaAsset | null;
  onClose(): void;
  onChanged(asset: MediaAsset | null): void;
}) {
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ severity: "success" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Reset when a different file is opened.
  if ((asset?.id ?? null) !== loadedId) {
    setLoadedId(asset?.id ?? null);
    setDetail(null);
    setAlt(asset?.alt_text ?? "");
    setMessage(null);
    setConfirmDelete(false);
  }

  useEffect(() => {
    if (!asset) return;
    let cancelled = false;
    apiData<MediaDetail>(`/admin/media/${asset.id}`)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setMessage({ severity: "error", text: "Could not load where this file is used." });
      });
    return () => {
      cancelled = true;
    };
  }, [asset]);

  if (!asset) return null;
  const isImage = asset.kind === "image";
  const altChanged = alt.trim() !== (asset.alt_text ?? "");
  const inUse = detail ? detail.in_use > 0 : true;

  async function saveAlt() {
    if (!asset) return;
    setBusy(true);
    setMessage(null);
    try {
      const updated = await apiData<MediaAsset>(`/admin/media/${asset.id}`, {
        method: "PATCH",
        json: { alt_text: alt.trim() || null },
      });
      onChanged(updated);
      setMessage({ severity: "success", text: "Description saved." });
    } catch (caught) {
      setMessage({
        severity: "error",
        text: caught instanceof ApiError ? caught.fieldError("alt_text") ?? caught.message : "Could not save.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!asset) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/media/${asset.id}`, { method: "DELETE" });
      onChanged(null);
    } catch (caught) {
      setConfirmDelete(false);
      setMessage({ severity: "error", text: caught instanceof ApiError ? caught.message : "Could not delete." });
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(asset!.url);
      setMessage({ severity: "success", text: "Link copied." });
    } catch {
      setMessage({ severity: "error", text: "Could not copy. Select the link and copy it instead." });
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" scroll="body">
      <DialogTitle sx={{ pr: 7, overflowWrap: "anywhere" }}>
        {asset.original_filename}
        <IconButton aria-label="Close" onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.2fr) minmax(0, 1fr)" },
          }}
        >
          {/* Preview */}
          <Box>
            {isImage ? (
              <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "background.subtle", borderRadius: 1, overflow: "hidden" }}>
                <Image src={asset.url} alt={asset.alt_text ?? ""} fill sizes="(max-width: 900px) 100vw, 480px" style={{ objectFit: "contain" }} unoptimized />
              </Box>
            ) : (
              <Stack
                spacing={1.5}
                sx={{ alignItems: "center", justifyContent: "center", aspectRatio: "4 / 3", bgcolor: "background.subtle", borderRadius: 1 }}
              >
                <PictureAsPdfIcon sx={{ fontSize: 64, color: "error.main" }} />
                <Button href={asset.url} target="_blank" rel="noopener noreferrer" variant="outlined" size="small">
                  Open the PDF
                </Button>
              </Stack>
            )}
          </Box>

          {/* Details */}
          <Stack spacing={2.5}>
            {message && <Alert severity={message.severity}>{message.text}</Alert>}

            {isImage && (
              <Box>
                <TextField
                  label="Description (alt text)"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  placeholder="e.g. Waste pickers sorting plastics at a CECI training in Dandora"
                  slotProps={{ htmlInput: { maxLength: 500 } }}
                  helperText="What the photo shows, for people using screen readers. Needed before it appears on the website."
                  error={!alt.trim()}
                />
                <Button variant="contained" size="small" sx={{ mt: 1 }} onClick={saveAlt} disabled={busy || !altChanged}>
                  Save description
                </Button>
              </Box>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Fact label="Size">{formatBytes(asset.file_size)}</Fact>
              {isImage && asset.width && asset.height ? (
                <Fact label="Dimensions">{asset.width} × {asset.height} px</Fact>
              ) : (
                <Fact label="Type">PDF document</Fact>
              )}
              <Fact label="Uploaded">{formatDate(asset.created_at)}</Fact>
              <Fact label="By">{asset.uploaded_by?.full_name ?? "Unknown"}</Fact>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>Link</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="body2" sx={{ fontFamily: "monospace", overflowWrap: "anywhere", flex: 1 }}>
                  {asset.url}
                </Typography>
                <Button size="small" onClick={copyLink}>Copy</Button>
              </Stack>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>Used in</Typography>
              {!detail && <Skeleton width="60%" />}
              {detail && detail.in_use === 0 && <Typography>Not used anywhere yet.</Typography>}
              {detail && detail.used_in.length > 0 && (
                <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
                  {detail.used_in.map((use) => (
                    <li key={`${use.type}-${use.title}-${use.label}`}>
                      <Typography component="span" sx={{ color: "text.secondary" }}>{use.label}: </Typography>
                      {use.admin_path ? (
                        <Box component={Link} href={use.admin_path} sx={{ color: "primary.main", fontWeight: 600 }}>
                          {use.title}
                        </Box>
                      ) : (
                        <Box component="span" sx={{ fontWeight: 600 }}>{use.title}</Box>
                      )}
                    </li>
                  ))}
                </Stack>
              )}
              {detail && detail.in_use > 0 && detail.used_in.length === 0 && (
                <Typography>Used in {detail.in_use} {detail.in_use === 1 ? "place" : "places"}.</Typography>
              )}
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2, flexWrap: "wrap", gap: 1 }}>
        {confirmDelete ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography>Delete this file for good?</Typography>
            <Button color="error" variant="contained" onClick={remove} disabled={busy}>Delete</Button>
            <Button onClick={() => setConfirmDelete(false)} disabled={busy}>Keep it</Button>
          </Stack>
        ) : (
          <Box>
            <Button color="error" onClick={() => setConfirmDelete(true)} disabled={busy || inUse}>
              Delete file
            </Button>
            {detail && inUse && (
              <Typography variant="body2" sx={{ color: "text.secondary", px: 1 }}>
                Remove it from the records above first.
              </Typography>
            )}
          </Box>
        )}
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
