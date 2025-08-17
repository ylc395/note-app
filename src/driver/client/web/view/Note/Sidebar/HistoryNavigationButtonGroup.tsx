import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-solid';
import { For, type JSXElement } from 'solid-js';
import { Menu } from '@ark-ui/solid';
import type { Placement } from '@floating-ui/dom';

import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';
import { Direction } from '#domain/client/app/model/base/HistoryStack';
import { Portal } from 'solid-js/web';
import shell from '#web/infra/shell';

function HistoryNavigationButton(props: {
  disabled: boolean;
  children: JSXElement;
  onClick: () => void;
  onClickItem: (index: number) => void;
  records: { title: string | null; key: string }[];
  placement: Placement;
}) {
  return (
    <Menu.Root unmountOnExit lazyMount positioning={{ placement: props.placement, gutter: 4 }}>
      <Menu.Trigger
        class="button button-square-md"
        disabled={props.disabled}
        asChild={(childProps) => (
          <button
            {...childProps()}
            class="button button-square-md"
            onClick={props.onClick}
            onContextMenu={childProps().onClick}
          >
            {props.children}
          </button>
        )}
      />
      <Portal mount={shell.appRoot}>
        <Menu.Positioner>
          <Menu.Content class="menu">
            <For each={props.records.slice(0, 10)}>
              {({ title, key }, index) => (
                <Menu.Item
                  value={key}
                  class="menu-item block whitespace-nowrap text-ellipsis overflow-hidden w-44"
                  onClick={() => props.onClickItem(index())}
                >
                  {title}
                </Menu.Item>
              )}
            </For>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

export default function HistoryNavigationButtonGroup() {
  const { historyStack } = container.resolve(Workbench);

  return (
    <div class="space-x-1 flex items-center">
      <HistoryNavigationButton
        disabled={!historyStack.canBackward}
        onClick={() => historyStack.pop(Direction.BACKWARD)}
        onClickItem={(index) => historyStack.pop(Direction.BACKWARD, index + 1)}
        records={historyStack.backwards}
        placement="bottom-end"
      >
        <ArrowLeftIcon />
      </HistoryNavigationButton>
      <HistoryNavigationButton
        disabled={!historyStack.canForward}
        onClick={() => historyStack.pop(Direction.FORWARD)}
        onClickItem={(index) => historyStack.pop(Direction.FORWARD, index + 1)}
        records={historyStack.forwards}
        placement="bottom-start"
      >
        <ArrowRightIcon />
      </HistoryNavigationButton>
    </div>
  );
}
