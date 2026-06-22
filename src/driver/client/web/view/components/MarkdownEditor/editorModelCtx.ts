import { createSlice } from '@milkdown/kit/ctx';
import type Editor from './Editor';

export const editorModelCtx = createSlice({} as Editor, 'customCtx');
