import React from 'react';
import { FileText, ExternalLink, Link2, ArrowLeftRight, Loader2 } from 'lucide-react';
import { FileNode } from '../../../types/vault';
import { twMerge } from 'tailwind-merge';

interface LinksTabProps {
  activeNodeName: string;
  backlinks: FileNode[];
  outgoingLinks: { targetName: string; matchedNode: FileNode | null }[];
  semanticLinks: FileNode[];
  isSemanticLoading: boolean;
  onSelectFile: (id: string) => void;
}

export const LinksTab: React.FC<LinksTabProps> = ({
  activeNodeName,
  backlinks,
  outgoingLinks,
  semanticLinks,
  isSemanticLoading,
  onSelectFile,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* SECTION: SEMANTIC LINKS */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <ArrowLeftRight size={13} className="text-accent-primary" />
            Related Notes ({isSemanticLoading ? '...' : semanticLinks.length})
          </h3>
          <p className="text-[11px] text-text-muted">
            Rekomendasi AI berdasarkan kemiripan konteks
          </p>
        </div>

        {isSemanticLoading ? (
          <div className="py-4 flex justify-center text-text-muted">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : semanticLinks.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted border border-dashed border-border-default rounded-xl">
            Tidak ada catatan yang mirip.
          </div>
        ) : (
          <div className="space-y-1.5">
            {semanticLinks.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectFile(node.id)}
                className="w-full p-2.5 bg-bg-primary hover:bg-bg-hover border border-border-default hover:border-accent-primary/50 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <FileText size={14} className="text-text-muted shrink-0 group-hover:text-accent-primary" />
                  <span className="text-xs font-medium text-text-primary group-hover:text-accent-primary truncate">
                    {node.name}
                  </span>
                </div>
                <ExternalLink size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-px bg-border-default/50" />

      {/* SECTION: BACKLINKS */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <ArrowLeftRight size={13} className="text-accent-primary" />
            Linked References ({backlinks.length})
          </h3>
          <p className="text-[11px] text-text-muted">
            Catatan lain yang mereferensikan &quot;{activeNodeName}&quot;
          </p>
        </div>

        {backlinks.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted border border-dashed border-border-default rounded-xl">
            Belum ada catatan yang menautkan ke sini.
          </div>
        ) : (
          <div className="space-y-1.5">
            {backlinks.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectFile(node.id)}
                className="w-full p-2.5 bg-bg-primary hover:bg-bg-hover border border-border-default hover:border-accent-primary/50 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <FileText size={14} className="text-text-muted shrink-0 group-hover:text-accent-primary" />
                  <span className="text-xs font-medium text-text-primary group-hover:text-accent-primary truncate">
                    {node.name}
                  </span>
                </div>
                <ExternalLink size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-px bg-border-default/50" />

      {/* SECTION: OUTGOING LINKS */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Link2 size={13} className="text-accent-primary" />
            Outgoing Links ({outgoingLinks.length})
          </h3>
          <p className="text-[11px] text-text-muted">
            Tautan internal wiki-link yang ada di catatan ini
          </p>
        </div>

        {outgoingLinks.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted border border-dashed border-border-default rounded-xl">
            Tidak ada tautan wiki-link <span className="font-mono text-accent-primary/70 bg-accent-primary/10 px-1 py-0.5 rounded border border-accent-primary/20">[[...]]</span> ditemukan.
          </div>
        ) : (
          <div className="space-y-1.5">
            {outgoingLinks.map((item, idx) => (
              <button
                key={idx}
                type="button"
                disabled={!item.matchedNode}
                onClick={() => item.matchedNode && onSelectFile(item.matchedNode.id)}
                className={twMerge(
                  'w-full p-2.5 bg-bg-primary border border-border-default hover:border-accent-primary/50 rounded-xl text-left transition-colors flex items-center justify-between group',
                  item.matchedNode
                    ? 'hover:bg-bg-hover cursor-pointer'
                    : 'opacity-60 cursor-default hover:border-border-default'
                )}
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <Link2 size={14} className="text-text-muted shrink-0 group-hover:text-accent-primary" />
                  <span className="text-xs font-medium text-text-primary truncate group-hover:text-accent-primary">
                    {item.targetName}
                  </span>
                </div>
                {item.matchedNode ? (
                  <ExternalLink size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                ) : (
                  <span className="text-[10px] text-text-muted shrink-0 ml-2">(Uncreated)</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
