import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { MarkerArea } from 'markerjs2';

export default observer(function ImageWindow({ blob }: { blob?: ArrayBuffer }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const markerAreaRef = useRef<MarkerArea>();
  const [blobSrc, setBlobSrc] = useState<string>();

  const handleLoad = () => {
    if (!imgRef.current || !divRef.current) {
      throw new Error('no img ');
    }

    const markerArea = new MarkerArea(imgRef.current);
    markerArea.availableMarkerTypes = markerArea.ALL_MARKER_TYPES;
    markerArea.uiStyleSettings.redoButtonVisible = true;
    markerArea.uiStyleSettings.notesButtonVisible = true;
    markerArea.uiStyleSettings.zoomButtonVisible = true;
    markerArea.uiStyleSettings.zoomOutButtonVisible = true;
    markerArea.uiStyleSettings.resultButtonBlockVisible = false;
    markerArea.targetRoot = divRef.current;
    markerArea.settings.displayMode = 'popup';
    markerArea.settings.popupMargin = 0;
    markerArea.zoomSteps = [1, 1.5, 2, 4, 6, 8];
    markerArea.zoomLevel = 1;
    markerArea.show();

    markerAreaRef.current = markerArea;
  };

  useEffect(() => {
    if (!blob) {
      return;
    }

    const blobSrc = window.URL.createObjectURL(new Blob([blob]));
    setBlobSrc(blobSrc);

    return () => {
      markerAreaRef.current?.close();
      window.URL.revokeObjectURL(blobSrc);
    };
  }, [blob]);

  return (
    <div ref={divRef} className="overflow-y-hidden h-screen relative justify-center items-center flex flex-wrap">
      <img ref={imgRef} src={blobSrc} onLoad={handleLoad}></img>
    </div>
  );
});
