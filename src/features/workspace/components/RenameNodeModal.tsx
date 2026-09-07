import React from 'react';
import { twMerge } from 'tailwind-merge';
import { FileNode } from '../../../types/vault';

interface RenameNodeModalProps {
  renamingNode: FileNode | null;
  renameValue: string;
  setRenameValue: (val: string) => void;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  isRenameDuplicate: boolean;
  setIsInputFocused: (focused: boolean) => void;
  closeActiveDialog: () => void;
  handleSaveRename: () => void;
}

export const RenameNodeModal: React.FC<RenameNodeModalProps> = ({
  renamingNode,
  renameValue,
  setRenameValue,
  renameInputRef,
  isRenameDuplicate,
  setIsInputFocused,
  closeActiveDialog,
  handleSaveRename,
}) => {
  if (!renamingNode) return null;

  return (
    <div 
      className="fixed inset-0 z-70 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4 pt-20 sm:pt-4"
      onClick={closeActiveDialog}
    >
      <div 
        className="w-full max-w-sm bg-bg-surface border border-border-default rounded-xl shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-text-heading">
          Ubah Nama {renamingNode.type === 'folder' ? 'Folder' : 'Catatan'}
        </h3>
        <input
          ref={renameInputRef}
          type="text"
          value={renameValue}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isRenameDuplicate && renameValue.trim()) handleSaveRename();
            if (e.key === 'Escape') {
              closeActiveDialog();
            }
          }}
          className={twMerge(
            "w-full px-3 py-2 bg-bg-primary border rounded-lg text-sm text-text-primary focus:outline-none transition-colors",
            isRenameDuplicate 
              ? "border-status-error focus:ring-1 focus:ring-status-error" 
              : "border-border-default focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/40"
          )}
          placeholder="Masukkan nama baru..."
        />
        {isRenameDuplicate && (
          <p className="text-[11px] text-status-error font-medium -mt-1">
            Nama ini sudah digunakan dalam folder ini.
          </p>
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={closeActiveDialog}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isRenameDuplicate || !renameValue.trim()}
            onClick={handleSaveRename}
            className={twMerge(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs",
              isRenameDuplicate || !renameValue.trim()
                ? "bg-bg-hover text-text-muted cursor-not-allowed opacity-50"
                : "bg-accent-primary text-accent-contrast hover:opacity-90 active:scale-[0.98]"
            )}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
