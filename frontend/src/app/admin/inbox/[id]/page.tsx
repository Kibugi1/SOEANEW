"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MailOutlineIcon from "@mui/icons-material/EmailOutlined";
import { ApiError, apiData, apiFetch } from "@/lib/admin/api";
import { useAdminSession } from "@/lib/admin/session";
import {
  Assignee,
  EnquiryDetail,
  EnquiryStatus,
  INBOXES,
  KIND_LABELS,
  STATUS_COLORS,
  STATUS_HELP,
  STATUS_LABELS,
  formatDateTime,
  optionLabel,
} from "@/lib/admin/inbox";

type Patch = Partial<{ status: EnquiryStatus; internal_notes: string | null; assigned_to_user_id: string | null }>;

/** One answer: a label and its value, with long text kept readable. */
function Answer({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7 }}>{children}</Box>
    </Box>
  );
}

function Answers({ enquiry }: { enquiry: EnquiryDetail }) {
  const { kind, details } = enquiry;
  const value = (field: string) => {
    const raw = details[field];
    return typeof raw === "string" && raw ? optionLabel(kind, field, raw) : null;
  };
  const items: [string, React.ReactNode][] = [];

  if (kind === "partnership") {
    const interests = Array.isArray(details.interests) ? details.interests : [];
    if (interests.length) {
      items.push([
        "Partnership areas",
        <Stack key="i" direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          {interests.map((item) => (
            <Chip key={item} size="small" label={optionLabel(kind, "interests", item)} />
          ))}
        </Stack>,
      ]);
    } else if (enquiry.partnership_category) {
      items.push(["Partnership area", enquiry.partnership_category]);
    }
    if (enquiry.experience_resources) items.push(["Experience and resources", enquiry.experience_resources]);
    if (enquiry.message) items.push(["Anything else", enquiry.message]);
  } else if (kind === "volunteer") {
    for (const [field, label] of [
      ["area", "Area of interest"],
      ["availability", "Availability"],
      ["skills", "Skills and experience"],
      ["motivation", "Why they'd like to volunteer"],
    ] as const) {
      const text = value(field);
      if (text) items.push([label, text]);
    }
  } else {
    if (enquiry.topic) items.push(["Topic", optionLabel("contact", "topic", enquiry.topic)]);
    if (enquiry.message) items.push(["Message", enquiry.message]);
  }

  return (
    <Stack spacing={3}>
      {items.map(([label, content]) => (
        <Answer key={label} label={label}>
          {content}
        </Answer>
      ))}
    </Stack>
  );
}

export default function EnquiryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAdminSession();
  const [enquiry, setEnquiry] = useState<EnquiryDetail | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiData<EnquiryDetail>(`/admin/enquiries/${id}`)
      .then((data) => {
        if (cancelled) return;
        setEnquiry(data);
        setNotes(data.internal_notes ?? "");
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError && caught.status === 404
            ? "This message does not exist. It may have been erased."
            : caught instanceof ApiError
              ? caught.message
              : "Could not load the message.",
        );
      });
    apiData<Assignee[]>("/admin/enquiries/assignees")
      .then((data) => !cancelled && setAssignees(data))
      .catch(() => {
        /* the assign picker just stays empty */
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const save = async (patch: Patch, done: string) => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await apiData<EnquiryDetail>(`/admin/enquiries/${id}`, { method: "PATCH", json: patch });
      setEnquiry(updated);
      if ("internal_notes" in patch) setNotes(updated.internal_notes ?? "");
      setToast(done);
    } catch (caught) {
      setSaveError(caught instanceof ApiError ? caught.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const erase = async () => {
    setSaving(true);
    try {
      await apiFetch(`/admin/enquiries/${id}`, { method: "DELETE" });
      router.push("/admin/inbox");
    } catch (caught) {
      setConfirmDelete(false);
      setSaveError(caught instanceof ApiError ? caught.message : "Could not erase the message.");
      setSaving(false);
    }
  };

  const back = (
    <Button component={Link} href="/admin/inbox" startIcon={<ArrowBackIcon />} sx={{ ml: -1 }}>
      Inbox
    </Button>
  );

  if (error) {
    return (
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        {back}
        <Alert severity="error">{error}</Alert>
      </Stack>
    );
  }

  if (!enquiry) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width={240} height={56} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    );
  }

  const inbox = INBOXES[enquiry.inbox];
  const subject = `Re: your ${enquiry.kind === "volunteer" ? "volunteer application" : "message"} to Square One Eco Africa${enquiry.reference ? ` (${enquiry.reference})` : ""}`;
  const mailto = `mailto:${enquiry.email}?subject=${encodeURIComponent(subject)}`;
  const notesChanged = notes.trim() !== (enquiry.internal_notes ?? "").trim();

  return (
    <>
      {back}

      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}>
        <Chip size="small" label={STATUS_LABELS[enquiry.status]} color={STATUS_COLORS[enquiry.status]} />
        <Chip size="small" variant="outlined" label={KIND_LABELS[enquiry.kind]} />
      </Stack>
      <Typography component="h1" variant="h3" sx={{ mt: 1.5, overflowWrap: "anywhere" }}>
        {enquiry.name}
      </Typography>
      {enquiry.organization && (
        <Typography variant="h6" component="p" sx={{ color: "text.secondary", fontWeight: 400 }}>
          {enquiry.organization}
        </Typography>
      )}

      {saveError && <Alert severity="error" sx={{ mt: 3 }}>{saveError}</Alert>}

      <Box
        sx={{
          mt: 4,
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 340px" },
          alignItems: "start",
        }}
      >
        {/* The message */}
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Answers enquiry={enquiry} />
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Typography component="h2" variant="h6">
              Internal notes
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Only admins and editors see these. The sender never does.
            </Typography>
            <TextField
              multiline
              minRows={3}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Call booked for Thursday; send the CECI concept note."
              sx={{ mt: 2 }}
              slotProps={{ htmlInput: { maxLength: 10000, "aria-label": "Internal notes" } }}
            />
            <Button
              variant="outlined"
              sx={{ mt: 1.5 }}
              disabled={saving || !notesChanged}
              onClick={() => save({ internal_notes: notes.trim() || null }, "Notes saved")}
            >
              Save notes
            </Button>
          </Paper>
        </Stack>

        {/* Who, where, and what happens next */}
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Button fullWidth variant="contained" href={mailto} startIcon={<MailOutlineIcon />}>
              Reply by email
            </Button>
            {enquiry.status !== "contacted" && enquiry.status !== "closed" && (
              <Button
                fullWidth
                variant="text"
                sx={{ mt: 1 }}
                disabled={saving}
                onClick={() => save({ status: "contacted" }, "Marked as contacted")}
              >
                I&apos;ve replied: mark as contacted
              </Button>
            )}
            <Divider sx={{ my: 2 }} />
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={enquiry.status}
              disabled={saving}
              onChange={(e) => save({ status: e.target.value as EnquiryStatus }, "Status updated")}
              helperText={STATUS_HELP[enquiry.status]}
            >
              {(Object.keys(STATUS_LABELS) as EnquiryStatus[]).map((status) => (
                <MenuItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              size="small"
              label="Assigned to"
              value={enquiry.assigned_to?.id ?? ""}
              disabled={saving}
              onChange={(e) =>
                save({ assigned_to_user_id: e.target.value || null }, e.target.value ? "Assigned" : "Unassigned")
              }
              sx={{ mt: 2.5 }}
            >
              <MenuItem value="">Nobody yet</MenuItem>
              {enquiry.assigned_to && !assignees.some((a) => a.id === enquiry.assigned_to!.id) && (
                <MenuItem value={enquiry.assigned_to.id}>
                  {enquiry.assigned_to.full_name ?? enquiry.assigned_to.email}
                </MenuItem>
              )}
              {assignees.map((person) => (
                <MenuItem key={person.id} value={person.id}>
                  {person.full_name ?? person.email}
                  {person.id === user?.id ? " (me)" : ""}
                </MenuItem>
              ))}
            </TextField>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Answer label="Email">
                <Box component="a" href={mailto} sx={{ color: "primary.main" }}>
                  {enquiry.email}
                </Box>
              </Answer>
              {enquiry.phone && (
                <Answer label="Phone or WhatsApp">
                  <Box component="a" href={`tel:${enquiry.phone.replace(/\s/g, "")}`} sx={{ color: "primary.main" }}>
                    {enquiry.phone}
                  </Box>
                </Answer>
              )}
              <Answer label="Routed to">
                {inbox.label} inbox
                <Typography variant="body2" component="span" sx={{ display: "block", color: "text.secondary" }}>
                  Alert sent to {inbox.email}
                </Typography>
              </Answer>
              <Answer label="Received">{formatDateTime(enquiry.created_at)}</Answer>
              {enquiry.reference && (
                <Answer label="Reference">
                  <Box component="span" sx={{ fontFamily: "monospace" }}>{enquiry.reference}</Box>
                </Answer>
              )}
              {enquiry.source_page && <Answer label="Sent from page">{enquiry.source_page}</Answer>}
              <Answer label="Consent">{enquiry.consent ? "Agreed to be contacted" : "Not given"}</Answer>
            </Stack>
          </Paper>

          {user?.role === "admin" && (
            <Box>
              <Button color="error" variant="text" onClick={() => setConfirmDelete(true)} disabled={saving}>
                Erase this message
              </Button>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                For data-removal requests. This cannot be undone.
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Erase this message for good?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {enquiry.name}&apos;s message and your notes will be permanently deleted. Use this when someone asks
            for their data to be removed. To tidy the inbox, set the status to Closed instead.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Keep it</Button>
          <Button color="error" variant="contained" onClick={erase} disabled={saving}>
            Erase permanently
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}
