import { useUiStore, PRIME_SHARE_BASIS_LABELS } from '../../stores/ui-store'
import type { PrimeShareBasis } from '../../stores/ui-store'

const OPTIONS: { value: PrimeShareBasis; label: string; hint: string }[] = [
  {
    value: 'iclimax',
    label: PRIME_SHARE_BASIS_LABELS.iclimax,
    hint: '分母: iClimax T列の全時間帯PRP合計 / 分子: そのうちプライム帯(19-24時)のPRP',
  },
  {
    value: 'forecast',
    label: PRIME_SHARE_BASIS_LABELS.forecast,
    hint: '分母: 本案予測+サービス予測の合計PRP / 分子: そのうちプライム帯(19-24時)のPRP',
  },
]

/** Prime Time Share の算出基準を切り替えるセグメンテッドコントロール */
export function PrimeShareBasisToggle() {
  const basis = useUiStore((s) => s.primeShareBasis)
  const setBasis = useUiStore((s) => s.setPrimeShareBasis)
  const active = OPTIONS.find((o) => o.value === basis) ?? OPTIONS[0]

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[12px] font-semibold text-[#86868b]">Prime Time Share 基準</span>
      <div className="inline-flex rounded-full bg-black/[0.04] p-0.5">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setBasis(o.value)}
            title={o.hint}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all ${
              basis === o.value
                ? 'bg-white text-[#1d1d1f] shadow-sm'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <span className="text-[11px] text-[#86868b]">{active.hint}</span>
    </div>
  )
}
