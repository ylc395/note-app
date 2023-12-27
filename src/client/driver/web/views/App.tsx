import { ConfigProvider, message as antdMessage } from 'antd';
import { DndProvider } from 'react-dnd';
import { useEffect } from 'react';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Explorer from './Explorer';
import Workbench from './Workbench';

import './index.css';

const getContainer = () => document.querySelector('#app') as HTMLElement;

// eslint-disable-next-line mobx/missing-observer
export default function App() {
  useEffect(() => {
    antdMessage.config({ getContainer });
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <ConfigProvider getPopupContainer={getContainer}>
        <main className="flex h-screen">
          <Explorer />
          <Workbench />
        </main>
      </ConfigProvider>
    </DndProvider>
  );
}
