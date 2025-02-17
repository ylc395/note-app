import Sidebar from './Sidebar';
import Main from './Main';

export default function MemoExplorer() {
  return (
    <div class="flex h-screen p-4 w-full">
      <Sidebar />
      <Main />
    </div>
  );
}
