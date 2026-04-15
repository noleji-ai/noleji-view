import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  /* Close on Escape */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  /* Clamp position so the menu stays within the viewport */
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw) menu.style.left = `${x - rect.width}px`;
    if (rect.bottom > vh) menu.style.top = `${y - rect.height}px`;
  }, [x, y]);

  return (
    <>
      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 z-[200]"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-[201] min-w-[160px] bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-150"
        style={{ left: x, top: y }}
      >
        {items.map((item, idx) => {
          if (item.divider) {
            return (
              <div
                key={`divider-${idx}`}
                className="my-1 mx-2 border-t border-[#E2E8F0]"
              />
            );
          }

          return (
            <button
              key={`${item.label}-${idx}`}
              onClick={() => { item.onClick(); onClose(); }}
              className={`w-full flex items-center space-x-2.5 py-1.5 px-3 text-[12px] font-medium transition-colors ${
                item.danger
                  ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
                  : 'text-[#1A202C]/70 hover:bg-[#10B981]/10 hover:text-[#10B981]'
              }`}
            >
              {item.icon && (
                <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
