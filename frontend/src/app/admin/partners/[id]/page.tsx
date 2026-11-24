"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, Button, Skeleton, Stack } from "@mui/material";
import PartnerEditor from "@/components/admin/partners/PartnerEditor";
import { ApiError, apiData } from "@/lib/admin/api";
import type { AdminPartner } from "@/lib/admin/partners";

export default function PartnerPage() {
  const { id } = useParams<{ id: string }>();
  const [partner, setPartner] = useState<AdminPartner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiData<AdminPartner>(`/admin/partners/${id}`)
      .then((data) => !cancelled && setPartner(data))
      .catch((caught) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError && caught.status === 404
            ? "This partner does not exist. It may have been deleted."
            : caught instanceof ApiError
              ? caught.message
              : "Could not load the partner.",
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
        <Button component={Link} href="/admin/partners">Back to partners</Button>
      </Stack>
    );
  }

  if (!partner) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width={320} height={56} />
        <Skeleton variant="rounded" height={420} />
      </Stack>
    );
  }

  // key: a fresh editor if the id changes (e.g. after creating a partner).
  return <PartnerEditor key={partner.id} partner={partner} />;
}
