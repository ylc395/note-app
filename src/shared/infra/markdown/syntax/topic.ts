import type { Extension, State, Tokenizer } from 'micromark-util-types';
import type { Extension as MdastExtension } from 'mdast-util-from-markdown';
import { codes } from 'micromark-util-symbol';
import { markdownLineEnding, markdownSpace } from 'micromark-util-character';
import type { Node } from 'mdast';

export interface Topic extends Node {
  type: 'topic';
  value: string;
}

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    topic: 'topic';
    topicMarker: 'topicMarker';
    topicName: 'topicName';
  }
}

declare module 'mdast' {
  interface RootContentMap {
    topic: Topic;
  }
}

const tokenize: Tokenizer = function (effects, ok, nok) {
  const start: State = (code) => {
    effects.enter('topic');
    effects.enter('topicMarker');
    effects.consume(code);
    effects.exit('topicMarker');

    return inside;
  };

  const inside: State = (code) => {
    if (markdownLineEnding(code)) {
      return nok(code);
    }

    if (this.previous === codes.numberSign) {
      if (code === codes.numberSign || code === codes.eof || markdownSpace(code)) {
        return nok(code);
      }

      effects.enter('topicName');
    }

    if (code === codes.numberSign) {
      effects.exit('topicName');
      effects.enter('topicMarker');
      effects.consume(code);
      effects.exit('topicMarker');
      effects.exit('topic');
      return ok(code);
    }

    effects.consume(code);
    return inside;
  };

  return start;
};

export const tokenExtension: Extension = {
  text: {
    [codes.numberSign]: { tokenize },
  },
};

export const mdastExtension: MdastExtension = {
  enter: {
    topic: function (token) {
      const value = this.sliceSerialize(token);
      this.enter({ type: 'topic', value: value.slice(1, -1) }, token);
    },
  },
  exit: {
    topic: function (token) {
      this.exit(token);
    },
  },
};
