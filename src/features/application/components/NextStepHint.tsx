import { ArrowRight, Hourglass } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ApplicationResponse } from "../types/application.types";
import { getNextStep } from "../util/nextStep";

interface Props {
  application: ApplicationResponse;
  userId: string | undefined;
  className?: string;
}

export function NextStepHint({ application, userId, className = "" }: Props) {
  useTranslation();
  const step = getNextStep(application, userId);
  if (!step.label) return null;

  if (step.mine && step.pending) {
    return (
      <p
        className={`flex items-center gap-1.5 text-sm font-bold text-primary ${className}`}
      >
        <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        {step.label}
      </p>
    );
  }
  return (
    <p
      className={`flex items-center gap-1.5 text-xs text-text-secondary ${className}`}
    >
      {step.pending && (
        <Hourglass className="size-3.5 shrink-0" aria-hidden="true" />
      )}
      {step.label}
    </p>
  );
}
