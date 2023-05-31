import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { Resizable } from 're-resizable';

import context from '../Context';
import HighlightItem from './HighlightItem';

export default observer(function HighlightList() {
  const { pdfViewer } = useContext(context);

  return (
    <Resizable
      enable={{ left: true }}
      minWidth={220}
      defaultSize={{ width: 300, height: 'auto' }}
      className="overflow-auto"
    >
      {pdfViewer?.editor.highlights.map((highlight) => {
        return <HighlightItem key={highlight.id} highlight={highlight} />;
      })}
    </Resizable>
  );
});
