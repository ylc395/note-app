import { commandsCtx } from '@milkdown/core';
import { Plugin } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { $command, $prose, $useKeymap } from '@milkdown/utils';
import { createSlice } from '@milkdown/ctx';
import clsx from 'clsx';
import noop from 'lodash/noop';

import './style.css';
import SearchView from './SearchView';

const searchViewCtx = createSlice<SearchView | null>(null, 'searchView');

const searchPlugin = $prose((ctx) => {
  const searchView = new SearchView(ctx);

  ctx.inject(searchViewCtx, searchView);

  return new Plugin({
    props: {
      decorations(state) {
        const { ranges, activeIndex } = searchView.getSearchState();

        return DecorationSet.create(
          state.doc,
          ranges.map((range, i) =>
            Decoration.inline(range.from, range.to, {
              // eslint-disable-next-line tailwindcss/no-custom-classname
              class: clsx('match-highlight', i === activeIndex ? 'active-match-highlight' : ''),
              nodeName: 'mark',
            }),
          ),
        );
      },
    },

    state: {
      init: noop,
      apply(tr) {
        if (tr.docChanged) {
          searchView.search();
        }
      },
    },
    view: () => searchView,
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
