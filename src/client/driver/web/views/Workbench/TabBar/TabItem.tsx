import { observer } from 'mobx-react-lite';
import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useSortable } from '@dnd-kit/sortable';
import { useRef, useEffect } from 'react';

import IconTitle from 'web/components/common/IconTitle';
import type EntityEditor from 'model/abstract/Editor';

interface Props {
  editor: EntityEditor;
}
export default observer(function TabItem({ editor }: Props) {
  const { tile } = editor;
  const { switchToEditor, closeEditor, currentEditor } = tile;
  const { setNodeRef, attributes, listeners, over } = useSortable({
    id: editor.id,
    data: { editor },
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
      className={`flex cursor-pointer flex-nowrap items-center border-0 border-r border-solid border-gray-200 bg-gray-100 p-2 ${
        currentEditor === editor ? 'bg-white' : ''
      } ${over?.id === editor.id ? 'bg-gray-200' : ''}`}
      onClick={() => switchToEditor(editor.id)}
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
        type="text"
        icon={<CloseOutlined />}
      />
    </div>
  );
});
