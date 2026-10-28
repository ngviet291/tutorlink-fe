import { Info, Plus, Wallet } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { formatVnd } from '@/shared/utils/currency'
import { useWallet } from '../hooks/useWallet'

export function WalletCard({ onTopUp }: { onTopUp: () => void }) {
  const { data, isLoading, isError, refetch } = useWallet()
  return (
    <section className="rounded-3xl bg-gradient-to-br from-primary to-secondary p-6 text-white shadow-lg">
      <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
        <Wallet className="size-5" /> Số dư ví
      </div>
      <div className="mt-2 min-h-12">
        {isLoading ? (
          <Skeleton className="h-10 w-48 bg-white/30" />
        ) : isError ? (
          <button type="button" onClick={() => void refetch()} className="cursor-pointer text-sm underline">Không tải được số dư — thử lại</button>
        ) : (
          <p className="text-4xl font-extrabold tracking-tight">{formatVnd(data?.balance ?? 0)}</p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={onTopUp} className="bg-white text-primary hover:bg-white/90">
          <Plus className="size-4" /> Nạp tiền
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-white/85">
          <Info className="size-4" /> Ví chỉ dùng để nạp tiền và trả phí nhận lớp — không hỗ trợ rút tiền.
        </p>
      </div>
    </section>
  )
}
