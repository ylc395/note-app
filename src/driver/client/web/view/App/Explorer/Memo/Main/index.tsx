import Editor from './Editor';
import ListToolbar from './ListToolBar';
import List from './List';

export default function MemoMain() {
  return (
    <div class="flex flex-col grow min-h-0">
      <Editor />
      <ListToolbar />
      <List />
    </div>
  );
}
