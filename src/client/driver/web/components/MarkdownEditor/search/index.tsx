import { editorViewCtx, rootDOMCtx } from '@milkdown/core';
import { Plugin } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { $prose } from '@milkdown/utils';
import clsx from 'clsx';
import debounce from 'lodash/debounce';
import uniqueId from 'lodash/uniqueId';
import { action, observable, runInAction } from 'mobx';
import { createRoot } from 'react-dom/client';

import SearchBox from './SearchBox';
import './style.css';

interface Range {
  from: number;
  to: number;
}

interface SearchState {
  ranges: Range[];
  activeIndex: number;
}

const rangeKey = uniqueId('milkdown-search-range');
const activeKey = uniqueId('milkdown-search-active');

export default $prose((ctx) => {
  let keyword = '';
  const searchState = observable({
    total: 0,
    activeIndex: 0,
  });

  const search = debounce(() => {
    const editorView = ctx.get(editorViewCtx);
    const re = new RegExp(keyword, 'gui');
    const ranges: Range[] = [];

    if (keyword) {
      editorView.state.doc.descendants((node, pos) => {
        if (!node.isTextblock) {
          return;
        }

        const start = pos + 1;

        for (const match of node.textContent.matchAll(re)) {
          const from = start + (match.index ?? 0);
          const to = from + match[0].length;
          ranges.push({ from, to });
        }

        return false;
      });
    }

    runInAction(() => {
      searchState.total = ranges.length;
      searchState.activeIndex = 0;
    });
    editorView.dispatch(editorView.state.tr.setMeta(rangeKey, ranges));
  }, 300);

  const nextMatch = (dir: 'up' | 'down') =>
    action(() => {
      const editorView = ctx.get(editorViewCtx);

      if (dir === 'down' ? searchState.activeIndex + 1 === searchState.total : searchState.activeIndex === 0) {
        return;
      }

      searchState.activeIndex += dir === 'down' ? 1 : -1;
      editorView.dispatch(editorView.state.tr.setMeta(activeKey, searchState.activeIndex));
    });

  return new Plugin({
    props: {
      decorations(this: Plugin<SearchState>, state) {
        const pluginState = this.getState(state);

        if (!pluginState) {
          return DecorationSet.empty;
        }

        const { ranges, activeIndex } = pluginState;

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
      init: () => {
        const initialState: SearchState = {
          ranges: [],
          activeIndex: 0,
        };
        return initialState;
      },

      apply(tr, result) {
        if (tr.docChanged) {
          search();
        }

        const activeIndex = tr.getMeta(activeKey) as number;

        if (typeof activeIndex === 'number') {
          return { ...result, activeIndex };
        }

        const ranges = tr.getMeta(rangeKey) as Range[];

        if (ranges) {
          return { ...result, ranges };
        }

        return result;
      },
    },
    view() {
      const rootEl = ctx.get(rootDOMCtx);
      const searchBoxRoot = document.createElement('div');
      const root = createRoot(searchBoxRoot);

      searchBoxRoot.className = 'search-box';
      searchBoxRoot.addEventListener('click', (e) => e.stopPropagation());
      rootEl.parentElement?.prepend(searchBoxRoot);
      root.render(
        <SearchBox
          searchState={searchState}
          onPrevious={nextMatch('up')}
          onNext={nextMatch('down')}
          onChange={(v) => {
            keyword = v;
            search();
          }}
        />,
      );

      return {
        destroy() {
          search.cancel();
          root.unmount();
          searchBoxRoot.remove();
        },
      };
    },
  });
});
