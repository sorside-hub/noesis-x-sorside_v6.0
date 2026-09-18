import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bell, 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  Trash2,
  Type
} from 'lucide-react';
import { reminderService } from '../../../../lib/reminder/reminderService';
import { REMINDER_REGEX } from '../../../../lib/reminder/reminderParser';

interface ReminderModalProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  savedSelectionRef: React.MutableRefObject<{ from: number; to: number; empty: boolean } | null>;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  editor,
  isOpen,
  onClose,
  savedSelectionRef,
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [includeTime, setIncludeTime] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [hasExistingReminder, setHasExistingReminder] = useState(false);
  const [existingMatchRange, setExistingMatchRange] = useState<{ from: number; to: number } | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Helper to format date into YYYY-MM-DD
  const formatDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen && editor) {
      // Request permission if not yet decided
      if (reminderService.getPermissionStatus() === 'default') {
        reminderService.requestPermission();
      }

      // Default date: Tomorrow (or today if morning)
      const now = new Date();
      const defaultDate = formatDateStr(now);
      let initialDate = defaultDate;
      let initialTime = '09:00';
      let initialIncludeTime = false;
      let initialCustomTitle = '';
      let foundExisting = false;
      let matchRange: { from: number; to: number } | null = null;

      // Check current line for existing reminder syntax
      const sel = savedSelectionRef.current || editor.state.selection;
      const $pos = editor.state.doc.resolve(sel.from);
      const lineStart = $pos.start();
      const lineEnd = $pos.end();
      const lineText = editor.state.doc.textBetween(lineStart, lineEnd, ' ');

      REMINDER_REGEX.lastIndex = 0;
      let match: RegExpExecArray | null;
      let bestMatch: { match: RegExpExecArray; from: number; to: number } | null = null;
      while ((match = REMINDER_REGEX.exec(lineText)) !== null) {
        const from = lineStart + match.index;
        const to = from + match[0].length;
        if (!bestMatch) {
          bestMatch = { match, from, to };
        }
        // If cursor is within or adjacent to this reminder match
        if (sel.from >= from && sel.from <= to + 1) {
          bestMatch = { match, from, to };
          break;
        }
      }

      if (bestMatch) {
        foundExisting = true;
        initialDate = bestMatch.match[1];
        if (bestMatch.match[2]) {
          initialTime = bestMatch.match[2];
          initialIncludeTime = true;
        }
        if (bestMatch.match[3]) {
          initialCustomTitle = bestMatch.match[3].trim();
        }
        matchRange = {
          from: bestMatch.from,
          to: bestMatch.to,
        };
      }

      setCustomTitle(initialCustomTitle);
      setSelectedDate(initialDate);
      setIncludeTime(initialIncludeTime);
      setSelectedTime(initialTime);
      setHasExistingReminder(foundExisting);
      setExistingMatchRange(matchRange);

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, editor]);

  // Click outside and escape handling
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

  const handleApplyReminder = () => {
    if (!editor || !selectedDate) return;

    const timePart = includeTime && selectedTime ? ` ${selectedTime}` : '';
    const titlePart = customTitle.trim() ? ` [${customTitle.trim()}]` : '';
    const reminderTag = `⏰ ${selectedDate}${timePart}${titlePart}`;

    const sel = savedSelectionRef.current || editor.state.selection;

    if (hasExistingReminder && existingMatchRange) {
      // Replace existing reminder tag with clean plain text node (clearing any accidental marks like code/bold)
      editor
        .chain()
        .focus()
        .deleteRange(existingMatchRange)
        .unsetAllMarks()
        .insertContentAt(existingMatchRange.from, {
          type: 'text',
          text: reminderTag,
          marks: [],
        })
        .run();
    } else {
      // Insert at current cursor / end of current line with clean plain text
      const { from, empty } = sel;
      if (empty) {
        // If at end or middle of text, ensure leading space
        const $pos = editor.state.doc.resolve(from);
        const textBefore = $pos.parent.textBetween(0, $pos.parentOffset, undefined, '\0');
        const needsSpace = textBefore.length > 0 && !/\s$/.test(textBefore);
        const insertText = `${needsSpace ? ' ' : ''}${reminderTag} `;

        editor
          .chain()
          .focus()
          .unsetAllMarks()
          .insertContentAt(from, {
            type: 'text',
            text: insertText,
            marks: [],
          })
          .run();
      } else {
        // Append to selection
        editor
          .chain()
          .focus()
          .unsetAllMarks()
          .insertContentAt(sel.to, {
            type: 'text',
            text: ` ${reminderTag}`,
            marks: [],
          })
          .run();
      }
    }

    onClose();
  };

  const handleRemoveReminder = () => {
    if (!editor || !existingMatchRange) return;
    editor
      .chain()
      .focus()
      .deleteRange(existingMatchRange)
      .unsetAllMarks()
      .run();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={popoverRef}
        className="w-full max-w-sm bg-bg-surface border border-border-default rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border-default/60">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <div className="p-1.5 rounded-lg bg-accent-primary/10 text-accent-primary">
              <Bell size={16} />
            </div>
            <span>{hasExistingReminder ? 'Ubah Pengingat' : 'Pasang Pengingat'}</span>
          </div>
          <button 
            type="button" 
            onClick={() => onClose()}
            className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Custom Title Input (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Type size={13} className="text-accent-primary" />
              <span>Judul / Label Pengingat</span>
            </span>
            <span className="text-[10px] text-text-muted">Opsional</span>
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Misal: Bayar tagihan server, Kirim email..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyReminder();
              }
            }}
            className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary placeholder:text-text-muted outline-none transition-colors"
          />
        </div>

        {/* Date Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <CalendarIcon size={13} className="text-accent-primary" />
            <span>Tanggal Pengingat</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none transition-colors cursor-pointer"
          />
        </div>

        {/* Time Toggle & Input */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="reminder-time-toggle"
              className="text-xs font-medium text-text-primary flex items-center gap-1.5 cursor-pointer select-none"
            >
              <Clock size={13} className="text-accent-primary" />
              <span>Tentukan Jam Spesifik</span>
            </label>
            <input
              id="reminder-time-toggle"
              type="checkbox"
              checked={includeTime}
              onChange={(e) => setIncludeTime(e.target.checked)}
              className="w-4 h-4 rounded text-accent-primary bg-bg-primary border-border-default focus:ring-accent-primary cursor-pointer"
            />
          </div>

          {includeTime ? (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none transition-colors cursor-pointer"
              />
            </div>
          ) : (
            <p className="text-[11px] text-text-muted italic">
              * Tanpa jam spesifik: Notifikasi akan berbunyi di jam 09:00 pagi pada tanggal tersebut.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border-default/60 gap-2">
          {hasExistingReminder ? (
            <button
              type="button"
              onClick={handleRemoveReminder}
              className="px-3 py-1.5 text-xs text-status-error hover:bg-status-error-bg rounded-xl border border-status-error/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Hapus</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-xl border border-transparent transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApplyReminder}
              disabled={!selectedDate}
              className="px-3.5 py-1.5 bg-accent-primary hover:bg-accent-hover text-accent-contrast rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Check size={14} />
              <span>{hasExistingReminder ? 'Simpan' : 'Pasang'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
