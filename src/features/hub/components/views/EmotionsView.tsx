import React, { useMemo } from 'react';
import { EnrichedNoteItem } from '../../types';
import { Smile, FileText, ArrowRight, Clock } from 'lucide-react';

interface EmotionsViewProps {
  notes: EnrichedNoteItem[];
  onOpenNote: (id: string) => void;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
};

// Map specific emotions to accent colors for better aesthetics
const getEmotionColor = (emotion: string) => {
  const normalized = emotion.toLowerCase();
  if (['urgent', 'mendesak', 'kritis', 'panik', 'anxious', 'cemas', 'frustrated', 'frustrasi', 'marah', 'critical'].includes(normalized)) return 'text-red-400 bg-red-400/10 border-red-400/20';
  if (['optimistic', 'optimis', 'excited', 'antusias', 'happy', 'senang', 'bahagia', 'motivated', 'termotivasi', 'gembira'].includes(normalized)) return 'text-green-400 bg-green-400/10 border-green-400/20';
  if (['creative', 'kreatif', 'inspired', 'terinspirasi', 'exploratory', 'eksploratif', 'imajinatif'].includes(normalized)) return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
  if (['analytical', 'analitis', 'logical', 'logis', 'objective', 'objektif', 'rasional', 'fokus'].includes(normalized)) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
  if (['reflective', 'reflektif', 'calm', 'tenang', 'pensive', 'merenung', 'damai', 'sedih'].includes(normalized)) return 'text-teal-400 bg-teal-400/10 border-teal-400/20';
  return 'text-accent-primary bg-accent-primary/10 border-accent-primary/20'; // Default theme color
};

export const EmotionsView: React.FC<EmotionsViewProps> = ({ notes, onOpenNote }) => {
  // Group notes by emotion
  const { groupedNotes, emotionList } = useMemo(() => {
    const map: Record<string, EnrichedNoteItem[]> = {};
    
    notes.forEach(note => {
      // If AI didn't provide an emotion, categorize as Neutral
      let emotionKey = (note.emotion || 'Neutral').trim();
      // Capitalize first letter for consistency
      emotionKey = emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1).toLowerCase();

      if (!map[emotionKey]) {
        map[emotionKey] = [];
      }
      map[emotionKey].push(note);
    });

    // Sort emotions by count (descending)
    const list = Object.keys(map).sort((a, b) => map[b].length - map[a].length);

    return { groupedNotes: map, emotionList: list };
  }, [notes]);

  if (emotionList.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 text-text-muted border border-border-default border-dashed rounded-2xl">
        <Smile size={32} className="mb-3 opacity-50" />
        <h3 className="text-sm font-semibold text-text-heading mb-1">Emotion Matrix Kosong</h3>
        <p className="text-xs">Sistem belum merekam pola emosi atau nada dari catatan-catatan Anda.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar pr-2 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {emotionList.map(emotion => {
          const emotionNotes = groupedNotes[emotion];
          const colorClasses = getEmotionColor(emotion);

          return (
            <div key={emotion} className="flex flex-col bg-bg-surface/40 border border-border-default rounded-2xl overflow-hidden">
              {/* Category Header */}
              <div className="p-4 border-b border-border-default flex items-center justify-between bg-bg-surface/80">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${colorClasses}`}>
                    <Smile size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-text-heading tracking-wide">
                      {emotion}
                    </h3>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {emotionNotes.length} Catatan
                    </p>
                  </div>
                </div>
              </div>

              {/* Note Cards List */}
              <div className="flex-1 p-3 space-y-2">
                {emotionNotes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => onOpenNote(note.id)}
                    className="w-full text-left group p-3 rounded-xl bg-bg-primary border border-border-default hover:border-accent-primary/40 hover:bg-bg-hover transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText size={13} className="text-text-muted group-hover:text-accent-primary shrink-0 transition-colors" />
                        <span className="font-medium text-text-primary text-xs truncate">
                          {note.title}
                        </span>
                      </div>
                      <ArrowRight size={12} className="text-accent-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                    </div>
                    
                    {note.summary ? (
                      <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
                        {note.summary}
                      </p>
                    ) : (
                      <p className="text-[11px] text-text-muted/50 italic">Tanpa ringkasan</p>
                    )}
                    
                    <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-border-subtle text-[9px] text-text-muted">
                      <Clock size={9} />
                      <span>{formatDate(note.updatedAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
