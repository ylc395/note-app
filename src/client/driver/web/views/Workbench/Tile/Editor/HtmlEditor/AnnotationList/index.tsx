import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import Resizable from '@web/components/Resizable';

import context from '../Context';
import Annotation from './Annotation';

export default observer(function AnnotationList() {
  const { htmlViewer } = useContext(context);
  const annotations = htmlViewer?.editor.annotations;

  return (
    <Resizable resizable="left" minWidth={220} initialWidth={300} className="overflow-auto">
      {annotations && annotations.length > 0
        ? annotations.map((annotation) => {
            return <Annotation key={annotation.id} annotation={annotation} />;
          })
        : '无'}
    </Resizable>
  );
});
