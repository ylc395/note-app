import { container } from 'tsyringe';
import type { ReactNode } from 'react';
import { observer } from 'mobx-react-lite';

import ExplorerManager, { type ExplorerTypes } from '@domain/app/model/ExplorerManager';
import { EntityTypes } from '@domain/app/model/entity';
import Resizable from '@web/components/Resizable';

import ActivityBar from './ActivityBar';
import NoteExplorer from './Note';
import Material from './Material';

const explorerMap: Record<ExplorerTypes, () => ReactNode> = {
  [EntityTypes.Note]: () => <NoteExplorer />,
  [EntityTypes.Material]: () => <Material />,
  // [EntityTypes.Memo]: () => <Memo />,
};

export default observer(function ExplorerView() {
  const { currentExplorerType } = container.resolve(ExplorerManager);

  return (
    <div className="flex h-full overflow-x-hidden border-0 border-r border-solid  border-gray-200">
      <ActivityBar />
      <Resizable
        className="box-border flex h-full flex-col bg-gray-50 p-2"
        initialWidth={300}
        minWidth={250}
        resizable="right"
      >
        {explorerMap[currentExplorerType]()}
      </Resizable>
    </div>
  );
});
