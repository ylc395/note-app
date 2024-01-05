import {
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
  AiOutlineSetting,
  AiOutlineSearch,
  AiOutlineHistory,
  AiOutlineZoomIn,
  AiOutlineZoomOut,
} from 'react-icons/ai';
import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import Button from '@web/components/Button';
import { Workbench } from '@domain/app/model/workbench';

export default observer(function BottomBar() {
  const { historyManager } = container.resolve(Workbench);

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
        <input placeholder="搜索..." className="h-full border-none bg-transparent" />
      </div>
      <div className="flex space-x-2">
        <div className="flex">
          <Button>
            <AiOutlineZoomIn />
          </Button>
          <span className="flex w-10 items-center rounded border-solid border-gray-200 px-2 text-sm">100%</span>
          <Button>
            <AiOutlineZoomOut />
          </Button>
        </div>
        <Button>
          <AiOutlineSetting />
        </Button>
      </div>
    </div>
  );
});
