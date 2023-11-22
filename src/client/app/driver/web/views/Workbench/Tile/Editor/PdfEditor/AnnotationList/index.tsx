import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { Resizable } from 're-resizable';

import context from '../Context';
import Annotation from './Annotation';

export default observer(function AnnotationList() {
  const { pdfViewer } = useContext(context);
  const annotations = pdfViewer?.editor.pdfAnnotations;

  return (
    <Resizable
      enable={{ left: true }}
      minWidth={220}
      defaultSize={{ width: 300, height: 'auto' }}
      className="overflow-auto"
    >
      {annotations && annotations.length > 0
        ? annotations.map((annotation) => {
            return <Annotation key={annotation.id} annotation={annotation} />;
          })
        : '无'}
    </Resizable>
  );
});
