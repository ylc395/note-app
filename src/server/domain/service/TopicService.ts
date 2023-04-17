import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { fromMarkdown } from 'mdast-util-from-markdown';

import { extension, mdastExtension } from 'markdown/topic';
import { events as noteEvents, type NoteBodyUpdatedEvent } from './NoteService';

@Injectable()
export default class TopicService {
  @OnEvent(noteEvents.bodyUpdated)
  async extractTopics({ id, content }: NoteBodyUpdatedEvent) {
    const mdAst = fromMarkdown(content, {
      extensions: [extension],
      mdastExtensions: [mdastExtension],
    });
    console.log(mdAst);
  }
}
