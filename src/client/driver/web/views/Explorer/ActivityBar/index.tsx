import { AiOutlineStar, AiOutlineNumber, AiOutlineDelete, AiOutlineSetting } from 'react-icons/ai';
import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { size } from 'lodash-es';

import TypeIcon from '@web/components/icon/TypeIcon';
import Button from './Button';
import { EntityTypes } from '@domain/app/model/entity';
import ExplorerManager, { ExtraPanelType } from '@domain/app/model/ExplorerManager';
import Popover from '@web/components/Popover';
import StarView from '../StarView';

export default observer(function ActivityBar() {
  const { extraPanels } = container.resolve(ExplorerManager);

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
        {extraPanels.length !== size(ExtraPanelType) && (
          <div className="border-0 border-t border-solid border-gray-200">
            {!extraPanels.includes(ExtraPanelType.Star) && (
              <Popover
                placement="right"
                reference={() => (
                  <Button>
                    <AiOutlineStar />
                  </Button>
                )}
              >
                <StarView />
              </Popover>
            )}
            {!extraPanels.includes(ExtraPanelType.Topic) && (
              <Button>
                <AiOutlineNumber />
              </Button>
            )}
          </div>
        )}
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
});
