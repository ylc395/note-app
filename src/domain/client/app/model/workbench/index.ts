import { uniqueId } from 'lodash-es';
import { observable, action, computed } from 'mobx';
import assert from 'assert';

import Editor from '#domain/client/app/model/note/editor/BaseEditor';
import { container } from '#domain/shared/infra/singletons';
import type { NoteVO } from '#domain/shared/model/note';
import type { EntityId } from '#domain/shared/model/entity';

import Tile from './Tile';
import { type TileNode, type TileParent, TileDirections, isTileLeaf } from './tileTree';
import EditorManager from './EditorManager';
import HistoryStack, { type Direction } from '../base/HistoryStack';

export interface HistoryRecord {
  key: EntityId;
  editorId: Editor['id'];
  mimeType: string | null;
}

export enum TileSplitDirections {
  Top = 1,
  Bottom,
  Left,
  Right,
}

type NewTile = { from?: Tile; splitDirection: TileSplitDirections };

export default class Workbench {
  // 这里的历史管理，更类似于焦点历史管理
  public readonly historyStack = new HistoryStack<HistoryRecord>({
    onPop: this.handleHistoryPop.bind(this),
  });

  private readonly editorManager = container.resolve(EditorManager);

  private readonly tilesMap: Record<Tile['id'], Tile> = {};

  @observable public accessor root: TileNode | undefined; // a binary tree

  @computed
  public get currentEditor() {
    return this.historyStack.current && this.editorManager.get(this.historyStack.current.editorId);
  }

  @computed
  public get currentTile() {
    return this.currentEditor?.tile || this.latestTile;
  }

  public getTileById(id: Tile['id']) {
    return this.tilesMap[id];
  }

  private latestTile?: Tile;

  private createTile() {
    const tile = new Tile({
      onDestroy: this.removeTile.bind(this),
      onEditorFocus: ({ editor, fromHistory }) =>
        this.historyStack.push({
          fromHistory,
          record: { key: editor.noteId, mimeType: editor.mimeType, editorId: editor.id },
        }),
    });

    this.tilesMap[tile.id] = tile;
    this.latestTile = tile;

    return tile;
  }

  @action.bound
  private removeTile(tile: Tile) {
    delete this.tilesMap[tile.id];

    if (this.latestTile === tile) {
      this.latestTile = undefined;
    }

    const searchAndRemove = (node: TileNode, parentNode?: TileParent): TileNode | null => {
      if (isTileLeaf(node)) {
        return null;
      }

      if (node.first !== tile.id && node.second !== tile.id) {
        return searchAndRemove(node.first, node) || searchAndRemove(node.second, node);
      }

      const nodeToKeep = node.first === tile.id ? node.second : node.first;

      if (parentNode) {
        const branchOfParent = parentNode.first === node ? 'first' : 'second';
        parentNode[branchOfParent] = nodeToKeep;
      } else {
        // if parentNode is undefined, node must be root
        this.root = nodeToKeep;
      }

      return nodeToKeep;
    };

    assert(this.root, 'no root');

    if (this.root === tile.id) {
      this.root = undefined;
      this.historyStack.push({ record: null });
    } else {
      const keptTile = searchAndRemove(this.root);
      assert(keptTile, 'can not find tile');

      if (isTileLeaf(keptTile)) {
        const tile = this.tilesMap[keptTile];
        assert(tile?.currentEditor);

        this.historyStack.push({
          record: {
            key: tile.currentEditor.noteId,
            editorId: tile.currentEditor.id,
            mimeType: tile.currentEditor.mimeType,
          },
        });
      }
    }
  }

  @action
  private splitTile(from: Tile['id'], direction: TileSplitDirections) {
    assert(this.root);

    const splitDirectionToDirection = (direction: TileSplitDirections) => {
      return direction === TileSplitDirections.Bottom || direction === TileSplitDirections.Top
        ? TileDirections.Vertical
        : TileDirections.Horizontal;
    };

    const newTile = this.createTile();

    if (this.root === from) {
      this.root = {
        id: uniqueId('tileParent-'),
        direction: splitDirectionToDirection(direction),
        ...(direction === TileSplitDirections.Bottom || direction === TileSplitDirections.Right
          ? { first: this.root, second: newTile.id }
          : { second: this.root, first: newTile.id }),
      };
      return newTile;
    }

    const split = (node: TileNode, parentNode?: TileParent): boolean => {
      if (node === from) {
        if (!parentNode) {
          throw new Error('no parent');
        }

        const parentBranch = parentNode.first === node ? 'first' : 'second';
        parentNode[parentBranch] = {
          id: uniqueId('tileParent-'),
          direction: splitDirectionToDirection(direction),
          ...(direction === TileSplitDirections.Bottom || direction === TileSplitDirections.Right
            ? {
                first: parentNode[parentBranch],
                second: newTile.id,
              }
            : {
                second: parentNode[parentBranch],
                first: newTile.id,
              }),
        };

        return true;
      } else if (typeof node !== 'string') {
        return split(node.first, node) || split(node.second, node);
      }

      return false;
    };

    if (!split(this.root)) {
      throw new Error('can not find tile');
    }

    return newTile;
  }

  @action
  public splitTileWithEditor(from: Tile['id'], direction: TileSplitDirections, editor: Editor) {
    const newTile = this.splitTile(from, direction);
    editor.moveTo(newTile, true);
  }

  // 在指定位置打开一个 editor。该 editor 可能是新建的，也可能是复用已存在的
  // 若已存在，则其会被移动到指定位置（若有指定）
  @action
  public open(
    note: Pick<NoteVO, 'id' | 'mimeType'>,
    dest?: Editor | Tile | NewTile,
    options?: { isFromHistory?: Direction },
  ) {
    dest = dest || this.currentTile;

    if (!dest) {
      // 说明当前工作区一个 tile 都没有，需要创建一个
      const rootTile = this.createTile();
      this.root = rootTile.id;
      dest = rootTile;
    }

    let destTile: Tile | undefined;
    let editor: Editor;

    // 打开到指定 tile，或是指定 editor 旁边
    if (dest instanceof Tile || dest instanceof Editor) {
      destTile = dest instanceof Tile ? dest : dest.tile;
      const existedEditor = destTile.findEditor(note.id);

      // 对应 editor 已存在：
      if (existedEditor) {
        editor = existedEditor;

        if (dest instanceof Editor) {
          existedEditor.moveTo(dest);
        }
      } else {
        // 对应的 editor 不存在，则新建
        editor = destTile.createEditor(note, dest instanceof Editor ? dest : undefined);
      }
    } else {
      const { from = this.currentTile, splitDirection } = dest;
      assert(from, 'can not split tile');
      // 新建一个 tile，并打开至此
      destTile = this.splitTile(from.id, splitDirection);
      editor = destTile.createEditor(note);
    }

    destTile.switchToEditor(editor, { isFromHistory: options?.isFromHistory });
  }

  private handleHistoryPop({ record, direction }: { record: HistoryRecord; direction: Direction }) {
    const dest = this.editorManager.get(record.editorId) || this.editorManager.getAndRemoveTileIdOf(record.editorId);

    if (dest instanceof Editor) {
      dest.tile.switchToEditor(dest, { isFromHistory: direction });
    } else {
      const destTile = this.getTileById(dest);
      this.open({ id: record.key, mimeType: record.mimeType }, destTile, { isFromHistory: direction });
    }
  }
}
