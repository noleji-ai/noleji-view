import { getDailyUsage, getUserPlan } from '../utils/featureGate';

export default function UsageBadge() {
  const plan = getUserPlan();

  // Hidden for paid users
  if (plan !== 'free') return null;

  const { used, limit } = getDailyUsage();
  const percentage = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5">
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold text-[#1A202C]/40 mb-1">
          오늘 {used}/{limit}회 사용
        </div>
        <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              backgroundColor:
                percentage >= 100 ? '#EF4444' : percentage >= 80 ? '#F59E0B' : '#10B981',
            }}
          />
        </div>
      </div>
    </div>
  );
}
