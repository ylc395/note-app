import { observer } from 'mobx-react-lite';
import type { ReactNode } from 'react';

import Sidebar, { type ExplorerTypes } from '#domain/client/app/model/Sidebar';
import { container } from '#domain/shared/infra/singletons';
import Resizable from '#web/components/Resizable';
import { EntityTypes } from '#domain/client/shared/model/entity';

import Note from './Note';
import Material from './Material';
import Memo from './Memo';

const explorerMap: Record<ExplorerTypes, () => ReactNode> = {
  [EntityTypes.Note]: () => <Note />,
  [EntityTypes.Material]: () => <Material />,
  [EntityTypes.Memo]: () => <Memo />,
};

export default observer(function TreeView() {
  const {
    currentExplorer: { entityType },
  } = container.resolve(Sidebar);

  return (
    <Resizable
      className="relative box-border flex h-full flex-col bg-gray-50"
      initialWidth={300}
      minWidth={250}
      resizable="right"
    >
      {explorerMap[entityType as ExplorerTypes]()}
    </Resizable>
  );
});
