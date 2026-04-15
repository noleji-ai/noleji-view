import { Check } from 'lucide-react';
import { PRICING_PLANS } from '../data/pricingPlans';
import type { PricingTier } from '../types/pricing';

interface PricingSectionProps {
  currentTier?: PricingTier;
  onSelectPlan?: (tier: PricingTier) => void;
}

export default function PricingSection({ currentTier = 'free', onSelectPlan }: PricingSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PRICING_PLANS.map((plan) => {
        const isCurrent = plan.tier === currentTier;

        return (
          <div
            key={plan.tier}
            className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all ${
              plan.highlighted
                ? 'border-[#10B981] shadow-xl shadow-[#10B981]/10 scale-[1.02]'
                : 'border-[#E2E8F0] hover:border-[#10B981]/40 hover:shadow-lg'
            } bg-white`}
          >
            {/* Highlighted badge */}
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#10B981] text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                추천
              </div>
            )}

            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-black text-[#1A202C]">{plan.name}</h3>
                <span className="text-[9px] font-bold text-[#1A202C]/25 uppercase">{plan.nameEn}</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black text-[#1A202C]">{plan.price}</span>
              </div>
              <p className="text-[11px] font-bold text-[#1A202C]/30 mt-1">{plan.priceNote}</p>
            </div>

            {/* Features */}
            <ul className="flex-grow space-y-2.5 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start space-x-2.5">
                  <Check
                    size={14}
                    className={`flex-shrink-0 mt-0.5 ${
                      plan.highlighted ? 'text-[#10B981]' : 'text-[#1A202C]/20'
                    }`}
                  />
                  <span className="text-[12px] font-medium text-[#1A202C]/70">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => onSelectPlan?.(plan.tier)}
              disabled={isCurrent}
              className={`w-full py-3 rounded-xl font-black text-[11px] tracking-wide transition-all active:scale-[0.98] ${
                isCurrent
                  ? 'bg-[#F7FAFC] text-[#1A202C]/30 border border-[#E2E8F0] cursor-default'
                  : plan.highlighted
                    ? 'bg-[#10B981] text-white hover:bg-[#059669] shadow-lg shadow-[#10B981]/20'
                    : 'bg-[#1A202C] text-white hover:bg-[#10B981] shadow-sm'
              }`}
            >
              {isCurrent ? '현재 플랜' : plan.cta}
            </button>
          </div>
        );
      })}
    </div>
  );
}
