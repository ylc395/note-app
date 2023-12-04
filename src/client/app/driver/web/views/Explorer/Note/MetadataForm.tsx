// import { observer } from 'mobx-react-lite';
// import { container } from 'tsyringe';
// import { useCallback, useState, type MouseEvent, useContext } from 'react';
// import { Form, Button, Checkbox, Popover } from 'antd';
// import type { CheckboxChangeEvent } from 'antd/es/checkbox';
// import uniq from 'lodash/uniq';
// import NoteMetadata, { MULTIPLE_ICON_FLAG } from '@domain/model/note/MetadataForm';

// import { FORM_ITEM_LAYOUT } from '@components/utils';
// import { EmojiPicker, Emoji } from '@components/Emoji';
// import { useCreation } from 'ahooks';
// import NoteService from '@domain/service/NoteService';
// import Context from './Context';

// export default observer(function MetadataForm() {
//   const { getSelectedMetadata, editNotes, noteTree } = container.resolve(NoteService);
//   const noteMetadata = useCreation(() => new NoteMetadata(getSelectedMetadata()), []);
//   const [isPickingEmoji, setIsPickingEmoji] = useState(false);

//   const handleIsReadonly = useCallback(
//     (e: CheckboxChangeEvent) => noteMetadata.updateValue('isReadonly', e.target.checked),
//     [noteMetadata],
//   );
//   const handleEmojiSelect = useCallback(
//     (id: string) => {
//       noteMetadata.updateValue('icon', `emoji:${id}`);
//       setIsPickingEmoji(false);
//     },
//     [noteMetadata],
//   );

//   const handleEmojiClick = (e: MouseEvent) => {
//     e.stopPropagation();
//     setIsPickingEmoji(!isPickingEmoji);
//   };

//   const { editingModal } = useContext(Context);
//   const handleSubmit = useCallback(async () => {
//     const data = await noteMetadata.validate();

//     if (!data) {
//       return;
//     }

//     await editNotes(data);
//     editingModal.close();
//   }, [editNotes, editingModal, noteMetadata]);

//   const uniqIcons = uniq(Array.from(noteTree.selectedNodes).map(({ entity: { icon } }) => icon));
//   const showClear = noteMetadata.values.icon || uniqIcons.length > 0;

//   return (
//     <div className="mt-4">
//       <Form {...FORM_ITEM_LAYOUT}>
//         <Form.Item label="图标">
//           <div className="flex items-center">
//             {noteMetadata.values.icon === MULTIPLE_ICON_FLAG && uniqIcons.length === 1 && (
//               <Emoji id={uniqIcons[0]!} className="mr-4" />
//             )}
//             {noteMetadata.values.icon !== MULTIPLE_ICON_FLAG && (
//               <Emoji id={noteMetadata.values.icon as string | null} className="mr-4" />
//             )}
//             <Popover
//               trigger="click"
//               open={isPickingEmoji}
//               content={() => (
//                 <EmojiPicker onSelect={handleEmojiSelect} onClickOutside={() => setIsPickingEmoji(false)} />
//               )}
//             >
//               <Button size="small" onClick={handleEmojiClick}>
//                 选择 emoji
//               </Button>
//             </Popover>
//             {showClear && (
//               <Button size="small" className="ml-2" onClick={() => noteMetadata.updateValue('icon', null)}>
//                 清除
//               </Button>
//             )}
//           </div>
//         </Form.Item>
//         <Form.Item label="只读">
//           <Checkbox
//             indeterminate={noteMetadata.values.isReadonly === 2}
//             checked={Boolean(noteMetadata.values.isReadonly)}
//             onChange={handleIsReadonly}
//           />
//         </Form.Item>
//       </Form>
//       <div className="mt-8 text-right">
//         <Button onClick={editingModal.close} className="mr-4">
//           取消
//         </Button>
//         <Button type="primary" disabled={!noteMetadata.isValid} onClick={handleSubmit}>
//           保存
//         </Button>
//       </div>
//     </div>
//   );
// });
