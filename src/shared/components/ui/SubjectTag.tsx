interface SubjectTagProps {
  name: string
  className?: string
}

export function SubjectTag({ name, className = '' }: SubjectTagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary ${className}`}
    >
      {name}
    </span>
  )
}
