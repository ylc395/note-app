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
    <div style={{ height: height * ratio }}>
      <iframe
        width={viewportWidth}
        height={height}
        style={{
          transform: `scale(${ratio})`,
          transformOrigin: '0 0',
          userSelect: 'none',
        }}
        srcDoc={processedHtml}
      />
    </div>
  );
}
