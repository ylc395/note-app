import { uniqueId } from 'lodash-es';
import { observable, action, computed } from 'mobx';
import assert from 'assert';

import Editor from '#domain/client/app/model/note/editor/BaseEditor';
import { container } from '#domain/shared/infra/singletons';
import type { NoteVO } from '#domain/shared/model/note';

import Tile from './Tile';
import { type TileNode, type TileParent, TileDirections, isTileLeaf } from './tileTree';
import HistoryStack, { type Direction, type Record as HistoryRecord } from './HistoryStack';
import EditorFactory from './EditorFactory';

export enum TileSplitDirections {
  Top = 1,
  Bottom,
  Left,
  Right,
}

type NewTile = { from?: Tile; splitDirection: TileSplitDirections };

export default class Workbench {
  public readonly historyStack = new HistoryStack({
    onPop: this.handleHistoryPop.bind(this),
  });

  private readonly editorFactory = container.resolve(EditorFactory);

  private readonly tilesMap: Record<Tile['id'], Tile> = {};

  @observable public accessor root: TileNode | undefined; // a binary tree

  @computed
  public get currentTile() {
    return this.historyStack.current?.tile;
  }

  public getTileById(id: Tile['id']) {
    return this.tilesMap[id];
  }

  private createTile() {
    const tile = new Tile({
      onDestroy: this.removeTile.bind(this),
      onEditorSwitch: this.historyStack.push.bind(this.historyStack),
    });

    this.tilesMap[tile.id] = tile;
    return tile;
  }

  @action.bound
  private removeTile(tile: Tile) {
    delete this.tilesMap[tile.id];

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
      this.historyStack.push({ editor: null });
    } else {
      const keptTile = searchAndRemove(this.root);
      assert(keptTile, 'can not find tile');

      if (isTileLeaf(keptTile)) {
        const tile = this.tilesMap[keptTile];
        assert(tile?.currentEditor);

        this.historyStack.push({ editor: tile.currentEditor });
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
  public open(note: Pick<NoteVO, 'id' | 'mimeType'>, dest?: Editor | Tile | NewTile) {
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

    destTile.switchToEditor(editor);
  }

  private handleHistoryPop({ record, direction }: { record: HistoryRecord; direction: Direction }) {
    const dest = this.editorFactory.get(record.editorId) || this.tilesMap[record.tileId];

    if (dest instanceof Editor) {
      dest.tile.switchToEditor(dest, { fromHistory: direction });
    } else {
      this.open({ id: record.entityId, mimeType: record.mimeType }, dest);
    }
  }
}
