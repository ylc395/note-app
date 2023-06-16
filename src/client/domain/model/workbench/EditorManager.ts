import { container } from 'tsyringe';

import { EntityTypes, type EntityLocator } from 'interface/entity';
import type Editor from 'model/abstract/Editor';
import { Events as EditorEvents } from 'model/abstract/Editor';
import type EditorView from 'model/abstract/EditorView';
import { Events as EditorViewEvents } from 'model/abstract/EditorView';
import type EntityEditor from 'model/abstract/Editor';
import type MaterialEditor from 'model/material/editor/Editor';
import NoteEditorView from 'model/note/EditorView';
import NoteEditor from 'model/note/Editor';
import PdfEditor from 'model/material/editor/PdfEditor';
import PdfEditorView from 'model/material/view/PdfEditorView';
import HtmlEditor from 'model/material/editor/HtmlEditor';
import HtmlEditorView from 'model/material/view/HtmlEditorView';
import ImageEditor from 'model/material/editor/ImageEditor';
import ImageEditorView from 'model/material/view/ImageEditorView';

import type Tile from './Tile';
import { token as treeToken } from 'model/note/Tree';

export default class EditorManager {
  private editors: { [key in EntityTypes]?: Record<EntityLocator['id'], Editor> } = {
    [EntityTypes.Note]: {},
    [EntityTypes.Material]: {},
  };

  private editorViews = new Map<EntityEditor, Set<EditorView>>();

  getEditorByEntity(entity: EntityLocator) {
    return this.editors[entity.type]?.[entity.id];
  }

  private createEditor(tile: Tile, entity: EntityLocator) {
    let editor = this.getEditorByEntity(entity);

    if (editor) {
      return editor;
    }

    switch (entity.type) {
      case EntityTypes.Note:
        editor = new NoteEditor(tile, entity.id, container.resolve(treeToken));
        break;
      case EntityTypes.Material:
        editor = this.createMaterialEditor(tile, entity);
        break;
      default:
        throw new Error('invalid type');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editor.once(EditorEvents.Destroyed, () => delete this.editors[entity.type]![entity.id]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.editors[entity.type]![entity.id] = editor;
    return editor;
  }

  private createMaterialEditor(tile: Tile, entity: EntityLocator) {
    if (!entity.mimeType) {
      throw new Error('no mimeType');
    }

    let editor: MaterialEditor | null = null;

    if (entity.mimeType.startsWith('image')) {
      editor = new ImageEditor(tile, entity.id);
    } else if (entity.mimeType === 'application/pdf') {
      editor = new PdfEditor(tile, entity.id);
    } else if (entity.mimeType === 'text/html') {
      editor = new HtmlEditor(tile, entity.id);
    }

    if (!editor) {
      throw new Error('can not create editor');
    }

    return editor;
  }

  createEditorView(tile: Tile, entity: EntityLocator) {
    const editor = this.createEditor(tile, entity);
    let editorView: EditorView | undefined;

    if (editor instanceof NoteEditor) {
      editorView = new NoteEditorView(tile, editor);
    }

    if (editor instanceof PdfEditor) {
      editorView = new PdfEditorView(tile, editor);
    }

    if (editor instanceof HtmlEditor) {
      editorView = new HtmlEditorView(tile, editor);
    }

    if (editor instanceof ImageEditor) {
      editorView = new ImageEditorView(tile, editor);
    }

    if (!editorView) {
      throw new Error('invalid editor');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editorView.once(EditorViewEvents.Destroyed, () => this.handleViewDestroyed(editorView!));
    const viewSet = this.editorViews.get(editor);

    if (viewSet) {
      viewSet.add(editorView);
    } else {
      this.editorViews.set(editor, new Set([editorView]));
    }

    return editorView;
  }

  private handleViewDestroyed(editorView: EditorView) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const viewSet = this.editorViews.get(editorView.editor)!;
    viewSet.delete(editorView);

    if (viewSet.size === 0) {
      this.editorViews.delete(editorView.editor);
      editorView.editor.destroy();
    }
  }
}
