import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Check, Info } from 'lucide-react';
import { reminderService } from '../../../lib/reminder/reminderService';
import { NotificationPermissionStatus } from '../../../types/reminder';

export const NotificationSettingsCard: React.FC = () => {
  const [status, setStatus] = useState<NotificationPermissionStatus>('default');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setStatus(reminderService.getPermissionStatus());
  }, []);

  const handleRequestPermission = async () => {
    const res = await reminderService.requestPermission();
    setStatus(res);
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      await reminderService.triggerNotification({
        id: `test-${Date.now()}`,
        noteId: '',
        noteTitle: 'Uji Coba Pengingat Noesis',
        text: 'Notifikasi PWA berhasil aktif! Pengingat tugas & jadwal kamu siap bekerja.',
        rawMatch: '⏰ test',
        dueDate: 'Sekarang',
        hasSpecificTime: true,
        dueTimestamp: Date.now(),
        isChecklist: true,
        isCompleted: false,
        lineIndex: 0,
      });
    } finally {
      setTimeout(() => setIsTesting(false), 1000);
    }
  };

  return (
    <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden shadow-xs divide-y divide-border-subtle">
      <div className="p-4 bg-bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            status === 'granted'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              : status === 'denied'
                ? 'bg-status-error-bg border-status-error/20 text-status-error'
                : 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary'
          }`}>
            {status === 'granted' ? (
              <BellRing size={18} />
            ) : status === 'denied' ? (
              <BellOff size={18} />
            ) : (
              <Bell size={18} />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-heading">Notifikasi Pengingat (PWA)</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {status === 'granted'
                ? 'Notifikasi aktif — Noesis akan mengingatkan tugas saat waktu tiba.'
                : status === 'denied'
                  ? 'Izin notifikasi diblokir di browser. Aktifkan di pengaturan browser/HP.'
                  : status === 'unsupported'
                    ? 'Browser ini belum mendukung Web Notification API.'
                    : 'Izinkan notifikasi agar jadwal dan checklist bisa berdering di HP/Desktop.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {status === 'granted' ? (
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={isTesting}
              className="px-3 py-1.5 bg-bg-primary hover:bg-bg-hover text-text-primary rounded-xl text-xs font-semibold border border-border-default hover:border-accent-primary/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <BellRing size={13} className="text-accent-primary" />
              <span>{isTesting ? 'Mengirim...' : 'Tes Notifikasi'}</span>
            </button>
          ) : status === 'denied' ? (
            <span className="text-[11px] font-medium text-status-error px-2.5 py-1 rounded-lg bg-status-error-bg border border-status-error/20">
              Diblokir
            </span>
          ) : status === 'unsupported' ? (
            <span className="text-[11px] font-medium text-text-muted px-2.5 py-1 rounded-lg bg-bg-primary">
              Tidak Didukung
            </span>
          ) : (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3.5 py-1.5 bg-accent-primary hover:bg-accent-hover text-accent-contrast rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Bell size={13} />
              <span>Aktifkan Notifikasi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
