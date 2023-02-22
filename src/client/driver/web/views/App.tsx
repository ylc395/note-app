import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { ConfigProvider, message as antdMessage } from 'antd';
import { type ReactNode, useCallback, useEffect } from 'react';
import './index.css';

import ViewService, { ExplorerTypes } from 'service/ViewService';

import ActivityBar from './Explorer/ActivityBar';
import NoteExplorer from './Explorer/Note';
import Workbench from './Workbench';

const explorerMap: Record<ExplorerTypes, () => ReactNode> = {
  [ExplorerTypes.Notes]: () => <NoteExplorer />,
  [ExplorerTypes.Materials]: () => null,
  [ExplorerTypes.Timeline]: () => null,
  [ExplorerTypes.Topic]: () => null,
  [ExplorerTypes.Code]: () => null,
  [ExplorerTypes.Dustbin]: () => null,
  [ExplorerTypes.Graph]: () => null,
  [ExplorerTypes.Todo]: () => null,
};

export default observer(function App() {
  const getContainer = useCallback(() => document.querySelector('#app') as HTMLElement, []);

  useEffect(() => {
    antdMessage.config({ getContainer });
  });

  const { currentExplorer: currentView } = container.resolve(ViewService);

  return (
    <ConfigProvider getPopupContainer={getContainer}>
      <main className="flex">
        <ActivityBar />
        {explorerMap[currentView]()}
        <Workbench />
      </main>
    </ConfigProvider>
  );
});
