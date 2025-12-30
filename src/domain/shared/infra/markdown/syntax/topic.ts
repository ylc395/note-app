import type { Extension, State, Tokenizer } from 'micromark-util-types';
import type { Extension as MdastExtension } from 'mdast-util-from-markdown';
import type { Options as ToMarkdownExtension } from 'mdast-util-to-markdown';
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

declare module 'mdast-util-to-markdown' {
  interface ConstructNameMap {
    topic: 'topic';
  }
}

const tokenize: Tokenizer = function (effects, ok, nok) {
  const start: State = (code) => {
    effects.enter('topic');
    effects.enter('topicMarker');
    return marker(code);
  };

  const marker: State = (code) => {
    if (code === codes.numberSign) {
      effects.consume(code);
      return afterMarker;
    }
  };

  const afterMarker: State = (code) => {
    if (markdownSpace(code)) {
      return nok(code);
    }

    effects.exit('topicMarker');
    effects.enter('topicName');
    return insideTopic(code);
  };

  const insideTopic: State = (code) => {
    if (code === codes.numberSign) {
      if (this.previous === codes.numberSign) {
        return nok(code);
      }

      effects.exit('topicName');
      effects.enter('topicMarker');
      return closingMarker(code);
    }

    if (code === codes.eof || markdownLineEnding(code)) {
      return nok(code);
    }

    effects.consume(code);
    return insideTopic;
  };

  const closingMarker: State = (code) => {
    if (code === codes.numberSign) {
      effects.consume(code);
      effects.exit('topicMarker');
      effects.exit('topic');
      return ok;
    }
    return nok(code);
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

// 咱也不懂 toMarkdownExtension 怎么实现。照着官方的 strikethrough 语法抄的
export const toMarkdownExtension: ToMarkdownExtension = {
  handlers: {
    topic: (node, parent, state, info) => {
      const tracker = state.createTracker(info);
      const exit = state.enter('topic');
      let value = tracker.move('#');
      value += state.containerPhrasing(node, {
        ...tracker.current(),
        before: value,
        after: '#',
      });
      value += tracker.move('#');
      exit();
      return value;
    },
  },
};
