import { editorViewCtx, rootDOMCtx } from '@milkdown/core';
import type { Ctx } from '@milkdown/ctx';
import { EditorState, PluginKey, PluginView } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { listenerCtx } from '@milkdown/plugin-listener';
import { observable, reaction, action, makeObservable } from 'mobx';
import debounce from 'lodash/debounce';
import { type Root, createRoot } from 'react-dom/client';
import clsx from 'clsx';

import SearchBox from './SearchBox';
import type { SearchState, Range } from './type';

export default class SearchView implements PluginView {
  private resources?: { react: Root; el: HTMLElement; autoDispatchDisposer: ReturnType<typeof reaction> };
  private readonly key = new PluginKey();

  @observable.shallow
  private readonly searchState: SearchState = {
    ranges: [],
    activeIndex: 0,
  };

  private keyword = '';

  constructor(private readonly ctx: Ctx) {
    makeObservable(this);

    const listeners = ctx.get(listenerCtx);

    listeners.markdownUpdated(this.search);
    listeners.destroy(this.destroy);
  }

  private autoDispatch() {
    return reaction(
      () => ({ ...this.searchState }),
      () => {
        const editorView = this.ctx.get(editorViewCtx);
        editorView.dispatch(editorView.state.tr.setMeta(this.key, null));
      },
    );
  }

  private readonly search = debounce(
    action(() => {
      const editorView = this.ctx.get(editorViewCtx);
      const re = new RegExp(this.keyword, 'gui');
      const ranges: Range[] = [];

      if (this.keyword && this.resources) {
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

      this.searchState.ranges = ranges;
      this.searchState.activeIndex = 0;
    }),
    300,
  );

  private nextMatch(dir: 'up' | 'down') {
    return action(() => {
      if (
        dir === 'down'
          ? this.searchState.activeIndex + 1 === this.searchState.ranges.length
          : this.searchState.activeIndex === 0
      ) {
        return;
      }

      this.searchState.activeIndex += dir === 'down' ? 1 : -1;
    });
  }

  enable() {
    if (this.resources) {
      this.resources.el.querySelector('input')?.select();
      return;
    }

    const searchBoxRootEl = document.createElement('div');
    searchBoxRootEl.className = 'search-box';
    searchBoxRootEl.addEventListener('click', (e) => e.stopPropagation());

    const rootEl = this.ctx.get(rootDOMCtx);
    rootEl.parentElement?.prepend(searchBoxRootEl);

    this.resources = {
      el: searchBoxRootEl,
      react: createRoot(searchBoxRootEl),
      autoDispatchDisposer: this.autoDispatch(),
    };

    this.resources.react.render(
      <SearchBox
        searchState={this.searchState}
        onPrevious={this.nextMatch('up')}
        onNext={this.nextMatch('down')}
        onClose={this.destroy}
        onChange={(v) => {
          this.keyword = v;
          this.search();
        }}
      />,
    );
  }

  @action.bound
  destroy() {
    if (!this.resources) {
      return;
    }

    this.searchState.ranges = [];
    this.searchState.activeIndex = 0;
    this.search.cancel();

    this.resources.react.unmount();
    this.resources.el.remove();
    this.resources.autoDispatchDisposer();
    this.resources = undefined;
  }

  getDecorations(state: EditorState) {
    const { ranges, activeIndex } = this.searchState;

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
  }
}
