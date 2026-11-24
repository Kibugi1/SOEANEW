"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Alert, Box, Button, LinearProgress, Stack, TextField, Typography } from "@mui/material";
import { ApiError, apiData, apiFetch } from "@/lib/admin/api";

export interface ImageValue {
  id: string;
  url: string;
  alt_text: string | null;
}

/**
 * One uploaded image (a partner logo, a program cover): upload, describe, replace or
 * remove. The image itself is linked when the record is saved; the description (alt
 * text) belongs to the image and is saved as soon as the field is left.
 */
export default function ImageField({
  label,
  hint,
  value,
  onChange,
  disabled,
  altPlaceholder,
  previewHeight = 140,
  contain = false,
  error,
}: {
  label: string;
  hint: string;
  value: ImageValue | null;
  onChange(value: ImageValue | null): void;
  disabled?: boolean;
  altPlaceholder?: string;
  previewHeight?: number;
  /** Show the whole image on a light background (logos) instead of cropping (photos). */
  contain?: boolean;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [alt, setAlt] = useState(value?.alt_text ?? "");
  const [shownId, setShownId] = useState(value?.id);

  // Keep the description box in step when the image changes from outside (e.g. after save).
  if (value?.id !== shownId) {
    setShownId(value?.id);
    setAlt(value?.alt_text ?? "");
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setProblem(null);
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const media = await apiData<ImageValue>("/admin/media", { method: "POST", body: form });
      onChange({ id: media.id, url: media.url, alt_text: media.alt_text });
    } catch (caught) {
      setProblem(caught instanceof ApiError ? caught.fieldError("file") ?? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  async function saveAlt() {
    if (!value || alt.trim() === (value.alt_text ?? "")) return;
    try {
      await apiFetch(`/admin/media/${value.id}`, { method: "PATCH", json: { alt_text: alt.trim() || null } });
      onChange({ ...value, alt_text: alt.trim() || null });
    } catch {
      setProblem("Could not save the image description. Try again.");
    }
  }

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>{hint}</Typography>
      </Box>
      {(problem || error) && (
        <Alert severity="error" onClose={problem ? () => setProblem(null) : undefined}>
          {problem ?? error}
        </Alert>
      )}

      {value && (
        <Box
          sx={{
            position: "relative",
            height: previewHeight,
            maxWidth: contain ? 320 : 520,
            borderRadius: 1,
            overflow: "hidden",
            border: 1,
            borderColor: "divider",
            bgcolor: contain ? "#fff" : "background.subtle",
          }}
        >
          <Image
            src={value.url}
            alt={value.alt_text ?? ""}
            fill
            sizes="520px"
            style={{ objectFit: contain ? "contain" : "cover", padding: contain ? 12 : 0 }}
            unoptimized
          />
        </Box>
      )}
      {uploading && <LinearProgress aria-label="Uploading" />}

      {value && (
        <TextField
          label="Image description (alt text)"
          size="small"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onBlur={saveAlt}
          disabled={disabled}
          placeholder={altPlaceholder}
          helperText="Read aloud to people using screen readers."
          slotProps={{ htmlInput: { maxLength: 300 } }}
        />
      )}

      <Stack direction="row" spacing={1}>
        <Button variant="outlined" size="small" component="label" disabled={disabled || uploading}>
          {value ? "Replace" : "Upload"}
          <input
            ref={input}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </Button>
        {value && (
          <Button size="small" color="error" onClick={() => onChange(null)} disabled={disabled || uploading}>
            Remove
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
