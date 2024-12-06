import { useEffect } from 'react';
import { container } from '#domain/shared/infra/singletons';
import { observer } from 'mobx-react-lite';

import TopicManager from '#domain/client/app/model/TopicManager';

export default observer(function TopicView() {
  const { topics, load, reset } = container.resolve(TopicManager);

  useEffect(() => {
    load();
    return reset;
  }, [load, reset]);

  return (
    <div>
      {topics?.map((topic) => (
        <div key={topic.name}>
          <div> {topic.name} </div>
          <div>{topic.entities.map((e) => e.entity.title)}</div>
        </div>
      ))}
    </div>
  );
});
