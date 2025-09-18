import type { Extension, State, Tokenizer, HtmlExtension } from 'micromark-util-types';
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

export const htmlExtension: HtmlExtension = {
  enter: {
    topic: function (token) {
      const topic = this.sliceSerialize(token).slice(1, -1);

      this.tag('<span class="markdown-topic"');
      this.tag(topic);
      this.tag('</span>');
    },
  },
};
