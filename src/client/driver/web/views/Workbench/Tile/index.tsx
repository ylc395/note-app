import { container } from 'tsyringe';
import { Workbench, type Tile } from '@domain/app/model/workbench';
import { IS_DEV } from '@shared/domain/infra/constants';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

import Droppable from '@web/components/dnd/Droppable';
import TabBar from './TabBar';
import Editor from './Editor';
import Breadcrumb from './Breadcrumb';
import useDrop from './useDrop';
import assert from 'assert';

export default observer(function TileView({ id }: { id: Tile['id'] }) {
  const workbench = container.resolve(Workbench);
  const tile = workbench.getTileById(id);
  assert(tile);

  const { onDrop, setIsOver, dropArea, onDragMove } = useDrop(tile);
  const updateHistory = () => tile.currentEditor && workbench.historyManager.update(tile.currentEditor, true);

  return (
    <Droppable
      onDragMove={onDragMove}
      onOverToggle={setIsOver}
      onDrop={onDrop}
      onFocusCapture={updateHistory}
      className={clsx(
        'flex h-full flex-col border border-solid',
        workbench.currentTile?.id === id && workbench.root !== id ? 'z-10 border-blue-300' : 'border-gray-100 ',
      )}
    >
      {IS_DEV ? <span className="absolute right-0 top-0 text-xs">{id}</span> : null}
      <TabBar tile={tile} />
      <div className="relative flex min-h-0 grow flex-col">
        <Breadcrumb tile={tile} />
        <Editor tile={tile} />
        {dropArea && <div className="absolute bg-blue-50 opacity-60" style={dropArea} />}
      </div>
    </Droppable>
  );
});
