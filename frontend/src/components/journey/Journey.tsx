"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import JourneyFlow from "@/components/journey/JourneyFlow";
import { journeys, type JourneyId } from "@/components/journey/journeys";
import type { Answers } from "@/components/journey/types";

type JourneyProps = {
  /** Which journey to show. Configs live in journeys.ts (they hold functions, so pages pass an id). */
  id: JourneyId;
  /** Answers filled in before the journey starts. */
  preset?: Answers;
  /**
   * Read a preset from the URL, e.g. /partner-with-us?interest=resource-mobilization
   * or /stay-connected?topic=taarifa-eco. Maps a query key to an answer field.
   */
  queryPreset?: { param: string; field: string; multiple?: boolean };
};

function JourneyWithQuery({ id, preset, queryPreset }: Required<Pick<JourneyProps, "queryPreset">> & JourneyProps) {
  const params = useSearchParams();
  const config = journeys[id];
  const raw = params.get(queryPreset.param);
  const field = config.steps.flatMap((step) => step.fields).find((item) => item.name === queryPreset.field);
  const valid = raw && field?.options?.some((option) => option.value === raw) ? raw : null;

  const initialAnswers: Answers = {
    ...preset,
    ...(valid ? { [queryPreset.field]: queryPreset.multiple ? [valid] : valid } : {}),
  };

  return <JourneyFlow key={valid ?? "none"} config={config} initialAnswers={initialAnswers} />;
}

export default function Journey({ id, preset, queryPreset }: JourneyProps) {
  if (!queryPreset) return <JourneyFlow config={journeys[id]} initialAnswers={preset} />;

  return (
    <Suspense fallback={<JourneyFlow config={journeys[id]} initialAnswers={preset} />}>
      <JourneyWithQuery id={id} preset={preset} queryPreset={queryPreset} />
    </Suspense>
  );
}
