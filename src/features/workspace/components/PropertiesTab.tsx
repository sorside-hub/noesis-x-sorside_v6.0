import React from 'react';
import {
  Folder,
  ChevronDown,
  Sliders,
} from 'lucide-react';
import { FileNode } from '../../../types/vault';
import { ChipInput } from './ChipInput';
import { CustomPropertiesSection } from './CustomPropertiesSection';
import { NoteTypeSelector } from './NoteTypeSelector';
import { NoteRagCard } from './NoteRagCard';
import { NoteAutoDetectCard } from './NoteAutoDetectCard';
import { NoteStatsSection } from './NoteStatsSection';
import { RagSyncStatus } from '../../rag/services/ragPipeline';

interface PropertiesTabProps {
  activeNode: FileNode;
  folderName: string;
  noteType: string;
  status: string;
  tags: string[];
  aliases: string[];
  isSyncingRag: boolean;
  ragSyncStatus: RagSyncStatus | null;
  aiMetadata?: any | null;
  formattedCreated: string;
  formattedModified: string;
  stats: {
    words: number;
    characters: number;
    readingTimeMinutes: number;
  };
  isAutoDetecting?: boolean;
  autoDetectError?: string | null;
  existingTags?: string[];
  existingNoteTypes?: string[];
  handleTypeChange: (val: string) => void;
  handleStatusChange: (val: string) => void;
  handleTagsChange: (newTags: string[]) => void;
  handleAliasesChange: (newAliases: string[]) => void;
  handleCustomPropertiesChange: (props: any[]) => void;
  handleProcessRag: () => void;
  handleRemoveRag: () => void;
  handleRunAutoDetect?: () => void;
}

export const PropertiesTab: React.FC<PropertiesTabProps> = ({
  activeNode,
  folderName,
  noteType,
  status,
  tags,
  aliases,
  isSyncingRag,
  ragSyncStatus,
  aiMetadata,
  formattedCreated,
  formattedModified,
  stats,
  isAutoDetecting,
  autoDetectError,
  existingTags = [],
  existingNoteTypes = [],
  handleTypeChange,
  handleStatusChange,
  handleTagsChange,
  handleAliasesChange,
  handleCustomPropertiesChange,
  handleProcessRag,
  handleRemoveRag,
  handleRunAutoDetect,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. Header Tab Section */}
      <div className="space-y-2 pb-2 border-b border-border-default/50">
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Sliders size={13} className="text-accent-primary" />
          <span>Properties & Metadata</span>
        </h3>
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-text-heading tracking-tight truncate">
            {activeNode.name}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Folder size={12} className="text-text-muted shrink-0" />
            <span className="truncate">{folderName}</span>
          </div>
        </div>
      </div>

      {/* 2. Core Properties Section Header */}
      <div className="flex items-center gap-2 pt-1">
        <div className="h-px bg-border-subtle flex-1" />
        <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest px-2">
          Core Properties
        </span>
        <div className="h-px bg-border-subtle flex-1" />
      </div>

      {/* 3. Note Type Autocomplete */}
      <NoteTypeSelector
        noteType={noteType}
        existingNoteTypes={existingNoteTypes}
        activeNodeId={activeNode.id}
        onChange={handleTypeChange}
      />

      {/* 4. Status Dropdown */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
          Status
        </label>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border-default hover:border-border-hover focus:border-accent-primary/60 rounded-xl text-xs text-text-primary appearance-none focus:outline-none pr-8 cursor-pointer transition-colors"
          >
            <option value="">-</option>
            <option value="Inbox">Inbox</option>
            <option value="Idea">Idea</option>
            <option value="Draft">Draft</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* 5. Tags Input */}
      <ChipInput
        label="Tags"
        items={tags}
        onChange={handleTagsChange}
        placeholder="Add tag (e.g. journal)..."
        prefix="#"
        chipColorClass="bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shadow-xs"
        suggestions={existingTags}
      />

      {/* 6. Aliases Input */}
      <ChipInput
        label="Aliases"
        items={aliases}
        onChange={handleAliasesChange}
        placeholder="Add alias (e.g. Daily Note)..."
        chipColorClass="bg-bg-surface text-text-muted border border-border-default hover:text-text-primary transition-colors"
        helperText="Nama alias yang dapat memicu tautan [[wikilink]]."
      />

      {/* 7. Custom Properties */}
      <CustomPropertiesSection
        customProperties={activeNode.metadata?.customProperties || []}
        onChange={handleCustomPropertiesChange}
      />

      {/* 8. AI RAG Brain Card */}
      <NoteRagCard
        isSyncingRag={isSyncingRag}
        ragSyncStatus={ragSyncStatus}
        aiMetadata={aiMetadata}
        handleProcessRag={handleProcessRag}
        handleRemoveRag={handleRemoveRag}
      />

      <div className="h-px bg-border-subtle" />

      {/* 9. AI Auto-Detect Section */}
      <NoteAutoDetectCard
        isAutoDetecting={isAutoDetecting}
        autoDetectError={autoDetectError}
        handleRunAutoDetect={handleRunAutoDetect}
      />

      <div className="h-px bg-border-subtle" />

      {/* 10. Dates & Document Statistics */}
      <NoteStatsSection
        formattedCreated={formattedCreated}
        formattedModified={formattedModified}
        stats={stats}
      />
    </div>
  );
};
