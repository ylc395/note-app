import MemoService from '#domain/client/app/service/MemoService';
import { container } from '#domain/shared/infra/singletons';
import { For } from 'solid-js';

export default function TopicListView() {
  const { topicList } = container.resolve(MemoService);

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
