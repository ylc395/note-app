import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { ConfigProvider, message as antdMessage } from 'antd';
import { type ReactNode, useEffect } from 'react';
import { Resizable } from 're-resizable';
import './index.css';

import Layout, { ExplorerTypes } from 'model/Layout';

import ActivityBar from './Explorer/ActivityBar';
import NoteExplorer from './Explorer/Note';
import Workbench from './Workbench';
import { DraggableZone, DragPreview } from './DraggableZone';

const explorerMap: Record<ExplorerTypes, () => ReactNode> = {
  [ExplorerTypes.Notes]: () => <NoteExplorer />,
  [ExplorerTypes.Materials]: () => null,
  [ExplorerTypes.Timeline]: () => null,
  [ExplorerTypes.Memo]: () => null,
  [ExplorerTypes.Topic]: () => null,
  [ExplorerTypes.Code]: () => null,
  [ExplorerTypes.Dustbin]: () => null,
  [ExplorerTypes.Todo]: () => null,
};

const getContainer = () => document.querySelector('#app') as HTMLElement;

export default observer(function App() {
  const { currentExplorer } = container.resolve(Layout);

  useEffect(() => {
    antdMessage.config({ getContainer });
  }, []);

  return (
    <DraggableZone>
      <ConfigProvider getPopupContainer={getContainer}>
        <main className="flex">
          <div className="flex border-0 border-r border-solid border-gray-200">
            <ActivityBar />
            <Resizable enable={{ right: true }} minWidth={220} defaultSize={{ width: 300, height: 'auto' }}>
              {explorerMap[currentExplorer]()}
            </Resizable>
          </div>
          <Workbench />
          <DragPreview />
        </main>
      </ConfigProvider>
    </DraggableZone>
  );
});
