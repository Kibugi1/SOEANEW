"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ImageField, { ImageValue } from "@/components/admin/ImageField";
import { ApiError, apiData, apiFetch } from "@/lib/admin/api";
import { useAdminSession } from "@/lib/admin/session";
import { AdminPartner, PARTNER_TYPE_LABELS, PartnerType } from "@/lib/admin/partners";
import { PUBLICATION_COLORS, PUBLICATION_HELP, PUBLICATION_LABELS, PublicationStatus } from "@/lib/admin/programs";
import { PickerOptions, formatDate } from "@/lib/admin/stories";

const SUMMARY_MAX = 5000;

interface Form {
  name: string;
  slug: string;
  partner_type: PartnerType | "";
  summary: string;
  website_url: string;
  sort_order: string;
  logo: ImageValue | null;
  area_slugs: string[];
  program_slugs: string[];
}

type Named = { slug: string; name: string };

function formFrom(partner: AdminPartner | null): Form {
  return {
    name: partner?.name ?? "",
    slug: partner?.slug ?? "",
    partner_type: partner?.partner_type ?? "",
    summary: partner?.summary ?? "",
    website_url: partner?.website_url ?? "",
    sort_order: String(partner?.sort_order ?? 0),
    logo: partner?.logo ? { id: partner.logo.id, url: partner.logo.url, alt_text: partner.logo.alt_text } : null,
    area_slugs: partner?.areas.map((a) => a.slug) ?? [],
    program_slugs: partner?.programs.map((p) => p.slug) ?? [],
  };
}

// Alt text is saved on the image directly, so only which image is linked counts as a change.
const comparable = (f: Form) => JSON.stringify({ ...f, logo: f.logo?.id ?? null });

const orNull = (value: string) => (value.trim() ? value.trim() : null);

function payloadFrom(form: Form, isNew: boolean) {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    partner_type: form.partner_type,
    summary: orNull(form.summary),
    website_url: orNull(form.website_url),
    sort_order: Number.parseInt(form.sort_order, 10) || 0,
    logo_id: form.logo?.id ?? null,
    area_slugs: form.area_slugs,
    program_slugs: form.program_slugs,
  };
  if (!isNew || form.slug.trim()) payload.slug = form.slug.trim();
  return payload;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  slug: "Web address",
  partner_type: "Type",
  summary: "Description",
  website_url: "Website",
  sort_order: "Order",
  logo_id: "Logo",
  area_slugs: "Partnership areas",
  program_slugs: "Programs",
};

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 } }}>
      <Typography component="h2" variant="h6">{title}</Typography>
      {hint && <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>{hint}</Typography>}
      <Stack spacing={2.5} sx={{ mt: 2.5 }}>{children}</Stack>
    </Paper>
  );
}

export default function PartnerEditor({ partner }: { partner: AdminPartner | null }) {
  const { user } = useAdminSession();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const [saved, setSaved] = useState<AdminPartner | null>(partner);
  const [form, setForm] = useState<Form>(() => formFrom(partner));
  const [baseline, setBaseline] = useState(() => comparable(formFrom(partner)));
  const [areas, setAreas] = useState<Named[]>([]);
  const [programs, setPrograms] = useState<Named[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ severity: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isNew = saved === null;
  const publication: PublicationStatus = saved?.publication_status ?? "draft";
  const canEdit = isAdmin || publication === "draft";
  const dirty = comparable(form) !== baseline;
  const disabled = !canEdit || busy;

  useEffect(() => {
    apiData<Named[]>("/admin/partnership-areas").then(setAreas).catch(() => setAreas([]));
    apiData<PickerOptions>("/admin/options")
      .then((data) => setPrograms(data.programs.map((p) => ({ slug: p.slug, name: p.title }))))
      .catch(() => setPrograms([]));
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const err = (field: string) => ({ error: Boolean(errors[field]), helperText: errors[field] });
  const pick = (list: Named[], slugs: string[]) =>
    slugs.map((slug) => list.find((item) => item.slug === slug) ?? { slug, name: slug });

  function showErrors(caught: unknown, fallback: string) {
    if (caught instanceof ApiError) {
      const fieldErrors: Record<string, string> = {};
      for (const [field, value] of Object.entries(caught.details)) {
        const first = Array.isArray(value) ? value[0] : Object.values(value).flat()[0];
        if (first) fieldErrors[field] = String(first);
      }
      setErrors(fieldErrors);
      const listed = Object.keys(fieldErrors)
        .filter((f) => f !== "_schema")
        .map((f) => FIELD_LABELS[f] ?? f.replace(/_/g, " "));
      setMessage({ severity: "error", text: listed.length ? `Please check: ${listed.join(", ")}.` : caught.message });
    } else {
      setMessage({ severity: "error", text: fallback });
    }
  }

  function validate(publishing: boolean): boolean {
    const found: Record<string, string> = {};
    if (!form.name.trim()) found.name = "Add the partner's name.";
    if (!form.partner_type) found.partner_type = "Choose what kind of partner this is.";
    if (publishing && !form.summary.trim()) found.summary = "Add the approved description before publishing.";
    setErrors(found);
    if (Object.keys(found).length) {
      setMessage({ severity: "error", text: `Please check: ${Object.keys(found).map((f) => FIELD_LABELS[f]).join(", ")}.` });
      return false;
    }
    return true;
  }

  async function save(publish?: PublicationStatus, done = "Saved.") {
    if (canEdit && !validate(publish === "published")) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = canEdit ? payloadFrom(form, isNew) : {};
      if (publish) payload.publication_status = publish;
      const next = saved
        ? await apiData<AdminPartner>(`/admin/partners/${saved.id}`, { method: "PATCH", json: payload })
        : await apiData<AdminPartner>("/admin/partners", { method: "POST", json: payload });
      setSaved(next);
      setForm(formFrom(next));
      setBaseline(comparable(formFrom(next)));
      setErrors({});
      setMessage({ severity: "success", text: done });
      if (!saved) router.replace(`/admin/partners/${next.id}`);
    } catch (caught) {
      showErrors(caught, "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!saved) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/partners/${saved.id}`, { method: "DELETE" });
      router.replace("/admin/partners");
    } catch (caught) {
      setConfirmDelete(false);
      showErrors(caught, "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <>
      <Button component={Link} href="/admin/partners" size="small" sx={{ mb: 2 }}>
        ← All partners
      </Button>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <Box>
              <Typography component="h1" variant="h3" sx={{ overflowWrap: "anywhere" }}>
                {isNew ? "Add a partner" : saved.name}
              </Typography>
              {!canEdit && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This partner is {PUBLICATION_LABELS[publication].toLowerCase()}. Only an admin can change it.
                </Alert>
              )}
            </Box>

            <Section title="About the partner">
              <TextField
                label="Name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                disabled={disabled}
                required
                fullWidth
                slotProps={{ htmlInput: { maxLength: 200 } }}
                {...err("name")}
              />
              <TextField
                select
                label="Type"
                value={form.partner_type}
                onChange={(e) => set("partner_type", e.target.value as PartnerType)}
                disabled={disabled}
                required
                fullWidth
                {...err("partner_type")}
              >
                {(Object.keys(PARTNER_TYPE_LABELS) as PartnerType[]).map((key) => (
                  <MenuItem key={key} value={key}>{PARTNER_TYPE_LABELS[key]}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Description"
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                disabled={disabled}
                multiline
                minRows={4}
                fullWidth
                slotProps={{ htmlInput: { maxLength: SUMMARY_MAX } }}
                error={Boolean(errors.summary)}
                helperText={
                  errors.summary ??
                  "The wording SOEA and the partner have agreed on. Needed before publishing."
                }
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Website"
                  value={form.website_url}
                  onChange={(e) => set("website_url", e.target.value)}
                  disabled={disabled}
                  fullWidth
                  placeholder="https://…"
                  slotProps={{ htmlInput: { maxLength: 500 } }}
                  {...err("website_url")}
                />
                <TextField
                  label="Web address on our site"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  disabled={disabled}
                  fullWidth
                  placeholder={isNew ? "Made from the name" : undefined}
                  slotProps={{ htmlInput: { maxLength: 120 } }}
                  error={Boolean(errors.slug)}
                  helperText={errors.slug ?? (isNew ? "Leave empty to make one from the name." : undefined)}
                />
              </Stack>
            </Section>

            <Section title="Logo">
              <ImageField
                label="Partner logo"
                hint="PNG or WebP with a transparent or white background works best (JPEG also accepted, up to 10 MB). SVG is not accepted: export it as PNG."
                value={form.logo}
                onChange={(logo) => set("logo", logo)}
                disabled={disabled}
                altPlaceholder={form.name ? `${form.name} logo` : "e.g. Mr. Green Africa logo"}
                contain
                error={errors.logo_id}
              />
            </Section>

            <Section title="How we work together" hint="Shows the partner on these program pages and areas.">
              <Autocomplete
                multiple
                options={programs}
                getOptionLabel={(p) => p.name}
                isOptionEqualToValue={(a, b) => a.slug === b.slug}
                value={pick(programs, form.program_slugs)}
                onChange={(_, value) => set("program_slugs", value.map((p) => p.slug))}
                disabled={disabled}
                renderInput={(params) => <TextField {...params} label="Programs" {...err("program_slugs")} />}
              />
              <Autocomplete
                multiple
                options={areas}
                getOptionLabel={(a) => a.name}
                isOptionEqualToValue={(a, b) => a.slug === b.slug}
                value={pick(areas, form.area_slugs)}
                onChange={(_, value) => set("area_slugs", value.map((a) => a.slug))}
                disabled={disabled}
                noOptionsText="No partnership areas loaded yet."
                renderInput={(params) => <TextField {...params} label="Partnership areas" {...err("area_slugs")} />}
              />
            </Section>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2} sx={{ position: { md: "sticky" }, top: { md: 88 } }}>
            {message && <Alert severity={message.severity}>{message.text}</Alert>}

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Chip label={PUBLICATION_LABELS[publication]} color={PUBLICATION_COLORS[publication]} size="small" />
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                {PUBLICATION_HELP[publication]}
                {!isAdmin && publication === "draft" ? " An admin publishes it once the partner has agreed." : ""}
              </Typography>

              <Stack spacing={1} sx={{ mt: 2 }}>
                {canEdit && (
                  <Button
                    variant={isAdmin && publication !== "published" ? "outlined" : "contained"}
                    onClick={() => save(undefined, isNew ? "Saved as a draft." : "Saved.")}
                    disabled={busy || (!dirty && !isNew)}
                  >
                    {isNew ? "Save as draft" : publication === "published" ? "Save changes (goes live)" : "Save"}
                  </Button>
                )}
                {isAdmin && publication !== "published" && (
                  <Button variant="contained" onClick={() => save("published", "Published. It is live on the website.")} disabled={busy}>
                    {dirty || isNew ? "Save and publish" : "Publish"}
                  </Button>
                )}
                {isAdmin && publication === "published" && (
                  <Button variant="text" color="warning" onClick={() => save("archived", "Archived. It is off the website.")} disabled={busy}>
                    Take off the website (archive)
                  </Button>
                )}
                {isAdmin && publication === "archived" && (
                  <Button variant="text" onClick={() => save("draft", "Moved back to drafts.")} disabled={busy}>
                    Move back to drafts
                  </Button>
                )}
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <TextField
                label="Order"
                type="number"
                size="small"
                fullWidth
                value={form.sort_order}
                onChange={(e) => set("sort_order", e.target.value)}
                disabled={disabled}
                slotProps={{ htmlInput: { min: 0, max: 10000 } }}
                error={Boolean(errors.sort_order)}
                helperText={errors.sort_order ?? "Lower numbers come first in partner lists."}
              />
            </Paper>

            {saved && (
              <Typography variant="body2" sx={{ color: "text.secondary", px: 0.5 }}>
                Added {formatDate(saved.created_at)} · Updated {formatDate(saved.updated_at)}
              </Typography>
            )}

            {isAdmin && saved && (
              <Box>
                <Button color="error" variant="text" onClick={() => setConfirmDelete(true)} disabled={busy}>
                  Delete partner
                </Button>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Only for mistakes. To take a partner off the website, archive it.
                </Typography>
              </Box>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete {saved?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This cannot be undone. A partner linked to programs or stories cannot be deleted: archive it instead.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Keep it</Button>
          <Button color="error" variant="contained" onClick={remove} disabled={busy}>
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
