import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, Check, Calendar } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { CustomProperty, PropertyType } from '../../../types/vault';

interface CustomPropertiesSectionProps {
  customProperties: CustomProperty[];
  onChange: (props: CustomProperty[]) => void;
}

export const CustomPropertiesSection: React.FC<CustomPropertiesSectionProps> = ({
  customProperties,
  onChange,
}) => {
  const handleAddProperty = () => {
    const newProp: CustomProperty = {
      id: crypto.randomUUID(),
      key: `Property ${customProperties.length + 1}`,
      type: 'text',
      value: '',
    };
    onChange([...customProperties, newProp]);
  };

  const handleUpdateProperty = (id: string, updates: Partial<CustomProperty>) => {
    onChange(
      customProperties.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleDeleteProperty = (id: string) => {
    onChange(customProperties.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2">
        <div className="h-px bg-border-subtle flex-1" />
        <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest px-2">
          Custom Properties
        </span>
        <div className="h-px bg-border-subtle flex-1" />
      </div>

      <div className="space-y-2">
        {customProperties.map((prop) => (
          <div key={prop.id} className="flex flex-col gap-2 p-2.5 bg-bg-primary border border-border-default hover:border-border-hover rounded-xl group transition-all shadow-2xs">
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={prop.key}
                  onChange={(e) => handleUpdateProperty(prop.id, { key: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="bg-transparent text-xs font-semibold text-text-heading placeholder:text-text-muted/60 focus:outline-none focus:text-text-link w-full"
                  placeholder="Property Name"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <select
                    value={prop.type}
                    onChange={(e) => handleUpdateProperty(prop.id, { type: e.target.value as PropertyType, value: '' })}
                    className="appearance-none bg-bg-elevated border border-border-default rounded-lg text-[10px] text-text-secondary px-2.5 py-1 pr-6 focus:outline-none focus:border-border-hover cursor-pointer uppercase font-bold tracking-wider shadow-2xs"
                  >
                    <option value="text">TEXT</option>
                    <option value="number">NUMBER</option>
                    <option value="date">DATE</option>
                    <option value="checkbox">BOOLEAN</option>
                  </select>
                  <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
                
                <button
                  type="button"
                  onClick={() => handleDeleteProperty(prop.id)}
                  title="Delete property"
                  className="p-1 rounded-lg text-status-error/80 hover:text-status-error bg-status-error-bg/30 hover:bg-status-error-bg border border-status-error-border/40 hover:border-status-error-border transition-all cursor-pointer shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="mt-0.5">
              {prop.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer py-0.5">
                  <div className={twMerge(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    prop.value ? "bg-accent-primary border-accent-primary text-accent-contrast" : "bg-bg-elevated border-border-default"
                  )}>
                    {prop.value && <Check size={12} strokeWidth={3} />}
                  </div>
                  <input
                    type="checkbox"
                    checked={!!prop.value}
                    onChange={(e) => handleUpdateProperty(prop.id, { value: e.target.checked })}
                    className="hidden"
                  />
                  <span className="text-xs text-text-secondary">{prop.value ? 'True' : 'False'}</span>
                </label>
              ) : prop.type === 'date' ? (
                <div className="relative w-full">
                  <input
                    type="date"
                    value={prop.value || ''}
                    onClick={(e) => {
                      try {
                        // Type assertion to access showPicker which is standard in modern browsers
                        if ('showPicker' in e.currentTarget) {
                          (e.currentTarget as any).showPicker();
                        }
                      } catch (err) {
                        // Fallback silently if unsupported
                      }
                    }}
                    onChange={(e) => handleUpdateProperty(prop.id, { value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className={twMerge(
                      "w-full bg-bg-elevated border border-border-default focus:border-border-hover rounded-lg px-2.5 py-1.5 text-xs focus:outline-none transition-colors cursor-pointer shadow-2xs [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative z-10",
                      prop.value ? "text-text-primary" : "text-transparent"
                    )}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-0">
                    <Calendar size={13} />
                  </div>
                  {/* Invisible placeholder if empty to look better */}
                  {!prop.value && (
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted/60 text-xs pointer-events-none z-0">
                      Select date...
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type={prop.type === 'number' ? 'number' : 'text'}
                  value={prop.value || ''}
                  onChange={(e) => handleUpdateProperty(prop.id, { value: prop.type === 'number' ? Number(e.target.value) : e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Empty..."
                  className="w-full bg-bg-elevated border border-border-default focus:border-border-hover rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none transition-colors shadow-2xs"
                />
              )}
            </div>
            
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddProperty}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-bg-primary/70 hover:bg-bg-elevated border border-border-default hover:border-border-hover text-text-secondary hover:text-text-heading rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
      >
        <Plus size={14} className="text-text-link transition-transform group-hover:scale-110" />
        <span>Add Property</span>
      </button>

    </div>
  );
};
