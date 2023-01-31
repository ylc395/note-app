import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Resizable } from 're-resizable';

import NoteService from 'service/NoteService';

import Tree from './Tree';

export default observer(function NoteExplorer() {
  const { createNote } = container.resolve(NoteService);

  return (
    <Resizable enable={{ right: true }} minWidth={200} defaultSize={{ width: 200, height: 'auto' }}>
      <div>
        <div>笔记</div>
        <div>
          <button onClick={createNote}>add</button>
        </div>
      </div>
      <div>
        <Tree />
      </div>
    </Resizable>
  );
});
