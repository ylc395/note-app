import { useEffect, useRef, useState } from 'react';
import browser from 'webextension-polyfill';
import { useEventListener } from 'ahooks';

const previewPageUrl = browser.runtime.getURL('content-script/preview.html');

// eslint-disable-next-line mobx/missing-observer
export default function IFramePreview({ html }: { html: string }) {
  const { clientWidth: viewportWidth } = document.documentElement;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const width = 680;
  const height = 360;
  const ratio = width / viewportWidth;

  useEventListener('message', (e) => {
    if (e.source === iframeRef.current?.contentWindow && e.data.message === 'ready') {
      setIframeReady(true);
    }
  });

  useEffect(() => {
    if (iframeRef.current && iframeReady) {
      iframeRef.current.contentWindow?.postMessage({ message: 'render', html }, '*');
    }
  }, [html, iframeReady]);

  // we can not use `srcdoc`, because content in `srcdoc` should obey the CSP rule of parent page, which may break our generated inline-styles / data-url img etc.
  // see https://stackoverflow.com/questions/67849788/which-csp-is-enforced-on-an-iframe-created-with-a-globally-unique-identifier-s
  return (
    <div className="box-content border" style={{ width, height }}>
      <iframe
        ref={iframeRef}
        src={previewPageUrl}
        width={viewportWidth}
        height={height / ratio}
        className="origin-top-left select-none"
        style={{ transform: `scale(${ratio})` }}
      />
    </div>
  );
}
