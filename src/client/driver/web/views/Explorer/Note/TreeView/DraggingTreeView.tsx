import { observer } from 'mobx-react-lite';

import type NoteTree from 'model/note/Tree';
import Tree from 'components/Tree';

import NodeTitle from './NodeTitle';

export default observer(function NoteTreeView({ tree }: { tree: NoteTree }) {
  return <Tree tree={tree} renderTitle={(node) => <NodeTitle node={node} />} />;
});
