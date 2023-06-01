import type { Extension, State, Tokenizer } from 'micromark-util-types';
import type { Extension as MdastExtension } from 'mdast-util-from-markdown';
import { codes } from 'micromark-util-symbol/codes';

const tokenize: Tokenizer = function (effects, ok, nok) {
  const start: State = (code) => {
    effects.enter('topic');
    effects.enter('topicMarker');
    effects.consume(code);
    effects.exit('topicMarker');
    effects.enter('topicName');
    return (code) => {
      return code === codes.numberSign ? nok(code) : inside(code);
    };
  };

  const inside: State = (code) => {
    if ([codes.lineFeed, codes.carriageReturnLineFeed, codes.carriageReturn, codes.eof].includes(code)) {
      return nok(code);
    }

    if (code === codes.numberSign) {
      effects.exit('topicName');
      effects.enter('topicMarker');
      effects.consume(code);
      effects.exit('topicMarker');
      effects.exit('topic');
      return ok;
    }

    effects.consume(code);
    return inside;
  };

  return start;
};

export const extension: Extension = {
  text: {
    [codes.numberSign]: { tokenize },
  },
};

export const mdastExtension: MdastExtension = {
  enter: {
    topic: function (token) {
      const value = this.sliceSerialize(token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.enter({ type: token.type as any, value: value.slice(1, -1) }, token);
    },
  },
  exit: {
    topic: function (token) {
      this.exit(token);
    },
  },
};
