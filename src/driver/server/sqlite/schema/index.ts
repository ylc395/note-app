import { default as note, type Row as NoteRow } from './note.js';
import { default as recyclable, type Row as RecyclableRow } from './recyclable.js';
import { default as star, type Row as StarRow } from './star.js';
import { default as file, type Row as FileRow } from './file.js';
import { default as topic, type Row as TopicRow } from './topic.js';
import { default as link, type Row as LinkRow } from './link.js';
import { default as fileText, type Row as FileTextRow } from './fileText.js';
import { default as revision, type Row as RevisionRow } from './revision.js';

export interface Schemas {
  sqlite_master: { name: string; type: string }; // 这个是 sqlite 自带的
  [note.tableName]: NoteRow;
  [recyclable.tableName]: RecyclableRow;
  [star.tableName]: StarRow;
  [file.tableName]: FileRow;
  [topic.tableName]: TopicRow;
  [link.tableName]: LinkRow;
  [fileText.tableName]: FileTextRow;
  [revision.tableName]: RevisionRow;
}

export const schemas = [note, recyclable, star, file, topic, link, fileText, revision];
