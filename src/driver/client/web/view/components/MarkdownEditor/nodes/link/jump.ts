import type { Ctx } from '@milkdown/kit/ctx';
import { editorViewCtx } from '@milkdown/kit/core';
import type { Mark } from '@milkdown/kit/prose/model';

import EntitySource from '#domain/client/app/model/base/EntitySource';
import { parseAppUrl } from '#domain/shared/infra/url';
import shell from '#web/infra/shell';

import { customCtx } from '../../customCtx';

export function setupLinkJump({
  dom,
  ctx,
  mark,
  entitySource,
}: {
  dom: HTMLAnchorElement;
  ctx: Ctx;
  mark: Mark;
  entitySource?: EntitySource | null;
}) {
  const abortController = new AbortController();

  function handleClick(e: MouseEvent) {
    e.preventDefault();

    if (ctx.get(editorViewCtx).editable) {
      return;
    }

    if (!entitySource) {
      shell.openNewWindow(mark.attrs.href);
      return;
    }

    if (entitySource.value.isSuccess) {
      const appUrl = parseAppUrl(mark.attrs.href);

      if (appUrl) {
        ctx.get(customCtx).onJump?.({
          ...appUrl,
          mimeType: entitySource.mimeType,
        });
      }
    }
  }

  dom.addEventListener('click', handleClick, { signal: abortController.signal });

  return () => {
    abortController.abort();
  };
}
