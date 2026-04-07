import { createComponent, createEffect, createSignal, onCleanup } from 'solid-js';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { dropTargetForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter';
import { render } from 'solid-js/web';
import { compact } from 'lodash-es';

import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';
import TreeViewModel, { TreeNodeStates } from '#domain/client/app/model/note/TreeExplorer';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import { transferItemToFileDTO } from '#web/utils/file';

import DragPreview from './DragPreview';

export default function useDnd(props: { treeView: TreeViewModel; node: TreeNode }) {
  const { updateNote, createNotesWithFile } = container.resolve(NoteService);
  const [dndElementRef, setDndElementRef] = createSignal<HTMLElement>();
  const [isDropHovering, setIsDropHovering] = createSignal(false);

  createEffect(() => {
    const element = dndElementRef();

    if (!element) {
      return;
    }

    const cleanup = combine(
      draggable({
        element,
        canDrag: () => !props.node.isRoot,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            render: ({ container }) => {
              return render(
                () => createComponent(DragPreview, { treeView: props.treeView, node: props.node }),
                container,
              );
            },
          });
        },
        onDragStart: () => {
          if (!props.treeView.treeNodeSets.selected.has(props.node.id)) {
            props.treeView.select(props.node.id);
          }
        },
        getInitialData: () => {
          const selectedIds = Array.from(props.treeView.treeNodeSets.selected);

          return (selectedIds.includes(props.node.id)
            ? props.treeView.tree?.get(selectedIds)
            : props.node) as unknown as Record<string, unknown>;
        },
      }),
      dropTargetForElements({
        element,
        onDragEnter: () => {
          setIsDropHovering(true);
        },
        onDragLeave: () => {
          setIsDropHovering(false);
        },
        onDrop: ({ source, self, location }) => {
          setIsDropHovering(false);

          if (
            props.node.is(TreeNodeStates.Unselectable) ||
            location.current.dropTargets[0]?.element !== self.element // 子节点处理过了，这里就不处理了
          ) {
            return;
          }

          const note = NoteService.getNote(source.data);

          if (note) {
            updateNote(note, { parentId: props.node.id }).then(() => props.node.toggleExpand(true));
          }
        },
      }),
      dropTargetForExternal({
        element,
        onDragEnter: () => {
          setIsDropHovering(true);
        },
        onDragLeave: () => {
          setIsDropHovering(false);
        },
        onDrop: async ({ source }) => {
          setIsDropHovering(false);
          const files = compact(await Promise.all(source.items.map(transferItemToFileDTO)));

          createNotesWithFile({
            files,
            onDuplicated: (upload) => upload(),
            onCreated: () => props.node.toggleExpand(true),
          });
        },
      }),
    );

    onCleanup(cleanup);
  });

  return {
    setDndElementRef,
    isDropHovering,
  };
}
