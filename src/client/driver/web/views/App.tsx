import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Explorer from './Explorer';
import Workbench from './Workbench';

import './index.css';

// eslint-disable-next-line mobx/missing-observer
export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <main className="flex h-screen">
        <Explorer />
        <Workbench />
      </main>
    </DndProvider>
  );
}
