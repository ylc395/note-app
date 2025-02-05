import { ChevronDownIcon, ChevronRightIcon } from 'lucide-solid';
import { For, Show } from 'solid-js';
import { TreeView } from '@ark-ui/solid';

import type { TopicNode } from '#domain/client/app/model/TopicList';
import { container } from '#domain/shared/infra/singletons';
import MemoService from '#domain/client/app/service/MemoService';

export default function Node(props: { node: TopicNode; indexPath: number[] }) {
  const paddingLeft = (props.indexPath.length - 1) * 20;
  const { topicList } = container.resolve(MemoService);

  return (
    <TreeView.NodeProvider node={props.node} indexPath={props.indexPath}>
      <Show
        when={props.node.children.length > 0}
        fallback={
          <TreeView.Item
            style={{ 'padding-left': `${paddingLeft}px` }}
            classList={{ 'bg-gray-100': topicList.selectedTopics.includes(props.node.id) }}
          >
            <TreeView.ItemText>{props.node.name}</TreeView.ItemText>
          </TreeView.Item>
        }
      >
        <TreeView.Branch style={{ 'padding-left': `${paddingLeft}px` }}>
          <TreeView.BranchControl
            class="flex cursor-default items-center -ml-5"
            classList={{ 'bg-gray-100': topicList.selectedTopics.includes(props.node.id) }}
          >
            <TreeView.BranchTrigger class="hidden data-[state=closed]:block">
              <ChevronRightIcon class="w-5" />
            </TreeView.BranchTrigger>
            <TreeView.BranchTrigger class="hidden data-[state=open]:block">
              <ChevronDownIcon class="w-5" />
            </TreeView.BranchTrigger>
            <TreeView.BranchText>{props.node.name}</TreeView.BranchText>
          </TreeView.BranchControl>
          <TreeView.BranchContent class="flex data-[state=closed]:hidden">
            <For each={props.node.children}>
              {(child, index) => <Node node={child} indexPath={[...props.indexPath, index()]} />}
            </For>
          </TreeView.BranchContent>
        </TreeView.Branch>
      </Show>
    </TreeView.NodeProvider>
  );
}
