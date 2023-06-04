import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { Resizable } from 're-resizable';

import context from '../Context';
import HighlightItem from './HighlightItem';

export default observer(function HighlightList() {
  const { pdfViewer } = useContext(context);
  const highlights = pdfViewer?.editor.highlights;

  return (
    <Resizable
      enable={{ left: true }}
      minWidth={220}
      defaultSize={{ width: 300, height: 'auto' }}
      className="overflow-auto"
    >
      {highlights && highlights.length > 0
        ? pdfViewer?.editor.highlights.map((highlight) => {
            return <HighlightItem key={highlight.id} highlight={highlight} />;
          })
        : '无'}
    </Resizable>
  );
});
