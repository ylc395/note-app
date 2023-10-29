import { ConfigProvider, message as antdMessage } from 'antd';
import { useEffect } from 'react';

import Explorer from './Explorer';
import Workbench from './Workbench';
import DraggableZone from './Dnd/DraggableZone';
import DraggingPreview from './Dnd/DraggingPreview';

import './index.css';

const getContainer = () => document.querySelector('#app') as HTMLElement;

// eslint-disable-next-line mobx/missing-observer
export default function App() {
  useEffect(() => {
    antdMessage.config({ getContainer });
  }, []);

  return (
    <DraggableZone>
      <ConfigProvider getPopupContainer={getContainer}>
        <main className="flex h-screen">
          <Explorer />
          <Workbench />
          <DraggingPreview />
        </main>
      </ConfigProvider>
    </DraggableZone>
  );
}
