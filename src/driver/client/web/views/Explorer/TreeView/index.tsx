import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import type { ReactNode } from 'react';

import ExplorerManager, { type ExplorerTypes } from '@domain/client/app/model/ExplorerManager';
import { EntityTypes } from '@domain/client/app/model/entity';
import Resizable from '@web/components/Resizable';
import Note from './Note';
import Material from './Material';
import Memo from './Memo';
import TreeDraggingPreview from './common/TreeDraggingPreview';

const explorerMap: Record<ExplorerTypes, () => ReactNode> = {
  [EntityTypes.Note]: () => <Note />,
  [EntityTypes.Material]: () => <Material />,
  [EntityTypes.Memo]: () => <Memo />,
};

export default observer(function TreeView() {
  const {
    currentExplorer: { entityType },
  } = container.resolve(ExplorerManager);

  return (
    <Resizable
      className="relative box-border flex h-full flex-col bg-gray-50"
      initialWidth={300}
      minWidth={250}
      resizable="right"
    >
      {explorerMap[entityType as ExplorerTypes]()}
      <TreeDraggingPreview />
    </Resizable>
  );
});
