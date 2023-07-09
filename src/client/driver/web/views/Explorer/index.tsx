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
  [ExplorerTypes.Memo]: () => <Memo />,
  [ExplorerTypes.Dustbin]: () => null,
};

export default observer(function Explorer() {
  const { currentExplorer } = container.resolve(Layout);

  return (
    <div className="flex h-full overflow-x-hidden border-0 border-r border-solid  border-gray-200">
      <ActivityBar />
      <Resizable enable={{ right: true }} minWidth={220} defaultSize={{ width: 300, height: '100%' }}>
        {explorerMap[currentExplorer]()}
      </Resizable>
    </div>
  );
});
