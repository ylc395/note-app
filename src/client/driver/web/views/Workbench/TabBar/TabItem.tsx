import { observer } from 'mobx-react-lite';
import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useSortable } from '@dnd-kit/sortable';
import { useRef, useEffect } from 'react';
import clsx from 'clsx';

import IconTitle from 'web/components/IconTitle';
import type EditorView from 'model/abstract/EditorView';
import useContextmenu from './useContextmenu';

export default observer(function TabItem({ editorView }: { editorView: EditorView }) {
  const { tile } = editorView;
  const { switchToEditorView, removeEditorView, currentEditorView } = tile;
  const { setNodeRef, attributes, listeners, over } = useSortable({
    id: editorView.id,
    data: { instance: editorView },
  });
  const buttonRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!buttonRef.current || !currentEditorView) {
      throw new Error('unexpected');
    }

    currentEditorView === editorView && buttonRef.current.scrollIntoView();
  }, [currentEditorView, editorView]);

  const onContextMenu = useContextmenu();

  if (!currentEditorView) {
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
          'bg-white': currentEditorView === editorView,
          'bg-gray-200': over?.id === editorView.id,
        },
      )}
      onClick={() => switchToEditorView(editorView.id)}
      onContextMenu={onContextMenu}
    >
      <IconTitle
        className="mr-1 max-w-[200px] text-sm"
        titleClassName=" overflow-hidden text-ellipsis"
        size="1em"
        {...editorView.editor.tabView}
      />
      <Button
        ref={buttonRef}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          removeEditorView(editorView.id);
        }}
        onFocus={(e) => e.stopPropagation()}
        type="text"
        icon={<CloseOutlined />}
      />
    </div>
  );
});
