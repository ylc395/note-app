import { observer } from 'mobx-react-lite';
import { ConfigProvider } from '@douyinfe/semi-ui';
import './index.css';

import ActivityBar from './ActivityBar';
import MaterialExplorer from './Explorer/Material';

export default observer(function App() {
  return (
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    <ConfigProvider getPopupContainer={() => document.querySelector('#app')!}>
      <main className="flex h-screen">
        <ActivityBar />
        <MaterialExplorer />
      </main>
    </ConfigProvider>
  );
});
