import { createEffect, onCleanup, onMount } from 'solid-js';
import { XIcon } from 'lucide-solid';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

import BaseEditor from '#domain/client/app/model/Workbench/BaseEditor';
import { isFullyVisible } from '#web/utils/dom';
import { IS_DEV } from '#domain/shared/infra/env';
import Menu from '#web/view/components/Menu';
import Icon from '#web/view/components/Icon';

import useContextmenu from './useContextmenu';

export default function Tab(props: { editor: BaseEditor }) {
  let rootRef: HTMLDivElement | undefined;
  const { handleContextmenuClick, getContextmenu } = useContextmenu(props);

  onMount(() => {
    createEffect(() => {
      if (props.editor.entity.value.result.isSuccess && props.editor.isCurrent && rootRef && !isFullyVisible(rootRef)) {
        rootRef.scrollIntoView();
      }
    });
  });

  onMount(() => {
    const cleanup = combine(
      draggable({
        element: rootRef!,
        canDrag: () => props.editor.entity.value.result.isSuccess,
        getInitialData: () => props.editor as unknown as Record<string, unknown>,
      }),
      dropTargetForElements({
        element: rootRef!,
        getData: () => props.editor as unknown as Record<string, unknown>,
      }),
    );

    onCleanup(cleanup);
  });

  return (
    <Menu contextmenu menu={getContextmenu} onSelect={handleContextmenuClick}>
      {(childProps) => (
        <div
          {...childProps}
          ref={rootRef}
          class="shrink-0 h-12 flex justify-between items-center w-36 text-sm px-2 border-r border-border-secondary cursor-pointer group"
          classList={{ 'bg-bg-accent-subtle': props.editor.isCurrent }}
          onClick={() => props.editor.tile.switchToEditor(props.editor)}
        >
          <Icon icon={props.editor.entity.icon} mimeType={props.editor.mimeType} className="shrink-0 w-4 h-4 mr-1" />
          <span class="whitespace-nowrap text-ellipsis overflow-hidden">
            {IS_DEV && `${props.editor.id}-${props.editor.entityId.slice(0.3)} `}
            {props.editor.entity.title}
          </span>
          <button
            class="ml-2 group-hover:visible button button-square-md"
            classList={{
              invisible: !props.editor.isCurrent,
            }}
            onClick={(e) => {
              e.stopPropagation();
              props.editor.destroy();
            }}
          >
            <XIcon />
          </button>
        </div>
      )}
    </Menu>
  );
}
