import React, { useState, useRef } from 'react';
import { PanelLeft, SlidersHorizontal } from 'lucide-react';
import { VaultData } from '../../../types/vault';
import { useNavigation } from '../../../context/NavigationContext';

import { ChatHistorySidebar } from './ChatHistorySidebar';
import { ChatSettingsSidebar } from './ChatSettingsSidebar';
import { ChatMessageFeed } from './ChatMessageFeed';
import { ChatInputArea } from './ChatInputArea';
import { useChatLogic } from '../hooks/useChatLogic';

import { useVault } from '../../../hooks/useVault';

interface ChatViewProps {
  vault: VaultData;
  vaultState?: ReturnType<typeof useVault>;
}

export const ChatView: React.FC<ChatViewProps> = ({ vault, vaultState }) => {
  const { 
    activeTabId, 
    isMobileSidebarOpen: isLeftSidebarOpen,
    openMobileSidebar,
    closeMobileSidebar,
    isMobileRightSidebarOpen: isRightSidebarOpen,
    openMobileRightSidebar,
    closeMobileRightSidebar
  } = useNavigation();
  
  const {
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    messages,
    setMessages,
    input,
    setInput,
    mode,
    setMode,
    topK,
    setTopK,
    threshold,
    setThreshold,
    isProcessing,
    processingPhase,
    renderedHtmlMap,
    expandedContexts,
    messagesEndRef,
    textareaRef,
    activeNode,
    handleSend,
    handleEditUserMessage,
    handleNewChat,
    toggleContextInspector
  } = useChatLogic(vault, activeTabId);

  // Desktop sidebar independent visibility state
  const [isDesktopLeftOpen, setIsDesktopLeftOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280;
    }
    return true;
  });

  const [isDesktopRightOpen, setIsDesktopRightOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1440;
    }
    return false;
  });

  // Touch Swipe Reference for Mobile
  const touchStartRef = useRef<{ x: number; y: number; isIgnored?: boolean } | null>(null);

  // Touch Gesture Handling (Slide to Open/Close on mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const target = e.target as HTMLElement | null;
      const width = window.innerWidth;
      
      // Expanded threshold (80-100px) so user can comfortably swipe without triggering phone's system back navigation
      const EDGE_THRESHOLD = Math.max(80, Math.min(100, Math.round(width * 0.22)));
      
      // Exclude interactive elements and scrollable tables/code blocks
      const isInteractive = !!target?.closest('button, input, textarea, select, a, [data-no-swipe], table, pre, code, .overflow-x-auto');
      
      let isIgnored = isInteractive;

      // If both sidebars are closed, only allow opening if touch starts near the left or right edge.
      if (!isLeftSidebarOpen && !isRightSidebarOpen && !isIgnored) {
         if (touch.clientX > EDGE_THRESHOLD && touch.clientX < width - EDGE_THRESHOLD) {
             isIgnored = true;
         }
      }

      touchStartRef.current = { x: touch.clientX, y: touch.clientY, isIgnored };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || touchStartRef.current.isIgnored || e.changedTouches.length === 0) {
      touchStartRef.current = null;
      return;
    }

    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        if (isRightSidebarOpen) {
          closeMobileRightSidebar();
        } else if (!isLeftSidebarOpen) {
          openMobileSidebar();
        }
      } else {
        if (isLeftSidebarOpen) {
          closeMobileSidebar();
        } else if (!isRightSidebarOpen) {
          openMobileRightSidebar();
        }
      }
    }

    touchStartRef.current = null;
  };

  const handleLeftToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      if (isLeftSidebarOpen) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
        if (isRightSidebarOpen) closeMobileRightSidebar();
      }
    } else {
      setIsDesktopLeftOpen((prev) => !prev);
    }
  };

  const handleRightToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      if (isRightSidebarOpen) {
        closeMobileRightSidebar();
      } else {
        openMobileRightSidebar();
        if (isLeftSidebarOpen) closeMobileSidebar();
      }
    } else {
      setIsDesktopRightOpen((prev) => !prev);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full flex flex-row bg-bg-primary text-text-primary select-text relative overflow-hidden"
    >
      {/* ========================================================================= */}
      {/* 1. DESKTOP LEFT SIDEBAR (Inline collapsible flex panel) */}
      {/* ========================================================================= */}
      <div
        className={`hidden lg:flex flex-col h-full border-r border-border-default bg-bg-surface transition-[width,opacity] duration-200 ease-in-out shrink-0 overflow-hidden ${
          isDesktopLeftOpen ? 'w-72 xl:w-80 opacity-100' : 'w-0 opacity-0 border-r-0 pointer-events-none'
        }`}
      >
        <ChatHistorySidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          setSessions={setSessions}
          setMessages={setMessages}
          onNewChat={handleNewChat}
          onClose={() => setIsDesktopLeftOpen(false)}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE LEFT DRAWER (Slide overlay with backdrop) */}
      {/* ========================================================================= */}
      <div className="lg:hidden">
        {isLeftSidebarOpen && (
          <div
            onClick={() => closeMobileSidebar()}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity cursor-pointer"
          />
        )}
        <div
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] h-full bg-bg-surface z-50 overflow-hidden flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
            isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          }`}
        >
          <ChatHistorySidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
            setSessions={setSessions}
            setMessages={setMessages}
            onNewChat={handleNewChat}
            onClose={closeMobileSidebar}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CHAT AREA (FLEXIBLE CENTER CANVAS) */}
      {/* ========================================================================= */}
      <main className="flex-1 h-full w-full flex flex-col relative min-w-0 overflow-hidden">
        {/* Floating Header Actions */}
        <div className="absolute top-3 inset-x-0 z-20 pointer-events-none flex items-center justify-between px-4">
          {/* Left Floating Pill (History Toggle + Title) */}
          <button
            type="button"
            onClick={handleLeftToggle}
            title="Riwayat Percakapan"
            className="pointer-events-auto flex items-center gap-2 p-1.5 px-3 rounded-full bg-bg-surface/85 backdrop-blur-md border border-border-default shadow-xs hover:border-accent-primary/40 hover:bg-bg-hover text-text-muted hover:text-text-primary transition-all cursor-pointer"
          >
            <PanelLeft size={16} />
            <span className="text-xs font-semibold text-text-heading truncate max-w-[140px] sm:max-w-xs">
              {activeSession ? activeSession.title : 'Chat Baru'}
            </span>
          </button>

          {/* Right Floating Button (Context & Settings) */}
          <button
            type="button"
            onClick={handleRightToggle}
            title="Pengaturan Chat"
            className="pointer-events-auto p-2 rounded-full bg-bg-surface/85 backdrop-blur-md border border-border-default shadow-xs hover:border-accent-primary/40 hover:bg-bg-hover text-text-muted hover:text-text-primary transition-all cursor-pointer"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Messages Container */}
        <ChatMessageFeed
          messages={messages}
          activeSessionId={activeSessionId}
          renderedHtmlMap={renderedHtmlMap}
          expandedContexts={expandedContexts}
          toggleContextInspector={toggleContextInspector}
          messagesEndRef={messagesEndRef}
          mode={mode}
          activeNodeName={activeNode?.name}
          vaultState={vaultState}
          isProcessing={isProcessing}
          processingPhase={processingPhase}
          onEditMessage={handleEditUserMessage}
        />

        {/* FLOATING INPUT AREA */}
        <ChatInputArea
          input={input}
          setInput={setInput}
          isProcessing={isProcessing}
          onSend={() => handleSend()}
          textareaRef={textareaRef}
          placeholder="Tanya Noesis..."
        />
      </main>

      {/* ========================================================================= */}
      {/* 4. DESKTOP RIGHT SIDEBAR (Inline collapsible flex panel) */}
      {/* ========================================================================= */}
      <div
        className={`hidden lg:flex flex-col h-full border-l border-border-default bg-bg-surface transition-[width,opacity] duration-200 ease-in-out shrink-0 overflow-hidden ${
          isDesktopRightOpen ? 'w-72 xl:w-80 opacity-100' : 'w-0 opacity-0 border-l-0 pointer-events-none'
        }`}
      >
        <ChatSettingsSidebar
          mode={mode}
          setMode={setMode}
          topK={topK}
          setTopK={setTopK}
          threshold={threshold}
          setThreshold={setThreshold}
          
          activeNodeName={activeNode?.name}
          onClose={() => setIsDesktopRightOpen(false)}
        />
      </div>

      {/* ========================================================================= */}
      {/* 5. MOBILE RIGHT DRAWER (Slide overlay with backdrop) */}
      {/* ========================================================================= */}
      <div className="lg:hidden">
        {isRightSidebarOpen && (
          <div
            onClick={() => closeMobileRightSidebar()}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity cursor-pointer"
          />
        )}
        <div
          className={`fixed inset-y-0 right-0 w-72 max-w-[85vw] h-full bg-bg-surface z-50 overflow-hidden flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
            isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
        >
          <ChatSettingsSidebar
            mode={mode}
            setMode={setMode}
            topK={topK}
            setTopK={setTopK}
            threshold={threshold}
            setThreshold={setThreshold}
            
            activeNodeName={activeNode?.name}
            onClose={closeMobileRightSidebar}
          />
        </div>
      </div>
    </div>
  );
};
