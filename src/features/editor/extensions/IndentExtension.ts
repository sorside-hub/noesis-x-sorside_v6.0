import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      /**
       * Increase indentation of current block, paragraph, heading, or list item
       */
      indent: () => ReturnType;
      /**
       * Decrease indentation of current block, paragraph, heading, or list item
       */
      outdent: () => ReturnType;
    };
  }
}

export const IndentExtension = Extension.create({
  name: 'indent',

  addCommands() {
    return {
      indent:
        () =>
        ({ editor, chain }) => {
          // 1. If in a task item, try standard sinking
          if (editor.isActive('taskItem')) {
            return chain().sinkListItem('taskItem').run();
          }

          // 2. If in a regular list item, try standard sinking
          if (editor.isActive('listItem')) {
            return chain().sinkListItem('listItem').run();
          }

          // Return false if not a list item, ignoring the command
          return false;
        },

      outdent:
        () =>
        ({ editor, chain }) => {
          // 1. If in a task item, lift list item hierarchically
          if (editor.isActive('taskItem')) {
            return chain().liftListItem('taskItem').run();
          }

          // 2. If in a regular list item, lift list item hierarchically
          if (editor.isActive('listItem')) {
            return chain().liftListItem('listItem').run();
          }

          // Return false if not a list item
          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive('table')) {
          return false;
        }
        return this.editor.commands.indent();
      },
      'Shift-Tab': () => {
        if (this.editor.isActive('table')) {
          return false;
        }
        return this.editor.commands.outdent();
      },
    };
  },
});
