import assert from 'assert';

import { MimeTypes } from '#domain/shared/model/file';
import type { NoteVO } from '#domain/shared/model/note';
import { EntityTypes } from '#domain/shared/model/entity';

import HtmlEditor from './HtmlEditor';
import ImageEditor from './ImageEditor';
import MarkdownEditor from './MarkdownEditor';
import PdfEditor from './PdfEditor';
import UnknownEditor from './UnknownEditor';
import type { EditorDTO, Factory as EditorFactory } from '../../Workbench/EditorFactory';

function isValidConfig(config: EditorDTO): config is EditorDTO<NoteVO> {
  return config.entityType === EntityTypes.Note;
}

const factory: EditorFactory<NoteVO> = (config, tile) => {
  const { mimeType } = config;
  assert(isValidConfig(config));

  if (!mimeType) {
    return new MarkdownEditor(tile, config);
  } else if (mimeType === MimeTypes.PDF) {
    return new PdfEditor(tile, config);
  } else if (mimeType === MimeTypes.HTML) {
    return new HtmlEditor(tile, config);
  } else if (mimeType.startsWith('image')) {
    return new ImageEditor(tile, { ...config, mimeType });
  } else {
    return new UnknownEditor(tile, { ...config, mimeType });
  }
};

export default factory;
