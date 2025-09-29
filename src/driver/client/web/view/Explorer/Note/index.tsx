import TreeView from './TreeView';
import DropArea from './DropArea';
import HistoryNavigationButtonGroup from './HistoryNavigationButtonGroup';
import SearchBox from './SearchBox';

export default function NoteExplorer() {
  return (
    <div class="border-r border-r-border-secondary h-full flex flex-col min-w-60 p-inset-square-lg bg-surface-secondary">
      <div class="flex items-center mb-stack-s">
        <h1 class="font-bold">笔记</h1>
        <div class="relative grow h-full flex justify-end">
          <HistoryNavigationButtonGroup />
          <DropArea />
        </div>
      </div>
      <SearchBox />
      <TreeView />
    </div>
  );
}
