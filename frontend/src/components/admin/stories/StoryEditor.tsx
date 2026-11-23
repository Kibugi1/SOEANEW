"use client";

import { useEffect, useMemo, useState } from "react";
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
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ApiError, apiData, apiFetch } from "@/lib/admin/api";
import { useAdminSession } from "@/lib/admin/session";
import {
  AdminStory,
  CONSENT_LABELS,
  ConsentStatus,
  EVENT_ROLE_LABELS,
  EventRole,
  GalleryItem,
  PickerOptions,
  STATUS_COLORS,
  STATUS_LABELS,
  StoryType,
  formatDate,
} from "@/lib/admin/stories";
import StoryGallery from "./StoryGallery";

interface Form {
  story_type: StoryType;
  title: string;
  summary: string;
  body: string;
  activity_date: string;
  event_end_date: string;
  venue: string;
  organiser: string;
  event_role: EventRole | "";
  lessons: string;
  next_step: string;
  outcomes: string;
  video_url: string;
  social_url: string;
  consent_status: ConsentStatus;
  is_confidential: boolean;
  team: { slug: string; role: "lead" | "support" }[];
  author_slugs: string[];
  program_slugs: string[];
  phase_refs: string[];
  theme_slugs: string[];
  location_slugs: string[];
  gallery: GalleryItem[];
  cover_image_id: string | null;
}

const SUMMARY_MAX = 1000;

function formFromStory(story: AdminStory | null, type: StoryType): Form {
  return {
    story_type: story?.story_type ?? type,
    title: story?.title ?? "",
    summary: story?.summary ?? "",
    body: story?.body ?? "",
    activity_date: story?.activity_date ?? "",
    event_end_date: story?.event_end_date ?? "",
    venue: story?.venue ?? "",
    organiser: story?.organiser ?? "",
    event_role: story?.event_role ?? "",
    lessons: story?.lessons ?? "",
    next_step: story?.next_step ?? "",
    outcomes: story?.outcomes ?? "",
    video_url: story?.video_url ?? "",
    social_url: story?.social_url ?? "",
    consent_status: story?.consent_status ?? "unreviewed",
    is_confidential: story?.is_confidential ?? false,
    team: story?.team.map(({ slug, role }) => ({ slug, role })) ?? [],
    author_slugs: story?.authors.map((a) => a.slug) ?? [],
    program_slugs: story?.programs.map((p) => p.slug) ?? [],
    phase_refs: story?.phases.map((p) => p.ref) ?? [],
    theme_slugs: story?.themes.map((t) => t.slug) ?? [],
    location_slugs: story?.locations.map((l) => l.slug) ?? [],
    gallery: story?.gallery ?? [],
    cover_image_id: story?.cover_image?.id ?? null,
  };
}

/** What the API expects: empty text becomes null, and manager-only fields are left out for authors. */
function payloadFrom(form: Form, manager: boolean, isNew: boolean) {
  const text = (value: string) => value.trim() || null;
  const payload: Record<string, unknown> = {
    story_type: form.story_type,
    title: form.title.trim(),
    activity_date: form.activity_date || null,
    event_end_date: form.story_type === "event" ? form.event_end_date || null : null,
    venue: form.story_type === "event" ? text(form.venue) : null,
    organiser: form.story_type === "event" ? text(form.organiser) : null,
    event_role: form.story_type === "event" ? form.event_role || null : null,
    lessons: text(form.lessons),
    next_step: text(form.next_step),
    outcomes: text(form.outcomes),
    video_url: text(form.video_url),
    social_url: text(form.social_url),
    consent_status: form.consent_status,
    team: form.team,
    program_slugs: form.program_slugs,
    phase_refs: form.phase_refs,
    theme_slugs: form.theme_slugs,
    location_slugs: form.location_slugs,
    gallery: form.gallery.map(({ media_id, caption }) => ({ media_id, caption: caption?.trim() || null })),
    cover_image_id: form.cover_image_id,
  };
  // The API rejects empty summary/body (min 1 character); leave them out until written.
  if (form.summary.trim()) payload.summary = form.summary.trim();
  if (form.body.trim()) payload.body = form.body.trim();
  if (manager) {
    payload.is_confidential = form.is_confidential;
    if (!isNew) payload.author_slugs = form.author_slugs;
  }
  return payload;
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  summary: "Summary",
  body: "Story",
  activity_date: "Date",
  event_end_date: "End date",
  event_role: "SOEA's role",
  consent_status: "Consent",
  gallery: "Photos",
  video_url: "Video link",
  social_url: "Social media link",
  publish_at: "Publish time",
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

export default function StoryEditor({ story, initialType = "story" }: { story: AdminStory | null; initialType?: StoryType }) {
  const { user } = useAdminSession();
  const router = useRouter();
  const manager = user?.role === "admin" || user?.role === "editor";
  const isNew = story === null;
  const canEdit = isNew || story.permissions.edit;

  const [saved, setSaved] = useState<AdminStory | null>(story);
  const [form, setForm] = useState<Form>(() => formFromStory(story, initialType));
  const [baseline, setBaseline] = useState<string>(() => JSON.stringify(formFromStory(story, initialType)));
  const [options, setOptions] = useState<PickerOptions | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ severity: "success" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<null | "approve" | "changes" | "delete">(null);
  const [notes, setNotes] = useState("");
  const [publishMode, setPublishMode] = useState<"now" | "later">("now");
  const [publishAt, setPublishAt] = useState("");

  const dirty = JSON.stringify(form) !== baseline;
  const permissions = saved?.permissions;

  useEffect(() => {
    apiData<PickerOptions>("/admin/options").then(setOptions).catch(() => setOptions(null));
  }, []);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const phaseOptions = useMemo(
    () => (options?.programs ?? []).filter((p) => form.program_slugs.includes(p.slug)).flatMap((p) => p.phases.map((ph) => ({ ...ph, program: p.name }))),
    [options, form.program_slugs],
  );
  const byName = <T extends { slug: string; name: string }>(list: T[] | undefined, slugs: string[]) =>
    slugs.map((slug) => list?.find((item) => item.slug === slug) ?? { slug, name: slug } as T);

  function showErrors(caught: unknown, fallback: string) {
    if (caught instanceof ApiError) {
      const fieldErrors: Record<string, string> = {};
      for (const [field, value] of Object.entries(caught.details)) {
        const first = Array.isArray(value) ? value[0] : Object.values(value).flat()[0];
        if (first) fieldErrors[field] = String(first);
      }
      setErrors(fieldErrors);
      const listed = Object.keys(fieldErrors).map((f) => FIELD_LABELS[f] ?? f.replace(/_/g, " "));
      setMessage({
        severity: "error",
        text: listed.length ? `Please check: ${listed.join(", ")}.` : caught.message,
      });
    } else {
      setMessage({ severity: "error", text: fallback });
    }
  }

  function accept(next: AdminStory, text: string) {
    setSaved(next);
    const nextForm = formFromStory(next, next.story_type);
    setForm(nextForm);
    setBaseline(JSON.stringify(nextForm));
    setErrors({});
    setMessage({ severity: "success", text });
  }

  async function save(): Promise<AdminStory | null> {
    if (!form.title.trim()) {
      setErrors({ title: "Give your story a title." });
      setMessage({ severity: "error", text: "Please check: Title." });
      return null;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload = payloadFrom(form, manager, isNew && !saved);
      const next = saved
        ? await apiData<AdminStory>(`/admin/stories/${saved.id}`, { method: "PATCH", json: payload })
        : await apiData<AdminStory>("/admin/stories", { method: "POST", json: payload });
      accept(next, "Saved.");
      if (!saved) router.replace(`/admin/stories/${next.id}`);
      return next;
    } catch (caught) {
      showErrors(caught, "Could not save. Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function act(path: string, success: string, body?: unknown) {
    setBusy(true);
    setMessage(null);
    try {
      let current = saved;
      if (dirty && canEdit) current = await save();
      if (!current) return;
      const next = await apiData<AdminStory>(`/admin/stories/${current.id}/${path}`, { method: "POST", json: body ?? {} });
      accept(next, success);
      setDialog(null);
    } catch (caught) {
      setDialog(null);
      showErrors(caught, "That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!saved) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/stories/${saved.id}`, { method: "DELETE" });
      router.replace("/admin/stories");
    } catch (caught) {
      setDialog(null);
      showErrors(caught, "Could not delete.");
      setBusy(false);
    }
  }

  const disabled = !canEdit || busy;
  const isEvent = form.story_type === "event";
  const err = (field: string) => ({ error: Boolean(errors[field]), helperText: errors[field] });

  return (
    <>
      <Button component={Link} href="/admin/stories" size="small" sx={{ mb: 2 }}>
        ← All stories
      </Button>

      <Grid container spacing={3}>
        {/* ---------------- Form ---------------- */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <Box>
              <Typography component="h1" variant="h3">
                {isNew && !saved ? (isEvent ? "Record an event" : "Write a story") : form.title || "Untitled"}
              </Typography>
              {!canEdit && saved && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {saved.status === "IN_REVIEW"
                    ? "This is with the reviewer. You can edit it again if changes are requested."
                    : "This story cannot be edited in its current state."}
                </Alert>
              )}
            </Box>

            <Section title="What happened">
              <ToggleButtonGroup
                exclusive
                value={form.story_type}
                onChange={(_, value: StoryType | null) => value && set("story_type", value)}
                disabled={disabled}
                size="small"
                aria-label="Type"
              >
                <ToggleButton value="story">Story</ToggleButton>
                <ToggleButton value="event">Event</ToggleButton>
              </ToggleButtonGroup>
              <TextField
                label="Title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                disabled={disabled}
                required
                fullWidth
                slotProps={{ htmlInput: { maxLength: 255 } }}
                {...err("title")}
              />
              <TextField
                label="Summary"
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                disabled={disabled}
                multiline
                minRows={3}
                fullWidth
                slotProps={{ htmlInput: { maxLength: SUMMARY_MAX } }}
                error={Boolean(errors.summary)}
                helperText={errors.summary ?? `Two or three sentences shown on story cards. ${form.summary.length}/${SUMMARY_MAX}`}
              />
              <TextField
                label={isEvent ? "What happened at the event" : "Your story"}
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                disabled={disabled}
                multiline
                minRows={10}
                fullWidth
                error={Boolean(errors.body)}
                helperText={errors.body ?? "Leave a blank line between paragraphs. **Bold**, and lines starting with “- ” become a list."}
              />
              {!isEvent && (
                <TextField
                  label="When did it happen?"
                  type="date"
                  value={form.activity_date}
                  onChange={(e) => set("activity_date", e.target.value)}
                  disabled={disabled}
                  sx={{ maxWidth: 240 }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...err("activity_date")}
                />
              )}
            </Section>

            {isEvent && (
              <Section title="The event" hint="Events need a date and SOEA's role before they can be published.">
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Date (first day)"
                    type="date"
                    value={form.activity_date}
                    onChange={(e) => set("activity_date", e.target.value)}
                    disabled={disabled}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                    {...err("activity_date")}
                  />
                  <TextField
                    label="End date (if more than one day)"
                    type="date"
                    value={form.event_end_date}
                    onChange={(e) => set("event_end_date", e.target.value)}
                    disabled={disabled}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                    {...err("event_end_date")}
                  />
                </Stack>
                <TextField
                  select
                  label="SOEA's role"
                  value={form.event_role}
                  onChange={(e) => set("event_role", e.target.value as EventRole)}
                  disabled={disabled}
                  fullWidth
                  {...err("event_role")}
                >
                  {Object.entries(EVENT_ROLE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Venue" value={form.venue} onChange={(e) => set("venue", e.target.value)} disabled={disabled} fullWidth slotProps={{ htmlInput: { maxLength: 200 } }} />
                <TextField label="Organised by" value={form.organiser} onChange={(e) => set("organiser", e.target.value)} disabled={disabled} fullWidth slotProps={{ htmlInput: { maxLength: 300 } }} />
              </Section>
            )}

            <Section title="People" hint="The story appears on the profile of everyone listed here.">
              {form.team.map((member, index) => (
                <Stack key={member.slug} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography sx={{ flex: 1 }}>
                    {options?.profiles.find((p) => p.slug === member.slug)?.name ?? member.slug}
                  </Typography>
                  <TextField
                    select
                    size="small"
                    value={member.role}
                    onChange={(e) =>
                      set("team", form.team.map((m, i) => (i === index ? { ...m, role: e.target.value as "lead" | "support" } : m)))
                    }
                    disabled={disabled}
                    slotProps={{ htmlInput: { "aria-label": "Role" } }}
                  >
                    <MenuItem value="lead">Led it</MenuItem>
                    <MenuItem value="support">Supported</MenuItem>
                  </TextField>
                  <IconButton aria-label="Remove person" onClick={() => set("team", form.team.filter((_, i) => i !== index))} disabled={disabled}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Autocomplete
                options={(options?.profiles ?? []).filter((p) => !form.team.some((m) => m.slug === p.slug))}
                getOptionLabel={(p) => p.name}
                value={null}
                onChange={(_, person) =>
                  person && set("team", [...form.team, { slug: person.slug, role: form.team.length ? "support" : "lead" }])
                }
                disabled={disabled}
                blurOnSelect
                renderInput={(params) => <TextField {...params} label="Add a team member" size="small" />}
              />
              {manager && saved && (
                <Autocomplete
                  multiple
                  options={options?.profiles ?? []}
                  getOptionLabel={(p) => p.name}
                  isOptionEqualToValue={(a, b) => a.slug === b.slug}
                  value={byName(options?.profiles, form.author_slugs)}
                  onChange={(_, value) => set("author_slugs", value.map((p) => p.slug))}
                  disabled={disabled}
                  renderInput={(params) => <TextField {...params} label="Byline (written by)" size="small" />}
                />
              )}
            </Section>

            <Section title="Where it belongs" hint="Tagging shows the story on those program, place and theme pages too.">
              <Autocomplete
                multiple
                options={options?.programs ?? []}
                getOptionLabel={(p) => p.name}
                isOptionEqualToValue={(a, b) => a.slug === b.slug}
                value={byName(options?.programs, form.program_slugs)}
                onChange={(_, value) => {
                  const slugs = value.map((p) => p.slug);
                  setForm((f) => ({ ...f, program_slugs: slugs, phase_refs: f.phase_refs.filter((ref) => slugs.includes(ref.split("/")[0])) }));
                }}
                disabled={disabled}
                renderInput={(params) => <TextField {...params} label="Programs" />}
              />
              {phaseOptions.length > 0 && (
                <Autocomplete
                  multiple
                  options={phaseOptions}
                  getOptionLabel={(p) => `${p.program}: ${p.name}`}
                  isOptionEqualToValue={(a, b) => a.ref === b.ref}
                  value={phaseOptions.filter((p) => form.phase_refs.includes(p.ref))}
                  onChange={(_, value) => set("phase_refs", value.map((p) => p.ref))}
                  disabled={disabled}
                  renderInput={(params) => <TextField {...params} label="Program phase" />}
                />
              )}
              <Autocomplete
                multiple
                options={options?.themes ?? []}
                getOptionLabel={(t) => t.name}
                isOptionEqualToValue={(a, b) => a.slug === b.slug}
                value={byName(options?.themes, form.theme_slugs)}
                onChange={(_, value) => set("theme_slugs", value.map((t) => t.slug))}
                disabled={disabled}
                renderInput={(params) => <TextField {...params} label="Focus areas" />}
              />
              <Autocomplete
                multiple
                options={options?.places ?? []}
                getOptionLabel={(p) => p.name}
                isOptionEqualToValue={(a, b) => a.slug === b.slug}
                value={byName(options?.places, form.location_slugs)}
                onChange={(_, value) => set("location_slugs", value.map((p) => p.slug))}
                disabled={disabled}
                renderInput={(params) => <TextField {...params} label="Places" />}
              />
            </Section>

            <Section title="Photos">
              <StoryGallery
                items={form.gallery}
                coverId={form.cover_image_id}
                disabled={disabled}
                onChange={(items) => set("gallery", items)}
                onCoverChange={(id) => set("cover_image_id", id)}
              />
              {errors.gallery && <Alert severity="error">{errors.gallery}</Alert>}
            </Section>

            <Section title="Learning and next steps" hint="Optional.">
              <TextField label="What we learned" value={form.lessons} onChange={(e) => set("lessons", e.target.value)} disabled={disabled} multiline minRows={2} fullWidth />
              <TextField label="What happens next" value={form.next_step} onChange={(e) => set("next_step", e.target.value)} disabled={disabled} multiline minRows={2} fullWidth />
              <TextField
                label="Outcomes"
                value={form.outcomes}
                onChange={(e) => set("outcomes", e.target.value)}
                disabled={disabled}
                multiline
                minRows={2}
                fullWidth
                helperText="Only results that have been checked; leave empty otherwise."
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="Video link" value={form.video_url} onChange={(e) => set("video_url", e.target.value)} disabled={disabled} fullWidth placeholder="https://" {...err("video_url")} />
                <TextField label="Social media post" value={form.social_url} onChange={(e) => set("social_url", e.target.value)} disabled={disabled} fullWidth placeholder="https://" {...err("social_url")} />
              </Stack>
            </Section>

            <Section title="Consent" hint="Required before this can be sent for review.">
              <RadioGroup value={form.consent_status} onChange={(e) => set("consent_status", e.target.value as ConsentStatus)}>
                {(["confirmed", "not_required", "withdrawn"] as ConsentStatus[]).map((value) => (
                  <FormControlLabel
                    key={value}
                    value={value}
                    disabled={disabled}
                    control={<Radio />}
                    label={
                      <Box sx={{ py: 0.5 }}>
                        <Typography>{CONSENT_LABELS[value].label}</Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>{CONSENT_LABELS[value].help}</Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
              {errors.consent_status && <Alert severity="error">{errors.consent_status}</Alert>}
              {manager && (
                <FormControlLabel
                  control={<Switch checked={form.is_confidential} onChange={(e) => set("is_confidential", e.target.checked)} disabled={disabled} />}
                  label="Confidential: never show on the website"
                />
              )}
            </Section>
          </Stack>
        </Grid>

        {/* ---------------- Status and actions ---------------- */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, position: { md: "sticky" }, top: { md: 24 } }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="eyebrow" component="p" sx={{ color: "text.secondary" }}>Status</Typography>
                <Chip
                  sx={{ mt: 1 }}
                  label={saved ? STATUS_LABELS[saved.status] : "Not saved yet"}
                  color={saved ? STATUS_COLORS[saved.status] : "default"}
                />
              </Box>

              {saved?.review_notes && (
                <Alert severity={saved.status === "CHANGES_REQUESTED" ? "warning" : "info"}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Reviewer notes</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{saved.review_notes}</Typography>
                </Alert>
              )}

              {message && (
                <Alert severity={message.severity} onClose={() => setMessage(null)}>{message.text}</Alert>
              )}

              {canEdit && (
                <Button variant={dirty || !saved ? "contained" : "outlined"} onClick={() => void save()} disabled={busy || (!dirty && Boolean(saved))}>
                  {busy ? "Working…" : dirty || !saved ? "Save" : "Saved"}
                </Button>
              )}

              {/* The founder reviews; on her own drafts "Publish" replaces "Submit". */}
              {(permissions ? permissions.submit && !permissions.approve : user?.role !== "admin") && (
                <Button variant="contained" color="secondary" disabled={busy} onClick={() => void act("submit", "Sent for review. You'll get an email when it's reviewed.")}>
                  Submit for review
                </Button>
              )}

              {permissions?.approve && (
                <Button variant="contained" color="success" disabled={busy} onClick={() => setDialog("approve")}>
                  {saved?.status === "IN_REVIEW" ? "Approve and publish" : "Publish"}
                </Button>
              )}
              {permissions?.request_changes && (
                <Button variant="outlined" color="warning" disabled={busy} onClick={() => setDialog("changes")}>
                  Request changes
                </Button>
              )}
              {permissions?.unpublish && (
                <Button variant="outlined" disabled={busy} onClick={() => void act("unpublish", "Unpublished. It is no longer on the website.")}>
                  Unpublish
                </Button>
              )}
              {saved?.status === "ARCHIVED" && user?.role === "admin" && (
                <Button variant="outlined" disabled={busy} onClick={() => void act("reopen", "Reopened as a draft.")}>
                  Reopen as draft
                </Button>
              )}

              <Divider />
              <Stack spacing={0.5}>
                {saved?.created_by && <Typography variant="body2">Written by {saved.created_by.full_name}</Typography>}
                {saved?.submitted_at && <Typography variant="body2">Submitted {formatDate(saved.submitted_at)}</Typography>}
                {saved?.reviewed_by && <Typography variant="body2">Reviewed by {saved.reviewed_by.full_name}, {formatDate(saved.reviewed_at)}</Typography>}
                {saved?.published_at && saved.status === "PUBLISHED" && (
                  <Typography variant="body2">
                    {new Date(saved.published_at) > new Date() ? "Scheduled for " : "Published "}
                    {formatDate(saved.published_at)}
                  </Typography>
                )}
              </Stack>

              {permissions?.delete && (
                <Button color="error" size="small" disabled={busy} onClick={() => setDialog("delete")} sx={{ alignSelf: "flex-start" }}>
                  Delete
                </Button>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* ---------------- Dialogs ---------------- */}
      <Dialog open={dialog === "approve"} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>Publish “{form.title}”</DialogTitle>
        <DialogContent>
          <RadioGroup value={publishMode} onChange={(e) => setPublishMode(e.target.value as "now" | "later")}>
            <FormControlLabel value="now" control={<Radio />} label="Publish now" />
            <FormControlLabel value="later" control={<Radio />} label="Schedule for later" />
          </RadioGroup>
          {publishMode === "later" && (
            <TextField
              type="datetime-local"
              label="Publish on"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              slotProps={{ inputLabel: { shrink: true } }}
              {...err("publish_at")}
            />
          )}
          <TextField label="Note to the writer (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} fullWidth sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            disabled={busy || (publishMode === "later" && !publishAt)}
            onClick={() =>
              void act("approve", publishMode === "now" ? "Published. It's now on the website." : "Scheduled.", {
                publish_at: publishMode === "later" && publishAt ? new Date(publishAt).toISOString() : null,
                notes: notes.trim() || null,
              })
            }
          >
            {publishMode === "now" ? "Publish now" : "Schedule"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "changes"} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Request changes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            The writer gets an email and sees your notes next to their story.
          </Typography>
          <TextField label="What needs to change?" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={4} fullWidth autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={busy || !notes.trim()}
            onClick={() => void act("request-changes", "Sent back with your notes.", { notes: notes.trim() })}
          >
            Send back
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "delete"} onClose={() => setDialog(null)}>
        <DialogTitle>Delete this story?</DialogTitle>
        <DialogContent>
          <Typography>This cannot be undone. The photos stay in Photos &amp; files.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={busy} onClick={() => void remove()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
