import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';
import { FilePlusIcon, Trash2Icon } from 'lucide-solid';
import { createEffect, createMemo, onCleanup, Show } from 'solid-js';

import { getAppUrl, parseAppUrl, RouteTypes } from '#domain/shared/infra/url';
import type { Icon } from '#domain/shared/model/entity';
import type IconManager from '#domain/client/app/model/note/IconManager';
import Button from '#web/view/components/Button';
import CustomIconPickerModal from './CustomIconPickerModal';

export default function IconPicker(props: {
  currentIcon?: Icon | null;
  className?: string;
  onFinish?: () => void;
  iconManager: IconManager;
}) {
  let rootRef: HTMLDivElement | undefined;

  const customIcons = createMemo(() => {
    const icons = props.iconManager.customIcons.data;

    if (!icons?.length) {
      return undefined;
    }

    return [
      {
        id: 'custom',
        name: 'Custom',
        emojis: icons.map(({ code }) => ({
          id: code,
          name: '',
          keyword: [],
          skins: [{ src: getAppUrl(RouteTypes.File, code) }],
        })),
      },
    ];
  });

  async function handleRemoveIcon() {
    await props.iconManager.submit(null);
    props.onFinish?.();
  }

  function handleAddCustomIcon() {
    props.iconManager.initCustomIconPicker();
  }

  async function onEmojiSelect(e: { shortcodes: string; src?: string }) {
    const icon: Icon = e.src ? { code: parseAppUrl(e.src)!.id, type: 'file' } : { code: e.shortcodes, type: 'emoji' };
    await props.iconManager.submit(icon);
    props.onFinish?.();
  }

  createEffect(() => {
    if (!rootRef) {
      return;
    }

    const picker = new Picker({
      data,
      previewPosition: 'none',
      emojiButtonSize: 24,
      emojiSize: 18,
      onEmojiSelect,
      maxFrequentRows: 1,
      custom: customIcons,
      onAddCustomEmoji: handleAddCustomIcon,
    }) as unknown as HTMLElement;

    rootRef.append(picker);

    onCleanup(() => {
      picker.remove();
    });
  });

  return (
    <div class={props.className}>
      <div class="w-fit overflow-hidden rounded-2xl border border-border-primary bg-surface-raised shadow-lg">
        <div class="bg-surface-overlay">
          <div ref={rootRef}></div>
        </div>
        <div class="flex items-center justify-between gap-3 border-b border-border-secondary px-3 py-3">
          <div class="flex items-center">
            <Button disabled={!props.currentIcon} size="small" onClick={handleRemoveIcon}>
              <Trash2Icon />
              删除当前
            </Button>
            <Button size="small" onClick={handleAddCustomIcon}>
              <FilePlusIcon />
              上传图标
            </Button>
          </div>
        </div>
      </div>
      <Show when={props.iconManager.customIconPicker}>
        {(picker) => <CustomIconPickerModal iconPicker={picker()} onFinish={props.onFinish} />}
      </Show>
    </div>
  );
}
