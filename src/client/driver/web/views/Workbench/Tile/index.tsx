import { container } from 'tsyringe';
import { Workbench, type Tile } from '@domain/app/model/workbench';
import { IS_DEV } from '@shared/domain/infra/constants';

import Droppable from '@web/components/dnd/Droppable';
import TabBar from './TabBar';
import Editor from './Editor';
import Breadcrumb from './Breadcrumb';
import useDrop from './useDrop';

// eslint-disable-next-line mobx/missing-observer
export default function TileView({ id }: { id: Tile['id'] }) {
  const workbench = container.resolve(Workbench);
  const tile = workbench.getTileById(id);
  const { onDrop, setIsOver, dropArea, onDragMove } = useDrop(tile);

  return (
    <Droppable
      onDragMove={onDragMove}
      onOverToggle={setIsOver}
      onDrop={onDrop}
      className="relative flex h-full flex-col"
    >
      {IS_DEV ? <span className="absolute right-0 top-0 text-xs">{id}</span> : null}
      <TabBar tile={tile} />
      <Breadcrumb tile={tile} />
      <Editor tile={tile} />
      {dropArea && <div className="absolute bg-blue-50 opacity-60" style={dropArea} />}
    </Droppable>
  );
}
