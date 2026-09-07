import { Editor } from '@tiptap/react';
import { Plus, Trash2, ArrowLeft, ArrowRight, Columns, RotateCcw, SquareDashed, Square, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react';
import { ColumnLayout, ColumnWidth, ColumnAlign } from '../../extensions/ColumnsExtension';

interface ColumnControlsProps {
  editor: Editor | null;
}

export const ColumnControls = ({ editor }: ColumnControlsProps) => {
  if (!editor || (!editor.isActive('columns') && !editor.isActive('column'))) return null;

  const getColumnContext = () => {
    const { state } = editor;
    const { $from } = state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'column') {
        const parent = $from.node(depth - 1);
        if (parent && parent.type.name === 'columns') {
          const columnIndex = $from.index(depth - 1);
          return {
            totalColumns: parent.childCount,
            columnIndex,
            currentWidth: (node.attrs.width as ColumnWidth) || 'auto',
            currentAlign: (node.attrs.align as ColumnAlign) || 'top',
            layout: (parent.attrs.layout as ColumnLayout) || '30-70',
            hasBorder: parent.attrs.border !== false,
          };
        }
      }
    }
    return null;
  };

  const context = getColumnContext();
  const totalColumns = context?.totalColumns || 2;
  const columnIndex = context ? context.columnIndex + 1 : 1;
  const currentWidth = context?.currentWidth || 'auto';
  const currentAlign = context?.currentAlign || 'top';
  const currentLayout = context?.layout || '30-70';
  const hasBorder = context ? context.hasBorder : true;

  const widthOptions: { label: string; value: ColumnWidth; title: string }[] = [
    { label: 'Auto', value: 'auto', title: 'Ukuran Auto / Rata' },
    { label: '25%', value: '25%', title: 'Lebar 25% (Kecil / Media)' },
    { label: '33%', value: '33%', title: 'Lebar 33% (Sepertiga Layar)' },
    { label: '50%', value: '50%', title: 'Lebar 50% (Setengah Layar)' },
    { label: '70%', value: '70%', title: 'Lebar 70% (Utama / Teks)' },
  ];

  const alignOptions: { label: string; value: ColumnAlign; icon: any; title: string }[] = [
    { label: 'Atas', value: 'top', icon: AlignVerticalJustifyStart, title: 'Posisi Kolom: Rata Atas (Top)' },
    { label: 'Tengah', value: 'center', icon: AlignVerticalJustifyCenter, title: 'Posisi Kolom: Rata Tengah Vertikal (Center / Middle)' },
    { label: 'Bawah', value: 'bottom', icon: AlignVerticalJustifyEnd, title: 'Posisi Kolom: Rata Bawah (Bottom)' },
  ];

  return (
    <div className="flex items-center gap-1 pr-2 mr-2 border-r border-border-default shrink-0">
      <span className="text-[11px] font-semibold text-accent-primary uppercase tracking-wider px-1 flex items-center gap-1">
        <Columns size={12} /> Kolom {columnIndex}/{totalColumns}:
      </span>

      {/* Border ON / OFF Toggle */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (editor.commands as any).toggleColumnsBorder()}
        className={`px-2 py-1 text-xs rounded border shrink-0 cursor-pointer font-medium transition-colors flex items-center gap-1 mr-0.5 ${
          hasBorder
            ? 'bg-accent-soft text-accent-primary border-accent-primary/40 font-semibold shadow-xs'
            : 'bg-bg-canvas hover:bg-bg-hover text-text-secondary hover:text-text-primary border-border-default'
        }`}
        title={hasBorder ? 'Border Kolom: AKTIF (Klik untuk Matikan / Mode Tanpa Border)' : 'Border Kolom: MATI (Klik untuk Aktifkan Border)'}
      >
        {hasBorder ? (
          <>
            <SquareDashed size={13} className="text-accent-primary" />
            <span>Border: ON</span>
          </>
        ) : (
          <>
            <Square size={13} className="opacity-60" />
            <span>Border: OFF</span>
          </>
        )}
      </button>

      {/* Per-Column Vertical Alignment (Top / Center / Bottom) */}
      <div className="flex items-center gap-0.5 border-r border-border-default pr-1.5 mr-0.5" title="Perataan Vertikal untuk Kolom Ini">
        {alignOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = currentAlign === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => (editor.commands as any).setColumnAlign(opt.value)}
              className={`p-1 text-xs rounded border shrink-0 cursor-pointer transition-colors flex items-center justify-center ${
                isActive
                  ? 'bg-accent-soft text-accent-primary border-accent-primary/40 font-semibold'
                  : 'bg-bg-canvas hover:bg-bg-hover text-text-secondary hover:text-text-primary border-border-default'
              }`}
              title={opt.title}
            >
              <Icon size={13} />
            </button>
          );
        })}
      </div>

      {/* When exactly 2 columns: show standard 2-col presets */}
      {totalColumns === 2 && (
        <div className="flex items-center gap-0.5 border-r border-border-default pr-1.5 mr-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (editor.commands as any).setColumnsLayout('30-70')}
            className={`px-2 py-1 text-xs rounded border shrink-0 cursor-pointer font-medium transition-colors ${
              currentLayout === '30-70' && currentWidth === 'auto'
                ? 'bg-accent-soft text-accent-primary border-accent-primary/40 font-semibold'
                : 'bg-bg-canvas hover:bg-bg-hover text-text-primary border-border-default'
            }`}
            title="Rasio 30:70 (Media & Teks)"
          >
            30:70
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (editor.commands as any).setColumnsLayout('50-50')}
            className={`px-2 py-1 text-xs rounded border shrink-0 cursor-pointer font-medium transition-colors ${
              currentLayout === '50-50' && currentWidth === 'auto'
                ? 'bg-accent-soft text-accent-primary border-accent-primary/40 font-semibold'
                : 'bg-bg-canvas hover:bg-bg-hover text-text-primary border-border-default'
            }`}
            title="Rasio 50:50 (Seimbang)"
          >
            50:50
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (editor.commands as any).setColumnsLayout('70-30')}
            className={`px-2 py-1 text-xs rounded border shrink-0 cursor-pointer font-medium transition-colors ${
              currentLayout === '70-30' && currentWidth === 'auto'
                ? 'bg-accent-soft text-accent-primary border-accent-primary/40 font-semibold'
                : 'bg-bg-canvas hover:bg-bg-hover text-text-primary border-border-default'
            }`}
            title="Rasio 70:30 (Teks & Samping)"
          >
            70:30
          </button>
        </div>
      )}

      {/* Individual Column Width Customizer */}
      <div className="flex items-center gap-0.5 border-r border-border-default pr-1.5 mr-0.5">
        {widthOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (editor.commands as any).setColumnWidth(opt.value)}
            className={`px-2 py-1 text-xs rounded border shrink-0 cursor-pointer font-medium transition-colors ${
              currentWidth === opt.value
                ? 'bg-accent-soft text-accent-primary border-accent-primary/40 font-semibold'
                : 'bg-bg-canvas hover:bg-bg-hover text-text-primary border-border-default'
            }`}
            title={opt.title}
          >
            {opt.label}
          </button>
        ))}

        {totalColumns > 2 && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (editor.commands as any).setColumnsLayout('equal')}
            className="px-2 py-1 text-xs rounded bg-bg-canvas hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-default flex items-center gap-1 shrink-0 cursor-pointer"
            title="Bagi Semua Kolom Sama Rata"
          >
            <RotateCcw size={11} /> Sama Rata
          </button>
        )}
      </div>

      {/* Add / Remove Column Buttons */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (editor.commands as any).addLayoutColumnBefore()}
        className="px-2 py-1 text-xs rounded bg-bg-canvas hover:bg-bg-hover text-text-primary flex items-center gap-1 border border-border-default shrink-0 cursor-pointer"
        title="Tambah Kolom di Kiri"
      >
        <ArrowLeft size={12} /><Plus size={12} /> Kolom
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (editor.commands as any).addLayoutColumnAfter()}
        className="px-2 py-1 text-xs rounded bg-bg-canvas hover:bg-bg-hover text-text-primary flex items-center gap-1 border border-border-default shrink-0 cursor-pointer"
        title="Tambah Kolom di Kanan"
      >
        <ArrowRight size={12} /><Plus size={12} /> Kolom
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (editor.commands as any).deleteCurrentColumn()}
        className="px-2 py-1 text-xs rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center gap-1 border border-red-500/20 shrink-0 cursor-pointer"
        title={`Hapus Kolom ${columnIndex} Ini`}
      >
        <Trash2 size={12} /> Kolom
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (editor.commands as any).deleteColumns()}
        className="px-2 py-1 text-xs rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center gap-1 font-medium shrink-0 cursor-pointer ml-1"
        title="Hapus Seluruh Blok Kolom"
      >
        <Trash2 size={12} /> Blok Kolom
      </button>
    </div>
  );
};
