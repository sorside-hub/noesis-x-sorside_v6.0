import React, { useEffect, useState, useRef } from 'react';
import { Mic, Square, Loader2, X, FileAudio, CheckCircle2, AudioLines } from 'lucide-react';
import { useNavigation } from '../../../context/NavigationContext';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { useVault } from '../../../hooks/useVault';

interface VoiceNoteModalProps {
  vaultState: ReturnType<typeof useVault>;
}

export const VoiceNoteModal: React.FC<VoiceNoteModalProps> = ({ vaultState }) => {
  const { activeModal, closeModal, navigateToNote, navigateView } = useNavigation();
  const {
    isRecording,
    audioBase64,
    mimeType,
    error: recorderError,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState(false);
  const isFinishingRef = useRef(false);

  const isOpen = activeModal === 'voice-note';

  // Handle auto-start when modal opens
  useEffect(() => {
    if (isOpen) {
      isFinishingRef.current = false;
      setProcessError(null);
      setSuccessStatus(false);
      setIsProcessing(false);
      clearRecording();
      startRecording();
    } else {
      isFinishingRef.current = false;
      stopRecording();
      clearRecording();
    }
  }, [isOpen]);

  // Handle when audio Base64 is ready
  useEffect(() => {
    if (audioBase64 && mimeType && isOpen && !isProcessing && !successStatus && isFinishingRef.current) {
      processAudio(audioBase64, mimeType);
    }
  }, [audioBase64, mimeType, isOpen]);

  const processAudio = async (base64: string, mime: string) => {
    setIsProcessing(true);
    setProcessError(null);

    try {
      const response = await fetch('/api/voice-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioBase64: base64, mimeType: mime }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      // We got the structured note, now let's create it in the vault
      if (vaultState.vault) {
        // Extract title from markdown if available (e.g. # Title)
        let title = 'Voice Note';
        let contentBody = data.structuredNote || '';
        const titleMatch = contentBody.match(/^#\s+(.+)$/m);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
          // Hapus baris judul dari isi konten agar tidak duplikat
          contentBody = contentBody.replace(/^#\s+(.+)$\n*/m, '').trim();
        }

        const newNoteId = await vaultState.createNote(null, title);
        if (newNoteId) {
          // Note created, now update its content
          await vaultState.updateNoteContent(newNoteId, contentBody);
          
          setSuccessStatus(true);
          
          // Wait a moment for user to see success, then navigate
          setTimeout(() => {
            navigateToNote(newNoteId);
            setIsProcessing(false);
            setSuccessStatus(false);
          }, 1500);
          return;
        }
      }
      throw new Error('Gagal membuat catatan di vault');
    } catch (err: any) {
      console.error('Failed to process voice note:', err);
      setProcessError(err.message || 'Terjadi kesalahan saat memproses audio.');
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    isFinishingRef.current = true;
    stopRecording();
  };

  const handleClose = () => {
    isFinishingRef.current = false;
    stopRecording();
    clearRecording();
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent-primary/10 text-accent-primary rounded-md">
              <AudioLines size={18} />
            </div>
            <h3 className="font-semibold text-text-primary">AI Voice Transcript</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-primary rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col items-center justify-center min-h-[250px]">
          {/* Status 1: Error */}
          {(recorderError || processError) && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <X size={32} />
              </div>
              <h4 className="font-medium text-text-primary mb-2">Terjadi Kesalahan</h4>
              <p className="text-sm text-text-muted max-w-xs">{recorderError || processError}</p>
              <button
                onClick={handleClose}
                className="mt-6 px-4 py-2 bg-bg-primary border border-border-default rounded-md text-sm font-medium hover:bg-bg-hover transition-colors"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Status 2: Success */}
          {!recorderError && !processError && successStatus && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="font-medium text-text-primary mb-2">Catatan Selesai!</h4>
              <p className="text-sm text-text-muted">Membuka catatan Anda...</p>
            </div>
          )}

          {/* Status 3: Processing */}
          {!recorderError && !processError && !successStatus && isProcessing && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-4 relative">
                <Loader2 size={32} className="animate-spin relative z-10" />
                <div className="absolute inset-0 border-4 border-accent-primary/20 rounded-full border-t-accent-primary animate-spin" style={{ animationDuration: '1.5s' }}></div>
              </div>
              <h4 className="font-medium text-text-primary mb-2">AI sedang merangkum...</h4>
              <p className="text-sm text-text-muted">Mentranskripsikan audio dan merombak menjadi catatan terstruktur.</p>
            </div>
          )}

          {/* Status 4: Recording */}
          {!recorderError && !processError && !successStatus && !isProcessing && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="relative mb-8">
                {/* Pulsing ring background */}
                {isRecording && (
                  <>
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute inset-[-10px] bg-red-500/10 rounded-full animate-pulse"></div>
                  </>
                )}
                
                {/* Main Mic Button */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center relative z-10 transition-colors duration-300 shadow-lg ${isRecording ? 'bg-red-500 text-white' : 'bg-bg-primary text-text-muted border border-border-default'}`}>
                  {isRecording ? <Mic size={36} /> : <FileAudio size={36} />}
                </div>
              </div>
              
              <h4 className="font-medium text-text-primary mb-2">
                {isRecording ? 'Mendengarkan...' : 'Menyiapkan Mikrofon...'}
              </h4>
              <p className="text-sm text-text-muted max-w-[250px] mb-8">
                {isRecording ? 'Silakan ucapkan "Brain Dump" atau pikiran Anda sekarang.' : 'Meminta izin akses mikrofon.'}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-bg-primary border border-border-default text-text-secondary hover:text-text-primary rounded-full text-sm font-medium hover:bg-bg-hover active:scale-95 transition-all"
                >
                  <X size={16} />
                  <span>Batal</span>
                </button>
                {isRecording && (
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="flex items-center gap-2 px-6 py-2.5 bg-text-primary text-bg-primary rounded-full text-sm font-medium shadow-md hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Square size={16} fill="currentColor" />
                    <span>Selesai & Proses</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
