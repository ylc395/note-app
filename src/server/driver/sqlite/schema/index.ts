import { default as note, type Row as NoteRow } from './note';
import { default as recyclable, type Row as RecyclableRow } from './recyclable';
import { default as star, type Row as StarRow } from './star';
import { default as file, type Row as FileRow } from './file';
import { default as memo, type Row as MemoRow } from './memo';
import { default as material, type Row as MaterialRow } from './material';
import { default as revision, type Row as RevisionRow } from './revision';
import { default as materialAnnotation, type Row as MaterialAnnotationRow } from './materialAnnotation';
import { default as syncEntity, type Row as SyncEntityRow } from './syncEntity';
import { default as topic, type Row as TopicRow } from './topic';
import { default as link, type Row as LinkRow } from './link';
import { default as fileText, type Row as FileTextRow } from './fileText';

export interface Schemas {
  [note.tableName]: NoteRow;
  [recyclable.tableName]: RecyclableRow;
  [star.tableName]: StarRow;
  [file.tableName]: FileRow;
  [materialAnnotation.tableName]: MaterialAnnotationRow;
  [revision.tableName]: RevisionRow;
  [material.tableName]: MaterialRow;
  [memo.tableName]: MemoRow;
  [syncEntity.tableName]: SyncEntityRow;
  [topic.tableName]: TopicRow;
  [link.tableName]: LinkRow;
  [fileText.tableName]: FileTextRow;
}

export const schemas = [
  note,
  recyclable,
  star,
  file,
  materialAnnotation,
  revision,
  material,
  memo,
  syncEntity,
  topic,
  link,
  fileText,
];
