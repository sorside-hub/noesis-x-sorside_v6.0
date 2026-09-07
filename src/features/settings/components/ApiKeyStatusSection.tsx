import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Sparkles,
  Cpu, 
  ShieldCheck, 
  Edit3, 
  Check, 
  X,
  Zap,
  RotateCcw
} from 'lucide-react';
import { 
  KeySlotId, 
  KeySlotInfo, 
  KeyHealthStatus, 
  SystemKeysOverviewResponse 
} from '../../../lib/ai/types';
import { 
  checkAllKeysOverview, 
  checkSingleKeySlot, 
  getLocalKeyOverride, 
  setLocalKeyOverride
} from '../../../lib/ai/keyManager';

export const ApiKeyStatusSection: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [testingSlot, setTestingSlot] = useState<KeySlotId | null>(null);
  const [overview, setOverview] = useState<SystemKeysOverviewResponse | null>(null);
  
  // Custom edit states for user local key overrides
  const [editingSlot, setEditingSlot] = useState<KeySlotId | null>(null);
  const [tempKeyInput, setTempKeyInput] = useState<string>('');

  const fetchStatus = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await checkAllKeysOverview(forceRefresh);
      setOverview(data);
    } catch (err) {
      console.error('Gagal mengambil status API key:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestSingleSlot = async (slotId: KeySlotId) => {
    setTestingSlot(slotId);
    try {
      const result = await checkSingleKeySlot(slotId);
      
      setOverview((prev) => {
        if (!prev) return null;
        const currentSlot = prev.slots[slotId];
        const updatedSlot: KeySlotInfo = {
          ...currentSlot,
          status: result.status,
          latencyMs: result.latencyMs,
          message: result.message,
          lastCheckedAt: result.timestamp,
        };

        return {
          ...prev,
          slots: {
            ...prev.slots,
            [slotId]: updatedSlot,
          },
        };
      });
    } catch (err) {
      console.error(`Gagal menguji slot ${slotId}:`, err);
    } finally {
      setTestingSlot(null);
    }
  };

  const handleStartEdit = (slotId: KeySlotId) => {
    setEditingSlot(slotId);
    setTempKeyInput(getLocalKeyOverride(slotId));
  };

  const handleSaveCustomKey = (slotId: KeySlotId) => {
    setLocalKeyOverride(slotId, tempKeyInput);
    setEditingSlot(null);
    handleTestSingleSlot(slotId);
  };

  const handleClearCustomKey = (slotId: KeySlotId) => {
    setLocalKeyOverride(slotId, '');
    setEditingSlot(null);
    handleTestSingleSlot(slotId);
  };

  const getStatusIcon = (status: KeyHealthStatus | 'checking') => {
    switch (status) {
      case 'active': return <CheckCircle2 size={14} className="text-status-success" />;
      case 'missing': return <Key size={14} className="text-text-muted opacity-60" />;
      case 'checking': return <RefreshCw size={14} className="text-status-info animate-spin" />;
      default: return <XCircle size={14} className="text-status-error" />; // quota_exceeded, invalid_key, error
    }
  };

  const getStatusText = (status: KeyHealthStatus | 'checking') => {
    switch (status) {
      case 'active': return 'Connected';
      case 'missing': return 'Off';
      case 'checking': return 'Checking...';
      default: return 'Disconnected'; // quota_exceeded, invalid_key, error
    }
  };

  const renderSlotRow = (slotId: KeySlotId, slotInfo?: KeySlotInfo, icon?: React.ReactNode) => {
    if (!slotInfo) return null;
    const isEditing = editingSlot === slotId;
    const isTestingThis = testingSlot === slotId;
    
    // Get the local key to display when not editing
    const localKey = getLocalKeyOverride(slotId);

    return (
      <div key={slotId} className="flex flex-col p-4 group transition-colors hover:bg-bg-hover/30 gap-3 border-t border-border-subtle first:border-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="text-text-secondary shrink-0">{icon}</div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-text-primary truncate">
                {slotInfo.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-bg-primary rounded-md border border-border-default">
              {getStatusIcon(isTestingThis ? 'checking' : slotInfo.status)}
              <span className="text-[10px] font-medium text-text-secondary hidden sm:inline-block">
                {getStatusText(isTestingThis ? 'checking' : slotInfo.status)}
              </span>
            </div>
            
            <button
              type="button"
              disabled={isTestingThis || loading}
              onClick={() => handleTestSingleSlot(slotId)}
              className="p-1.5 text-text-muted hover:text-accent-primary hover:bg-bg-surface rounded-md disabled:opacity-50 cursor-pointer transition-colors"
              title="Test Connection"
            >
              <RefreshCw size={14} className={isTestingThis ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type={isEditing ? 'text' : 'password'}
              value={isEditing ? tempKeyInput : (localKey || '')}
              onChange={(e) => setTempKeyInput(e.target.value)}
              readOnly={!isEditing}
              placeholder={slotInfo.isCustom ? "API Key local..." : "Using Environment Variable .env"}
              className={`w-full text-xs font-mono rounded-lg pl-9 pr-3 py-2 transition-colors ${
                isEditing 
                  ? 'bg-bg-surface border border-border-default text-text-primary focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/40' 
                  : 'bg-bg-base/50 border border-border-subtle/60 text-text-muted cursor-default'
              }`}
            />
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          </div>

          {!isEditing ? (
             <button
                type="button"
                onClick={() => handleStartEdit(slotId)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-primary bg-bg-surface hover:bg-bg-hover rounded-lg transition-colors border border-border-default cursor-pointer shadow-2xs shrink-0"
              >
                <Edit3 size={14} className="text-accent-primary" />
                <span className="hidden sm:inline">Edit</span>
             </button>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
               <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="flex items-center justify-center px-2.5 py-1.5 bg-bg-hover text-text-muted rounded-lg hover:text-text-primary cursor-pointer transition-colors"
                  title="Cancel"
                >
                  <X size={14} />
               </button>
               {slotInfo.isCustom && (
                 <button
                    type="button"
                    onClick={() => handleClearCustomKey(slotId)}
                    className="flex items-center justify-center px-2.5 py-1.5 text-text-muted hover:text-text-primary bg-transparent hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
                    title="Reset to .env"
                  >
                    <RotateCcw size={14} />
                    <span className="hidden sm:inline ml-1.5 text-xs font-medium">Reset</span>
                 </button>
               )}
               <button
                  type="button"
                  onClick={() => handleSaveCustomKey(slotId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent-contrast bg-accent-primary hover:opacity-90 rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Check size={14} />
                  <span className="hidden sm:inline">Save</span>
               </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5 px-1 flex items-center gap-2">
        <ShieldCheck size={14} className="text-accent-primary" /> API Connectivity
      </h2>
      <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden divide-y divide-border-subtle shadow-xs">
        <div className="flex items-center justify-between p-3.5 bg-bg-primary/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-accent-primary">Api Key Status</span>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => fetchStatus(true)}
            className="text-[11px] flex items-center gap-1.5 font-medium text-text-secondary hover:text-text-primary disabled:opacity-50 cursor-pointer transition-colors"
          >
            <RefreshCw size={12} className={`text-accent-primary ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Testing...' : 'Test All Keys'}</span>
          </button>
        </div>

        {renderSlotRow('groq_primary', overview?.slots.groq_primary, <Zap size={16} className="text-status-warning" />)}
        {renderSlotRow('groq_secondary', overview?.slots.groq_secondary, <Zap size={16} className="text-amber-500" />)}
        {renderSlotRow('gemini', overview?.slots.gemini, <Sparkles size={16} className="text-accent-primary" />)}
      </div>
    </>
  );
};
