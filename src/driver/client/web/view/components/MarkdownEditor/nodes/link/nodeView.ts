import { $view } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkView } from '@milkdown/kit/prose/view';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { parseAppUrl, toEntityType } from '#domain/shared/infra/url';
import entitySourceFactory from '#domain/client/app/model/entitySourceFactory';

import { setupLinkJump } from './jump';
import { setupLinkState } from './state';

export const linkNodeView = $view(linkSchema.mark, (ctx) => {
  return (mark): MarkView => {
    const dom = document.createElement('a');
    dom.href = sanitizeUrl(mark.attrs.href);

    const abortController = new AbortController();
    const appUrl = parseAppUrl(mark.attrs.href);
    const entityType = appUrl && toEntityType(appUrl.type);
    const entitySource = entityType && entitySourceFactory(entityType, appUrl.id, abortController.signal);

    const disposeJump = setupLinkJump({ dom, ctx, mark, entitySource });
    const disposeLinkState = setupLinkState(dom, entitySource);

    function destroy() {
      abortController.abort();
      disposeJump();
      disposeLinkState();
    }

    return {
      dom,
      destroy,
    };
  };
});
