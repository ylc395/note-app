import type { Ctx } from '@milkdown/kit/ctx';
import { editorViewCtx } from '@milkdown/kit/core';
import type { Mark } from '@milkdown/kit/prose/model';

import Entity from '#domain/client/app/model/base/Entity';

import { editorModelCtx } from '../../editorModelCtx';

export function setupLinkJump({
  dom,
  ctx,
  mark,
  entity,
}: {
  dom: HTMLAnchorElement;
  ctx: Ctx;
  mark: Mark;
  entity?: Entity | null;
}) {
  const abortController = new AbortController();

  dom.addEventListener(
    'click',
    (e) => {
      e.preventDefault();

      if (ctx.get(editorViewCtx).editable || (entity && !entity.value.isSuccess)) {
        return;
      }

      if (URL.canParse(mark.attrs.href)) {
        ctx.get(editorModelCtx).jumpTo?.(mark.attrs.href, entity?.mimeType || undefined);
      }
    },
    { signal: abortController.signal },
  );

  return () => {
    abortController.abort();
  };
}
