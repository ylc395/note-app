import { ConfigProvider, message as antdMessage } from 'antd';
import { useEffect } from 'react';

import Explorer from './Explorer';
import Workbench from './Workbench';
import Dnd from './Dnd';

import './index.css';

const getContainer = () => document.querySelector('#app') as HTMLElement;

// eslint-disable-next-line mobx/missing-observer
export default function App() {
  useEffect(() => {
    antdMessage.config({ getContainer });
  }, []);

  return (
    <Dnd>
      <ConfigProvider getPopupContainer={getContainer}>
        <main className="flex h-screen">
          <Explorer />
          <Workbench />
        </main>
      </ConfigProvider>
    </Dnd>
  );
}
