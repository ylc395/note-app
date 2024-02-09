import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import Resizable from '@web/components/Resizable';

import context from '../Context';
import Item from './Item';

export default observer(function AnnotationList() {
  const { editor } = useContext(context);
  const annotations = editor.allAnnotations;

  return (
    <Resizable resizable="left" minWidth={220} initialWidth={300} className="h-full overflow-auto">
      {annotations.length > 0
        ? annotations.map((annotation) => {
            return <Item key={annotation.id} annotation={annotation} />;
          })
        : '无'}
    </Resizable>
  );
});
