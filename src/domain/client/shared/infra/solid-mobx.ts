import { enableExternalSource } from 'solid-js';
import { Reaction, untracked } from 'mobx';

let id = 0;

// mobx + solid vs. solid （来自实践，持续更新中）
// 1. 组件中，任何位置读取响应式数据，都会导致整个组件被卸载、创建、渲染 vs. 只有 jsx 等特定位置对响应式数据的读取会导致重新渲染（不包括组件卸载、创建）
enableExternalSource((fn, trigger) => {
  const reaction = new Reaction(`externalSource@${++id}`, trigger);
  return {
    track: (x) => {
      let next;
      reaction.track(() => (next = fn(x)));
      return next;
    },
    dispose: () => {
      reaction.dispose();
    },
  };
}, untracked);
