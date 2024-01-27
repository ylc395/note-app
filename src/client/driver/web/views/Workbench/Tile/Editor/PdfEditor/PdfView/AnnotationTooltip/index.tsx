// import { Button } from 'antd';
// import { useState, useContext, useEffect } from 'react';
// import { observer } from 'mobx-react-lite';
// import { BgColorsOutlined, CommentOutlined, DeleteOutlined } from '@ant-design/icons';

// import context from '../../Context';
// import Palette from './Palette';
// import CommentTextArea from './CommentTextArea';
// import useTooltip from './useTooltip';

// export default observer(function AnnotationTooltip() {
//   const { pdfViewer } = useContext(context);
//   const editor = pdfViewer?.editor;
//   const annotation = editor?.currentAnnotation;
//   const [visibleMenu, setVisibleMenu] = useState<string | undefined>();

//   useEffect(() => {
//     setVisibleMenu(undefined);
//   }, [editor?.currentAnnotation]);

//   const { setFloating, styles, showing } = useTooltip();

//   return showing ? (
//     <div ref={setFloating} style={styles} className="z-10 rounded">
//       <div className="w-fit bg-gray-600 ">
//         <Button
//           className="text-white"
//           type="text"
//           icon={<BgColorsOutlined />}
//           onClick={() => setVisibleMenu('colors')}
//         />
//         <Button
//           className="text-white"
//           type="text"
//           icon={<CommentOutlined />}
//           onClick={() => setVisibleMenu('comment')}
//         />
//         <Button
//           className="text-white"
//           type="text"
//           icon={<DeleteOutlined />}
//           onClick={() => editor?.removeCurrentAnnotation()}
//         />
//       </div>
//       {visibleMenu === 'colors' && <Palette onSelect={(color) => editor?.updateCurrentAnnotation({ color })} />}
//       {visibleMenu === 'comment' && (
//         <CommentTextArea
//           defaultValue={annotation?.comment}
//           onConfirm={(comment) => editor?.updateCurrentAnnotation({ comment })}
//         />
//       )}
//     </div>
//   ) : null;
// });
