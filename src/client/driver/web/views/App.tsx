import { ConfigProvider, message as antdMessage } from 'antd';
import { useEffect } from 'react';

import Explorer from './Explorer';
import Workbench from './Workbench';
import { DraggableZone, DragPreview } from './DraggableZone';
import './index.css';

const getContainer = () => document.querySelector('#app') as HTMLElement;

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
          <DragPreview />
        </main>
      </ConfigProvider>
    </DraggableZone>
  );
}
