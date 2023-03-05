import { observer } from 'mobx-react-lite';
import { CloseOutlined } from '@ant-design/icons';
import { container } from 'tsyringe';
import { Button } from 'antd';
import { useSortable } from '@dnd-kit/sortable';
import { useRef, useEffect } from 'react';

import IconTitle from 'web/components/common/IconTitle';
import type EntityEditor from 'model/abstract/Editor';
import EditorService from 'service/EditorService';
import clsx from 'clsx';

interface Props {
  editor: EntityEditor;
}
export default observer(function TabItem({ editor }: Props) {
  const editorService = container.resolve(EditorService);
  const { tile } = editor;
  const { switchToEditor, removeEditor: closeEditor, currentEditor } = tile;
  const { setNodeRef, attributes, listeners, over } = useSortable({
    id: editor.id,
    data: { instance: editor },
  });
  const buttonRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!buttonRef.current || !currentEditor) {
      throw new Error('unexpected');
    }

    currentEditor === editor && buttonRef.current.scrollIntoView();
  }, [currentEditor, editor]);

  if (!currentEditor) {
    throw new Error('no current editor');
  }

  return (
    <div
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      className={clsx(
        'flex cursor-pointer flex-nowrap items-center border-0 border-r border-solid border-gray-200 bg-gray-100 p-2',
        {
          'bg-white': currentEditor === editor,
          'bg-gray-200': over?.id === editor.id,
        },
      )}
      onClick={() => switchToEditor(editor.id)}
      onContextMenu={() => editorService.actByContextmenu(editor)}
    >
      <IconTitle
        className="mr-1 max-w-[200px] text-sm"
        titleClassName=" overflow-hidden text-ellipsis"
        size="1em"
        {...editor.tabView}
      />
      <Button
        ref={buttonRef}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          closeEditor(editor.id);
        }}
        onFocus={(e) => e.stopPropagation()}
        type="text"
        icon={<CloseOutlined />}
      />
    </div>
  );
});
