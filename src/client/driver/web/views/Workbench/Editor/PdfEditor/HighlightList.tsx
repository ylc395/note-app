import { observer } from 'mobx-react-lite';
import type PdfEditor from 'model/material/PdfEditor';

export default observer(function HighlightList({ editor }: { editor: PdfEditor }) {
  return (
    <div>
      {editor.highlights.map(({ content, id, color }) => (
        <div key={id} className="mb-2 text-sm" style={{ color: color }}>
          {content}
        </div>
      ))}
    </div>
  );
});
