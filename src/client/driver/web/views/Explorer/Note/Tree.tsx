import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { container } from 'tsyringe';
import { useEffect } from 'react';
import { Tree } from 'antd';

import NoteService from 'service/NoteService';
import WorkbenchService from 'service/WorkbenchService';

export default observer(function NoteTree() {
  const {
    noteTree: { roots, loadChildren, getNote },
  } = container.resolve(NoteService);
  const { open } = container.resolve(WorkbenchService);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <Tree
      treeData={toJS(roots)}
      blockNode
      className="bg-transparent"
      loadData={(node) => loadChildren(node.key)}
      onSelect={(keys) => open({ type: 'note', entity: getNote(keys[0] as string) }, false)}
    />
  );
});
