// import { observer } from 'mobx-react-lite';
// import { useContext } from 'react';
// import { useFloating, autoUpdate } from '@floating-ui/react';

// import { coverElementMiddleware } from '../../../../../../../../../../components/floatingMiddleware';

// import Annotation from './Annotation';
// import AreaAnnotationGenerator from './AreaAnnotationGenerator';
// import context from '../../Context';

// export default observer(function AnnotationLayer({ page }: { page: number }) {
//   const { pdfViewer } = useContext(context);

//   if (!pdfViewer) {
//     throw new Error('no pdfViewer');
//   }

//   const pageEl = pdfViewer.getPageEl(page);
//   const {
//     floatingStyles: styles,
//     refs: { setFloating },
//   } = useFloating({
//     elements: { reference: pageEl },
//     whileElementsMounted: autoUpdate,
//     middleware: coverElementMiddleware,
//   });

//   if (!pageEl) {
//     return null;
//   }

//   const fragments = pdfViewer.editor.editable.fragmentsByPage[page] || [];
//   const areas = pdfViewer.editor.editable.areaAnnotationsByPage[page] || [];

//   return (
//     <div ref={setFloating} style={styles} className="pointer-events-none z-10">
//       {fragments.map((fragment) => (
//         <Annotation
//           key={fragment.fragmentId}
//           rect={fragment.rect}
//           page={page}
//           annotationId={fragment.annotationId}
//           color={fragment.color}
//           isLast={fragment.isLast}
//         />
//       ))}
//       {areas.map((area) => (
//         <Annotation key={area.id} rect={area.rect} page={page} annotationId={area.id} color={area.color} isLast />
//       ))}
//       <AreaAnnotationGenerator page={page} />
//     </div>
//   );
// });
