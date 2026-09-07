import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook to manage auto-hiding navigation based on scroll direction.
 * - Automatically reveals navigation on page/tab/note changes (resetDeps).
 * - Enforces visibility if the current visible content is too short to be scrolled.
 */
export const useScrollDirection = (resetDeps: unknown[] = []) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Helper to check if any visible main container can actually be scrolled
  const checkIsContentScrollable = useCallback(() => {
    // 1. Check window/document
    const docScrollable = document.documentElement.scrollHeight > window.innerHeight + 24;
    if (docScrollable) return true;

    // 2. Check active visible scroll containers in the view
    const scrollContainers = document.querySelectorAll<HTMLElement>(
      'main, .overflow-y-auto, .overflow-auto, [data-scrollable="true"]'
    );

    for (let i = 0; i < scrollContainers.length; i++) {
      const el = scrollContainers[i];
      // Check if element is visible on screen
      if (el.offsetParent !== null || el.getClientRects().length > 0) {
        if (el.scrollHeight > el.clientHeight + 24) {
          return true;
        }
      }
    }

    return false;
  }, []);

  // 1. Auto-Reset when page, tab, or note changes
  useEffect(() => {
    setIsVisible(true);
    lastScrollY.current = 0;

    // Double check after new view renders
    const timer = setTimeout(() => {
      const canScroll = checkIsContentScrollable();
      if (!canScroll) {
        setIsVisible(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  // 2. Scroll event listener with non-scrollable check
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      const isDoc = target === document || target === document.documentElement;
      
      const currentScrollY = isDoc
        ? window.scrollY
        : (target as HTMLElement).scrollTop || 0;

      const scrollHeight = isDoc
        ? document.documentElement.scrollHeight
        : (target as HTMLElement).scrollHeight || 0;

      const clientHeight = isDoc
        ? window.innerHeight
        : (target as HTMLElement).clientHeight || 0;

      // If container is not scrollable, force visible
      if (scrollHeight <= clientHeight + 20) {
        setIsVisible(true);
        lastScrollY.current = 0;
        return;
      }

      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const diff = currentScrollY - lastScrollY.current;

          // Always visible near the top (first 40px)
          if (currentScrollY <= 40) {
            setIsVisible(true);
          } else if (diff > 8) {
            // Scrolling down significantly -> hide
            setIsVisible(false);
          } else if (diff < -6) {
            // Scrolling up significantly -> show
            setIsVisible(true);
          }

          lastScrollY.current = Math.max(0, currentScrollY);
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    // Capture scrolls on window and any inner scrollable element
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    // Also check on resize / orientation change
    const handleResize = () => {
      if (!checkIsContentScrollable()) {
        setIsVisible(true);
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', handleResize);
    };
  }, [checkIsContentScrollable]);

  return { isVisible, setIsVisible };
};

