import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { AiOutlineClose } from 'react-icons/ai';

import type { Tile } from '@domain/client/app/model/workbench';
import Droppable from '@web/components/dnd/Droppable';
import Button from '@web/components/Button';

import TabItem from './TabItem';
import useDrop from './useDrop';

export default observer(function TabBar({ tile }: { tile: Tile }) {
  const { editors } = tile;
  const { setIsOver, isOver, onDrop } = useDrop(tile);

  return (
    <div className="flex justify-between border-0 border-b border-solid border-layout">
      <Droppable
        onOverToggle={setIsOver}
        onDrop={onDrop}
        className={clsx('scrollbar-hidden flex grow overflow-auto', isOver ? 'bg-slate-200' : 'bg-gray-50')}
      >
        {editors.map((editor) => (
          <TabItem key={editor.id} editor={editor} />
        ))}
      </Droppable>
      {tile.editors.length > 1 && (
        <Button onClick={tile.closeAllEditors}>
          <AiOutlineClose />
        </Button>
      )}
    </div>
  );
});
