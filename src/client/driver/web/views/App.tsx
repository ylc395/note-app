import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { ConfigProvider } from 'antd';
import { useCallback } from 'react';
import './index.css';

import ViewService from 'service/ViewService';
import { KnowledgeTypes } from 'model/constants';

import ActivityBar from './Explorer/ActivityBar';
import MaterialExplorer from './Explorer/Material';
import NoteExplorer from './Explorer/Note';
import Workbench from './Workbench';

const explorerMap = {
  [KnowledgeTypes.Notes]: () => <NoteExplorer />,
  [KnowledgeTypes.Materials]: () => <MaterialExplorer />,
} as const;

export default observer(function App() {
  const getContainer = useCallback(() => document.querySelector('#app') as HTMLElement, []);
  const { currentView } = container.resolve(ViewService);

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
