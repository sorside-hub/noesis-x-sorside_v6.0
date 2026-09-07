import { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { ExternalLink, X, Check, Unlink } from 'lucide-react';

interface LinkModalProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  initialLinkUrl: string;
  initialLinkText: string;
  savedSelectionRef: React.MutableRefObject<{ from: number; to: number; empty: boolean } | null>;
}

export const LinkModal = ({ editor, isOpen, onClose, initialLinkUrl, initialLinkText, savedSelectionRef }: LinkModalProps) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLinkUrl(initialLinkUrl);
      setLinkText(initialLinkText);
      setTimeout(() => {
        if (initialLinkText) {
          urlInputRef.current?.focus();
          urlInputRef.current?.select();
        } else {
          textInputRef.current?.focus();
          textInputRef.current?.select();
        }
      }, 80);
    }
  }, [isOpen, initialLinkUrl, initialLinkText]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSaveLink = () => {
    if (!editor) return;
    let formattedUrl = linkUrl.trim();
    if (!formattedUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      onClose();
      return;
    }

    if (!/^https?:\/\//i.test(formattedUrl) && !formattedUrl.startsWith('#') && !formattedUrl.startsWith('/') && !formattedUrl.startsWith('mailto:')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const sel = savedSelectionRef.current || editor.state.selection;
    const { from, to, empty } = sel;
    const textToDisplay = linkText.trim() || formattedUrl;

    if (empty) {
      editor
        .chain()
        .focus()
        .insertContentAt(from, {
          type: 'text',
          text: textToDisplay,
          marks: [{ type: 'link', attrs: { href: formattedUrl } }],
        })
        .setTextSelection(from + textToDisplay.length)
        .run();
    } else {
      if (linkText.trim() && linkText.trim() !== editor.state.doc.textBetween(from, to, ' ')) {
        editor
          .chain()
          .focus()
          .insertContentAt({ from, to }, {
            type: 'text',
            text: textToDisplay,
            marks: [{ type: 'link', attrs: { href: formattedUrl } }],
          })
          .setTextSelection(from + textToDisplay.length)
          .run();
      } else {
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .setLink({ href: formattedUrl })
          .setTextSelection(to)
          .run();
      }
    }

    onClose();
  };

  const handleUnsetLink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={popoverRef}
        className="w-full max-w-sm bg-bg-surface border border-border-default rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-border-default/60">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <ExternalLink size={16} className="text-accent-primary" />
            <span>{editor?.isActive('link') ? 'Ubah Tautan Web' : 'Sisipkan Tautan [nama](url)'}</span>
          </div>
          <button 
            type="button" 
            onClick={() => onClose()}
            className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Nama / Teks Tampilan <span className="font-mono text-accent-primary font-normal">[nama]</span>
            </label>
            <input 
              ref={textInputRef}
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!linkUrl.trim()) {
                    urlInputRef.current?.focus();
                  } else {
                    handleSaveLink();
                  }
                }
              }}
              placeholder="contoh: Google Search"
              className="w-full text-sm px-3 py-2 bg-bg-canvas border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-text-muted/60"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              URL Tautan Web <span className="font-mono text-accent-primary font-normal">(url)</span>
            </label>
            <input 
              ref={urlInputRef}
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveLink();
                }
              }}
              placeholder="https://google.com"
              className="w-full text-sm px-3 py-2 bg-bg-canvas border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-text-muted/60 font-mono"
            />
          </div>

          {/* Markdown Format Preview */}
          <div className="px-3 py-2 bg-bg-canvas/90 border border-border-default/70 rounded-lg text-xs font-mono text-text-muted flex items-center justify-between">
            <span className="truncate text-text-secondary">
              [{linkText.trim() || 'nama'}]({linkUrl.trim() || 'https://...'})
            </span>
            <span className="text-[11px] text-accent-primary font-sans shrink-0 ml-2 font-medium">Markdown</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 mt-1">
          {editor?.isActive('link') ? (
            <button
              type="button"
              onClick={handleUnsetLink}
              className="inline-flex items-center gap-1 text-xs px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <Unlink size={14} />
              <span>Hapus</span>
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="text-xs px-3 py-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-hover transition-colors font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveLink}
              className="inline-flex items-center gap-1.5 text-xs px-4 py-2 bg-accent-primary text-accent-contrast rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
            >
              <Check size={14} />
              <span>Simpan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
};
