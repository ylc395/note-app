import { $view } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkView } from '@milkdown/kit/prose/view';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { createQuery } from 'mobx-tanstack-query/preset';
import { editorViewCtx } from '@milkdown/kit/core';
import { when } from 'mobx';

import { parseAppUrl, RouteTypes } from '#domain/shared/infra/url';
import shell from '#web/infra/shell';
import container from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';

import { addIcon } from './icon';
import { customCtx } from '../../customCtx';

export const linkNodeView = $view(linkSchema.mark, (ctx) => {
  const remote = container.resolve(remoteToken);

  return (mark): MarkView => {
    const dom = document.createElement('a');
    dom.dataset.linkIcon = 'true';
    dom.href = sanitizeUrl(mark.attrs.href);

    const abortController = new AbortController();
    const parsed = parseAppUrl(dom.href);

    const entity = createQuery(
      async () => {
        if (!parsed) {
          return null;
        }

        if (parsed.type === RouteTypes.Note) {
          const note = await remote.note.queryOneById.query(parsed.id);

          return {
            type: RouteTypes.Note,
            icon: note.icon,
            mimeType: note.mimeType,
          };
        }

        return { type: parsed.type };
      },
      { queryKey: ['link', dom.href], abortSignal: abortController.signal },
    );

    if (!ctx.get(editorViewCtx).editable) {
      dom.addEventListener(
        'click',
        (e) => {
          e.preventDefault();

          if (!parsed) {
            shell.openNewWindow(dom.href);
          } else if (entity.data) {
            ctx.get(customCtx).onJump?.({
              ...parsed,
              mimeType: entity.data.mimeType,
            });
          }
        },
        { signal: abortController.signal },
      );

      if (!parsed) {
        dom.title = dom.href;
      }
    }

    let disposeIcon: (() => void) | undefined;

    when(
      () => entity.isSuccess,
      () => {
        disposeIcon = addIcon(dom, entity.data);
      },
      { signal: abortController.signal },
    );

    return {
      dom,
      destroy: () => {
        disposeIcon?.();
        abortController.abort();
        dom.remove();
      },
    };
  };
});
