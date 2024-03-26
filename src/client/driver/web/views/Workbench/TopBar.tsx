import {
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
  AiOutlineSetting,
  AiOutlineSearch,
  AiOutlineHistory,
} from 'react-icons/ai';
import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import Button from '@web/components/Button';
import { Workbench } from '@domain/app/model/workbench';
import SearchService from '@domain/app/service/SearchService';

export default observer(function BottomBar() {
  const { historyManager } = container.resolve(Workbench);
  const { search } = container.resolve(SearchService);

  return (
    <div className="flex h-10 items-center justify-between overflow-hidden border-0 border-b border-solid border-gray-200 bg-gray-50 p-2">
      <div className="flex space-x-2">
        <Button onClick={() => historyManager.go('backward')} disabled={!historyManager.canBackward}>
          <AiOutlineArrowLeft />
        </Button>
        <Button onClick={() => historyManager.go('forward')} disabled={!historyManager.canForward}>
          <AiOutlineArrowRight />
        </Button>
        <Button>
          <AiOutlineHistory />
        </Button>
      </div>
      <div className="mx-4 flex h-8 max-w-[280px] grow items-center rounded-md border border-solid border-gray-300 bg-gray-100 px-2">
        <AiOutlineSearch className="mr-1" />
        <input
          placeholder="搜索..."
          onChange={(e) => search({ keyword: e.target.value })}
          className="h-full border-none bg-transparent"
        />
      </div>
      <div className="flex space-x-2">
        <Button>
          <AiOutlineSetting />
        </Button>
      </div>
    </div>
  );
});
