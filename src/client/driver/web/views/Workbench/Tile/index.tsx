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

export default observer(function TileView({ id }: { id: Tile['id'] }) {
  const workbench = container.resolve(Workbench);
  const tile = workbench.getTileById(id);
  const { onDrop, setIsOver, dropArea, onDragMove } = useDrop(tile);
  const setTile = () => workbench.setCurrentTile(tile);

  return (
    <Droppable
      onDragMove={onDragMove}
      onOverToggle={setIsOver}
      onDrop={onDrop}
      onFocusCapture={setTile}
      onClickCapture={setTile}
      className={clsx(
        'relative flex h-full flex-col border-2 border-solid',
        workbench.currentTile?.id === id && workbench.root !== id ? 'z-10 border-blue-100' : 'border-transparent',
      )}
    >
      {IS_DEV ? <span className="absolute right-0 top-0 text-xs">{id}</span> : null}
      <TabBar tile={tile} />
      <Breadcrumb tile={tile} />
      <Editor tile={tile} />
      {dropArea && <div className="absolute bg-blue-50 opacity-60" style={dropArea} />}
    </Droppable>
  );
});
