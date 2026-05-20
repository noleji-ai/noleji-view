import { Check } from 'lucide-react';
import { PRICING_PLANS } from '../data/pricingPlans';
import type { PricingLocale, PricingTier } from '../types/pricing';

interface PricingSectionProps {
  currentTier?: PricingTier;
  onSelectPlan?: (tier: PricingTier) => void;
  locale?: PricingLocale;
}

export default function PricingSection({
  currentTier = 'free',
  onSelectPlan,
  locale = 'ko',
}: PricingSectionProps) {
  const isKo = locale === 'ko';

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {PRICING_PLANS.map((plan) => {
        const isCurrent = plan.tier === currentTier;
        const name = isKo ? plan.name : plan.nameEn;
        const secondaryName = isKo ? plan.nameEn : plan.name;
        const priceNote = isKo ? plan.priceNote : plan.priceNoteEn;
        const features = isKo ? plan.features : plan.featuresEn;
        const cta = isCurrent
          ? isKo
            ? '현재 플랜'
            : 'Current plan'
          : isKo
            ? plan.cta
            : plan.ctaEn;

        return (
          <div
            key={plan.tier}
            className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 transition-all ${
              plan.highlighted
                ? 'scale-[1.02] border-[#10B981] shadow-xl shadow-[#10B981]/10'
                : 'border-[#E2E8F0] hover:border-[#10B981]/40 hover:shadow-lg'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#10B981] px-4 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                {isKo ? '추천' : 'Popular'}
              </div>
            )}

            <div className="mb-5">
              <div className="mb-1 flex items-center space-x-2">
                <h3 className="text-lg font-black text-[#1A202C]">{name}</h3>
                <span className="text-[9px] font-bold uppercase text-[#1A202C]/25">{secondaryName}</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black text-[#1A202C]">{plan.price}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-[#1A202C]/30">{priceNote}</p>
            </div>

            <ul className="mb-6 flex-grow space-y-2.5">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start space-x-2.5">
                  <Check
                    size={14}
                    className={`mt-0.5 flex-shrink-0 ${
                      plan.highlighted ? 'text-[#10B981]' : 'text-[#1A202C]/20'
                    }`}
                  />
                  <span className="text-[12px] font-medium text-[#1A202C]/70">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelectPlan?.(plan.tier)}
              disabled={isCurrent}
              className={`w-full rounded-xl py-3 text-[11px] font-black tracking-wide transition-all active:scale-[0.98] ${
                isCurrent
                  ? 'cursor-default border border-[#E2E8F0] bg-[#F7FAFC] text-[#1A202C]/30'
                  : plan.highlighted
                    ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20 hover:bg-[#059669]'
                    : 'bg-[#1A202C] text-white shadow-sm hover:bg-[#10B981]'
              }`}
            >
              {cta}
            </button>
          </div>
        );
      })}
    </div>
  );
}
