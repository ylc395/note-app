import { mapValues, uniqueId } from 'lodash-es';
import { observable, action, computed, when, runInAction, autorun } from 'mobx';
import assert from 'assert';

import Editor from '#domain/client/app/model/note/editor/BaseEditor';
import container from '#utils/singletonContainer';
import type { EntityId } from '#domain/shared/model/entity';

import Tile from './Tile';
import { type TileNode, type TileParent, TileDirections, isTileLeaf } from './tileTree';
import EditorFactory, { type EditorDTO } from './EditorFactory';
import HistoryStack from '../base/HistoryStack';
import RecentManager from './RecentManager';
import UIState from './UIState';

export interface HistoryRecord {
  key: Editor['id'];
  noteId: EntityId;
  title: string | null;
  tileId: Tile['id'];
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
  constructor() {
    when(
      () => this.state.isReady,
      () => {
        this.restore();
        autorun(this.persistTiles.bind(this));
      },
    );
  }

  private readonly state = new UIState();

  private latestTile?: Tile; // 最新一个被创建的 Tile

  // 这里的历史管理，更类似于焦点历史管理
  public readonly historyStack = new HistoryStack<HistoryRecord>({
    onPop: this.handleHistoryPop.bind(this),
  });

  private readonly editorManager = container.resolve(EditorFactory);

  public readonly recentManager = container.resolve(RecentManager);

  private readonly tilesMap: Record<Tile['id'], Tile> = {};

  @observable public accessor root: TileNode | undefined; // a binary tree

  @computed
  public get currentEditor() {
    return this.historyStack.current && this.editorManager.get(this.historyStack.current.key);
  }

  public getTileById(id: Tile['id']) {
    return this.tilesMap[id];
  }

  private createTile() {
    const tile = new Tile({
      onDestroy: this.removeTile.bind(this),
      onEditorFocus: this.handleEditorFocus.bind(this),
    });

    this.tilesMap[tile.id] = tile;
    this.latestTile = tile;

    return tile;
  }

  private persistTiles() {
    const currentEditor = this.currentEditor;

    this.state.update({
      root: this.root,
      focusedId: currentEditor?.tile.id,
      tiles: mapValues(this.tilesMap, (tile) => tile.toObject()),
    });
  }

  private async handleEditorFocus(editor: Editor) {
    assert(this.root);
    await when(() => editor.value.result.isLoadingError || editor.value.result.isSuccess); // 确保 editor 的信息（如 title / mimeType）加载好了

    this.historyStack.push({
      mimeType: editor.mimeType,
      key: editor.id,
      noteId: editor.noteId,
      tileId: editor.tile.id,
      title: editor.title,
    });
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
      this.historyStack.push(null);
    } else {
      const keptTile = searchAndRemove(this.root);
      assert(keptTile, 'can not find tile');

      if (isTileLeaf(keptTile)) {
        const tile = this.tilesMap[keptTile];
        assert(tile?.currentEditor);
        tile.currentEditor.focus();
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
  @action.bound
  public open(note: EditorDTO, dest?: Editor | Tile | NewTile) {
    const currentTile = this.currentEditor?.tile || this.latestTile;
    dest = dest || currentTile;

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
      const existedEditor = destTile.findEditor(note.noteId);

      // 对应 editor 已存在：
      if (existedEditor) {
        editor = existedEditor;

        if (dest instanceof Editor) {
          existedEditor.moveTo(dest);
        }

        note.initialAction?.(existedEditor);
      } else {
        // 对应的 editor 不存在，则新建
        editor = destTile.createAndAddEditor(note, dest instanceof Editor ? dest : undefined);
      }
    } else {
      const { from = currentTile, splitDirection } = dest;
      assert(from, 'can not split tile');
      // 新建一个 tile，并打开至此
      destTile = this.splitTile(from.id, splitDirection);
      editor = destTile.createAndAddEditor(note);
    }

    destTile.switchToEditor(editor);
    this.recentManager.add(note.noteId);

    return editor;
  }

  private handleHistoryPop({ record }: { record: HistoryRecord }) {
    const dest =
      this.editorManager.get(record.key) || this.getTileById(record.tileId)?.findEditor(record.noteId) || record.tileId;

    if (dest instanceof Editor) {
      dest.tile.switchToEditor(dest);
    } else {
      const destTile = this.getTileById(dest);
      this.open({ noteId: record.key, mimeType: record.mimeType }, destTile);
    }
  }

  @action.bound
  public setTilePercentage(tileParent: TileParent, percentage: number | undefined) {
    tileParent.splitPercentage = percentage;
  }

  private async restore() {
    const { tiles, root, focusedId } = this.state;

    if (!tiles || !root || !focusedId) {
      return;
    }

    let focusedTile: Tile | undefined;

    const iterate = (tileNode: TileNode): TileNode => {
      if (typeof tileNode !== 'string') {
        return {
          ...tileNode,
          id: uniqueId('tileParent-'),
          first: iterate(tileNode.first),
          second: iterate(tileNode.second),
        };
      }

      const tileData = tiles[tileNode];
      assert(tileData);

      const tile = this.createTile();
      tile.restore(tileData);

      if (focusedId === tileNode) {
        focusedTile = tile;
      }

      return tile.id;
    };

    runInAction(() => {
      this.root = iterate(root);
    });

    if (focusedTile) {
      focusedTile.currentEditor?.focus();
    }
  }
}
