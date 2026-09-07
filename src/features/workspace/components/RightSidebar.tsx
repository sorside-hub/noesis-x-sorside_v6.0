import React from 'react';
import { 
  SlidersVertical, 
  ArrowLeftRight, 
  Link2, 
  ListTree, 
  Sparkles,
  CheckSquare,
  Bot,
  Network
} from 'lucide-react';
import { VaultData, FileNode, NoteMetadata } from '../../../types/vault';
import { useVirtualKeyboard } from '../../../hooks/useVirtualKeyboard';
import { useRightSidebarLogic, RightSidebarTab } from '../hooks/useRightSidebarLogic';
import { PropertiesTab } from './PropertiesTab';
import { DistilTab } from './DistilTab';
import { ChatTab } from './ChatTab';
import { LinksTab } from './LinksTab';
import { OutlineTab } from './OutlineTab';
import { TasksTab } from './TasksTab';
import { LocalGraphTab } from './localGraph/LocalGraphTab';
import { RightSidebarTabSwitcher } from './RightSidebarTabSwitcher';
import { AutoDetectModal } from './AutoDetectModal';

export type { RightSidebarTab };

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  vault: VaultData;
  activeNode: FileNode | null;
  onSelectFile: (id: string) => void;
  onUpdateMetadata: (id: string, metadata: Partial<NoteMetadata>) => void;
  updateNoteContent?: (id: string, content: string) => void;
  updateNodeTitle?: (id: string, title: string) => void;
  createFolder?: (parentId: string | null, name: string) => string | null;
  moveNode?: (id: string, targetParentId: string | null) => void;
  onNavigateToHeading?: (lineIndex: number, text: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  vault,
  activeNode,
  onSelectFile,
  onUpdateMetadata,
  updateNoteContent,
  updateNodeTitle,
  createFolder,
  moveNode,
  onNavigateToHeading,
}) => {
  const { isKeyboardOpen } = useVirtualKeyboard();

  const {
    activeTab,
    setActiveTab,
    isTabMenuOpen,
    setIsTabMenuOpen,
    tabMenuRef,
    isDistiling,
    distilError,
    distilHtml,
    distilLog,
    isSyncingRag,
    ragSyncStatus,
    aiMetadata,
    folderName,
    stats,
    formattedCreated,
    formattedModified,
    tags,
    aliases,
    noteType,
    status,
    backlinks,
    outgoingLinks,
    semanticLinks,
    isSemanticLoading,
    collapsedHeadingIndices,
    setCollapsedHeadingIndices,
    outlineHeadings,
    handleGenerateDistil,
    handleTypeChange,
    handleStatusChange,
    handleTagsChange,
    handleAliasesChange,
    handleCustomPropertiesChange,
    handleDistilClick,
    handleRemoveRag,
    handleProcessRag,
    toggleHeadingCollapse,
    handleUpdateContent,
    isAutoDetecting,
    autoDetectError,
    autoDetectResult,
    autoDetectLog,
    isAutoDetectModalOpen,
    setIsAutoDetectModalOpen,
    handleRunAutoDetect,
    handleApplyAutoDetect,
    existingTags,
    existingNoteTypes,
  } = useRightSidebarLogic({
    vault,
    activeNode,
    onSelectFile,
    onUpdateMetadata,
    updateNoteContent,
    updateNodeTitle,
    createFolder,
    moveNode,
    onNavigateToHeading,
  });

  // Metadata accessors
  const metadata: NoteMetadata = activeNode?.metadata || {};

  // Tab definitions
  const tabs: { id: RightSidebarTab; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'PROPERTIES', label: 'Properties', icon: SlidersVertical },
    { id: 'LOCAL_GRAPH', label: 'Local Graph', icon: Network },
    { id: 'TASKS', label: 'Tasks', icon: CheckSquare },
    { id: 'OUTLINE', label: 'Outline', icon: ListTree },
    { id: 'DISTIL', label: 'Distil AI', icon: Sparkles },
    { id: 'CHAT', label: 'Copilot', icon: Bot },
    { id: 'LINKS', label: 'Links', icon: Link2 },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-full h-full flex flex-col bg-bg-surface border-l border-border-default relative overflow-hidden select-none">
      {/* MAIN BODY CONTENT */}
      <div className={`flex-1 ${
        activeTab === 'LOCAL_GRAPH' 
          ? 'overflow-hidden flex flex-col p-0 pb-[4.5rem]' 
          : 'overflow-y-auto p-4 space-y-3 pb-20'
      } ${
        activeTab === 'CHAT' && isKeyboardOpen ? 'pb-4' : ''
      }`}>
        {!activeNode ? (
          <div className="h-full flex items-center justify-center text-center text-text-muted text-sm py-24">
            Tidak ada catatan aktif yang dipilih.
          </div>
        ) : (
          <>
            {/* TAB 1: PROPERTIES */}
            {activeTab === 'PROPERTIES' && (
              <PropertiesTab
                activeNode={activeNode}
                folderName={folderName}
                noteType={noteType}
                status={status}
                tags={tags}
                aliases={aliases}
                isSyncingRag={isSyncingRag}
                ragSyncStatus={ragSyncStatus}
                aiMetadata={aiMetadata}
                formattedCreated={formattedCreated}
                formattedModified={formattedModified}
                stats={stats}
                isAutoDetecting={isAutoDetecting}
                autoDetectError={autoDetectError}
                existingTags={existingTags}
                existingNoteTypes={existingNoteTypes}
                handleTypeChange={handleTypeChange}
                handleStatusChange={handleStatusChange}
                handleTagsChange={handleTagsChange}
                handleAliasesChange={handleAliasesChange}
                handleCustomPropertiesChange={handleCustomPropertiesChange}
                handleProcessRag={handleProcessRag}
                handleRemoveRag={handleRemoveRag}
                handleRunAutoDetect={handleRunAutoDetect}
              />
            )}

            {/* TAB 2: LOCAL GRAPH */}
            {activeTab === 'LOCAL_GRAPH' && (
              <LocalGraphTab
                vault={vault}
                activeNode={activeNode}
                onSelectFile={onSelectFile}
              />
            )}

            {/* TAB 3: TASKS & CHECKLIST */}
            {activeTab === 'TASKS' && (
              <TasksTab
                activeNode={activeNode}
                onUpdateContent={handleUpdateContent}
                onNavigateToLine={onNavigateToHeading}
              />
            )}

            {/* TAB 3: OUTLINE */}
            {activeTab === 'OUTLINE' && (
              <OutlineTab
                outlineHeadings={outlineHeadings}
                collapsedHeadingIndices={collapsedHeadingIndices}
                setCollapsedHeadingIndices={setCollapsedHeadingIndices}
                toggleHeadingCollapse={toggleHeadingCollapse}
                onNavigateToHeading={onNavigateToHeading}
              />
            )}

            {/* TAB 4: DISTIL */}
            {activeTab === 'DISTIL' && (
              <DistilTab
                activeNode={activeNode}
                isDistiling={isDistiling}
                distilError={distilError}
                distilHtml={distilHtml}
                distilLog={distilLog}
                distilResult={metadata.distilResult as string | undefined}
                onGenerateDistil={handleGenerateDistil}
                onDistilClick={handleDistilClick}
              />
            )}

            {/* TAB 5: CHAT */}
            {activeTab === 'CHAT' && (
              <ChatTab activeNode={activeNode} onUpdateMetadata={onUpdateMetadata} />
            )}

            {/* TAB 6: LINKS */}
            {activeTab === 'LINKS' && (
              <LinksTab
                activeNodeName={activeNode.name}
                backlinks={backlinks}
                outgoingLinks={outgoingLinks}
                semanticLinks={semanticLinks}
                isSemanticLoading={isSemanticLoading}
                onSelectFile={onSelectFile}
              />
            )}
          </>
        )}
      </div>

      {/* FLOATING ROUNDED PILL TAB SWITCHER */}
      <RightSidebarTabSwitcher
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTabMenuOpen={isTabMenuOpen}
        setIsTabMenuOpen={setIsTabMenuOpen}
        tabMenuRef={tabMenuRef}
        isKeyboardOpen={isKeyboardOpen}
        tabs={tabs}
      />

      {/* AUTO-DETECT CONFIRMATION MODAL */}
      <AutoDetectModal
        isOpen={isAutoDetectModalOpen}
        onClose={() => setIsAutoDetectModalOpen(false)}
        result={autoDetectResult}
        cascadeLog={autoDetectLog}
        onApply={handleApplyAutoDetect}
      />
    </aside>
  );
};
