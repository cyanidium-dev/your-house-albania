/**
 * Test double for `SqlClient`: records every statement and answers queries
 * from a handler, so store code is tested without a database.
 */

import type { SqlClient, Statement } from './db'

export type FakeSql = {
  client: SqlClient
  /** Every statement, in order, whether sent alone or in a transaction. */
  calls: Statement[]
  transactions: Statement[][]
}

export function fakeSql(handler: (text: string, params: unknown[]) => unknown[] | undefined = () => []): FakeSql {
  const calls: Statement[] = []
  const transactions: Statement[][] = []
  const client: SqlClient = {
    async query<T>(text: string, params: unknown[] = []) {
      calls.push({ text, params })
      return (handler(text, params) ?? []) as T[]
    },
    async transaction(statements: Statement[]) {
      transactions.push(statements)
      calls.push(...statements)
    },
  }
  return { client, calls, transactions }
}
