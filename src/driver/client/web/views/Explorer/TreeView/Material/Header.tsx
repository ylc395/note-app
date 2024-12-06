import { observer } from 'mobx-react-lite';
import { container } from '#domain/shared/infra/singletons';

import MaterialExplorer from '#domain/client/app/model/material/Explorer';
import ExplorerHeader from '../common/Header';

export default observer(function Header() {
  const { tree } = container.resolve(MaterialExplorer);

  return <ExplorerHeader tree={tree} title="素材" />;
});
