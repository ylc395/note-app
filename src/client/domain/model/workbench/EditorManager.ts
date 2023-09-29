import { EntityTypes, type EntityLocator } from 'model/entity';
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

export default class EditorManager {
  private readonly editors: { [key in EntityTypes]?: Record<EntityLocator['entityId'], Editor> } = {
    [EntityTypes.Note]: {},
    [EntityTypes.Material]: {},
  };

  private readonly editorViews = new Map<EntityEditor, Set<EditorView>>();

  getEditorByEntity({ entityType, entityId }: EntityLocator) {
    return this.editors[entityType]?.[entityId];
  }

  private createEditor(tile: Tile, { entityId, entityType, mimeType }: EntityLocator) {
    let editor = this.getEditorByEntity({ entityId, entityType, mimeType });

    if (editor) {
      return editor;
    }

    switch (entityType) {
      case EntityTypes.Note:
        editor = new NoteEditor(tile, entityId);
        break;
      case EntityTypes.Material:
        editor = this.createMaterialEditor(tile, { entityId, entityType, mimeType });
        break;
      default:
        throw new Error('invalid type');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editor.once(EditorEvents.Destroyed, () => delete this.editors[entityType]![entityId]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.editors[entityType]![entityId] = editor;
    return editor;
  }

  private createMaterialEditor(tile: Tile, { mimeType, entityId }: EntityLocator) {
    if (!mimeType) {
      throw new Error('no mimeType');
    }

    let editor: MaterialEditor | null = null;

    if (mimeType.startsWith('image')) {
      editor = new ImageEditor(tile, entityId);
    } else if (mimeType === 'application/pdf') {
      editor = new PdfEditor(tile, entityId);
    } else if (mimeType === 'text/html') {
      editor = new HtmlEditor(tile, entityId);
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
