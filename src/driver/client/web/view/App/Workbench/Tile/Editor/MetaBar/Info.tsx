import { createMemo, createSignal } from 'solid-js';
import dayjs from 'dayjs';
import { Popover } from '@ark-ui/solid';

import EditorFactory from '#domain/client/app/model/Workbench/EditorFactory';
import { useContext } from '../composables';
import RevisionModal from './RevisionModal';

const ROW_CLASS = 'flex items-center py-1 gap-2';
const LABEL_CLASS = 'text-fg-secondary shrink-0 w-24';
const VALUE_CLASS = 'text-fg-primary';

export default function Info() {
  const ctx = useContext()!;

  const editor = createMemo(() => {
    EditorFactory.assertIsEditor(ctx.editor);
    return ctx.editor;
  });

  const [showHistory, setShowHistory] = createSignal(false);

  return (
    <>
      <Popover.Content
        asChild={(props) => (
          <dl
            {...props()}
            class={`bg-surface-raised border border-border-primary rounded-lg shadow-lg px-3 py-2 min-w-[260px] text-sm ${
              props().class ?? ''
            }`}
          >
            <div class={ROW_CLASS}>
              <dt class={LABEL_CLASS}>ID</dt>
              <dd class={`${VALUE_CLASS} font-mono text-xs truncate max-w-[160px]`}>{ctx.editor.entityId}</dd>
            </div>
            <div class={ROW_CLASS}>
              <dt class={LABEL_CLASS}>字数</dt>
              <dd class={VALUE_CLASS}>{editor().entity.pureTextWordCount}</dd>
            </div>
            <div class={ROW_CLASS}>
              <dt class={LABEL_CLASS}>版本记录</dt>
              <dd class="text-fg-link cursor-pointer hover:text-fg-link-hover" onclick={() => setShowHistory(true)}>
                查看
              </dd>
            </div>
            <div class={ROW_CLASS}>
              <dt class={LABEL_CLASS}>创建时间</dt>
              <dd class={VALUE_CLASS}>{dayjs(editor().entity.value.data!.createdAt).format('YYYY-MM-DD HH:mm:ss')}</dd>
            </div>
            <div class={ROW_CLASS}>
              <dt class={LABEL_CLASS}>最后修改时间</dt>
              <dd class={VALUE_CLASS}>{dayjs(editor().entity.value.data!.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</dd>
            </div>
          </dl>
        )}
      />
      <RevisionModal open={showHistory()} onClose={() => setShowHistory(false)} />
    </>
  );
}
