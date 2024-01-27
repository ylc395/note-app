// import { useContext } from 'react';

// import Palette from '../AnnotationTooltip/Palette';
// import Context from '../../Context';
// import useTooltip from './useTooltip';

// export default function SelectionTooltip() {
//   const { pdfViewer } = useContext(Context);
//   const { setFloating, styles, open } = useTooltip();

//   return open ? (
//     <div className="z-10" ref={setFloating} style={styles}>
//       <Palette onSelect={(color) => pdfViewer?.createRangeAnnotation(color)} />
//     </div>
//   ) : null;
// }
