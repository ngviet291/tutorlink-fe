import type { ReactNode } from 'react'
import { Logo } from '@/shared/components/ui/Logo'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-light via-background to-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg sm:p-8">
          <h1 className="text-2xl font-extrabold text-text">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-text-secondary">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
