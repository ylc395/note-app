import { Resizable } from 're-resizable';
import { container } from 'tsyringe';
import type { ReactNode } from 'react';
import { observer } from 'mobx-react-lite';

import Explorer, { type ExplorerTypes } from 'model/Explorer';
import { EntityTypes } from 'model/entity';
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
        className="bg-gray-50 p-2"
        enable={{ right: true }}
        minWidth={220}
        defaultSize={{ width: 300, height: '100%' }}
      >
        <div className="flex h-full flex-col">{explorerMap[currentExplorer.value!]()}</div>
      </Resizable>
    </div>
  );
});
