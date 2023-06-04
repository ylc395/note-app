import { observer } from 'mobx-react-lite';
import { useRef, useEffect, useState } from 'react';

import type HtmlEditor from 'model/material/HtmlEditor';
import useHtml from './useHtml';

export default observer(function HtmlEditor({ editor }: { editor: HtmlEditor }) {
  const shadowWrapperRef = useRef<HTMLDivElement | null>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setShadowRoot(shadowWrapperRef.current!.attachShadow({ mode: 'open' }));
  }, []);

  useHtml(editor, shadowRoot);

  return (
    <div>
      <div className="all-initial">
        <div className="select-text" ref={shadowWrapperRef}></div>
      </div>
    </div>
  );
});
