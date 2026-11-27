import type { ReactNode } from "react";
import { Logo } from "@/shared/components/ui/Logo";
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher";
import { cn } from "@/shared/utils/cn";

export function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary-light via-background to-background px-4 py-10">
      <LanguageSwitcher className="absolute right-4 top-4" />
      <div
        className={cn("w-full max-w-md", wide && "md:max-w-xl lg:max-w-2xl")}
      >
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-lg sm:p-8">
          <h1 className="text-2xl font-extrabold text-text">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-text-secondary">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
