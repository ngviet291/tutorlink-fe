import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { formatCountdown } from '@/shared/utils/date'
import { useMyApplications } from '../hooks/useApplications'
import type { ApplicationResponse } from '../types/application.types'

function Countdown({ deadline }: { deadline: string }) {
  const [left, setLeft] = useState(() => new Date(deadline).getTime() - Date.now())
  useEffect(() => {
    const t = setInterval(() => setLeft(new Date(deadline).getTime() - Date.now()), 1000)
    return () => clearInterval(t)
  }, [deadline])
  return <span className="font-mono">{formatCountdown(left)}</span>
}

/** Lời mời nhận lớp đang chờ gia sư thanh toán phí. */
export function OfferList({ onPay }: { onPay: (a: ApplicationResponse) => void }) {
  const { data } = useMyApplications()
  const offers = data?.filter((a) => a.awaitingPayment) ?? []
  if (offers.length === 0) return null

  return (
    <section aria-labelledby="offers" className="rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-4 dark:bg-amber-500/10">
      <h2 id="offers" className="mb-3 text-lg font-bold text-text">Lời mời nhận lớp cần thanh toán ({offers.length})</h2>
      <ul className="flex flex-col gap-3">
        {offers.map((a) => (
          <li key={a.id} className="flex flex-col gap-3 rounded-xl bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-semibold text-text">{a.post.title}</p>
              {a.payDeadline && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                  <Clock className="size-3.5" /> Còn <Countdown deadline={a.payDeadline} /> để thanh toán
                </p>
              )}
            </div>
            <Button onClick={() => onPay(a)}>Xem & thanh toán</Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
