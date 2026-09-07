import React, { useState } from 'react';
import { SorsideCreditItem } from '../../../types/sorside';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Code2,
  ListFilter,
  Check,
  RotateCcw
} from 'lucide-react';

export const DEFAULT_SORSIDE_CREDITS_TEMPLATE: SorsideCreditItem[] = [
  { role: 'Vocal & Guitar', name: '' },
  { role: 'Bass', name: '' },
  { role: 'Drums', name: '' },
  { role: 'Synths & Programming', name: '' },
  { role: 'Lyrics', name: 'SORSIDE' },
  { role: 'Arranger', name: 'SORSIDE' },
  { role: 'Mixing Engineer', name: '' },
  { role: 'Mastering Engineer', name: '' },
  { role: 'Recorded at', name: '' },
  { role: 'Label / Publisher', name: 'SORSIDE Records' },
  { role: 'Artwork / Photography', name: '' },
  { role: 'Notes', name: '' }
];

export const SUGGESTED_ROLES: string[] = [
  'Vocal & Guitar',
  'Lead Vocal',
  'Lead Guitar',
  'Rhythm Guitar',
  'Acoustic Guitar',
  'Bass',
  'Drums',
  'Synths & Programming',
  'Keyboards / Piano',
  'Backing Vocals',
  'Lyrics',
  'Songwriter',
  'Arranger',
  'Music Producer',
  'Mixing Engineer',
  'Mastering Engineer',
  'Recorded at',
  'Studio Engineering',
  'Label / Publisher',
  'Artwork / Photography',
  'Music Video Director',
  'Executive Producer',
  'Notes',
  'Liner Notes'
];

interface CreditsBuilderProps {
  credits: SorsideCreditItem[];
  onChange: (credits: SorsideCreditItem[]) => void;
}

export const CreditsBuilder: React.FC<CreditsBuilderProps> = ({
  credits,
  onChange
}) => {
  const [mode, setMode] = useState<'visual' | 'json'>('visual');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(credits, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync jsonText when switching to JSON mode
  const handleSwitchToJson = () => {
    setJsonText(JSON.stringify(credits, null, 2));
    setJsonError(null);
    setMode('json');
  };

  const handleSwitchToVisual = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        const cleanList: SorsideCreditItem[] = parsed.map((item) => ({
          role: String(item.role || item.key || 'Role'),
          name: String(item.name || item.value || '')
        }));
        onChange(cleanList);
        setJsonError(null);
        setMode('visual');
      } else {
        setJsonError('Format JSON harus berupa array [ { "role": "...", "name": "..." } ]');
      }
    } catch (e: any) {
      setJsonError(`JSON tidak valid: ${e.message}`);
    }
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        const cleanList: SorsideCreditItem[] = parsed.map((item) => ({
          role: String(item.role || item.key || 'Role'),
          name: String(item.name || item.value || '')
        }));
        onChange(cleanList);
        setJsonError(null);
      } else {
        setJsonError('Harus berupa array JSON [ ... ]');
      }
    } catch {
      // Allow typing without immediate visual breakage
    }
  };

  const handleItemChange = (index: number, field: 'role' | 'name', value: string) => {
    const updated = [...credits];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddItem = () => {
    onChange([...credits, { role: '', name: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    onChange(credits.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...credits];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === credits.length - 1) return;
    const updated = [...credits];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onChange(updated);
  };

  const handleApplyTemplate = () => {
    onChange(DEFAULT_SORSIDE_CREDITS_TEMPLATE.map(item => ({ ...item })));
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3 bg-bg-surface border border-border-default p-4 sm:p-5 rounded-2xl">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="font-bold text-text-heading text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-accent-primary" />
            <span>Credits & Personel (JSONB)</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
            {credits.length} entri
          </span>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-1.5">
          {mode === 'visual' ? (
            <>
              <button
                type="button"
                onClick={handleApplyTemplate}
                title="Isi otomatis dengan 11 peran template standar SORSIDE"
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-accent-primary/10 text-accent-primary border border-accent-primary/30 hover:bg-accent-primary/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} />
                <span>Template SORSIDE</span>
              </button>
              <button
                type="button"
                onClick={handleSwitchToJson}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-text-muted hover:text-text-primary bg-bg-primary border border-border-default hover:border-border-hover transition-all flex items-center gap-1 cursor-pointer"
              >
                <Code2 size={12} />
                <span>Raw JSON</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSwitchToVisual}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-accent-primary text-accent-contrast shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <ListFilter size={12} />
              <span>Kembali ke Visual Form</span>
            </button>
          )}
        </div>
      </div>

      {/* Datalist for Suggested Roles */}
      <datalist id="suggested-roles-list">
        {SUGGESTED_ROLES.map((roleOption) => (
          <option key={roleOption} value={roleOption} />
        ))}
      </datalist>

      {/* MODE 1: VISUAL LIST / FORM BUILDER */}
      {mode === 'visual' && (
        <div className="space-y-3">
          {credits.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-border-default bg-bg-primary/50 text-center space-y-3">
              <p className="text-xs text-text-muted">
                Belum ada data personel / credits untuk rilisan ini.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  className="px-3 py-2 rounded-xl bg-accent-primary text-accent-contrast text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles size={13} />
                  <span>Gunakan Template Band SORSIDE</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-2 rounded-xl bg-bg-surface border border-border-default text-text-primary text-xs font-semibold hover:border-border-hover transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Tambah Baris Manual</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Responsive Cards List */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {credits.map((item, index) => {
                  const isNotesRole =
                    item.role.trim().toLowerCase().includes('note') ||
                    item.role.trim().toLowerCase().includes('catatan');

                  return (
                    <div
                      key={index}
                      className="p-3 sm:p-3.5 rounded-xl bg-bg-primary border border-border-default/90 hover:border-border-hover transition-all space-y-2.5 shadow-2xs"
                    >
                      {/* Card Header: Index + Role Input + Action Toolbar */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-accent-primary/15 border border-accent-primary/30 text-accent-primary font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>

                          {/* Role Selector / Input */}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              list="suggested-roles-list"
                              value={item.role}
                              onChange={(e) => handleItemChange(index, 'role', e.target.value)}
                              placeholder="Role (misal: Vocal & Guitar, Notes...)"
                              className="w-full px-2.5 py-1.5 bg-bg-surface border border-border-default focus:border-accent-primary rounded-lg text-xs font-bold text-text-heading outline-none placeholder:font-normal placeholder:text-text-muted"
                            />
                          </div>
                        </div>

                        {/* Dedicated Action Buttons Toolbar */}
                        <div className="flex items-center gap-0.5 bg-bg-surface border border-border-default rounded-lg p-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            title="Geser ke atas"
                            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === credits.length - 1}
                            title="Geser ke bawah"
                            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <div className="w-px h-3.5 bg-border-default mx-0.5" />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            title="Hapus baris"
                            className="p-1.5 rounded-md text-text-muted hover:text-status-error hover:bg-status-error-bg transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Card Body: Name or Notes Textarea */}
                      <div>
                        {isNotesRole ? (
                          <textarea
                            rows={2}
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            placeholder="Tuliskan catatan khusus, cerita di balik lagu, atau ucapan terima kasih..."
                            className="w-full p-2.5 bg-bg-surface border border-border-default focus:border-accent-primary rounded-lg text-xs text-text-primary outline-none resize-y leading-relaxed"
                          />
                        ) : (
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            placeholder="Nama Personel / Entitas (contoh: Nugraha / SORSIDE Records)"
                            className="w-full px-2.5 py-1.5 bg-bg-surface border border-border-default focus:border-accent-primary rounded-lg text-xs text-text-primary outline-none placeholder:text-text-muted"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Add Chips & Action Footer */}
              <div className="pt-2 border-t border-border-subtle space-y-2">
                {/* Quick Role Presets Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1">
                    Tambah Cepat:
                  </span>
                  {[
                    { label: '+ Notes', role: 'Notes' },
                    { label: '+ Lyrics', role: 'Lyrics' },
                    { label: '+ Arranger', role: 'Arranger' },
                    { label: '+ Recorded at', role: 'Recorded at' },
                    { label: '+ Mixing', role: 'Mixing Engineer' },
                    { label: '+ Mastering', role: 'Mastering Engineer' }
                  ].map((preset) => (
                    <button
                      key={preset.role}
                      type="button"
                      onClick={() => onChange([...credits, { role: preset.role, name: '' }])}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-primary hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-default hover:border-accent-primary/50 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Main Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 rounded-xl border border-dashed border-border-default hover:border-accent-primary text-text-muted hover:text-accent-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-bg-primary/50"
                  >
                    <Plus size={14} />
                    <span>Tambah Baris Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2.5 py-1.5 text-[11px] text-text-muted hover:text-status-error transition-colors cursor-pointer"
                  >
                    Kosongkan Semua
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: RAW JSON CODE EDITOR */}
      {mode === 'json' && (
        <div className="space-y-2">
          <div className="text-[11px] text-text-muted leading-relaxed">
            Format JSONB array standar. Kamu bisa copy-paste langsung JSON kamu ke kolom ini.
          </div>
          <textarea
            rows={12}
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='[\n  { "role": "Vocal & Guitar", "name": "Nama Personel 1" }\n]'
            className="w-full p-3 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs font-mono text-text-primary outline-none leading-relaxed resize-y shadow-xs"
          />
          {jsonError ? (
            <div className="text-xs text-status-error p-2 rounded-lg bg-status-error-bg border border-status-error/30 font-medium">
              ⚠️ {jsonError}
            </div>
          ) : (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <Check size={12} />
              <span>JSON Valid & Tersinkronisasi Otomatis</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
