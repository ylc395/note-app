import type { Extension, State, Tokenizer, HtmlExtension } from 'micromark-util-types';
import type { Extension as MdastExtension } from 'mdast-util-from-markdown';
import { codes } from 'micromark-util-symbol';
import { markdownLineEnding, markdownSpace } from 'micromark-util-character';
import type { Node } from 'mdast';
import assert from 'assert';

export interface Topic extends Node {
  type: 'topic';
  value: string;
  level: 1 | 2;
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
  let size = 0;

  const start: State = (code) => {
    effects.enter('topic');
    effects.enter('topicMarker');
    return marker(code);
  };

  const marker: State = (code) => {
    if (code === codes.numberSign) {
      size++;
      effects.consume(code);
      return size < 2 ? marker : afterMarker;
    } else {
      if (size === 0) {
        return nok(code);
      }
      return afterMarker(code);
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
      size--;
      effects.consume(code);
      if (size === 0) {
        effects.exit('topicMarker');
        effects.exit('topic');
        return ok;
      }
      return closingMarker;
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

function getLevel(str: string) {
  let signCount = 0;

  for (const char of str) {
    if (char === '#') {
      signCount += 1;
    }

    if (char !== '#' || signCount === 2) {
      break;
    }
  }

  assert(signCount === 1 || signCount === 2);
  return signCount;
}

export const mdastExtension: MdastExtension = {
  enter: {
    topic: function (token) {
      const value = this.sliceSerialize(token);
      const signCount = getLevel(value);

      this.enter({ type: 'topic', value: value.slice(signCount, -signCount), level: signCount }, token);
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
      const str = this.sliceSerialize(token);
      const level = getLevel(str);
      const topic = this.sliceSerialize(token).slice(level, -level);
      this.tag(`<span class="markdown-topic" data-markdown-topic="${topic}" data-markdown-topic-level="${level}">`);
      this.tag(`${'#'.repeat(level)}${topic}${'#'.repeat(level)}`);
      this.tag('</span>');
    },
  },
};
