import { default as note, type Row as NoteRow } from './note.js';
import { default as recyclable, type Row as RecyclableRow } from './recyclable.js';
import { default as star, type Row as StarRow } from './star.js';
import { default as file, type Row as FileRow } from './file.js';
import { default as memo, type Row as MemoRow } from './memo.js';
import { default as annotation, type Row as AnnotationRow } from './annotation.js';
import { default as topic, type Row as TopicRow } from './topic.js';
import { default as link, type Row as LinkRow } from './link.js';
import { default as fileText, type Row as FileTextRow } from './fileText.js';
import { default as entity, type Row as EntityRow } from './entity.js';
import { default as revision, type Row as RevisionRow } from './revision.js';

export interface Schemas {
  [note.tableName]: NoteRow;
  [recyclable.tableName]: RecyclableRow;
  [star.tableName]: StarRow;
  [file.tableName]: FileRow;
  [annotation.tableName]: AnnotationRow;
  [memo.tableName]: MemoRow;
  [topic.tableName]: TopicRow;
  [link.tableName]: LinkRow;
  [fileText.tableName]: FileTextRow;
  [entity.tableName]: EntityRow;
  [revision.tableName]: RevisionRow;
}

export const schemas = [note, recyclable, star, file, annotation, memo, topic, link, fileText, entity, revision];
