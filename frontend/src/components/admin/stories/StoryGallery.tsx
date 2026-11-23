"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Radio,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { ApiError, apiData, apiFetch } from "@/lib/admin/api";
import type { GalleryItem } from "@/lib/admin/stories";

interface UploadedMedia {
  id: string;
  url: string;
  alt_text: string | null;
}

/**
 * Photos for a story: upload, describe (alt text, saved on the photo itself), caption,
 * order, choose the cover, remove. Changes to order, captions and the cover are saved
 * with the story; alt text is saved as soon as the field is left.
 */
export default function StoryGallery({
  items,
  coverId,
  disabled,
  onChange,
  onCoverChange,
}: {
  items: GalleryItem[];
  coverId: string | null;
  disabled: boolean;
  onChange(items: GalleryItem[]): void;
  onCoverChange(id: string | null): void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading(files.length);
    const added: GalleryItem[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      try {
        const media = await apiData<UploadedMedia>("/admin/media", { method: "POST", body: form });
        added.push({ media_id: media.id, url: media.url, alt_text: media.alt_text, caption: null });
      } catch (caught) {
        const reason = caught instanceof ApiError ? caught.fieldError("file") ?? caught.message : "Upload failed.";
        setError(`${file.name}: ${reason}`);
      }
      setUploading((n) => n - 1);
    }
    if (added.length) {
      onChange([...items, ...added]);
      if (!coverId) onCoverChange(added[0].media_id);
    }
    if (input.current) input.current.value = "";
  }

  async function saveAlt(item: GalleryItem, altText: string) {
    try {
      await apiFetch(`/admin/media/${item.media_id}`, { method: "PATCH", json: { alt_text: altText || null } });
    } catch {
      setError("Could not save the photo description. Try again.");
    }
  }

  const update = (index: number, patch: Partial<GalleryItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  const remove = (index: number) => {
    const removed = items[index];
    onChange(items.filter((_, i) => i !== index));
    if (removed.media_id === coverId) onCoverChange(items.find((_, i) => i !== index)?.media_id ?? null);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        JPEG, PNG or WebP, up to 10 MB each. Location data is removed automatically. Every photo needs a
        description for people using screen readers, and consent from anyone who can be recognised.
      </Typography>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {items.map((item, index) => (
        <Paper key={item.media_id} variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box sx={{ position: "relative", width: { xs: "100%", sm: 160 }, aspectRatio: "4 / 3", flexShrink: 0, bgcolor: "background.subtle" }}>
              <Image src={item.url} alt={item.alt_text ?? ""} fill sizes="160px" style={{ objectFit: "cover" }} unoptimized />
            </Box>
            <Stack spacing={1.5} sx={{ flex: 1 }}>
              <TextField
                label="Photo description (alt text)"
                size="small"
                value={item.alt_text ?? ""}
                onChange={(e) => update(index, { alt_text: e.target.value })}
                onBlur={(e) => void saveAlt(item, e.target.value.trim())}
                error={!item.alt_text?.trim()}
                helperText={item.alt_text?.trim() ? " " : "Describe what the photo shows, e.g. “Waste pickers sorting plastics at Dandora”."}
                disabled={disabled}
                slotProps={{ htmlInput: { maxLength: 500 } }}
                fullWidth
              />
              <TextField
                label="Caption (optional, shown under the photo)"
                size="small"
                value={item.caption ?? ""}
                onChange={(e) => update(index, { caption: e.target.value || null })}
                disabled={disabled}
                slotProps={{ htmlInput: { maxLength: 300 } }}
                fullWidth
              />
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <Radio
                  checked={coverId === item.media_id}
                  onChange={() => onCoverChange(item.media_id)}
                  disabled={disabled}
                  slotProps={{ input: { "aria-label": "Use as cover photo" } }}
                  size="small"
                />
                <Typography variant="body2" sx={{ flex: 1 }}>Cover photo</Typography>
                <Tooltip title="Move up">
                  <span>
                    <IconButton aria-label="Move up" size="small" disabled={disabled || index === 0} onClick={() => move(index, -1)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move down">
                  <span>
                    <IconButton aria-label="Move down" size="small" disabled={disabled || index === items.length - 1} onClick={() => move(index, 1)}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Remove from story">
                  <span>
                    <IconButton aria-label="Remove photo" size="small" disabled={disabled} onClick={() => remove(index)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      ))}

      {uploading > 0 && <LinearProgress aria-label="Uploading photos" />}

      {!disabled && (
        <Box>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => void upload(e.target.files)}
          />
          <Button variant="outlined" onClick={() => input.current?.click()} disabled={uploading > 0}>
            {items.length ? "Add more photos" : "Add photos"}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
