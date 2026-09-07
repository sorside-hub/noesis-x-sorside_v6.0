import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { AudioPill } from './AudioPill';

export const AudioPillNodeView: React.FC<any> = ({ node, deleteNode }) => {
  const { src, title } = node.attrs;

  return (
    <NodeViewWrapper 
      className="audio-node-view my-2 select-none"
      contentEditable={false}
      data-drag-handle={false}
      onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
      onTouchStart={(e: React.TouchEvent) => e.stopPropagation()}
      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <AudioPill
        src={src}
        title={title || 'Voice Note'}
        onDelete={deleteNode}
      />
    </NodeViewWrapper>
  );
};
