import { useEffect } from 'react';
import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';

import TopicManager from '@domain/app/model/TopicManager';

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
          <div>{topic.entities.map((e) => e.title)}</div>
        </div>
      ))}
    </div>
  );
});
