import { cx } from 'class-variance-authority';
import { SquareArrowOutUpRightIcon } from 'lucide-solid';
import { createEffect, createMemo, createSignal, For, on, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Combobox, useListCollection } from '@ark-ui/solid';
import { noop, pick } from 'lodash-es';

import container from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import Entity from '#domain/client/app/model/base/Entity';
import { SearchResultVO } from '#domain/shared/model/search';
import { getAppUrl } from '#domain/shared/infra/url';
import { editorModelCtx } from '#web/view/components/MarkdownEditor/editorModelCtx';
import Icon from '#web/view/components/Icon';

import { Mode } from './constant';
import { useContext } from './context';
import makeEntity from './makeEntity';

type Item = Pick<SearchResultVO, 'id' | 'type' | 'title' | 'icon' | 'path'> & { mimeType: string | null };

export default function LinkInput(props: {
  mode: Mode;
  initialValue: string;
  onInput: (url: string) => void;
  onSelect: (e: { url: string; title: string }) => void;
  ref?: HTMLInputElement;
}) {
  const remote = container.resolve(remoteToken);
  const { entity, milkdownCtx } = useContext()!;
  const [targetSource, setTargetSource] = createSignal<Entity>();
  const [value, setValue] = createSignal(props.initialValue);
  const isUnaccessible = createMemo(() => props.mode !== Mode.Preview || !entity?.value.isSuccess);

  const { collection, clear, set } = useListCollection<Item>({
    initialItems: [],
    itemToString: (item) => getAppUrl(item.type, item.id),
    itemToValue: (item) => item.id,
  });

  const editor = milkdownCtx.get(editorModelCtx);

  function handleUrlClick() {
    if (isUnaccessible()) {
      return;
    }

    editor.jumpTo?.(props.initialValue, entity!.mimeType || undefined);
  }

  createEffect(() => {
    props.onInput(value());
  });

  createEffect(
    on(value, (value) => {
      setTargetSource(undefined);
      clear();

      if (!value) {
        return;
      }

      // 如果是 url 的形式：若是 app url 则请求下相应的资源；否则无视
      if (URL.canParse(value)) {
        const entity = makeEntity(value);

        if (entity) {
          setTargetSource(entity);
        }

        return;
      }

      // 不是 URL 则当作普通字符串进行搜索
      const abortController = new AbortController();

      remote.search.search.mutate({ keyword: value }, { signal: abortController.signal }).then(
        (result) =>
          set(
            result.map((item) => ({
              ...item,
              mimeType: item.file?.mimeType || null,
            })),
          ),
        noop,
      );

      onCleanup(() => {
        abortController.abort();
      });
    }),
  );

  createEffect(() => {
    const data = targetSource();

    if (data?.value.isSuccess && data.path.data) {
      set([
        {
          ...pick(data, ['id', 'type', 'title', 'icon']),
          path: data.path.data,
          mimeType: data.mimeType || null,
        },
      ]);
    }
  });

  return (
    <div
      class="flex items-center gap-1 border border-border-primary rounded px-2 py-1 text-sm bg-bg-primary focus-within:border-border-accent transition-colors"
      classList={{ 'cursor-pointer': !isUnaccessible() }}
      onClick={handleUrlClick}
    >
      <Show
        when={entity?.path.isSuccess && props.mode === Mode.Preview}
        fallback={
          <Combobox.Root
            collection={collection()}
            class="w-full"
            placeholder="URL"
            readOnly={props.mode === Mode.Preview}
            defaultInputValue={props.initialValue}
            onInputValueChange={(e) => setValue(e.inputValue)}
            onValueChange={(e) =>
              props.onSelect({
                url: getAppUrl(e.items[0]!.type, e.items[0]!.id),
                title: e.items[0]!.title,
              })
            }
          >
            <Combobox.Control>
              <Combobox.Input
                ref={props.ref}
                class={cx(
                  'bg-transparent text-fg-primary placeholder:text-fg-tertiary outline-none w-full truncate',
                  !isUnaccessible() && 'cursor-pointer hover:underline',
                )}
              />
            </Combobox.Control>
            <Portal>
              <Combobox.Positioner class="z-50!">
                <Show when={collection().items.length > 0}>
                  <Combobox.Content class="bg-surface-raised border border-border-primary rounded shadow-lg p-1 max-h-60 overflow-auto">
                    <For each={collection().items}>
                      {(entity) => (
                        <Combobox.Item
                          item={entity}
                          class="flex items-center gap-2 px-2 py-1 rounded cursor-pointer data-[highlighted]:bg-bg-hover data-[selected]:bg-bg-accent-subtle"
                        >
                          <Icon icon={entity.icon} mimeType={entity.mimeType} className="shrink-0 size-4" />
                          <div class="min-w-0 flex-1">
                            <Combobox.ItemText class="text-fg-primary text-sm truncate block">
                              {entity.title}
                            </Combobox.ItemText>
                            <div class="text-xs text-fg-tertiary truncate">
                              /{entity.path.map((p) => p.title).join('/')}
                            </div>
                          </div>
                        </Combobox.Item>
                      )}
                    </For>
                  </Combobox.Content>
                </Show>
              </Combobox.Positioner>
            </Portal>
          </Combobox.Root>
        }
      >
        <div class="text-fg-primary truncate">
          {[...entity!.path.data!, { title: entity?.title }].map((p) => p.title).join('/')}
        </div>
      </Show>
      <Show when={props.mode === Mode.Preview && !entity?.value.isError && !entity?.path.isError}>
        <SquareArrowOutUpRightIcon class="size-4 text-fg-secondary shrink-0" />
      </Show>
    </div>
  );
}
