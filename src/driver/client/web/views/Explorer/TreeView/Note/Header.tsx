import { observer } from 'mobx-react-lite';

import { container } from '#domain/shared/infra/singletons';
import NoteExplorer from '#domain/client/app/model/note/Explorer';

import ExplorerHeader from '../common/Header';

export default observer(function Header() {
  const { tree } = container.resolve(NoteExplorer);

  return <ExplorerHeader tree={tree} title="笔记" />;
});
