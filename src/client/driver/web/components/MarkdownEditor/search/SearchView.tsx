import { editorViewCtx, rootDOMCtx } from '@milkdown/core';
import type { Ctx } from '@milkdown/ctx';
import { PluginKey, PluginView } from '@milkdown/prose/state';
import { observable, reaction, action, makeObservable, runInAction } from 'mobx';
import debounce from 'lodash/debounce';
import { type Root, createRoot } from 'react-dom/client';

import SearchBox from './SearchBox';
import type { SearchState, Range } from './type';

export default class SearchView implements PluginView {
  private resources?: { react: Root; el: HTMLElement; autoDispatchDisposer: ReturnType<typeof reaction> };
  private readonly key = new PluginKey();

  @observable.ref
  private searchState: SearchState = {
    ranges: [],
    activeIndex: 0,
  };

  private keyword = '';

  constructor(private readonly ctx: Ctx) {
    makeObservable(this);
  }

  getSearchState() {
    return this.searchState;
  }

  private autoDispatch() {
    return reaction(
      () => this.searchState,
      () => {
        const editorView = this.ctx.get(editorViewCtx);
        editorView.dispatch(editorView.state.tr.setMeta(this.key, null));
        this.render();
      },
    );
  }

  readonly search = debounce(
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

      this.searchState = {
        ranges,
        activeIndex: 0,
      };
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

      this.searchState = { ...this.searchState, activeIndex: this.searchState.activeIndex + (dir === 'down' ? 1 : -1) };
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

    this.render();
  }

  private render() {
    if (!this.resources) {
      return;
    }

    this.resources.react.render(
      <SearchBox
        searchState={this.searchState}
        onPrevious={this.nextMatch('up')}
        onNext={this.nextMatch('down')}
        onClose={() => this.destroy()}
        onChange={(v) => {
          this.keyword = v;
          this.search();
        }}
      />,
    );
  }

  destroy() {
    if (!this.resources) {
      return;
    }

    runInAction(() => {
      this.searchState = {
        activeIndex: 0,
        ranges: [],
      };
    });

    this.resources.react.unmount();
    this.resources.el.remove();
    this.resources.autoDispatchDisposer();
    this.resources = undefined;
  }
}
