import { observer } from 'mobx-react-lite';
import './index.css';

import ActivityBar from './ActivityBar';
import MaterialExplorer from './Explorer/Material';

export default observer(function App() {
  return (
    <main className="flex h-screen">
      <ActivityBar />
      <MaterialExplorer />
    </main>
  );
});
