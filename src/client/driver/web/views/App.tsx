import { observer } from 'mobx-react-lite';
import { ConfigProvider } from '@douyinfe/semi-ui';
import { useCallback } from 'react';
import './index.css';

import ActivityBar from './ActivityBar';
import MaterialExplorer from './Explorer/Material';

export default observer(function App() {
  const getContainer = useCallback(() => document.querySelector('#app') as HTMLElement, []);

  return (
    <ConfigProvider getPopupContainer={getContainer}>
      <main className="flex h-screen">
        <ActivityBar />
        <MaterialExplorer />
      </main>
    </ConfigProvider>
  );
});
