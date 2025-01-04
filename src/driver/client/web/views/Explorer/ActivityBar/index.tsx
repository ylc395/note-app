import { StarIcon, HashIcon, RecycleIcon, SettingsIcon } from 'lucide-react';
import { observer } from 'mobx-react-lite';

import TypeIcon from '#web/components/icon/TypeIcon';
import Button from '#web/components/Button';
import Popover from '#web/components/Popover';
import Sidebar from '#domain/client/app/model/Sidebar';
import { EntityTypes } from '#domain/client/shared/model/entity';
import { container } from '#domain/shared/infra/singletons';

import StarView from '../StarView';
import TopicView from '../TopicView';

export default observer(function ActivityBar() {
  const {
    currentExplorer: { entityType },
    switchTo,
  } = container.resolve(Sidebar);
  const types = [EntityTypes.Material, EntityTypes.Note, EntityTypes.Memo] as const;

  return (
    <nav className="flex h-full shrink-0 flex-col justify-between border-0 border-r border-solid border-layout bg-layout text-center px-2">
      <div>
        <div className="flex flex-col py-2">
          {types.map((type) => (
            <Button
              onClick={() => switchTo(type)}
              icon={<TypeIcon type={type} />}
              key={type}
              size="large"
              className="mb-2"
              variant={entityType === type ? 'primary' : 'ghost'}
            />
          ))}
        </div>
        <div className="flex flex-col py-2 border-0 border-t border-solid border-layout">
          <Popover
            placement="right-start"
            offset={20}
            arrow
            reference={() => <Button size="large" stopPropagation={false} icon={<StarIcon />} />}
          >
            <StarView />
          </Popover>
          <Popover
            placement="right"
            arrow
            reference={() => <Button size="large" stopPropagation={false} icon={<HashIcon />} />}
          >
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
