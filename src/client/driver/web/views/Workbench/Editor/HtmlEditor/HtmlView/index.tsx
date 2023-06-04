import { observer } from 'mobx-react-lite';
import { useRef, useEffect, useState } from 'react';
import { useEventListener } from 'ahooks';

import type HtmlEditor from 'model/material/HtmlEditor';
import { ui } from 'web/infra/ui';
import useHtml from './useHtml';

function handleClick(e: MouseEvent) {
  // can not get event target by `e.target` when bubbling along the shadow dom
  const eventPath = e.composedPath() as HTMLElement[];
  const anchorEl = eventPath.find((el) => el.tagName.toLowerCase() === 'a' && el.getAttribute('href'));

  if (anchorEl) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ui.openNewWindow(anchorEl.getAttribute('href')!);
    e.preventDefault();
  }
}

export default observer(function HtmlEditor({ editor }: { editor: HtmlEditor }) {
  const shadowWrapperRef = useRef<HTMLDivElement | null>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setShadowRoot(shadowWrapperRef.current!.attachShadow({ mode: 'open' }));
  }, []);

  useHtml(editor, shadowRoot);

  useEventListener('click', handleClick, { target: shadowWrapperRef });

  return (
    <div>
      <div className="all-initial">
        <div className="select-text" ref={shadowWrapperRef}></div>
      </div>
    </div>
  );
});
