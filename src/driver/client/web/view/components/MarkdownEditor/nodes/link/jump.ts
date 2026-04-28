import { createQuery } from 'mobx-tanstack-query/preset';
import type { Ctx } from '@milkdown/kit/ctx';
import { editorViewCtx } from '@milkdown/kit/core';

import { parseAppUrl, RouteTypes } from '#domain/shared/infra/url';
import shell from '#web/infra/shell';
import container from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';

import { customCtx } from '../../customCtx';

export function setupLinkJump(dom: HTMLAnchorElement, ctx: Ctx) {
  const remote = container.resolve(remoteToken);
  const abortController = new AbortController();
  const appUrl = parseAppUrl(dom.href);

  const entity = createQuery(
    async () => {
      if (!appUrl) {
        return null;
      }

      if (appUrl.type === RouteTypes.Note) {
        const note = await remote.note.queryOneById.query(appUrl.id);

        return {
          type: RouteTypes.Note,
          icon: note.icon,
          mimeType: note.mimeType,
        };
      }

      return { type: appUrl.type };
    },
    { queryKey: ['link', dom.href], abortSignal: abortController.signal },
  );

  function handleClick(e: MouseEvent) {
    e.preventDefault();

    if (ctx.get(editorViewCtx).editable) {
      return;
    }

    if (!appUrl) {
      shell.openNewWindow(dom.href);
      return;
    }

    if (entity.data) {
      ctx.get(customCtx).onJump?.({
        ...appUrl,
        mimeType: entity.data.mimeType,
      });
    }
  }

  dom.addEventListener('click', handleClick, { signal: abortController.signal });

  return {
    entity,
    dispose: () => {
      abortController.abort();
    },
  };
}
