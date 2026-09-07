import React, { useState, useMemo } from 'react';
import { VaultData, FileNode } from '../../../types/vault';
import { X, Search, FileText, ArrowRight } from 'lucide-react';

interface ImportNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: VaultData | null;
  onSelectNote: (node: FileNode) => void;
}

export const ImportNoteModal: React.FC<ImportNoteModalProps> = ({
  isOpen,
  onClose,
  vault,
  onSelectNote
}) => {
  const [search, setSearch] = useState('');

  const notesList = useMemo(() => {
    if (!vault?.nodes) return [];
    return Object.values(vault.nodes).filter(
      (node) => node.type === 'file'
    );
  }, [vault]);

  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notesList;
    const q = search.toLowerCase();
    return notesList.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        (n.content && n.content.toLowerCase().includes(q))
    );
  }, [notesList, search]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-bg-surface/50">
          <div>
            <h3 className="text-sm font-bold text-text-heading">
              Pilih Catatan Vault untuk Di-publish
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Pilih salah satu draf catatan Noesis Anda untuk dijadikan artikel website SORSIDE.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border-default bg-bg-primary/50">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari judul atau isi catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-bg-surface border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
            />
          </div>
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              Tidak ada catatan yang cocok.
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  onSelectNote(note);
                  onClose();
                }}
                className="group flex items-center justify-between p-3 rounded-xl border border-border-default hover:border-accent-primary hover:bg-accent-primary/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-bg-primary flex items-center justify-center text-text-muted group-hover:text-accent-primary shrink-0 border border-border-subtle">
                    <FileText size={16} />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-text-heading group-hover:text-accent-primary truncate">
                      {note.name || 'Untitled'}
                    </div>
                    <div className="text-[10px] text-text-muted truncate mt-0.5">
                      {note.content
                        ? note.content.replace(/<[^>]*>/g, ' ').slice(0, 70)
                        : 'Tanpa konten'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-text-muted group-hover:text-accent-primary shrink-0 ml-2">
                  <span className="text-[11px] hidden sm:inline font-medium">Pilih</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
