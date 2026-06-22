import type { Ctx } from '@milkdown/kit/ctx';
import { editorViewCtx } from '@milkdown/kit/core';
import type { Mark } from '@milkdown/kit/prose/model';

import Entity from '#domain/client/app/model/base/Entity';
import { parseAppUrl } from '#domain/shared/infra/url';
import shell from '#web/infra/shell';

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

  function handleClick(e: MouseEvent) {
    e.preventDefault();

    if (ctx.get(editorViewCtx).editable) {
      return;
    }

    if (!entity) {
      shell.openNewWindow(mark.attrs.href);
      return;
    }

    if (entity.value.isSuccess) {
      const appUrl = parseAppUrl(mark.attrs.href);

      if (appUrl) {
        ctx.get(editorModelCtx).jump?.({
          ...appUrl,
          mimeType: entity.mimeType,
        });
      }
    }
  }

  dom.addEventListener('click', handleClick, { signal: abortController.signal });

  return () => {
    abortController.abort();
  };
}
