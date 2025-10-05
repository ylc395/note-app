import TreeView from './TreeView';
import DropArea from './DropArea';
import Header from '../Header';
import SearchBox from './SearchBox';

export default function NoteExplorer(props: { className: string }) {
  return (
    <div class={props.className}>
      <Header title="笔记">
        <DropArea />
      </Header>
      <SearchBox />
      <TreeView />
    </div>
  );
}
