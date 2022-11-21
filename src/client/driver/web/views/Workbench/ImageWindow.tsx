import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useRef } from 'react';
import { MarkerArea } from 'markerjs2';

import type ImageWindow from 'model/window/MaterialWindow';

export default observer(function ImageWindow({ imageWindow }: { imageWindow: ImageWindow }) {
  const url = useMemo(
    () => (imageWindow.blob ? window.URL.createObjectURL(new Blob([imageWindow.blob])) : ''),
    [imageWindow.blob],
  );

  const imgRef = useRef<HTMLImageElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    imgRef.current.addEventListener('load', () => {
      markerArea.zoomLevel = 1;
      markerArea.show();
    });

    return () => markerArea.close();
  }, []);

  return (
    <div ref={divRef} className="overflow-y-hidden h-screen relative justify-center items-center flex flex-wrap">
      <img ref={imgRef} src={url}></img>
    </div>
  );
});
