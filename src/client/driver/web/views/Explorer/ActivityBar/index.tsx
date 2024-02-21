import { AiOutlineStar, AiOutlineNumber, AiOutlineDelete, AiOutlineSetting } from 'react-icons/ai';

import TypeIcon from '@web/components/icon/TypeIcon';
import Button from './Button';
import { EntityTypes } from '@domain/app/model/entity';

// eslint-disable-next-line mobx/missing-observer
export default function ActivityBar() {
  return (
    <nav className="flex h-full w-14 shrink-0 flex-col justify-between border-0 border-r border-solid border-gray-200 bg-gray-50 text-center">
      <div>
        <div>
          <Button explorerType={EntityTypes.Material}>
            <TypeIcon type={EntityTypes.Material} />
          </Button>
          <Button explorerType={EntityTypes.Note}>
            <TypeIcon type={EntityTypes.Note} />
          </Button>
          <Button explorerType={EntityTypes.Memo}>
            <TypeIcon type={EntityTypes.Memo} />
          </Button>
        </div>
        <div className="border-0 border-t border-solid border-gray-200">
          <Button>
            <AiOutlineStar />
          </Button>
          <Button>
            <AiOutlineNumber />
          </Button>
        </div>
      </div>
      <div className="mb-1">
        <Button>
          <AiOutlineDelete />
        </Button>
        <Button>
          <AiOutlineSetting />
        </Button>
      </div>
    </nav>
  );
}
