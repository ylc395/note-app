import { $prose } from '@milkdown/kit/utils';
import { cursor } from '@milkdown/kit/plugin/cursor';
import { createVirtualCursor } from 'prosemirror-virtual-cursor';
import 'prosemirror-virtual-cursor/style/virtual-cursor.css';
import './style.css';

export default [cursor, $prose(() => createVirtualCursor())].flat();
