import { Resizable } from 're-resizable';
import { container } from 'tsyringe';
import type { ReactNode } from 'react';
import { observer } from 'mobx-react-lite';

import Layout, { ExplorerTypes } from 'model/Layout';
import ActivityBar from './ActivityBar';
import NoteExplorer from './Note';
import Memo from './Memo';
import Material from './Material';

const explorerMap: Record<ExplorerTypes, () => ReactNode> = {
  [ExplorerTypes.Notes]: () => <NoteExplorer />,
  [ExplorerTypes.Materials]: () => <Material />,
  [ExplorerTypes.Timeline]: () => null,
  [ExplorerTypes.Memo]: () => <Memo />,
  [ExplorerTypes.Topic]: () => null,
  [ExplorerTypes.Code]: () => null,
  [ExplorerTypes.Dustbin]: () => null,
  [ExplorerTypes.Todo]: () => null,
};

export default observer(function Explorer() {
  const { currentExplorer } = container.resolve(Layout);

  return (
    <div className="flex border-0 border-r border-solid border-gray-200">
      <ActivityBar />
      <Resizable enable={{ right: true }} minWidth={220} defaultSize={{ width: 300, height: 'auto' }}>
        {explorerMap[currentExplorer]()}
      </Resizable>
    </div>
  );
});
