import TopicList from '#domain/client/app/model/TopicList';
import { EntityTypes } from '#domain/shared/model/entity';
import { For } from 'solid-js';

export default function TopicListView() {
  const topicList = new TopicList(EntityTypes.Memo);

  return (
    <div>
      <h3>话题一览</h3>
      <div>
        <For each={topicList.tree}>
          {(topic) => (
            <div>
              {topic.name}
              <span>{topic.entities.length}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
