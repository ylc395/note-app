// import { useContext } from 'react';
// import { useFloating, autoUpdate } from '@floating-ui/react';
// import { useEventListener } from 'ahooks';

// import context from '../../Context';

// export default function useAnnotationTooltip() {
//   const { pdfViewer } = useContext(context);

//   const {
//     floatingStyles: styles,
//     refs: { setFloating, floating },
//   } = useFloating({
//     elements: { reference: pdfViewer?.currentAnnotationElement },
//     whileElementsMounted: autoUpdate,
//   });

//   if (floating.current) {
//     pdfViewer!.annotationTooltipRoot = floating.current;
//   }

//   useEventListener('mouseleave', () => pdfViewer!.editor.setCurrentAnnotationId(null), { target: floating });

//   return { setFloating, showing: Boolean(pdfViewer?.editor.currentAnnotationId), styles };
// }
