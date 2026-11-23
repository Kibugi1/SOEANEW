"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, Button, Skeleton, Stack } from "@mui/material";
import ProgramEditor from "@/components/admin/programs/ProgramEditor";
import { ApiError, apiData } from "@/lib/admin/api";
import type { AdminProgram } from "@/lib/admin/programs";

export default function ProgramPage() {
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<AdminProgram | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiData<AdminProgram>(`/admin/programs/${id}`)
      .then((data) => !cancelled && setProgram(data))
      .catch((caught) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError && caught.status === 404
            ? "This program does not exist. It may have been deleted."
            : caught instanceof ApiError
              ? caught.message
              : "Could not load the program.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Alert severity="error">{error}</Alert>
        <Button component={Link} href="/admin/programs">Back to programs</Button>
      </Stack>
    );
  }

  if (!program) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width={320} height={56} />
        <Skeleton variant="rounded" height={420} />
      </Stack>
    );
  }

  // key: a fresh editor if the id changes (e.g. after creating a program).
  return <ProgramEditor key={program.id} program={program} />;
}
