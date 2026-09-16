import React, { useState } from 'react';
import { 
  Folder, 
  FolderPlus, 
  Calendar, 
  Clock, 
  FileText, 
  Info, 
  Sparkles,
  Check,
  ChevronDown
} from 'lucide-react';
import { VaultData } from '../../../types/vault';
import { useTemplateSettings } from '../hooks/useTemplateSettings';
import { formatTemplateDate, formatTemplateTime } from '../utils/templateUtils';

interface TemplateSettingsCardProps {
  vault: VaultData;
  createFolder?: (parentId: string | null, name: string) => string | null;
}

const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (Standar ISO)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Standar ID/UK)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (Standar US)' },
  { value: 'DD MMMM YYYY', label: '16 September 2026 (Nama Bulan)' },
  { value: 'dddd, DD MMMM YYYY', label: 'Rabu, 16 September 2026 (Hari Lengkap)' },
];

const TIME_FORMAT_OPTIONS = [
  { value: 'HH:mm', label: 'HH:mm (24 Jam, misal 14:30)' },
  { value: 'hh:mm A', label: 'hh:mm AM/PM (12 Jam, misal 02:30 PM)' },
  { value: 'HH:mm:ss', label: 'HH:mm:ss (24 Jam dengan detik)' },
];

export const TemplateSettingsCard: React.FC<TemplateSettingsCardProps> = ({
  vault,
  createFolder,
}) => {
  const {
    settings,
    updateSettings,
    activeTemplateFolder,
    availableFolders,
    templates,
    createDefaultTemplateFolder,
  } = useTemplateSettings(vault, createFolder);

  const [isCreatedSuccess, setIsCreatedSuccess] = useState(false);

  const handleCreateFolder = () => {
    const id = createDefaultTemplateFolder();
    if (id) {
      setIsCreatedSuccess(true);
      setTimeout(() => setIsCreatedSuccess(false), 2500);
    }
  };

  const previewDate = formatTemplateDate(new Date(), settings.dateFormat);
  const previewTime = formatTemplateTime(new Date(), settings.timeFormat);

  return (
    <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden shadow-xs divide-y divide-border-subtle">
      {/* 1. Header Banner */}
      <div className="p-3.5 sm:p-4 bg-bg-surface">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-text-heading truncate">
                  Template Catatan
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-primary/15 text-accent-primary border border-accent-primary/20 whitespace-nowrap shrink-0">
                  {templates.length} template
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5 leading-normal">
                Kelola folder sumber template dan format tanggal dinamis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Folder Source Configuration */}
      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Folder size={13} className="text-accent-primary" />
            <span>Folder Sumber Template</span>
          </label>
          <div className="relative">
            <select
              value={activeTemplateFolder?.id || ''}
              onChange={(e) => {
                const folderId = e.target.value;
                if (!folderId) {
                  updateSettings({ templateFolderId: null, templateFolderPath: 'Templates' });
                } else {
                  const f = availableFolders.find((folder) => folder.id === folderId);
                  updateSettings({
                    templateFolderId: folderId,
                    templateFolderPath: f ? f.name : 'Templates',
                  });
                }
              }}
              className="w-full appearance-none bg-bg-primary border border-border-default hover:border-accent-primary/50 text-text-primary text-xs rounded-lg px-3 py-2.5 pr-8 focus:outline-hidden focus:ring-1 focus:ring-accent-primary transition-colors cursor-pointer font-medium"
            >
              <option value="">
                {availableFolders.length === 0
                  ? 'Belum ada folder di vault'
                  : '-- Pilih Folder Template --'}
              </option>
              {availableFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  📁 {folder.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
        </div>

        {/* Status bar & action for folder */}
        {activeTemplateFolder ? (
          <div className="p-2.5 rounded-lg bg-bg-primary/60 border border-border-subtle flex items-start gap-2 text-xs">
            <Info size={14} className="text-accent-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-text-secondary font-medium leading-relaxed">
                Setiap note di dalam folder <strong className="text-text-heading">"{activeTemplateFolder.name}"</strong> akan otomatis dikenali sebagai template.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-2.5">
            <div className="flex items-start gap-2">
              <Info size={14} className="shrink-0 mt-0.5 text-amber-500" />
              <span className="leading-relaxed">
                Folder template belum dipilih atau belum ada di vault kamu.
              </span>
            </div>
            {createFolder && (
              <button
                type="button"
                onClick={handleCreateFolder}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-accent-primary text-accent-contrast hover:opacity-90 text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
              >
                {isCreatedSuccess ? (
                  <>
                    <Check size={13} />
                    <span>Folder 'Templates' Berhasil Dibuat!</span>
                  </>
                ) : (
                  <>
                    <FolderPlus size={13} />
                    <span>Buat Folder 'Templates' Otomatis</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Date & Time Format Settings */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Date Format */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={13} className="text-accent-primary" />
              <span>Format Tanggal ({"{{date}}"})</span>
            </label>
            <div className="relative">
              <select
                value={settings.dateFormat}
                onChange={(e) => updateSettings({ dateFormat: e.target.value })}
                className="w-full appearance-none bg-bg-primary border border-border-default hover:border-accent-primary/50 text-text-primary text-xs rounded-lg px-3 py-2 pr-8 focus:outline-hidden focus:ring-1 focus:ring-accent-primary transition-colors cursor-pointer"
              >
                {DATE_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
            <p className="text-[11px] text-text-muted">
              Contoh saat ini: <span className="font-mono text-text-secondary font-semibold">{previewDate}</span>
            </p>
          </div>

          {/* Time Format */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={13} className="text-accent-primary" />
              <span>Format Jam ({"{{time}}"})</span>
            </label>
            <div className="relative">
              <select
                value={settings.timeFormat}
                onChange={(e) => updateSettings({ timeFormat: e.target.value })}
                className="w-full appearance-none bg-bg-primary border border-border-default hover:border-accent-primary/50 text-text-primary text-xs rounded-lg px-3 py-2 pr-8 focus:outline-hidden focus:ring-1 focus:ring-accent-primary transition-colors cursor-pointer"
              >
                {TIME_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
            <p className="text-[11px] text-text-muted">
              Contoh saat ini: <span className="font-mono text-text-secondary font-semibold">{previewTime}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Supported Variables Cheat Sheet */}
      <div className="p-4 bg-bg-surface/50 space-y-2">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-accent-primary" />
          <span>Variabel Dinamis yang Didukung</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="p-2 rounded-lg bg-bg-primary border border-border-subtle">
            <code className="font-mono font-bold text-accent-primary block">{"{{title}}"}</code>
            <span className="text-text-muted">Judul catatan target</span>
          </div>
          <div className="p-2 rounded-lg bg-bg-primary border border-border-subtle">
            <code className="font-mono font-bold text-accent-primary block">{"{{date}}"}</code>
            <span className="text-text-muted">Tanggal sesuai format</span>
          </div>
          <div className="p-2 rounded-lg bg-bg-primary border border-border-subtle">
            <code className="font-mono font-bold text-accent-primary block">{"{{time}}"}</code>
            <span className="text-text-muted">Jam sesuai format</span>
          </div>
          <div className="p-2 rounded-lg bg-bg-primary border border-border-subtle">
            <code className="font-mono font-bold text-accent-primary block">{"{{datetime}}"}</code>
            <span className="text-text-muted">Tanggal & jam lengkap</span>
          </div>
          <div className="p-2 rounded-lg bg-bg-primary border border-border-subtle">
            <code className="font-mono font-bold text-accent-primary block">{"{{folder}}"}</code>
            <span className="text-text-muted">Folder tempat note</span>
          </div>
          <div className="p-2 rounded-lg bg-bg-primary border border-border-subtle">
            <code className="font-mono font-bold text-accent-primary block">{"{{weekday}}"}</code>
            <span className="text-text-muted">Hari (Senin, Selasa...)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
