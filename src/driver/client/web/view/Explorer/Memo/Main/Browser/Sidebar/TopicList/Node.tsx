import { ChevronDownIcon, ChevronRightIcon } from 'lucide-solid';
import { For, Show } from 'solid-js';
import { TreeView } from '@ark-ui/solid';

import type { TopicNode } from '#domain/client/app/model/TopicList';
import { container } from '#domain/shared/infra/singletons';
import MemoService from '#domain/client/app/service/MemoService';

export default function Node(props: { node: TopicNode; indexPath: number[] }) {
  const { topicList } = container.resolve(MemoService);

  return (
    <TreeView.NodeProvider node={props.node} indexPath={props.indexPath}>
      <Show
        when={props.node.children.length > 0}
        fallback={
          <TreeView.Item
            class="grow py-1 pl-5 rounded-md"
            classList={{
              'bg-gray-100': topicList.selectedTopics.includes(props.node.id),
              'cursor-pointer': props.node.entities.length > 0,
            }}
          >
            <TreeView.ItemText class="flex justify-between px-2">
              <span>{props.node.name}</span>
              <Show when={props.node.entities.length > 0}>
                <span class="number-suffix text-xs">{props.node.entities.length}</span>
              </Show>
            </TreeView.ItemText>
          </TreeView.Item>
        }
      >
        <TreeView.Branch class="grow pl-5 rounded-md">
          <TreeView.BranchControl
            class="relative flex items-center py-1"
            classList={{
              'bg-gray-100': topicList.selectedTopics.includes(props.node.id),
              'cursor-pointer': props.node.entities.length > 0,
              'cursor-default': props.node.entities.length === 0,
            }}
          >
            <TreeView.BranchTrigger class="hidden data-[state=closed]:block absolute -left-5">
              <ChevronRightIcon class="w-5" />
            </TreeView.BranchTrigger>
            <TreeView.BranchTrigger class="hidden data-[state=open]:block absolute -left-5">
              <ChevronDownIcon class="w-5" />
            </TreeView.BranchTrigger>
            <TreeView.BranchText class="flex justify-between grow px-2">
              <span>{props.node.name}</span>
              <Show when={props.node.entities.length > 0}>
                <span class="number-suffix text-xs">{props.node.entities.length}</span>
              </Show>
            </TreeView.BranchText>
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
