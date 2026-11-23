"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import JourneyField from "@/components/journey/JourneyField";
import { resolve, type Answers, type JourneyConfig, type JourneyField as Field } from "@/components/journey/types";
import { createSubmission, submissionErrorMessage, type AnswerValue, type Submission } from "@/lib/submissions";

/** Submissions faster than this are treated as automated (anti-spam). */
const MIN_HUMAN_MS = 4000;
const SECONDS_PER_STEP = 15;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+()\d\s-]{7,20}$/;

function validateField(field: Field, value: AnswerValue | undefined): string | undefined {
  const isEmpty =
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0);

  if (isEmpty) {
    if (field.optional) return undefined;
    if (field.type === "multichoice") return "Choose at least one option to continue.";
    if (field.type === "choice") return "Choose an option to continue.";
    return `Please add your ${field.label.toLowerCase()} to continue.`;
  }
  if (field.type === "email" && typeof value === "string" && !EMAIL_PATTERN.test(value.trim())) {
    return "That email address doesn't look quite right.";
  }
  if (field.minLength && typeof value === "string" && value.trim().length < field.minLength) {
    return `Please write at least ${field.minLength} characters.`;
  }
  if (field.type === "tel" && typeof value === "string" && !PHONE_PATTERN.test(value.trim())) {
    return "Use digits, spaces and an optional + country code.";
  }
  return undefined;
}

function formatAnswer(field: Field, value: AnswerValue | undefined) {
  const label = (item: string) => field.options?.find((option) => option.value === item)?.label ?? item;
  if (Array.isArray(value)) return value.map(label).join(", ");
  if (typeof value === "string" && value.trim()) return label(value);
  return "Not provided";
}

function timeLeftLabel(remainingSteps: number) {
  const seconds = remainingSteps * SECONDS_PER_STEP;
  if (seconds <= 30) return "Almost there";
  if (seconds < 60) return "Less than a minute left";
  const minutes = Math.round(seconds / 60);
  return `About ${minutes} minute${minutes === 1 ? "" : "s"} left`;
}

type JourneyFlowProps = {
  config: JourneyConfig;
  /** Answers filled in before the journey starts, e.g. a selected program. */
  initialAnswers?: Answers;
};

/**
 * One-question-at-a-time journey used for every enquiry on the site.
 * Configure it with a JourneyConfig; it handles progress, validation,
 * review, anti-spam checks and the thank-you screen.
 */
export default function JourneyFlow({ config, initialAnswers = {} }: JourneyFlowProps) {
  const reduceMotion = useReducedMotion();
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const startedAt = useRef<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // True once the person has moved past the first screen; avoids stealing focus on page load.
  const [hasMoved, setHasMoved] = useState(false);

  const { steps } = config;
  const reviewIndex = steps.length;
  const totalStages = steps.length + 1;
  const isReview = index === reviewIndex && !submission;
  const step = index < steps.length ? steps[index] : null;
  const completed = submission ? totalStages : index;
  const percent = Math.round((completed / totalStages) * 100);

  useEffect(() => {
    startedAt.current ??= Date.now();
  }, []);

  // Move focus to the new question so screen readers announce it.
  useEffect(() => {
    if (hasMoved) headingRef.current?.focus();
  }, [hasMoved, index, submission]);

  const goTo = (next: number) => {
    setHasMoved(true);
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  const setAnswer = (name: string, value: AnswerValue) => {
    setAnswers((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const rest = { ...current };
      delete rest[name];
      return rest;
    });
  };

  const validateStep = (answersToCheck: Answers = answers) => {
    if (!step) return true;
    const stepErrors: Record<string, string> = {};
    for (const field of step.fields) {
      const message = validateField(field, answersToCheck[field.name]);
      if (message) stepErrors[field.name] = message;
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const next = () => {
    if (validateStep()) goTo(index + 1);
  };

  const submit = async () => {
    if (!consent) {
      setConsentError(true);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const elapsed = Date.now() - (startedAt.current ?? Date.now());
    const looksAutomated = honeypot.trim() !== "" || elapsed < MIN_HUMAN_MS;

    try {
      const saved = looksAutomated
        ? // Bots get the normal thank-you screen but nothing is stored.
          ({ reference: null } as Submission)
        : await createSubmission({
            kind: config.kind,
            answers,
            source: window.location.pathname,
          });
      setHasMoved(true);
      setDirection(1);
      setSubmission(saved);
    } catch (error) {
      setSubmitError(submissionErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 40 * direction },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 * direction },
      };

  const singleChoiceStep =
    step && step.fields.length === 1 && step.fields[0].type === "choice";

  const headingSx = {
    outline: "none",
    fontSize: { xs: "2.1rem", md: "3rem" },
    lineHeight: 1.05,
  } as const;

  return (
    <Box component="section" aria-label={config.name} sx={{ py: { xs: 4, md: 8 }, minHeight: { md: "calc(100vh - 90px)" } }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
            gap: { xs: 4, md: 10 },
            alignItems: "start",
          }}
        >
          {/* Progress tracker */}
          <Box component="aside" aria-label="Your progress" sx={{ position: { md: "sticky" }, top: { md: 120 } }}>
            <Typography variant="eyebrow" sx={{ color: "primary.dark" }}>
              {config.name}
            </Typography>
            <Stack direction="row" sx={{ mt: 1.5, mb: 1, justifyContent: "space-between", alignItems: "baseline" }}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                {submission ? "Complete" : `${percent}% complete`}
              </Typography>
              {!submission && (
                <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                  {timeLeftLabel(totalStages - index)}
                </Typography>
              )}
            </Stack>
            <LinearProgress
              variant="determinate"
              value={percent}
              aria-label={`${config.name} progress`}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: "divider",
                "& .MuiLinearProgress-bar": { borderRadius: 3, transition: "transform 400ms ease" },
              }}
            />
            <Box component="ol" sx={{ display: { xs: "none", md: "block" }, m: 0, mt: 4, p: 0, listStyle: "none" }}>
              {[...steps.map((item) => item.stage), "Review & send"].map((stage, stageIndex) => {
                const done = stageIndex < completed;
                const current = stageIndex === index && !submission;
                const canJump = done && !submission;
                return (
                  <Box
                    component="li"
                    key={stage}
                    aria-current={current ? "step" : undefined}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}
                  >
                    <Box
                      aria-hidden
                      sx={{
                        width: 24,
                        height: 24,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        border: 2,
                        borderColor: done || current ? "primary.main" : "divider",
                        bgcolor: done ? "primary.main" : "transparent",
                        color: done ? "primary.contrastText" : current ? "primary.dark" : "text.disabled",
                        transition: "all 300ms ease",
                      }}
                    >
                      {done ? <CheckRoundedIcon sx={{ fontSize: 14 }} /> : stageIndex + 1}
                    </Box>
                    {canJump ? (
                      <Box
                        component="button"
                        type="button"
                        onClick={() => goTo(stageIndex)}
                        sx={{
                          p: 0,
                          border: 0,
                          bgcolor: "transparent",
                          cursor: "pointer",
                          font: "inherit",
                          fontSize: "0.9rem",
                          color: "text.primary",
                          textAlign: "left",
                          "&:hover": { color: "primary.dark", textDecoration: "underline" },
                        }}
                      >
                        {stage}
                        <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                          {" "}(completed, edit)
                        </Box>
                      </Box>
                    ) : (
                      <Typography
                        sx={{
                          fontSize: "0.9rem",
                          fontWeight: current ? 600 : 400,
                          color: current ? "text.primary" : "text.secondary",
                        }}
                      >
                        {stage}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Current screen */}
          <Box sx={{ position: "relative", minHeight: { md: 460 }, maxWidth: 760 }}>
            {/* Honeypot: hidden from people, often filled in by bots. */}
            <Box aria-hidden sx={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }}>
              <label>
                Leave this field empty
                <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} name="website" />
              </label>
            </Box>

            <AnimatePresence mode="wait" initial={false}>
              {submission ? (
                <motion.div key="success" {...slide} transition={{ duration: 0.35 }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 56,
                      height: 56,
                      mb: 4,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "50%",
                      bgcolor: "secondary.main",
                      color: "secondary.contrastText",
                    }}
                  >
                    <CheckRoundedIcon />
                  </Box>
                  <Typography ref={headingRef} tabIndex={-1} variant="h2" component="h2" sx={headingSx}>
                    {resolve(config.success.title, answers)}
                  </Typography>
                  <Typography variant="lead" sx={{ mt: 3, color: "text.secondary" }}>
                    {resolve(config.success.body, answers)}
                  </Typography>
                  {submission.reference && (
                    <Typography sx={{ mt: 3, fontSize: "0.85rem" }}>
                      Your reference:{" "}
                      <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                        {submission.reference}
                      </Box>
                    </Typography>
                  )}
                  <Typography variant="eyebrow" component="h3" sx={{ mt: 5, mb: 2, color: "primary.dark" }}>
                    What happens next
                  </Typography>
                  <Box component="ol" sx={{ m: 0, pl: 2.5, "& li": { mb: 1.5, color: "text.secondary", lineHeight: 1.7 } }}>
                    {config.success.nextSteps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 5 }}>
                    {config.success.links.map((link, linkIndex) => (
                      <Button
                        key={link.href}
                        component={Link}
                        href={link.href}
                        variant={linkIndex === 0 ? "contained" : "outlined"}
                        endIcon={linkIndex === 0 ? <EastRoundedIcon /> : undefined}
                      >
                        {link.label}
                      </Button>
                    ))}
                  </Stack>
                </motion.div>
              ) : isReview ? (
                <motion.div key="review" {...slide} transition={{ duration: 0.3 }}>
                  <Typography variant="eyebrow" sx={{ color: "primary.dark" }}>
                    Step {totalStages} of {totalStages}
                  </Typography>
                  <Typography ref={headingRef} tabIndex={-1} variant="h2" component="h2" sx={{ ...headingSx, mt: 2 }}>
                    {resolve(config.review.title, answers)}
                  </Typography>
                  {config.review.body && (
                    <Typography variant="lead" sx={{ mt: 2, color: "text.secondary" }}>
                      {resolve(config.review.body, answers)}
                    </Typography>
                  )}

                  <Box component="dl" sx={{ mt: 4, mb: 0, borderTop: 1, borderColor: "divider" }}>
                    {steps.flatMap((item, stepIndex) =>
                      item.fields.map((field) => (
                        <Box
                          key={field.name}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr auto", sm: "180px 1fr auto" },
                            gap: { xs: 0.5, sm: 2 },
                            py: 2,
                            borderBottom: 1,
                            borderColor: "divider",
                            alignItems: "start",
                          }}
                        >
                          <Typography component="dt" sx={{ fontSize: "0.8rem", color: "text.secondary", gridColumn: { xs: "1", sm: "auto" } }}>
                            {field.label}
                          </Typography>
                          <Typography component="dd" sx={{ m: 0, fontSize: "0.95rem", whiteSpace: "pre-wrap", wordBreak: "break-word", gridColumn: { xs: "1", sm: "auto" }, gridRow: { xs: 2, sm: "auto" } }}>
                            {formatAnswer(field, answers[field.name])}
                          </Typography>
                          <Button size="small" onClick={() => goTo(stepIndex)} sx={{ minHeight: 0, gridRow: { xs: "1 / span 2", sm: "auto" } }} aria-label={`Edit ${field.label}`}>
                            Edit
                          </Button>
                        </Box>
                      ))
                    )}
                  </Box>

                  <FormControlLabel
                    sx={{ mt: 3, alignItems: "flex-start" }}
                    control={
                      <Checkbox
                        checked={consent}
                        onChange={(event) => {
                          setConsent(event.target.checked);
                          setConsentError(false);
                        }}
                        sx={{ mt: -0.75 }}
                      />
                    }
                    label={<Typography sx={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{config.review.consentLabel}</Typography>}
                  />
                  {consentError && (
                    <Typography role="alert" sx={{ mt: 1, color: "error.main", fontSize: "0.85rem" }}>
                      Please confirm you agree before sending.
                    </Typography>
                  )}
                  {submitError && (
                    <Typography role="alert" sx={{ mt: 1, color: "error.main", fontSize: "0.85rem" }}>
                      {submitError}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={2} sx={{ mt: 4, alignItems: "center" }}>
                    <Button onClick={() => goTo(index - 1)} startIcon={<ArrowBackRoundedIcon />} color="inherit">
                      Back
                    </Button>
                    <Button variant="contained" onClick={submit} disabled={submitting} endIcon={<EastRoundedIcon />} size="large">
                      {submitting ? "Sending…" : config.review.submitLabel}
                    </Button>
                  </Stack>
                </motion.div>
              ) : step ? (
                <motion.div key={step.id} {...slide} transition={{ duration: 0.3 }}>
                  <Typography variant="eyebrow" sx={{ color: "primary.dark" }}>
                    {step.eyebrow ? resolve(step.eyebrow, answers) : `Step ${index + 1} of ${totalStages}`}
                  </Typography>
                  <Typography ref={headingRef} tabIndex={-1} variant="h2" component="h2" sx={{ ...headingSx, mt: 2 }}>
                    {resolve(step.title, answers)}
                  </Typography>
                  {step.body && (
                    <Typography variant="lead" sx={{ mt: 2, color: "text.secondary" }}>
                      {resolve(step.body, answers)}
                    </Typography>
                  )}

                  <Stack spacing={3} sx={{ mt: 5 }}>
                    {step.fields.map((field, fieldIndex) => (
                      <JourneyField
                        key={field.name}
                        field={field}
                        value={answers[field.name]}
                        error={errors[field.name]}
                        autoFocus={hasMoved && fieldIndex === 0}
                        onChange={(value) => setAnswer(field.name, value)}
                        onEnter={next}
                        onChoose={
                          singleChoiceStep
                            ? () => window.setTimeout(() => goTo(index + 1), reduceMotion ? 0 : 280)
                            : undefined
                        }
                      />
                    ))}
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{ mt: 5, alignItems: "center" }}>
                    {index > 0 && (
                      <Button onClick={() => goTo(index - 1)} startIcon={<ArrowBackRoundedIcon />} color="inherit">
                        Back
                      </Button>
                    )}
                    <Button variant="contained" onClick={next} endIcon={<EastRoundedIcon />} size="large">
                      {index === 0 ? "Let's begin" : "Continue"}
                    </Button>
                    <Typography sx={{ display: { xs: "none", sm: "block" }, fontSize: "0.8rem", color: "text.secondary" }}>
                      or press Enter
                    </Typography>
                  </Stack>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
