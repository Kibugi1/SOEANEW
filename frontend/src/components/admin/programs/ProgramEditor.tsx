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
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ImageField, { ImageValue } from "@/components/admin/ImageField";
import { ApiError, Collection, apiData, apiFetch } from "@/lib/admin/api";
import { useAdminSession } from "@/lib/admin/session";
import {
  AdminProgram,
  PROGRESS_LABELS,
  PUBLICATION_COLORS,
  PUBLICATION_HELP,
  PUBLICATION_LABELS,
  ProgressStatus,
  PublicationStatus,
} from "@/lib/admin/programs";
import { PickerOptions, formatDate } from "@/lib/admin/stories";

const SUMMARY_MAX = 500;
const SHORT_NAME_MAX = 30;

interface Form {
  title: string;
  short_name: string;
  slug: string;
  summary: string;
  body: string;
  status: ProgressStatus;
  is_featured: boolean;
  start_date: string;
  end_date: string;
  sort_order: string;
  parent_slug: string;
  lead_profile_slug: string;
  contact_email: string;
  cta_label: string;
  cta_url: string;
  cta_pending: boolean;
  cover: ImageValue | null;
  theme_slugs: string[];
  primary_theme_slug: string;
  location_slugs: string[];
  partner_slugs: string[];
}

type Named = { slug: string; name: string };

function formFrom(program: AdminProgram | null): Form {
  return {
    title: program?.title ?? "",
    short_name: program?.short_name ?? "",
    slug: program?.slug ?? "",
    summary: program?.summary ?? "",
    body: program?.body ?? "",
    status: program?.status ?? "in_development",
    is_featured: program?.is_featured ?? false,
    start_date: program?.start_date ?? "",
    end_date: program?.end_date ?? "",
    sort_order: String(program?.sort_order ?? 0),
    parent_slug: program?.parent?.slug ?? "",
    lead_profile_slug: program?.lead?.slug ?? "",
    contact_email: program?.contact_email ?? "",
    cta_label: program?.cta_label ?? "",
    cta_url: program?.cta_url ?? "",
    cta_pending: program?.cta_pending ?? false,
    cover: program?.cover_image
      ? { id: program.cover_image.id, url: program.cover_image.url, alt_text: program.cover_image.alt_text }
      : null,
    theme_slugs: program?.themes.map((t) => t.slug) ?? [],
    primary_theme_slug: program?.primary_theme ?? "",
    location_slugs: program?.locations.map((l) => l.slug) ?? [],
    partner_slugs: program?.partners.map((p) => p.slug) ?? [],
  };
}

// Alt text is saved on the image directly, so only which image is linked counts as a change.
const comparable = (f: Form) => JSON.stringify({ ...f, cover: f.cover?.id ?? null });

const orNull = (value: string) => (value.trim() ? value.trim() : null);

function payloadFrom(form: Form, isNew: boolean) {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    short_name: orNull(form.short_name),
    summary: form.summary.trim(),
    body: orNull(form.body),
    status: form.status,
    is_featured: form.is_featured,
    start_date: orNull(form.start_date),
    end_date: orNull(form.end_date),
    sort_order: Number.parseInt(form.sort_order, 10) || 0,
    parent_slug: orNull(form.parent_slug),
    lead_profile_slug: orNull(form.lead_profile_slug),
    contact_email: orNull(form.contact_email),
    cta_label: orNull(form.cta_label),
    cta_url: form.cta_pending ? null : orNull(form.cta_url),
    cta_pending: form.cta_pending,
    cover_image_id: form.cover?.id ?? null,
    theme_slugs: form.theme_slugs,
    primary_theme_slug: form.theme_slugs.includes(form.primary_theme_slug) ? form.primary_theme_slug : null,
    location_slugs: form.location_slugs,
    partner_slugs: form.partner_slugs,
  };
  // A new program gets its web address from the short name or title unless one is typed.
  if (!isNew || form.slug.trim()) payload.slug = form.slug.trim();
  return payload;
}

const FIELD_LABELS: Record<string, string> = {
  title: "Name",
  short_name: "Short name",
  slug: "Web address",
  summary: "Summary",
  body: "Description",
  status: "Progress",
  start_date: "Start date",
  end_date: "End date",
  sort_order: "Order",
  parent_slug: "Sits under",
  lead_profile_slug: "Lead",
  contact_email: "Contact email",
  cta_label: "Button text",
  cta_url: "Button link",
  cover_image_id: "Cover photo",
  theme_slugs: "Themes",
  primary_theme_slug: "Main theme",
  location_slugs: "Places",
  partner_slugs: "Partners",
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

export default function ProgramEditor({ program }: { program: AdminProgram | null }) {
  const { user } = useAdminSession();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const [saved, setSaved] = useState<AdminProgram | null>(program);
  const [form, setForm] = useState<Form>(() => formFrom(program));
  const [baseline, setBaseline] = useState(() => comparable(formFrom(program)));
  const [options, setOptions] = useState<PickerOptions | null>(null);
  const [partners, setPartners] = useState<Named[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ severity: "success" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isNew = saved === null;
  const publication: PublicationStatus = saved?.publication_status ?? "draft";
  // Editors prepare drafts; once a program is public only an admin can change it.
  const canEdit = isAdmin || publication === "draft";
  const dirty = comparable(form) !== baseline;
  const disabled = !canEdit || busy;

  useEffect(() => {
    apiData<PickerOptions>("/admin/options").then(setOptions).catch(() => setOptions(null));
    apiFetch<Collection<Named & { id: string }>>("/admin/partners?per_page=50")
      .then((data) => setPartners(data.data.map(({ slug, name }) => ({ slug, name }))))
      .catch(() => setPartners([]));
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const err = (field: string) => ({ error: Boolean(errors[field]), helperText: errors[field] });
  const pick = (list: Named[] | undefined, slugs: string[]) =>
    slugs.map((slug) => list?.find((item) => item.slug === slug) ?? { slug, name: slug });

  // A program cannot sit under itself or under one of its own projects.
  const ownProjects = new Set(saved?.sub_programs.map((p) => p.slug) ?? []);
  const parentOptions = (options?.programs ?? []).filter((p) => p.slug !== saved?.slug && !ownProjects.has(p.slug));
  const themeOptions = options?.themes ?? [];
  const placeOptions = (options?.places ?? []).map((p) => ({ slug: p.slug, name: p.name, type: p.type }));
  const selectedThemes = pick(themeOptions, form.theme_slugs);

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

  function validate(): boolean {
    const found: Record<string, string> = {};
    if (!form.title.trim()) found.title = "Give the program a name.";
    if (!form.summary.trim()) found.summary = "Add a one-sentence summary.";
    if (form.cta_label.trim() && !form.cta_pending && !form.cta_url.trim()) {
      found.cta_url = "Add a link, or mark the button as coming soon.";
    }
    setErrors(found);
    if (Object.keys(found).length) {
      setMessage({ severity: "error", text: `Please check: ${Object.keys(found).map((f) => FIELD_LABELS[f]).join(", ")}.` });
      return false;
    }
    return true;
  }

  /** Save the form; optionally change the publication status in the same request. */
  async function save(publish?: PublicationStatus, done = "Saved.") {
    if (canEdit && !validate()) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = canEdit ? payloadFrom(form, isNew) : {};
      if (publish) payload.publication_status = publish;
      const next = saved
        ? await apiData<AdminProgram>(`/admin/programs/${saved.id}`, { method: "PATCH", json: payload })
        : await apiData<AdminProgram>("/admin/programs", { method: "POST", json: payload });
      setSaved(next);
      const nextForm = formFrom(next);
      setForm(nextForm);
      setBaseline(comparable(nextForm));
      setErrors({});
      setMessage({ severity: "success", text: done });
      if (!saved) router.replace(`/admin/programs/${next.id}`);
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
      await apiFetch(`/admin/programs/${saved.id}`, { method: "DELETE" });
      router.replace("/admin/programs");
    } catch (caught) {
      setConfirmDelete(false);
      showErrors(caught, "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <>
      <Button component={Link} href="/admin/programs" size="small" sx={{ mb: 2 }}>
        ← All programs
      </Button>

      <Grid container spacing={3}>
        {/* ---------------- Form ---------------- */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <Box>
              <Typography component="h1" variant="h3">
                {isNew ? "Add a program" : saved.title}
              </Typography>
              {!canEdit && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This program is {PUBLICATION_LABELS[publication].toLowerCase()}. Only an admin can change it.
                </Alert>
              )}
            </Box>

            <Section title="About the program">
              <TextField
                label="Name"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                disabled={disabled}
                required
                fullWidth
                placeholder="e.g. Community Environmental Champions Initiative"
                slotProps={{ htmlInput: { maxLength: 200 } }}
                {...err("title")}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Short name"
                  value={form.short_name}
                  onChange={(e) => set("short_name", e.target.value)}
                  disabled={disabled}
                  fullWidth
                  placeholder="e.g. CECI"
                  slotProps={{ htmlInput: { maxLength: SHORT_NAME_MAX } }}
                  error={Boolean(errors.short_name)}
                  helperText={errors.short_name ?? "Optional. Used on buttons and cards."}
                />
                <TextField
                  label="Web address"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  disabled={disabled}
                  fullWidth
                  placeholder={isNew ? "Made from the name" : undefined}
                  slotProps={{ htmlInput: { maxLength: 120 } }}
                  error={Boolean(errors.slug)}
                  helperText={
                    errors.slug ??
                    (isNew ? "Leave empty to make one from the short name." : "Changing this breaks old links.")
                  }
                />
              </Stack>
              <TextField
                label="Summary"
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                disabled={disabled}
                required
                multiline
                minRows={2}
                fullWidth
                slotProps={{ htmlInput: { maxLength: SUMMARY_MAX } }}
                error={Boolean(errors.summary)}
                helperText={errors.summary ?? `One sentence for program cards. ${form.summary.length}/${SUMMARY_MAX}`}
              />
              <TextField
                label="Description"
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                disabled={disabled}
                multiline
                minRows={8}
                fullWidth
                error={Boolean(errors.body)}
                helperText={errors.body ?? "Leave a blank line between paragraphs. **Bold**, and lines starting with “- ” become a list."}
              />
            </Section>

            <Section title="Cover photo" hint="Shown on the program card and across the top of the program page.">
              <ImageField
                label="Cover photo"
                hint="A landscape photo works best (JPEG, PNG or WebP, up to 10 MB). Only use photos where everyone recognisable has agreed to appear."
                value={form.cover}
                onChange={(cover) => set("cover", cover)}
                disabled={disabled}
                altPlaceholder="e.g. Waste pickers at a CECI training session in Dandora"
                previewHeight={220}
                error={errors.cover_image_id}
              />
            </Section>

            <Section title="Progress" hint="What visitors see as the program's badge and dates.">
              <TextField
                select
                label="Progress"
                value={form.status}
                onChange={(e) => set("status", e.target.value as ProgressStatus)}
                disabled={disabled}
                fullWidth
                {...err("status")}
              >
                {(Object.keys(PROGRESS_LABELS) as ProgressStatus[]).map((key) => (
                  <MenuItem key={key} value={key}>{PROGRESS_LABELS[key]}</MenuItem>
                ))}
              </TextField>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Start date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                  disabled={disabled}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...err("start_date")}
                />
                <TextField
                  label="End date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => set("end_date", e.target.value)}
                  disabled={disabled}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={Boolean(errors.end_date)}
                  helperText={errors.end_date ?? "Leave empty if ongoing."}
                />
              </Stack>
            </Section>

            <Section title="Where it sits and who leads it">
              <TextField
                select
                label="Sits under"
                value={form.parent_slug}
                onChange={(e) => set("parent_slug", e.target.value)}
                disabled={disabled}
                fullWidth
                error={Boolean(errors.parent_slug)}
                helperText={errors.parent_slug ?? "Choose a program if this is a project within it, like JEET Champions under CECI."}
              >
                <MenuItem value="">Nothing: this is a program in its own right</MenuItem>
                {parentOptions.map((p) => (
                  <MenuItem key={p.slug} value={p.slug}>{p.title}</MenuItem>
                ))}
              </TextField>
              {saved && saved.sub_programs.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>Projects under this program</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                    {saved.sub_programs.map((p) => <Chip key={p.slug} label={p.title} size="small" />)}
                  </Stack>
                </Box>
              )}
              <Autocomplete
                options={options?.profiles ?? []}
                getOptionLabel={(p) => (p.role_title ? `${p.name} · ${p.role_title}` : p.name)}
                isOptionEqualToValue={(a, b) => a.slug === b.slug}
                value={options?.profiles.find((p) => p.slug === form.lead_profile_slug) ?? null}
                onChange={(_, person) => set("lead_profile_slug", person?.slug ?? "")}
                disabled={disabled}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Lead"
                    error={Boolean(errors.lead_profile_slug)}
                    helperText={errors.lead_profile_slug ?? "Shown on the program page while their profile is published."}
                  />
                )}
              />
              <TextField
                label="Contact email"
                type="email"
                value={form.contact_email}
                onChange={(e) => set("contact_email", e.target.value)}
                disabled={disabled}
                fullWidth
                placeholder="e.g. c.atueyi@sq1ecoafrica.org"
                slotProps={{ htmlInput: { maxLength: 254 } }}
                {...err("contact_email")}
              />
            </Section>

            <Section title="Themes, places and partners" hint="Links this program to those pages on the website.">
              <Autocomplete
                multiple
                options={themeOptions}
                getOptionLabel={(t) => t.name}
                isOptionEqualToValue={(a, b) => a.slug === b.slug}
                value={selectedThemes}
                onChange={(_, value) => set("theme_slugs", value.map((t) => t.slug))}
                disabled={disabled}
                renderInput={(params) => <TextField {...params} label="Themes" {...err("theme_slugs")} />}
              />
              {form.theme_slugs.length > 1 && (
                <TextField
                  select
                  label="Main theme"
                  value={form.theme_slugs.includes(form.primary_theme_slug) ? form.primary_theme_slug : ""}
                  onChange={(e) => set("primary_theme_slug", e.target.value)}
                  disabled={disabled}
                  fullWidth
                  error={Boolean(errors.primary_theme_slug)}
                  helperText={errors.primary_theme_slug ?? "Optional. The theme this program is best known for."}
                >
                  <MenuItem value="">No main theme</MenuItem>
                  {selectedThemes.map((t) => (
                    <MenuItem key={t.slug} value={t.slug}>{t.name}</MenuItem>
                  ))}
                </TextField>
              )}
              <Autocomplete
                multiple
                options={placeOptions}
                getOptionLabel={(p) => p.name}
                groupBy={(p) => ("type" in p ? `${String(p.type)[0].toUpperCase()}${String(p.type).slice(1)}` : "")}
                isOptionEqualToValue={(a, b) => a.slug === b.slug}
                value={pick(placeOptions, form.location_slugs)}
                onChange={(_, value) => set("location_slugs", value.map((p) => p.slug))}
                disabled={disabled}
                renderInput={(params) => <TextField {...params} label="Places" {...err("location_slugs")} />}
              />
              <Autocomplete
                multiple
                options={partners}
                getOptionLabel={(p) => p.name}
                isOptionEqualToValue={(a, b) => a.slug === b.slug}
                value={pick(partners, form.partner_slugs)}
                onChange={(_, value) => set("partner_slugs", value.map((p) => p.slug))}
                disabled={disabled}
                noOptionsText="No partners yet. Add them under Partners."
                renderInput={(params) => <TextField {...params} label="Partners" {...err("partner_slugs")} />}
              />
            </Section>

            <Section title="Call to action" hint="Optional button on the program page, e.g. “Help shape the first cohort”.">
              <TextField
                label="Button text"
                value={form.cta_label}
                onChange={(e) => set("cta_label", e.target.value)}
                disabled={disabled}
                fullWidth
                slotProps={{ htmlInput: { maxLength: 120 } }}
                {...err("cta_label")}
              />
              <FormControlLabel
                control={
                  <Switch checked={form.cta_pending} onChange={(e) => set("cta_pending", e.target.checked)} disabled={disabled} />
                }
                label="Link coming soon (show the button without a link for now)"
              />
              {!form.cta_pending && (
                <TextField
                  label="Button link"
                  value={form.cta_url}
                  onChange={(e) => set("cta_url", e.target.value)}
                  disabled={disabled}
                  fullWidth
                  placeholder="/partner-with-us or https://…"
                  slotProps={{ htmlInput: { maxLength: 500 } }}
                  error={Boolean(errors.cta_url)}
                  helperText={errors.cta_url ?? "A page on this site (starting with /) or a full web address."}
                />
              )}
            </Section>
          </Stack>
        </Grid>

        {/* ---------------- Side panel ---------------- */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2} sx={{ position: { md: "sticky" }, top: { md: 88 } }}>
            {message && <Alert severity={message.severity}>{message.text}</Alert>}

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Chip label={PUBLICATION_LABELS[publication]} color={PUBLICATION_COLORS[publication]} size="small" />
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                {PUBLICATION_HELP[publication]}
                {!isAdmin && publication === "draft" ? " An admin publishes it when it's ready." : ""}
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
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} disabled={disabled} />
                  }
                  label="Featured program"
                />
                <TextField
                  label="Order"
                  type="number"
                  size="small"
                  value={form.sort_order}
                  onChange={(e) => set("sort_order", e.target.value)}
                  disabled={disabled}
                  slotProps={{ htmlInput: { min: 0, max: 10000 } }}
                  error={Boolean(errors.sort_order)}
                  helperText={errors.sort_order ?? "Lower numbers come first in lists."}
                />
              </Stack>
            </Paper>

            {saved && (
              <Typography variant="body2" sx={{ color: "text.secondary", px: 0.5 }}>
                Added {formatDate(saved.created_at)} · Updated {formatDate(saved.updated_at)}
              </Typography>
            )}

            {isAdmin && saved && (
              <Box>
                <Button color="error" variant="text" onClick={() => setConfirmDelete(true)} disabled={busy}>
                  Delete program
                </Button>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Only for mistakes. To take a program off the website, archive it.
                </Typography>
              </Box>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete {saved?.title}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This cannot be undone. Programs with projects under them, or with linked stories or team profiles,
            cannot be deleted: archive them instead.
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
