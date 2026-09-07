import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Music, ChevronLeft, ChevronRight, ChevronDown, Layers, Check } from 'lucide-react';
import { getChordDefinition, ChordDefinition } from '../lib/chordDatabase';
import { ChordDiagramSvg } from './ChordDiagramSvg';

interface ChordPopoverModalProps {
  isOpen: boolean;
  chordName: string;
  onClose: () => void;
}

export const ChordPopoverModal: React.FC<ChordPopoverModalProps> = ({
  isOpen,
  chordName,
  onClose,
}) => {
  const [instrument, setInstrument] = useState<'guitar' | 'ukulele'>('guitar');
  const [positionIndex, setPositionIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset position index when chordName or instrument changes
  useEffect(() => {
    setPositionIndex(0);
  }, [chordName, instrument]);

  // Click outside to close custom instrument dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!isOpen || !chordName) return null;

  const chordDef: ChordDefinition = getChordDefinition(chordName);
  const positions = instrument === 'guitar' 
    ? chordDef.guitar 
    : (chordDef.ukulele && chordDef.ukulele.length > 0 ? chordDef.ukulele : chordDef.guitar);

  const currentPos = positions[positionIndex] || positions[0];
  const maxPositions = positions.length;

  const handleNextPosition = () => {
    setPositionIndex((prev) => (prev + 1) % maxPositions);
  };

  const handlePrevPosition = () => {
    setPositionIndex((prev) => (prev - 1 + maxPositions) % maxPositions);
  };

  const instrumentOptions = [
    { id: 'guitar', label: 'Gitar Standard', icon: '🎸' },
    { id: 'ukulele', label: 'Ukulele', icon: '🪕' },
  ] as const;

  const modalContent = (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm bg-bg-surface border border-border-default rounded-xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chord-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-canvas/40 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-accent-primary/10 text-accent-primary shrink-0">
              <Music size={18} />
            </div>
            <div className="min-w-0">
              <h2 id="chord-modal-title" className="text-base font-bold text-text-primary leading-tight font-mono">
                {chordName}
              </h2>
              <p className="text-[11px] text-text-muted truncate">
                {chordDef.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Integrated Custom Instrument Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-surface hover:bg-bg-hover active:bg-bg-active border border-border-default rounded-lg text-xs font-medium text-text-primary transition-all duration-150 cursor-pointer shadow-2xs"
                title="Pilih Instrumen"
              >
                <span>{instrument === 'guitar' ? '🎸 Gitar' : '🪕 Ukulele'}</span>
                <ChevronDown size={13} className={`text-text-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-text-primary' : ''}`} />
              </button>

              {/* Custom Popover Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-bg-surface border border-border-default rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted border-b border-border-default/50 mb-1">
                    Instrumen
                  </div>
                  {instrumentOptions.map((opt) => {
                    const isSelected = instrument === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setInstrument(opt.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-accent-primary/10 text-accent-primary font-semibold'
                            : 'text-text-primary hover:bg-bg-hover'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </span>
                        {isSelected && <Check size={14} className="text-accent-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
              title="Tutup"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col items-center justify-center space-y-4">
          {/* SVG Diagram Canvas */}
          <div className="p-2 bg-bg-canvas/50 border border-border-default/80 rounded-xl flex items-center justify-center min-w-[200px]">
            <ChordDiagramSvg
              position={currentPos}
              instrument={instrument}
              width={190}
              height={220}
            />
          </div>

          {/* Voicing Position Controls & Counter */}
          {maxPositions > 1 && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-bg-canvas/80 border border-border-default/80 text-xs font-medium text-text-muted shadow-2xs">
              <button
                type="button"
                onClick={handlePrevPosition}
                className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover active:bg-bg-active transition-colors cursor-pointer"
                title="Posisi Voicing Sebelumnya"
                aria-label="Posisi Voicing Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5 px-1">
                <Layers size={13} className="text-accent-primary" />
                <span>
                  Voicing <strong className="text-text-primary font-semibold">{positionIndex + 1}</strong> dari {maxPositions}
                </span>
              </div>
              <button
                type="button"
                onClick={handleNextPosition}
                className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover active:bg-bg-active transition-colors cursor-pointer"
                title="Posisi Voicing Berikutnya"
                aria-label="Posisi Voicing Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Notes in chord */}
          {chordDef.notes && chordDef.notes.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="font-semibold text-text-secondary">Nada:</span>
              <div className="flex items-center gap-1 font-mono">
                {chordDef.notes.map((note, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded bg-bg-canvas border border-border-default font-semibold text-text-primary text-[11px]"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
