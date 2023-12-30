import { AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineSetting, AiOutlineSearch } from 'react-icons/ai';
import Button from '@web/components/Button';

// eslint-disable-next-line mobx/missing-observer
export default (function BottomBar() {
  return (
    <div className="flex h-10 items-center justify-between overflow-hidden border-0 border-b border-solid border-gray-200 bg-gray-50 p-2">
      <div className="flex">
        <Button>
          <AiOutlineArrowLeft />
        </Button>
        <Button>
          <AiOutlineArrowRight />
        </Button>
      </div>
      <div className="flex h-8 items-center rounded-md border border-solid border-gray-300 bg-gray-100 px-2">
        <AiOutlineSearch className="mr-1" />
        <input placeholder="搜索" className="h-full border-none bg-transparent" />
      </div>
      <div className="select-text space-x-3">
        <Button>
          <AiOutlineSetting />
        </Button>
      </div>
    </div>
  );
});
