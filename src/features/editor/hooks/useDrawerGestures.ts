import React, { useRef, useEffect, useCallback } from 'react';

interface UseDrawerGesturesProps {
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  isMobileRightSidebarOpen: boolean;
  openMobileRightSidebar: () => void;
  closeMobileRightSidebar: () => void;
}

export function useDrawerGestures({
  isMobileSidebarOpen,
  openMobileSidebar,
  closeMobileSidebar,
  isMobileRightSidebarOpen,
  openMobileRightSidebar,
  closeMobileRightSidebar,
}: UseDrawerGesturesProps) {
  // Left Drawer DOM refs
  const leftDrawerRef = useRef<HTMLDivElement>(null);
  const leftBackdropRef = useRef<HTMLDivElement>(null);

  // Right Drawer DOM refs
  const rightDrawerRef = useRef<HTMLDivElement>(null);
  const rightBackdropRef = useRef<HTMLDivElement>(null);

  // Ref tracking left gesture state
  const leftGestureState = useRef({
    isSwiping: false,
    isIgnored: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    velocityX: 0,
    isOpen: false,
    drawerWidth: typeof window !== 'undefined' ? window.innerWidth : 400,
    currentOffset: 0,
  });

  // Ref tracking right gesture state
  const rightGestureState = useRef({
    isSwiping: false,
    isIgnored: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    velocityX: 0,
    isOpen: false,
    drawerWidth: typeof window !== 'undefined' ? window.innerWidth : 400,
    currentOffset: 0,
  });

  // Bulletproof Drawer Snap Helpers (Percentage based to prevent stuck states & handle resize)
  const snapLeftDrawer = useCallback((open: boolean) => {
    if (leftDrawerRef.current && leftBackdropRef.current) {
      leftDrawerRef.current.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
      leftDrawerRef.current.style.transform = open ? 'translate3d(0%, 0, 0)' : 'translate3d(-100%, 0, 0)';
      leftBackdropRef.current.style.transition = 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
      leftBackdropRef.current.style.opacity = open ? '1' : '0';
      leftBackdropRef.current.style.pointerEvents = open ? 'auto' : 'none';
    }
  }, []);

  const snapRightDrawer = useCallback((open: boolean) => {
    if (rightDrawerRef.current && rightBackdropRef.current) {
      rightDrawerRef.current.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
      rightDrawerRef.current.style.transform = open ? 'translate3d(0%, 0, 0)' : 'translate3d(100%, 0, 0)';
      rightBackdropRef.current.style.transition = 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
      rightBackdropRef.current.style.opacity = open ? '1' : '0';
      rightBackdropRef.current.style.pointerEvents = open ? 'auto' : 'none';
    }
  }, []);

  // Keep Left drawer state sync
  useEffect(() => {
    leftGestureState.current.isOpen = isMobileSidebarOpen;
    snapLeftDrawer(isMobileSidebarOpen);
  }, [isMobileSidebarOpen, snapLeftDrawer]);

  // Keep Right drawer state sync
  useEffect(() => {
    rightGestureState.current.isOpen = isMobileRightSidebarOpen;
    snapRightDrawer(isMobileRightSidebarOpen);
  }, [isMobileRightSidebarOpen, snapRightDrawer]);

  // Window resize handler for drawer widths
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      leftGestureState.current.drawerWidth = width;
      rightGestureState.current.drawerWidth = width;
      snapLeftDrawer(leftGestureState.current.isOpen);
      snapRightDrawer(rightGestureState.current.isOpen);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [snapLeftDrawer, snapRightDrawer]);

  // -------------------------------------------------------------
  // TOUCH GESTURE HANDLING (Both Left and Right Slide Drawers)
  // -------------------------------------------------------------
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth >= 1024) return;
    const touch = e.touches[0];
    const width = window.innerWidth;
    const now = Date.now();

    const target = e.target as HTMLElement | null;
    const isInteractive = !!target?.closest('button, input, textarea, select, a, [data-no-swipe], .noesis-audio-pill, .audio-node-view, .noesis-document-pill, .document-node-view, .pdf-canvas-container');

    // Expanded threshold (80-100px) so user can comfortably swipe without triggering phone's system back navigation
    const EDGE_THRESHOLD = Math.max(80, Math.min(100, Math.round(width * 0.22)));
    const isLeftOpen = leftGestureState.current.isOpen;
    const isRightOpen = rightGestureState.current.isOpen;

    // Left state init
    const leftState = leftGestureState.current;
    leftState.startX = touch.clientX;
    leftState.startY = touch.clientY;
    leftState.lastX = touch.clientX;
    leftState.lastTime = now;
    leftState.velocityX = 0;
    leftState.isSwiping = false;
    // If closed, only allow opening if touch starts near left edge. If right is open, completely ignore left gesture.
    leftState.isIgnored = isLeftOpen ? isInteractive : (isRightOpen || touch.clientX > EDGE_THRESHOLD || isInteractive);
    leftState.drawerWidth = width;

    // Right state init
    const rightState = rightGestureState.current;
    rightState.startX = touch.clientX;
    rightState.startY = touch.clientY;
    rightState.lastX = touch.clientX;
    rightState.lastTime = now;
    rightState.velocityX = 0;
    rightState.isSwiping = false;
    // If closed, only allow opening if touch starts near right edge. If left is open, completely ignore right gesture.
    rightState.isIgnored = isRightOpen ? isInteractive : (isLeftOpen || touch.clientX < width - EDGE_THRESHOLD || isInteractive);
    rightState.drawerWidth = width;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.innerWidth >= 1024) return;
    const leftState = leftGestureState.current;
    const rightState = rightGestureState.current;

    if (leftState.isIgnored && rightState.isIgnored) return;

    const target = e.target as HTMLElement | null;
    if (target?.closest('button, input, textarea, select, a, [data-no-swipe], .noesis-audio-pill, .audio-node-view, .noesis-document-pill, .document-node-view, .pdf-canvas-container')) {
      return;
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - leftState.startX;
    const deltaY = Math.abs(touch.clientY - leftState.startY);

    // Calculate real-time instantaneous velocity (pixels/ms)
    const now = Date.now();
    const dt = now - leftState.lastTime;
    if (dt > 8) {
      const vx = (touch.clientX - leftState.lastX) / dt;
      leftState.velocityX = vx;
      leftState.lastX = touch.clientX;
      leftState.lastTime = now;

      rightState.velocityX = vx;
      rightState.lastX = touch.clientX;
      rightState.lastTime = now;
    }

    // Check if moving primarily horizontally with a solid deadzone (not too sensitive)
    const SWIPE_INIT_THRESHOLD = 15;

    if (!leftState.isSwiping && !rightState.isSwiping) {
      if (Math.abs(deltaX) > SWIPE_INIT_THRESHOLD && Math.abs(deltaX) > deltaY * 1.2) {
        if (!leftState.isIgnored) {
          if (leftState.isOpen && deltaX < 0) {
            leftState.isSwiping = true;
            if (leftDrawerRef.current) leftDrawerRef.current.style.transition = 'none';
            if (leftBackdropRef.current) leftBackdropRef.current.style.transition = 'none';
          } else if (!leftState.isOpen && deltaX > 0) {
            leftState.isSwiping = true;
            if (leftDrawerRef.current) leftDrawerRef.current.style.transition = 'none';
            if (leftBackdropRef.current) leftBackdropRef.current.style.transition = 'none';
          }
        }

        if (!rightState.isIgnored && !leftState.isSwiping) {
          if (rightState.isOpen && deltaX > 0) {
            rightState.isSwiping = true;
            if (rightDrawerRef.current) rightDrawerRef.current.style.transition = 'none';
            if (rightBackdropRef.current) rightBackdropRef.current.style.transition = 'none';
          } else if (!rightState.isOpen && deltaX < 0) {
            rightState.isSwiping = true;
            if (rightDrawerRef.current) rightDrawerRef.current.style.transition = 'none';
            if (rightBackdropRef.current) rightBackdropRef.current.style.transition = 'none';
          }
        }
      }
    }

    // Handle Active Left Swipe
    if (leftState.isSwiping && leftDrawerRef.current && leftBackdropRef.current) {
      const width = leftState.drawerWidth || window.innerWidth;
      const basePos = leftState.isOpen ? 0 : -width;
      const newPos = Math.min(0, Math.max(-width, basePos + deltaX));
      leftState.currentOffset = newPos;

      const progress = (newPos + width) / width;
      const translatePercent = (progress - 1) * 100;

      leftDrawerRef.current.style.transform = `translate3d(${translatePercent}%, 0, 0)`;
      leftBackdropRef.current.style.opacity = `${progress}`;
      leftBackdropRef.current.style.pointerEvents = progress > 0.05 ? 'auto' : 'none';
    }

    // Handle Active Right Swipe
    if (rightState.isSwiping && rightDrawerRef.current && rightBackdropRef.current) {
      const width = rightState.drawerWidth || window.innerWidth;
      const basePos = rightState.isOpen ? 0 : width;
      const newPos = Math.max(0, Math.min(width, basePos + deltaX));
      rightState.currentOffset = newPos;

      const progress = (width - newPos) / width;
      const translatePercent = (1 - progress) * 100;

      rightDrawerRef.current.style.transform = `translate3d(${translatePercent}%, 0, 0)`;
      rightBackdropRef.current.style.opacity = `${progress}`;
      rightBackdropRef.current.style.pointerEvents = progress > 0.05 ? 'auto' : 'none';
    }
  };

  const handleTouchEnd = () => {
    if (window.innerWidth >= 1024) return;
    const leftState = leftGestureState.current;
    const rightState = rightGestureState.current;

    // Finish Left Swipe
    if (leftState.isSwiping) {
      const width = leftState.drawerWidth || window.innerWidth;
      const progress = (leftState.currentOffset + width) / width;
      const velocity = leftState.velocityX;

      const shouldOpen = !leftState.isOpen
        ? (velocity > 0.35 || progress > 0.3)
        : !(velocity < -0.35 || progress < 0.7);

      if (shouldOpen) {
        openMobileSidebar();
      } else {
        closeMobileSidebar();
      }
      snapLeftDrawer(shouldOpen);
      leftState.isSwiping = false;
    }

    // Finish Right Swipe
    if (rightState.isSwiping) {
      const width = rightState.drawerWidth || window.innerWidth;
      const progress = (width - rightState.currentOffset) / width;
      const velocity = rightState.velocityX;

      const shouldOpen = !rightState.isOpen
        ? (velocity < -0.35 || progress > 0.3)
        : !(velocity > 0.35 || progress < 0.7);

      if (shouldOpen) {
        openMobileRightSidebar();
      } else {
        closeMobileRightSidebar();
      }
      snapRightDrawer(shouldOpen);
      rightState.isSwiping = false;
    }

    leftState.isIgnored = false;
    rightState.isIgnored = false;
  };

  return {
    leftDrawerRef,
    leftBackdropRef,
    rightDrawerRef,
    rightBackdropRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
