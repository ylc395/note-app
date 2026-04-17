import { createMemo } from 'solid-js';
import type BaseEditor from '#domain/client/app/model/Workbench/BaseEditor';

export default function useContextmenu({ editor }: { editor: BaseEditor }) {
  const tile = createMemo(() => editor.tile);

  function getContextmenu() {
    return [
      { label: '关闭其余标签页', key: 'close-others', disabled: tile().editors.length === 1 },
      { label: '关闭左侧标签页', key: 'close-left', disabled: editor.index === 0 },
      { label: '关闭右侧标签页', key: 'close-right', disabled: editor.index === tile().editors.length - 1 },
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
