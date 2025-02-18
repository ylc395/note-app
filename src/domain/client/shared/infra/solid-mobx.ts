import { enableExternalSource } from 'solid-js';
import { Reaction, untracked } from 'mobx';

let id = 0;

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
