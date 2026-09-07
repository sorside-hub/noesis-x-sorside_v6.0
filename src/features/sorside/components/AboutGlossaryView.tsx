import React, { useState } from 'react';
import { useAboutGlossary } from '../hooks/useAboutGlossary';
import { AboutGlossaryItem } from '../../../types/sorside';
import { Plus, Edit2, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';

// Very basic drag-and-drop or simple list view
export const AboutGlossaryView: React.FC = () => {
  const { items, isLoading, error, createItem, updateItem, deleteItem, reorderItems } = useAboutGlossary();
  const [editingItem, setEditingItem] = useState<AboutGlossaryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);

  const handleNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: AboutGlossaryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this glossary item?')) {
      await deleteItem(id);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIdx === null || draggedItemIdx === index) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedItemIdx, 1);
    newItems.splice(index, 0, draggedItem);

    setDraggedItemIdx(null);
    await reorderItems(newItems);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-bg-surface p-4 rounded-2xl border border-border-default shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-text-primary">About Glossary</h2>
          <p className="text-xs text-text-muted mt-1">Manage sections for the About page.</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary text-accent-contrast rounded-xl text-xs font-semibold hover:opacity-90"
        >
          <Plus size={14} />
          Add Section
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-xs text-text-muted">Loading glossary items...</div>
      ) : error ? (
        <div className="text-center py-10 text-xs text-status-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-xs text-text-muted">No glossary items found. Create one above.</div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className="flex items-start gap-3 p-3 bg-bg-surface border border-border-default rounded-xl hover:border-accent-primary transition-colors cursor-default"
            >
              <div className="cursor-grab pt-1 text-text-muted hover:text-text-primary">
                <GripVertical size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary truncate">{item.title}</h3>
                  {!item.published && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-status-error/10 text-status-error border border-status-error/20">
                      Draft
                    </span>
                  )}
                  {item.published && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-status-success">
                      <CheckCircle2 size={12} /> Published
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                  {item.content}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-1.5 text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-text-muted hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AboutGlossaryEditorModal
          item={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            if (editingItem) {
              await updateItem(editingItem.id, data);
            } else {
              await createItem({ ...data, order_index: items.length });
            }
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

interface EditorModalProps {
  item: AboutGlossaryItem | null;
  onClose: () => void;
  onSave: (data: Omit<AboutGlossaryItem, 'id' | 'created_at' | 'order_index'>) => Promise<void>;
}

const AboutGlossaryEditorModal: React.FC<EditorModalProps> = ({ item, onClose, onSave }) => {
  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState(item?.content || '');
  const [published, setPublished] = useState(item?.published ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSaving(true);
    try {
      await onSave({ title, content, published });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] cursor-default"
      >
        <div className="p-4 border-b border-border-default flex items-center justify-between shrink-0 bg-bg-surface/80">
          <h2 className="text-sm font-bold text-text-heading">
            {item ? 'Edit Glossary Section' : 'Add Glossary Section'}
          </h2>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary rounded-lg">
            X
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VISI MISI"
              className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-sm font-bold text-text-primary outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5 flex-1 flex flex-col">
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Content (HTML / Text)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the detailed description..."
              className="w-full min-h-[250px] px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none transition-colors resize-y leading-relaxed font-mono"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="rounded border-border-default text-accent-primary focus:ring-accent-primary bg-bg-primary"
            />
            <span className="text-xs font-semibold text-text-primary">Publish to Website</span>
          </label>
        </div>

        <div className="p-4 border-t border-border-default bg-bg-surface/50 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary bg-bg-primary hover:bg-bg-hover border border-border-default transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-accent-contrast bg-accent-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSaving ? 'Saving...' : 'Save Section'}
          </button>
        </div>
      </div>
    </div>
  );
};
