import { useMemo } from 'react';
import ClipService from 'service/ClipService';

export default function IFramePreview({
  html,
  viewportWidth,
  width,
}: {
  html: string;
  viewportWidth: number;
  width: number;
}) {
  const processedHtml = useMemo(() => ClipService.processHtmlForPreview(html), [html]);
  const ratio = width / viewportWidth;
  const height = 600;

  return (
    <div style={{ height: height * ratio }} className="border">
      <iframe
        width={viewportWidth}
        height={height}
        className="origin-top-left select-none"
        style={{ transform: `scale(${ratio})` }}
        srcDoc={processedHtml}
      />
    </div>
  );
}
