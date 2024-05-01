import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import context from '../../Context';
import PdfViewer from '../../PdfViewer';
import PageOverlay from './PageOverlay';
import Rect from './Rect';

export default observer(function AnnotationLayer({ page }: { page: number }) {
  const { editor } = useContext(context);

  if (!(editor.viewer instanceof PdfViewer)) {
    return null;
  }

  const rects = editor.viewer.annotationManager.getRectsOfPage(page);

  return (
    <PageOverlay page={page}>
      {rects.map((rect, i) => (
        <Rect rect={rect} key={i} />
      ))}
    </PageOverlay>
  );
});
