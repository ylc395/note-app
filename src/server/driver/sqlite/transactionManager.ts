import type { Knex } from 'knex';

let trxSingleton: Knex.Transaction | undefined;

export default (knex: Knex) => ({
  getTrx() {
    return trxSingleton || knex;
  },

  async startTransaction() {
    if (trxSingleton) {
      await trxSingleton.executionPromise;
    }
    trxSingleton = await knex.transaction();
  },

  async endTransaction() {
    if (!trxSingleton) {
      throw new Error('you should start a transaction before ending a transaction');
    }

    await trxSingleton.commit();
    trxSingleton = undefined;
  },
});
