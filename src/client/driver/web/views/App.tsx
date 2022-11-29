import { observer } from 'mobx-react-lite';
import { ConfigProvider } from 'antd';
import { useCallback } from 'react';
import './index.css';

import ActivityBar from './ActivityBar';
import MaterialExplorer from './Explorer/Material';
import Workbench from './Workbench';

export default observer(function App() {
  const getContainer = useCallback(() => document.querySelector('#app') as HTMLElement, []);

  return (
    <ConfigProvider getPopupContainer={getContainer}>
      <main className="flex">
        <ActivityBar />
        <MaterialExplorer />
        <Workbench />
      </main>
    </ConfigProvider>
  );
});
