import { commandsCtx } from '@milkdown/core';
import { Plugin } from '@milkdown/prose/state';
import { $command, $prose, $useKeymap } from '@milkdown/utils';
import { createSlice } from '@milkdown/ctx';

import './style.css';
import SearchView from './SearchView';

const searchViewCtx = createSlice<SearchView | null>(null, 'searchView');

const searchPlugin = $prose((ctx) => {
  const searchView = new SearchView(ctx);

  ctx.inject(searchViewCtx, searchView);

  return new Plugin({
    props: {
      decorations: searchView.getDecorations.bind(searchView),
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
