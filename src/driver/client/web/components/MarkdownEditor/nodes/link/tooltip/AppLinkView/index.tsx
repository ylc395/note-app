import { RouteTypes, type AppUrlParams } from '#domain/shared/infra/url';
import { createMemo, createSignal, Match, Switch } from 'solid-js';
import { createQuery } from 'mobx-tanstack-query/preset';
import { inline } from '@floating-ui/dom';
import type { Ctx } from '@milkdown/kit/ctx';

import container from '#utils/singletonContainer';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import type { MemoVO } from '#domain/shared/model/memo';
import { MimeTypes } from '#domain/shared/model/file';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import { useMilkdownEvent } from '#web/components/MarkdownEditor/shared/prosemirrorUtils';
import { useTooltip } from '#web/components/MarkdownEditor/shared/useTooltip';
import { customCtx } from '#web/components/MarkdownEditor/customCtx';

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
  const entity = createQuery<NoteVO | MemoVO | null>(
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

  const mimeType = createMemo(() => entity.data && 'mimeType' in entity.data && entity.data.mimeType);

  const title = createMemo(() => {
    if (!entity.data) {
      return '';
    }

    if (props.appUrl.type === RouteTypes.Note) {
      return normalizeTitle(entity.data as NoteVO);
    }
  });

  const body = createMemo(() => {
    return entity.data?.body;
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
    props.ctx.get(customCtx).onJump?.(props.appUrl);
  }

  useMilkdownEvent({
    event: 'selectionUpdated',
    ctx: props.ctx,
    fn: () => !isFixed() && props.onClose(),
  });

  return (
    <div ref={setTooltipEl} onMouseLeave={onLeave} onMouseEnter={props.onEnter} onFocusOut={onLeave}>
      <div class="flex justify-around">
        <h2 onClick={jump}>{title()}</h2>
        <button onClick={toggleFix}>固定</button>
      </div>
      <Switch>
        <Match when={mimeType() === MimeTypes.PDF}>
          <PDFPreviewer id={entity.data!.id} title={(entity.data as NoteVO).title} />
        </Match>
        <Match when={typeof body() === 'string'}>
          <MarkdownPreviewer body={body()!} onJump={props.ctx.get(customCtx).onJump} />
        </Match>
      </Switch>
    </div>
  );
}
