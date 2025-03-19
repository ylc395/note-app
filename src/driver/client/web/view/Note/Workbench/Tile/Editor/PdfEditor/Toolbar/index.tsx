import type PdfViewer from '../PDFViewer';
import PageSwitcher from './PageSwitcher';
import Outline from './Outline';
import Scale from './Scale';

export default function Toolbar(props: { viewer: PdfViewer }) {
  return (
    <div class="flex justify-center py-2 border-b space-x-2">
      <Outline viewer={props.viewer} />
      <PageSwitcher viewer={props.viewer} />
      <Scale viewer={props.viewer} />
    </div>
  );
}
