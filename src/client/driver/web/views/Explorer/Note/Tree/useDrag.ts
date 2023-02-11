import { useCallback, useState } from 'react';
import { container } from 'tsyringe';
import uniqueId from 'lodash/uniqueId';

import NoteService from 'service/NoteService';
import type { NoteTreeProps } from 'web/components/NoteTree';
import type { NoteVO } from 'interface/Note';

export const TITLE_CONTENT_CLASS = uniqueId('my-note-app-');

export default function useDrag() {
  const { noteTree, moveNotes } = container.resolve(NoteService);
  const [draggingKeys, setDraggingKeys] = useState<string[]>([]);

  const onDragStart = useCallback<NonNullable<NoteTreeProps['onDragStart']>>(
    ({ event, node }) => {
      const targetId = node.key as string;

      if (!noteTree.selectedNodes.has(targetId)) {
        noteTree.toggleSelect(targetId, true);
      }

      const selectedKeys = Array.from(noteTree.selectedNodes);
      const el = event.target as HTMLElement;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const targetEl = el.querySelector(`.${TITLE_CONTENT_CLASS}`)!;

      setDraggingKeys(selectedKeys);

      noteTree.toggleSelect([], true);
      event.dataTransfer.setDragImage(targetEl, 0, 0);
    },
    [noteTree],
  );

  const onDragEnter = useCallback<NonNullable<NoteTreeProps['onDragEnter']>>(
    ({ node }) => {
      noteTree.toggleSelect(node.key as string, true);
    },
    [noteTree],
  );

  const onDrop = useCallback<NonNullable<NoteTreeProps['onDrop']>>(
    async (e) => {
      console.log('ondrop', e.node.key);
      // await moveNotes(draggingKeys, node.key as string);
      setDraggingKeys([]);
    },
    [draggingKeys, moveNotes],
  );

  const allowDrop = useCallback<NonNullable<NoteTreeProps['allowDrop']>>(
    ({ dropNode, dropPosition }) => {
      console.log('allowDrop', dropNode.key);

      // let currentNode: NoteVO | undefined;

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      // const result =
      //   draggingKeys.length === 1 ? noteTree.getNode(draggingKeys[0]!).parent?.key === dropNode.key : false;

      // if (result) {
      //   return false;
      // }

      return dropPosition === 0;
    },
    [draggingKeys],
  );

  const onDragEnd = useCallback<NonNullable<NoteTreeProps['onDragEnd']>>((e) => {
    setDraggingKeys([]);
  }, []);

  return {
    onDragEnter,
    onDragStart,
    onDrop,
    onDragEnd,
    // allowDrop,
    draggingKeys,
  };
}
