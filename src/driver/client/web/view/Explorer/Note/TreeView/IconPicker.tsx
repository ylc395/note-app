import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';
import { onMount } from 'solid-js';

import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';

export default function IconPicker(props?: { onFinish?: () => void }) {
  let rootRef: HTMLDivElement | undefined;
  const { updateNote, exploreTreeView, toggleIconPicker } = container.resolve(NoteService);

  async function onEmojiSelect(e: { shortcodes: string }) {
    await updateNote(Array.from(exploreTreeView.treeNodeSets.selected), {
      icon: { code: e.shortcodes, type: 'emoji' },
    });
    props?.onFinish?.();
  }

  onMount(() => {
    // https://github.com/missive/emoji-mart?tab=readme-ov-file#options--props
    const picker = new Picker({
      data,
      previewPosition: 'none',
      emojiButtonSize: 24,
      emojiSize: 18,
      onEmojiSelect,
      maxFrequentRows: 1,
      onAddCustomEmoji: () => {
        toggleIconPicker();
        props?.onFinish?.();
      },
    });
    rootRef!.append(picker as unknown as HTMLElement);
  });

  return <div class="-mt-10" ref={rootRef}></div>;
}
