import React from 'react';

interface MobileDrawerProps {
  side: 'left' | 'right';
  backdropRef: React.RefObject<HTMLDivElement | null>;
  drawerRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  side,
  backdropRef,
  drawerRef,
  onClose,
  children,
}) => {
  const initialTransform = side === 'left' ? 'translate3d(-100%, 0, 0)' : 'translate3d(100%, 0, 0)';
  const positionClass = side === 'left' ? 'left-0' : 'right-0';

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 opacity-0 pointer-events-none will-change-[opacity]"
      />

      {/* Fullscreen Drawer Panel */}
      <div
        ref={drawerRef}
        style={{ transform: initialTransform }}
        className={`fixed inset-y-0 ${positionClass} w-full h-full bg-bg-surface z-50 overflow-hidden flex flex-col will-change-transform`}
      >
        {children}
      </div>
    </div>
  );
};
