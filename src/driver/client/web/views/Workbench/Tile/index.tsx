import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

import { container } from '#domain/shared/infra/singletons';
import Workbench from '#domain/client/app/model/Workbench';
import Tile from '#domain/client/app/model/Workbench/Tile';
import { IS_DEV } from '#domain/shared/infra/env';

import TabBar from './TabBar';
import Editor from './Editor';
import Breadcrumb from './Breadcrumb';

export default observer(function TileView({ id }: { id: Tile['id'] }) {
  const workbench = container.resolve(Workbench);
  const tile = workbench.getTileById(id);

  return (
    <div
      className={clsx(
        'flex h-full flex-col ',
        // workbench.currentTile?.id === id && workbench.root !== id ? 'z-10 border-blue-300' : 'border-gray-100 ',
      )}
    >
      {IS_DEV ? <span className="absolute right-0 top-0 text-xs">{id}</span> : null}
      <TabBar tile={tile} />
      <div className="relative flex min-h-0 grow flex-col">
        <Breadcrumb tile={tile} />
        <Editor tile={tile} />
      </div>
    </div>
  );
});
