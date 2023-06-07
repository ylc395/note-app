import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { Resizable } from 're-resizable';

import context from '../Context';
import Highlight from './Highlight';

export default observer(function AnnotationList() {
  const { htmlViewer } = useContext(context);
  const highlights = htmlViewer?.editor.highlightElements;

  return (
    <Resizable
      enable={{ left: true }}
      minWidth={220}
      defaultSize={{ width: 300, height: 'auto' }}
      className="overflow-auto"
    >
      {highlights && highlights.length > 0
        ? highlights.map((highlight) => {
            return <Highlight key={highlight.id} highlight={highlight} />;
          })
        : '无'}
    </Resizable>
  );
});
