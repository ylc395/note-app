import { createMemo, createSignal, Match, Show, Switch } from 'solid-js';
import { createQuery } from 'mobx-tanstack-query/preset';
import { inline } from '@floating-ui/dom';
import type { Ctx } from '@milkdown/kit/ctx';
import { PinIcon, PinOffIcon } from 'lucide-solid';

import container from '#utils/singletonContainer';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import { RouteTypes, type AppUrlParams } from '#domain/shared/infra/url';
import type { MemoVO } from '#domain/shared/model/memo';
import { MimeTypes } from '#domain/shared/model/file';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import { useMilkdownEvent } from '#web/view/components/MarkdownEditor/shared/prosemirrorUtils';
import { useTooltip } from '#web/view/components/MarkdownEditor/shared/useTooltip';
import { customCtx } from '#web/view/components/MarkdownEditor/customCtx';

import PDFPreviewer from './PDFPreviewer';
import MarkdownPreviewer from './MarkdownPreviewer';

export default function AppLinkView(props: {
  appUrl: AppUrlParams;
  targetDom: HTMLAnchorElement;
  ctx: Ctx;
  mousePosition: { x: number; y: number };
  onLeave: () => void;
  onEnter: () => void;
  onClose: () => void;
  onFixedChange?: (isFixed: boolean) => void;
}) {
  const remote = container.resolve(remoteToken);
  const [isFixed, setIsFixed] = createSignal(false);
  const entity = createQuery<Required<NoteVO> | Required<MemoVO> | null>(
    ({ signal }) => {
      switch (props.appUrl.type) {
        case RouteTypes.Note:
          return remote.note.queryOneById.query(props.appUrl.id, { signal });
        case RouteTypes.Memo:
          return remote.memo.queryOneById.query(props.appUrl.id, { signal });
        default:
          return null;
      }
    },
    {
      queryKey: ['entity', props.appUrl.id],
    },
  );

  const mimeType = createMemo(() => (entity.data && 'mimeType' in entity.data ? entity.data.mimeType : null));

  const title = createMemo(() => {
    if (props.appUrl.type === RouteTypes.Note && entity.data) {
      return normalizeTitle(entity.data as NoteVO);
    }
  });

  const { setTooltipEl } = useTooltip({
    reference: props.targetDom,
    ctx: props.ctx,
    placement: 'bottom',
    middleware: [props.mousePosition && inline(props.mousePosition)],
  });

  function onLeave() {
    if (!isFixed()) {
      props.onLeave();
    }
  }

  function toggleFix() {
    setIsFixed(!isFixed());
    props.onFixedChange?.(isFixed());
  }

  function jump() {
    props.ctx.get(customCtx).onJump?.({
      ...props.appUrl,
      mimeType: mimeType(),
    });
  }

  useMilkdownEvent({
    event: 'selectionUpdated',
    ctx: props.ctx,
    fn: () => !isFixed() && props.onClose(),
  });

  return (
    <div ref={setTooltipEl} onMouseLeave={onLeave} onMouseEnter={props.onEnter}>
      <div>
        <Show when={title()}>
          <h2 class="cursor-pointer hover:underline" onClick={jump}>
            {title()}
          </h2>
        </Show>
        <button class="absolute right-0 top-0" onClick={toggleFix}>
          <Show when={isFixed()} fallback={<PinIcon />}>
            <PinOffIcon />
          </Show>
        </button>
      </div>
      <Show when={entity.data}>
        {(entity) => (
          <Switch fallback={<MarkdownPreviewer body={entity().body} onJump={props.ctx.get(customCtx).onJump} />}>
            <Match when={mimeType() === MimeTypes.PDF}>
              <PDFPreviewer id={entity().id} />
            </Match>
          </Switch>
        )}
      </Show>
    </div>
  );
}
