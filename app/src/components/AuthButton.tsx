import { UserCircle, LogOut } from 'lucide-react';
import type { AuthState } from '../types/auth';

interface AuthButtonProps {
  authState: AuthState;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function AuthButton({ authState, onSignIn, onSignOut }: AuthButtonProps) {
  if (authState.status === 'loading') {
    return (
      <div className="flex items-center space-x-2 px-2 py-1.5">
        <div className="w-4 h-4 border-2 border-[#E2E8F0] border-t-[#10B981] rounded-full animate-spin" />
      </div>
    );
  }

  if (authState.status === 'unauthenticated') {
    return (
      <button
        onClick={onSignIn}
        className="flex items-center space-x-2 px-3 py-1.5 text-[11px] font-bold text-[#1A202C]/40 hover:text-[#10B981] transition-colors rounded-lg hover:bg-[#10B981]/5"
      >
        <UserCircle size={16} />
        <span>로그인</span>
      </button>
    );
  }

  const { user } = authState;
  const initial = user.displayName?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <div className="flex items-center space-x-2">
      {/* Avatar */}
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName ?? 'User'}
          className="w-6 h-6 rounded-full border border-[#E2E8F0]"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center text-white text-[10px] font-black">
          {initial}
        </div>
      )}

      {/* Name */}
      <span className="text-[10px] font-bold text-[#1A202C]/60 truncate max-w-[80px]">
        {user.displayName ?? 'User'}
      </span>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        className="p-1 text-[#1A202C]/20 hover:text-red-500 transition-colors rounded-md hover:bg-red-50"
        title="로그아웃"
      >
        <LogOut size={12} />
      </button>
    </div>
  );
}
