import { randomUUID } from 'node:crypto';

// generate id on business logic level instead of database level
// see https://medium.com/ingeniouslysimple/why-did-we-shift-away-from-database-generated-ids-7e0e54a49bb3
export function generateId() {
  // remove the "-" is ok
  // see https://stackoverflow.com/questions/51830845/how-safe-is-it-to-remove-the-in-a-randomly-generated-uuid
  return randomUUID().replaceAll('-', '');
}
