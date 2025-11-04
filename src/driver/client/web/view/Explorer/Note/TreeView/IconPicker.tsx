import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';
import { createEffect, createMemo, onCleanup } from 'solid-js';

import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';
import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';

export default function IconPicker(props?: { onFinish?: () => void }) {
  let rootRef: HTMLDivElement | undefined;
  const { iconPicker } = container.resolve(NoteService);
  const allCustomIcons = createMemo(
    () =>
      iconPicker.customIcons.result.data && [
        {
          id: 'custom',
          name: 'Custom',
          emojis: iconPicker.customIcons.result.data.map(({ code }) => ({
            id: code,
            name: '',
            keyword: [],
            skins: [{ src: getAppUrl(RouteTypes.File, code) }],
          })),
        },
      ],
  );

  async function onEmojiSelect(e: { shortcodes: string }) {
    await iconPicker.submit({ code: e.shortcodes, type: 'emoji' });
    props?.onFinish?.();
  }

  createEffect(() => {
    const customIcons = allCustomIcons();

    if (!customIcons || !rootRef) {
      return;
    }

    // https://github.com/missive/emoji-mart?tab=readme-ov-file#options--props
    const picker = new Picker({
      data,
      previewPosition: 'none',
      emojiButtonSize: 24,
      emojiSize: 18,
      onEmojiSelect,
      maxFrequentRows: 1,
      custom: customIcons[0]?.emojis?.length ? customIcons : undefined,
      onAddCustomEmoji: () => {
        iconPicker.customIconPickerState.toggle();
        props?.onFinish?.();
      },
    }) as unknown as HTMLElement;

    rootRef.append(picker);

    onCleanup(() => {
      picker.remove();
    });
  });

  return <div class="-mt-10" ref={rootRef}></div>;
}
