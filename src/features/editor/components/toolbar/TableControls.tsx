import { Editor } from '@tiptap/react';
import { Plus, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TableControlsProps {
  editor: Editor | null;
}

export const TableControls = ({ editor }: TableControlsProps) => {
  if (!editor || !editor.isActive('table')) return null;

  return (
    <div className="flex items-center gap-1 pr-2 mr-2 border-r border-border-default shrink-0">
              <span className="text-[11px] font-semibold text-accent-primary uppercase tracking-wider px-1">Tabel:</span>
              
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor?.chain().focus().addRowBefore().run()}
                className="px-2 py-1 text-xs rounded bg-bg-canvas hover:bg-bg-hover text-text-primary flex items-center gap-1 border border-border-default shrink-0 cursor-pointer"
                title="Tambah Baris Atas"
              >
                <ArrowUp size={12} /><Plus size={12} /> Baris
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor?.chain().focus().addRowAfter().run()}
                className="px-2 py-1 text-xs rounded bg-bg-canvas hover:bg-bg-hover text-text-primary flex items-center gap-1 border border-border-default shrink-0 cursor-pointer"
                title="Tambah Baris Bawah"
              >
                <ArrowDown size={12} /><Plus size={12} /> Baris
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor?.chain().focus().deleteRow().run()}
                className="px-2 py-1 text-xs rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center gap-1 border border-red-500/20 shrink-0 cursor-pointer"
                title="Hapus Baris Ini"
              >
                <Trash2 size={12} /> Baris
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor?.chain().focus().addColumnBefore().run()}
                className="px-2 py-1 text-xs rounded bg-bg-canvas hover:bg-bg-hover text-text-primary flex items-center gap-1 border border-border-default shrink-0 cursor-pointer"
                title="Tambah Kolom Kiri"
              >
                <ArrowLeft size={12} /><Plus size={12} /> Kolom
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor?.chain().focus().addColumnAfter().run()}
                className="px-2 py-1 text-xs rounded bg-bg-canvas hover:bg-bg-hover text-text-primary flex items-center gap-1 border border-border-default shrink-0 cursor-pointer"
                title="Tambah Kolom Kanan"
              >
                <ArrowRight size={12} /><Plus size={12} /> Kolom
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor?.chain().focus().deleteColumn().run()}
                className="px-2 py-1 text-xs rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center gap-1 border border-red-500/20 shrink-0 cursor-pointer"
                title="Hapus Kolom Ini"
              >
                <Trash2 size={12} /> Kolom
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
                className={`px-2 py-1 text-xs rounded border shrink-0 cursor-pointer font-medium transition-colors ${
                  editor?.isActive('tableHeader')
                    ? 'bg-accent-soft text-accent-primary border-accent-primary/40 font-semibold'
                    : 'bg-bg-canvas hover:bg-bg-hover text-text-primary border-border-default'
                }`}
                title="Toggle Baris Header"
              >
                Header
              </button>

              <div className="flex items-center gap-0.5 border-l border-r border-border-default px-1 mx-1 shrink-0">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  className={`p-1 text-xs rounded hover:bg-bg-hover transition-colors ${
                    editor?.isActive({ textAlign: 'left' }) ? 'text-accent-primary bg-accent-primary/10 font-bold' : 'text-text-primary'
                  }`}
                  title="Rata Kiri Sel"
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  className={`p-1 text-xs rounded hover:bg-bg-hover transition-colors ${
                    editor?.isActive({ textAlign: 'center' }) ? 'text-accent-primary bg-accent-primary/10 font-bold' : 'text-text-primary'
                  }`}
                  title="Rata Tengah Sel"
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                  className={`p-1 text-xs rounded hover:bg-bg-hover transition-colors ${
                    editor?.isActive({ textAlign: 'right' }) ? 'text-accent-primary bg-accent-primary/10 font-bold' : 'text-text-primary'
                  }`}
                  title="Rata Kanan Sel"
                >
                  <AlignRight size={14} />
                </button>
      </div>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor?.chain().focus().deleteTable().run()}
                className="px-2 py-1 text-xs rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center gap-1 font-medium shrink-0 cursor-pointer"
                title="Hapus Seluruh Tabel"
              >
                <Trash2 size={12} /> Tabel
              </button>
    </div>
  );
};
