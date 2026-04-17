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

import DragPreview from './DragPreview';

export async function transferItemToFileDTO(item: DataTransferItem) {
  const file = item.getAsFile();

  if (!file) {
    return null;
  }

  return {
    name: file.name,
    data: await file.arrayBuffer(),
    mimeType: file.type,
  };
}

export default function useDnd(props: { treeView: TreeViewModel; node?: TreeNode; draggable?: boolean }) {
  const { updateNote, explorer } = container.resolve(NoteService);
  const [dndElementRef, setDndElementRef] = createSignal<HTMLElement>();
  const [isDropHovering, setIsDropHovering] = createSignal(false);
  const isDraggable = props.draggable ?? true;

  createEffect(() => {
    const element = dndElementRef();
    const node = props.node ?? props.treeView.tree?.root;

    if (!element || !node) {
      return;
    }

    const parentId = node.isRoot ? null : node.id;

    const cleanup = combine(
      ...compact([
        isDraggable &&
          draggable({
            element,
            canDrag: () => !node.isRoot,
            onGenerateDragPreview: ({ nativeSetDragImage }) => {
              setCustomNativeDragPreview({
                nativeSetDragImage,
                render: ({ container }) => {
                  return render(
                    () => createComponent(DragPreview, { treeView: props.treeView, node: node }),
                    container,
                  );
                },
              });
            },
            onDragStart: () => {
              if (!props.treeView.treeNodeSets.selected.has(node.id)) {
                props.treeView.select(node.id);
              }
            },
            getInitialData: () => {
              const selectedIds = Array.from(props.treeView.treeNodeSets.selected);

              return (selectedIds.includes(node.id)
                ? props.treeView.tree?.get(selectedIds)
                : node) as unknown as Record<string, unknown>;
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
              node.is(TreeNodeStates.Unselectable) ||
              location.current.dropTargets[0]?.element !== self.element // 子节点处理过了，这里就不处理了
            ) {
              return;
            }

            const note = NoteService.getNote(source.data);

            if (note) {
              updateNote(note, { parentId }).then(() => node.toggleExpand(true));
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
            explorer.uploadFiles(files, { parentId: props.node?.id });
          },
        }),
      ]),
    );

    onCleanup(cleanup);
  });

  return {
    setDndElementRef,
    isDropHovering,
  };
}
