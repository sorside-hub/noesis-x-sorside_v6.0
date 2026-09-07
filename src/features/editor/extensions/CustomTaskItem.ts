import TaskItem from '@tiptap/extension-task-item';

export const CustomTaskItem = TaskItem.extend({
  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const listItem = document.createElement('li');
      const checkboxWrapper = document.createElement('label');
      const checkboxStyler = document.createElement('span');
      const checkbox = document.createElement('input');
      const content = document.createElement('div');

      checkboxWrapper.contentEditable = 'false';
      checkbox.type = 'checkbox';
      checkbox.checked = !!node.attrs.checked;

      // Prevent ProseMirror from misinterpreting mousedown on checkbox
      checkbox.addEventListener('mousedown', (event) => {
        event.stopPropagation();
      });

      checkbox.addEventListener('change', (event) => {
        const checked = (event.target as HTMLInputElement).checked;

        if (typeof getPos === 'function') {
          const position = getPos();
          if (typeof position === 'number') {
            try {
              const { state, dispatch } = editor.view;
              const currentNode = state.doc.nodeAt(position);
              if (currentNode) {
                const tr = state.tr.setNodeMarkup(position, undefined, {
                  ...currentNode.attrs,
                  checked,
                });
                dispatch(tr);
              }
            } catch (err) {
              console.warn('Error updating task item checkbox:', err);
            }
          }
        }
      });

      Object.entries(this.options.HTMLAttributes || {}).forEach(([key, value]) => {
        listItem.setAttribute(key, value as string);
      });

      listItem.dataset.checked = String(node.attrs.checked);
      listItem.dataset.type = 'taskItem';

      checkboxWrapper.append(checkbox, checkboxStyler);
      listItem.append(checkboxWrapper, content);

      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value as string);
      });

      return {
        dom: listItem,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) {
            return false;
          }
          listItem.dataset.checked = String(updatedNode.attrs.checked);
          checkbox.checked = !!updatedNode.attrs.checked;
          return true;
        },
      };
    };
  },
});
