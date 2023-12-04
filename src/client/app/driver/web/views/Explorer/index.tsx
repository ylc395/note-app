import { container } from 'tsyringe';
import type { ReactNode } from 'react';
import { observer } from 'mobx-react-lite';

import Explorer, { type ExplorerTypes } from '@domain/model/Explorer';
import { EntityTypes } from '@domain/model/entity';
import Resizable from '@components/Resizable';

import ActivityBar from './ActivityBar';
import NoteExplorer from './Note';
import Memo from './Memo';
import Material from './Material';

const explorerMap: Record<ExplorerTypes, () => ReactNode> = {
  [EntityTypes.Note]: () => <NoteExplorer />,
  [EntityTypes.Material]: () => <Material />,
  [EntityTypes.Memo]: () => <Memo />,
};

export default observer(function ExplorerView() {
  const { currentExplorer } = container.resolve(Explorer);

  return (
    <div className="flex h-full overflow-x-hidden border-0 border-r border-solid  border-gray-200">
      <ActivityBar />
      <Resizable
        className="box-border flex h-full flex-col bg-gray-50 p-2"
        initialWidth={300}
        minWidth={250}
        resizable="right"
      >
        {explorerMap[currentExplorer.value!]()}
      </Resizable>
    </div>
  );
});
