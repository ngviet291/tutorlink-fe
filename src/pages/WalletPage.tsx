import { useState } from 'react'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { PayFeeModal } from '@/features/wallet/components/PayFeeModal'
import { TopUpModal } from '@/features/wallet/components/TopUpModal'
import { TransactionTable } from '@/features/wallet/components/TransactionTable'
import { WalletCard } from '@/features/wallet/components/WalletCard'
import { OfferList } from '@/features/application/components/OfferList'
import type { ApplicationResponse } from '@/features/application/types/application.types'

export default function WalletPage() {
  const [topUp, setTopUp] = useState(false)
  const [offer, setOffer] = useState<ApplicationResponse | null>(null)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title="Ví của tôi" description="Nạp tiền bằng chuyển khoản và dùng để thanh toán phí nhận lớp." />
      <WalletCard onTopUp={() => setTopUp(true)} />
      <OfferList onPay={setOffer} />
      <TransactionTable />
      <TopUpModal open={topUp} onClose={() => setTopUp(false)} />
      <PayFeeModal application={offer} onClose={() => setOffer(null)} />
    </div>
  )
}
