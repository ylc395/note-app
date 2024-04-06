import { StarIcon, HashIcon, RecycleIcon, SettingsIcon } from 'lucide-react';
import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';

import TypeIcon from '@web/components/icon/TypeIcon';
import Button from '@web/components/Button';
import { EntityTypes } from '@domain/app/model/entity';
import Popover from '@web/components/Popover';
import ExplorerManager from '@domain/app/model/ExplorerManager';

import StarView from '../StarView';
import TopicView from '../TopicView';

export default observer(function ActivityBar() {
  const { currentExplorerType, switchTo } = container.resolve(ExplorerManager);
  const types = [EntityTypes.Material, EntityTypes.Note, EntityTypes.Memo] as const;

  return (
    <nav className="flex h-full shrink-0 flex-col justify-between border-0 border-r border-solid border-common bg-common-secondary text-center px-2">
      <div>
        <div className="flex flex-col py-2">
          {types.map((type) => (
            <Button
              onClick={() => switchTo(type)}
              icon={<TypeIcon type={type} />}
              key={type}
              size="large"
              className="mb-2"
              variant={currentExplorerType === type ? 'primary' : 'ghost'}
            />
          ))}
        </div>
        <div className="flex flex-col py-2 border-0 border-t border-solid border-common">
          <Popover placement="right" reference={() => <Button size="large" icon={<StarIcon />} />}>
            <StarView />
          </Popover>
          <Popover placement="right" reference={() => <Button size="large" icon={<HashIcon />} />}>
            <TopicView />
          </Popover>
        </div>
      </div>
      <div className="mb-2 flex flex-col">
        <Button size="large" icon={<RecycleIcon />} />
        <Button size="large" icon={<SettingsIcon />} />
      </div>
    </nav>
  );
});
