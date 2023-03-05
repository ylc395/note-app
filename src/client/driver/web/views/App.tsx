import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { ConfigProvider, message as antdMessage } from 'antd';
import { type ReactNode, useEffect } from 'react';
import { Resizable } from 're-resizable';
import { DragOverlay, useDndContext } from '@dnd-kit/core';
import './index.css';

import Layout, { ExplorerTypes } from 'model/Layout';
import EntityEditor from 'model/abstract/Editor';
import NoteService from 'service/NoteService';

import ActivityBar from './Explorer/ActivityBar';
import NoteExplorer from './Explorer/Note';
import Workbench from './Workbench';
import TabItem from './Workbench/TabBar/TabItem';
import NoteTree from './Explorer/Note/Tree';

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
  const { noteTree } = container.resolve(NoteService);
  const { active } = useDndContext();

  const draggingItem = active?.data.current?.instance;

  useEffect(() => {
    antdMessage.config({ getContainer });
  }, []);

  return (
    <ConfigProvider getPopupContainer={getContainer}>
      <main className="flex">
        <div className="flex border-0 border-r border-solid border-gray-200">
          <ActivityBar />
          <Resizable enable={{ right: true }} minWidth={220} defaultSize={{ width: 300, height: 'auto' }}>
            {explorerMap[currentExplorer]()}
          </Resizable>
        </div>
        <Workbench />
        <DragOverlay className="pointer-events-none">
          {draggingItem instanceof EntityEditor && <TabItem editor={draggingItem}></TabItem>}
          {noteTree.has(draggingItem) && <NoteTree node={draggingItem} />}
        </DragOverlay>
      </main>
    </ConfigProvider>
  );
});
