import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { DocumentPill } from './DocumentPill';

export const DocumentPillNodeView: React.FC<any> = ({ node, deleteNode }) => {
  const { src, title, filename } = node.attrs;

  return (
    <NodeViewWrapper 
      className="document-node-view my-2 select-none"
      contentEditable={false}
      data-drag-handle={false}
      onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
      onTouchStart={(e: React.TouchEvent) => e.stopPropagation()}
      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <DocumentPill
        src={src}
        title={title || 'Dokumen'}
        filename={filename}
        onDelete={deleteNode}
      />
    </NodeViewWrapper>
  );
};
