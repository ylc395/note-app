import { useMemo } from 'react';
import ClipService from 'service/ClipService';

export default function IFramePreview({ html }: { html: string }) {
  const { clientWidth: viewportWidth } = document.documentElement;
  const processedHtml = useMemo(() => ClipService.processHtmlForPreview(html), [html]);
  const width = 680;
  const height = 360;
  const ratio = width / viewportWidth;

  return (
    <div className="box-content border" style={{ width, height }}>
      <iframe
        width={viewportWidth}
        height={height / ratio}
        className="origin-top-left select-none"
        style={{ transform: `scale(${ratio})` }}
        srcDoc={processedHtml}
      />
    </div>
  );
}
