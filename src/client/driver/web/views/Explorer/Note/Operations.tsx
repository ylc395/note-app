import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { AiOutlinePlus, AiOutlineShrink, AiOutlineSetting } from 'react-icons/ai';

import NoteService from '@domain/app/service/NoteService';
import Button from '@web/components/Button';

export default observer(function Operations() {
  const {
    createNote,
    tree: { expandedNodes, collapseAll },
  } = container.resolve(NoteService);

  return (
    <div className="flex grow justify-between">
      <Button onClick={() => createNote()}>
        <AiOutlinePlus />
      </Button>
      <div className="flex">
        <Button disabled={expandedNodes.length === 0} onClick={collapseAll}>
          <AiOutlineShrink />
        </Button>
        <Button>
          <AiOutlineSetting />
        </Button>
      </div>
    </div>
  );
});
