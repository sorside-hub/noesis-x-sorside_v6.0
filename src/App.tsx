import { AuthProvider } from './context/AuthContext';
import { NoteEditor } from './features/editor/components/NoteEditor';
import { SettingsView } from './features/settings/components/SettingsView';
import { ChatView } from './features/chat/components/ChatView';
import { HubView } from './features/hub/components/HubView';
import { MediaView } from './features/media/components/MediaView';
import { SorsideView } from './features/sorside/components/SorsideView';
import { BottomNavPill } from './components/navigation/BottomNavPill';
import { ActivityBar } from './components/navigation/ActivityBar';
import { useVault } from './hooks/useVault';
import { useTheme } from './hooks/useTheme';
import { Loader2 } from 'lucide-react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { VoiceNoteModal } from './features/voice/components/VoiceNoteModal';
import { VoiceMemoModal } from './features/voice/components/VoiceMemoModal';
import { mediaGC } from './lib/mediaGarbageCollector';
import { reminderService } from './lib/reminder/reminderService';
import { useEffect } from 'react';

function AppContent({ vaultState }: { vaultState: ReturnType<typeof useVault> }) {
  const { view, navigateView, navigateToNote } = useNavigation();

  // Background Media GC & Reminder Scheduler
  useEffect(() => {
    mediaGC.processQueue();
    mediaGC.emptyOldTrash();
    const interval = setInterval(() => {
      mediaGC.processQueue();
      mediaGC.emptyOldTrash();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Initialize reminder service navigation callback and scheduler
  useEffect(() => {
    reminderService.setNavigateCallback((noteId: string) => {
      navigateToNote(noteId);
      navigateView('vault');
    });

    if (vaultState.vault?.nodes) {
      reminderService.startScheduler(() => vaultState.vault?.nodes || {});
    }

    return () => {
      reminderService.stopScheduler();
    };
  }, [vaultState.vault?.nodes, navigateToNote, navigateView]);

  // Listen for service worker notification click postMessage
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TO_NOTE' && event.data?.noteId) {
        navigateToNote(event.data.noteId);
        navigateView('vault');
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [navigateToNote, navigateView]);


  return (
    <div className="h-screen w-screen overflow-hidden bg-bg-primary text-text-primary relative flex flex-row font-sans">
      {/* Desktop Left Activity Bar */}
      <ActivityBar 
        activeTab={view} 
        onTabChange={navigateView} 
        onCreateNote={async () => {
          if (vaultState.vault) {
            const newId = await vaultState.createNote(null, 'Untitled');
            if (newId) {
              navigateToNote(newId);
            } else {
              navigateView('vault');
            }
          }
        }}
      />

      {/* Main Content Views */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {/* Vault & Editor View */}
        <div className={`absolute inset-0 ${view === 'vault' ? 'block' : 'hidden'}`}>
          <NoteEditor vaultState={vaultState as any} />
        </div>

        {/* Hub / Knowledge Matrix View */}
        <div className={`absolute inset-0 ${view === 'hub' ? 'block' : 'hidden'}`}>
          <HubView vault={vaultState.vault} vaultState={vaultState} />
        </div>

        {/* Chat / Ask AI View */}
        <div className={`absolute inset-0 ${view === 'chat' ? 'block' : 'hidden'}`}>
          <ChatView vault={vaultState.vault} vaultState={vaultState} />
        </div>

        {/* Media Library View */}
        <div className={`absolute inset-0 ${view === 'media' ? 'block' : 'hidden'}`}>
          <MediaView vaultState={vaultState} />
        </div>

        {/* SORSIDE Studio View (Website CMS) */}
        <div className={`absolute inset-0 ${view === 'sorside' ? 'block' : 'hidden'}`}>
          <SorsideView vaultState={vaultState} />
        </div>

        {/* Settings View */}
        <div className={`absolute inset-0 ${view === 'settings' ? 'block' : 'hidden'}`}>
          <SettingsView vault={vaultState.vault} createFolder={vaultState.createFolder} />
        </div>
      </div>

      {/* 2. Floating Bottom Navigation Pill (Mobile Only - Auto-hides on scroll down) */}
      <BottomNavPill activeTab={view} onTabChange={navigateView} />
      
      {/* Global Voice Note & Voice Memo Modals */}
      <VoiceNoteModal vaultState={vaultState} />
      <VoiceMemoModal vaultState={vaultState} />
    </div>
  );
}

export default function App() {
  const vaultState = useVault();
  useTheme(); // Initialize theme sync

  // Show loading screen while Dexie initializes
  if (!vaultState.vault) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg-primary text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-text-secondary mb-4" />
        <p className="font-medium">Memuat Ruang Kerja...</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <NavigationProvider
        activeTabId={vaultState.vault.activeTabId}
        onSelectTabId={vaultState.setActiveTabId}
      >
        <AppContent vaultState={vaultState} />
      </NavigationProvider>
    </AuthProvider>
  );
}

