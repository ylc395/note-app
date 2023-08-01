import 'tailwindcss/tailwind.css';

import Menu from './Menu';
import History from './History';
import Network from './Network';
import Options from './Options';
import TaskList from './TaskList';

// eslint-disable-next-line mobx/missing-observer
export default function App() {
  return (
    <div className="w-96 bg-gray-100 px-6">
      <h1 className="py-4 text-lg">StarNote Clipper</h1>
      <Options />
      <Menu />
      {/* <TaskList /> */}
      {/* <History /> */}
      <Network />
    </div>
  );
}
