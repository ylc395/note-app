import Menu from './Menu';
import History from './History';
import Network from './Network';
import './index.css';

// eslint-disable-next-line mobx/missing-observer
export default function App() {
  return (
    <div className="w-96">
      <Menu />
      <History />
      <Network />
    </div>
  );
}
