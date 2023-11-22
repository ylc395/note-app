import { Workbench, type Tile } from 'model/workbench';
import { IS_DEV } from 'infra/constants';
import TabBar from './TabBar';
import Editor from './Editor';
import { container } from 'tsyringe';

// eslint-disable-next-line mobx/missing-observer
export default function TileView({ id }: { id: Tile['id'] }) {
  const workbench = container.resolve(Workbench);
  const tile = workbench.getTileById(id);

  return (
    <div className="relative flex h-full flex-col">
      {IS_DEV ? <span className="absolute right-0 top-0 text-xs">{id}</span> : null}
      <TabBar tile={tile} />
      <Editor tile={tile} />
    </div>
  );
}
