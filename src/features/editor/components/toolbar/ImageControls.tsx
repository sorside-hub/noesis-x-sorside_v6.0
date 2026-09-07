import { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import {
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
  Trash2,
  Maximize2,
} from 'lucide-react';
import { ImageAlignment } from '../../extensions/CustomImageExtension';

interface ImageControlsProps {
  editor: Editor | null;
}

export const ImageControls = ({ editor }: ImageControlsProps) => {
  if (!editor) return null;

  const getImageContext = () => {
    const { selection } = editor.state;
    if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
      const { width, align } = selection.node.attrs;
      const numericWidth = parseInt(String(width || '100%').replace(/[^0-9]/g, ''), 10) || 100;
      return {
        width: numericWidth,
        align: (align as ImageAlignment) || 'center',
      };
    }

    if (editor.isActive('image')) {
      const attrs = editor.getAttributes('image');
      const numericWidth = parseInt(String(attrs.width || '100%').replace(/[^0-9]/g, ''), 10) || 100;
      return {
        width: numericWidth,
        align: (attrs.align as ImageAlignment) || 'center',
      };
    }

    return null;
  };

  const context = getImageContext();
  if (!context) return null;

  const { width, align } = context;

  return (
    <div className="flex items-center gap-1 pr-2 mr-2 border-r border-border-default shrink-0 bg-accent-soft/30 px-1.5 py-0.5 rounded-lg">
      <span className="text-xs font-semibold text-accent-primary flex items-center gap-1 shrink-0 mr-1 select-none">
        <ImageIcon size={13} /> Gambar:
      </span>

      {/* Alignment Buttons */}
      <div className="flex items-center gap-0.5 border-r border-border-default pr-1.5 mr-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (editor.commands as any).setImageAlign('left')}
          className={`p-1.5 text-xs rounded border shrink-0 cursor-pointer transition-colors ${
            align === 'left'
              ? 'bg-accent-primary text-accent-contrast border-accent-primary font-semibold shadow-xs'
              : 'bg-bg-canvas hover:bg-bg-hover text-text-secondary hover:text-text-primary border-border-default'
          }`}
          title="Rata Kiri (Teks mengalir di samping kanan)"
        >
          <AlignLeft size={13} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (editor.commands as any).setImageAlign('center')}
          className={`p-1.5 text-xs rounded border shrink-0 cursor-pointer transition-colors ${
            align === 'center'
              ? 'bg-accent-primary text-accent-contrast border-accent-primary font-semibold shadow-xs'
              : 'bg-bg-canvas hover:bg-bg-hover text-text-secondary hover:text-text-primary border-border-default'
          }`}
          title="Rata Tengah (Teks di atas dan bawah)"
        >
          <AlignCenter size={13} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (editor.commands as any).setImageAlign('right')}
          className={`p-1.5 text-xs rounded border shrink-0 cursor-pointer transition-colors ${
            align === 'right'
              ? 'bg-accent-primary text-accent-contrast border-accent-primary font-semibold shadow-xs'
              : 'bg-bg-canvas hover:bg-bg-hover text-text-secondary hover:text-text-primary border-border-default'
          }`}
          title="Rata Kanan (Teks mengalir di samping kiri)"
        >
          <AlignRight size={13} />
        </button>
      </div>

      {/* Resize Controls with Step 5%/10% */}
      <div className="flex items-center gap-1 border-r border-border-default pr-1.5 mr-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (editor.commands as any).adjustImageWidth(-5)}
          disabled={width <= 15}
          className="p-1 rounded bg-bg-canvas hover:bg-bg-hover text-text-primary border border-border-default disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          title="Kecilkan Ukuran (-5%)"
        >
          <Minus size={13} />
        </button>

        <span className="px-2 py-0.5 text-xs font-mono font-bold bg-bg-canvas text-accent-primary rounded border border-border-default min-w-[42px] text-center select-none shadow-xs">
          {width}%
        </span>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (editor.commands as any).adjustImageWidth(5)}
          disabled={width >= 100}
          className="p-1 rounded bg-bg-canvas hover:bg-bg-hover text-text-primary border border-border-default disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          title="Besarkan Ukuran (+5%)"
        >
          <Plus size={13} />
        </button>

        {/* Quick Reset to 100% */}
        {width < 100 && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (editor.commands as any).setImageWidth('100%')}
            className="px-1.5 py-1 text-xs rounded bg-bg-canvas hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-default flex items-center gap-1 shrink-0 cursor-pointer ml-0.5"
            title="Kembalikan ke Ukuran Penuh (100%)"
          >
            <Maximize2 size={11} /> 100%
          </button>
        )}
      </div>

      {/* Delete Image */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (editor.commands as any).deleteImage()}
        className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center gap-1 border border-red-500/20 shrink-0 cursor-pointer ml-0.5"
        title="Hapus Gambar"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
};
