import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { fromMarkdown } from 'mdast-util-from-markdown';

import { extension, mdastExtension } from 'markdown/topic';
import { events as noteEvents, type NoteUpdatedEvent } from './NoteService';

@Injectable()
export default class TopicService {
  @OnEvent(noteEvents.noteUpdated)
  async extractTopics({ id, content }: NoteUpdatedEvent) {
    const mdAst = fromMarkdown(content, {
      extensions: [extension],
      mdastExtensions: [mdastExtension],
    });
    console.log(mdAst);
  }
}
