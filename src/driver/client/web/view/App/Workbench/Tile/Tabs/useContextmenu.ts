import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import { createMemo } from 'solid-js';

export default function useContextmenu({ editor }: { editor: BaseEditor }) {
  const tile = createMemo(() => editor.tile);

  function getContextmenu() {
    return [
      { label: '关闭其余 tab', key: 'close-others', disabled: tile().editors.length === 1 },
      { label: '关闭左侧 tab', key: 'close-left', disabled: editor.index === 0 },
      { label: '关闭右侧 tab', key: 'close-right', disabled: editor.index === tile().editors.length - 1 },
    ];
  }

  function handleContextmenuClick(value: string) {
    switch (value) {
      case 'close-left':
        tile().closeEditors(editor, 'left');
        break;
      case 'close-right':
        tile().closeEditors(editor, 'right');
        break;
      case 'close-others':
        tile().closeEditors(editor, 'others');
        break;
      default:
        break;
    }
  }

  return { getContextmenu, handleContextmenuClick };
}
