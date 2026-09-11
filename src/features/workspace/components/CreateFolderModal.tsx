import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CreateFolderModalProps {
  parentFolderName?: string | null;
  folderName: string;
  setFolderName: (val: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isDuplicate: boolean;
  setIsInputFocused: (focused: boolean) => void;
  closeActiveDialog: () => void;
  handleCreateFolder: () => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  parentFolderName,
  folderName,
  setFolderName,
  inputRef,
  isDuplicate,
  setIsInputFocused,
  closeActiveDialog,
  handleCreateFolder,
}) => {
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [inputRef]);

  return (
    <div 
      className="fixed inset-0 z-70 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4 pt-20 sm:pt-4"
      onClick={closeActiveDialog}
    >
      <div 
        className="w-full max-w-sm bg-bg-surface border border-border-default rounded-xl shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-text-heading">
            Buat Folder Baru
          </h3>
          {parentFolderName && (
            <p className="text-[11px] text-text-muted truncate">
              di dalam <span className="font-medium text-text-secondary">{parentFolderName}</span>
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={folderName}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onChange={(e) => setFolderName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isDuplicate && folderName.trim()) {
              handleCreateFolder();
            }
            if (e.key === 'Escape') {
              closeActiveDialog();
            }
          }}
          className={twMerge(
            "w-full px-3 py-2 bg-bg-primary border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors",
            isDuplicate 
              ? "border-status-error focus:ring-1 focus:ring-status-error" 
              : "border-border-default focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/40"
          )}
          placeholder="Masukkan nama folder..."
        />

        {isDuplicate && (
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
            disabled={isDuplicate || !folderName.trim()}
            onClick={handleCreateFolder}
            className={twMerge(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs",
              isDuplicate || !folderName.trim()
                ? "bg-bg-hover text-text-muted cursor-not-allowed opacity-50"
                : "bg-accent-primary text-accent-contrast hover:opacity-90 active:scale-[0.98]"
            )}
          >
            Buat Folder
          </button>
        </div>
      </div>
    </div>
  );
};
