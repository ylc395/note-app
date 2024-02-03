import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import assert from 'assert';

import context from '../../Context';
import PdfViewer from '../../PdfViewer';
import PageOverlay from '../PageOverlay';
import Fragment from './Fragment';

export default observer(function AnnotationLayer({ page }: { page: number }) {
  const { editor } = useContext(context);
  assert(editor.viewer instanceof PdfViewer);

  const rects = editor.viewer.annotationManager.getRectsOfPage(page);
  editor.viewer.scale.value; // read it to make it a reactive dependency

  return (
    <PageOverlay page={page}>
      {rects.map((rect, i) => (
        <Fragment fragment={rect} key={i} />
      ))}
    </PageOverlay>
  );
});
