import { editorViewCtx, rootDOMCtx } from '@milkdown/core';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { $prose } from '@milkdown/utils';
import { Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { createRoot } from 'react-dom/client';

import './search.css';

interface Range {
  from: number;
  to: number;
}

export default $prose((ctx) => {
  let keyword = '';
  const result = observable({
    total: 0,
  });
  const pluginKey = new PluginKey();
  const search = debounce(() => {
    const editorView = ctx.get(editorViewCtx);
    const re = new RegExp(keyword, 'gui');
    const ranges: Range[] = [];

    if (!keyword) {
      editorView.dispatch(editorView.state.tr.setMeta(pluginKey, []));
      return;
    }

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

    editorView.dispatch(editorView.state.tr.setMeta(pluginKey, ranges));
  }, 300);

  const SearchBox = observer(() => {
    return (
      <>
        <span>
          <input
            onChange={(e) => {
              keyword = e.target.value;
              search();
            }}
          />
        </span>
        <span>{result.total}</span>
        <Button.Group>
          <Button type="text" icon={<ArrowUpOutlined />}></Button>
          <Button type="text" icon={<ArrowDownOutlined />}></Button>
        </Button.Group>
      </>
    );
  });

  return new Plugin({
    key: pluginKey,
    props: {
      decorations(this: Plugin, state) {
        return this.getState(state);
      },
    },

    state: {
      init: () => DecorationSet.empty,
      apply(tr, decorationSet) {
        const ranges = tr.getMeta(pluginKey) as Range[];

        if (tr.docChanged) {
          search();
        }

        if (ranges) {
          result.total = ranges.length;

          return DecorationSet.create(
            tr.doc,
            ranges.map((range) =>
              Decoration.inline(range.from, range.to, { class: 'match-highlight', nodeName: 'mark' }),
            ),
          );
        }

        return decorationSet.map(tr.mapping, tr.doc);
      },
    },
    view() {
      const rootEl = ctx.get(rootDOMCtx);
      const searchBoxRoot = document.createElement('div');
      const root = createRoot(searchBoxRoot);

      searchBoxRoot.className = 'search-box';
      searchBoxRoot.addEventListener('click', (e) => e.stopPropagation());
      rootEl.parentElement?.prepend(searchBoxRoot);
      root.render(<SearchBox />);

      return {
        destroy() {
          root.unmount();
          searchBoxRoot.remove();
        },
      };
    },
  });
});
