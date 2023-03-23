import { commandsCtx, editorViewCtx, rootDOMCtx } from '@milkdown/core';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { $command, $prose, $useKeymap } from '@milkdown/utils';
import { listenerCtx } from '@milkdown/plugin-listener';
import { createSlice } from '@milkdown/ctx';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import clsx from 'clsx';

import './style.css';
import SearchViewModel from './SearchViewModel';
import type { SearchState } from './type';

const searchViewCtx = createSlice<SearchViewModel | null>(null, 'searchView');
const pluginKey = new PluginKey();

const searchPlugin = $prose((ctx) => {
  const listeners = ctx.get(listenerCtx);

  listeners.mounted(() => {
    const rootEl = ctx.get(rootDOMCtx);
    const searchView = new SearchViewModel({
      rootEl,
      traverseText(cb) {
        const editorView = ctx.get(editorViewCtx);
        editorView.state.doc.descendants((node, pos) => {
          if (!node.isTextblock) {
            return;
          }

          cb(node.textContent, pos);
          return false;
        });
      },
      onUpdate(e) {
        const editorView = ctx.get(editorViewCtx);
        editorView.dispatch(editorView.state.tr.setMeta(pluginKey, e));
      },
    });

    listeners.markdownUpdated(searchView.search).destroy(searchView.destroy);

    ctx.inject(searchViewCtx, searchView);
  });

  return new Plugin({
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
    state: {
      init: () => DecorationSet.empty,
      apply(tr, decorations) {
        const searchState = tr.getMeta(pluginKey) as SearchState | undefined;

        if (!searchState) {
          return decorations.map(tr.mapping, tr.doc);
        }

        return DecorationSet.create(
          tr.doc,
          searchState.ranges.map((range, i) =>
            Decoration.inline(range.from, range.to, {
              // eslint-disable-next-line tailwindcss/no-custom-classname
              class: clsx('match-highlight', i === searchState.activeIndex ? 'active-match-highlight' : ''),
              nodeName: 'mark',
            }),
          ),
        );
      },
    },
  });
});

const enableSearchCommand = $command('search', (ctx) => () => () => {
  const searchView = ctx.get(searchViewCtx);

  if (!searchView) {
    throw new Error('no searchView');
  }

  searchView.enable();
  return true;
});

const exitSearchCommand = $command('stopSearch', (ctx) => () => () => {
  const searchView = ctx.get(searchViewCtx);

  if (!searchView) {
    throw new Error('no searchView');
  }

  searchView.destroy();
  return true;
});

const searchKeyMap = $useKeymap('search', {
  openSearch: {
    shortcuts: 'Mod-f',
    command: (ctx) => {
      const commands = ctx.get(commandsCtx);
      return () => commands.call(enableSearchCommand.key);
    },
  },
});

export default [enableSearchCommand, exitSearchCommand, searchKeyMap, searchPlugin].flat();
