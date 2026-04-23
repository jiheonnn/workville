type Row = Record<string, any>

type TableName = 'work_logs' | 'work_sessions'

type QueryAction = 'select' | 'insert' | 'update'

type FilterOperator = 'eq' | 'neq' | 'is' | 'in' | 'gte' | 'lte'

interface Filter {
  column: string
  operator: FilterOperator
  value: any
}

interface OrderClause {
  column: string
  ascending: boolean
}

interface MockSupabaseState {
  authUserId?: string | null
  tables?: Partial<Record<TableName, Row[]>>
  uniqueInsertRaceKeys?: Set<string>
  raceInsertRows?: Record<string, Row>
}

interface ExecuteResult {
  data: any
  error: any
}

interface QueryState {
  action: QueryAction
  table: TableName
  filters: Filter[]
  orders: OrderClause[]
  limitValue: number | null
  singleResult: boolean
  payload: Row | Row[] | null
}

const cloneRow = <T extends Row>(row: T): T => JSON.parse(JSON.stringify(row))

const matchesFilter = (row: Row, filter: Filter) => {
  const value = row[filter.column]

  switch (filter.operator) {
    case 'eq':
      return value === filter.value
    case 'neq':
      return value !== filter.value
    case 'is':
      return filter.value === null ? value === null : value === filter.value
    case 'in':
      return Array.isArray(filter.value) && filter.value.includes(value)
    case 'gte':
      return value >= filter.value
    case 'lte':
      return value <= filter.value
    default:
      return false
  }
}

class MockQueryBuilder implements PromiseLike<ExecuteResult> {
  private readonly store: MockSupabaseClient
  private readonly state: QueryState

  constructor(store: MockSupabaseClient, table: TableName) {
    this.store = store
    this.state = {
      action: 'select',
      table,
      filters: [],
      orders: [],
      limitValue: null,
      singleResult: false,
      payload: null,
    }
  }

  select() {
    return this
  }

  eq(column: string, value: any) {
    this.state.filters.push({ column, operator: 'eq', value })
    return this
  }

  neq(column: string, value: any) {
    this.state.filters.push({ column, operator: 'neq', value })
    return this
  }

  is(column: string, value: any) {
    this.state.filters.push({ column, operator: 'is', value })
    return this
  }

  in(column: string, value: any[]) {
    this.state.filters.push({ column, operator: 'in', value })
    return this
  }

  gte(column: string, value: any) {
    this.state.filters.push({ column, operator: 'gte', value })
    return this
  }

  lte(column: string, value: any) {
    this.state.filters.push({ column, operator: 'lte', value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.state.orders.push({ column, ascending: options?.ascending ?? true })
    return this
  }

  limit(value: number) {
    this.state.limitValue = value
    return this
  }

  single() {
    this.state.singleResult = true
    return this
  }

  insert(payload: Row | Row[]) {
    this.state.action = 'insert'
    this.state.payload = payload
    return this
  }

  update(payload: Row) {
    this.state.action = 'update'
    this.state.payload = payload
    return this
  }

  then<TResult1 = ExecuteResult, TResult2 = never>(
    onfulfilled?: ((value: ExecuteResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected)
  }

  private execute(): ExecuteResult {
    if (this.state.action === 'insert') {
      return this.executeInsert()
    }

    if (this.state.action === 'update') {
      return this.executeUpdate()
    }

    return this.executeSelect()
  }

  private executeSelect(): ExecuteResult {
    let rows = this.store.getRows(this.state.table)

    rows = rows.filter((row) => this.state.filters.every((filter) => matchesFilter(row, filter)))

    rows = [...rows].sort((left, right) => {
      for (const clause of this.state.orders) {
        if (left[clause.column] === right[clause.column]) {
          continue
        }

        if (left[clause.column] > right[clause.column]) {
          return clause.ascending ? 1 : -1
        }

        return clause.ascending ? -1 : 1
      }

      return 0
    })

    if (this.state.limitValue !== null) {
      rows = rows.slice(0, this.state.limitValue)
    }

    if (this.state.singleResult) {
      if (rows.length !== 1) {
        return {
          data: null,
          error: {
            code: 'PGRST116',
            message: 'JSON object requested, multiple (or no) rows returned',
          },
        }
      }

      return { data: cloneRow(rows[0]), error: null }
    }

    return { data: rows.map(cloneRow), error: null }
  }

  private executeInsert(): ExecuteResult {
    const payloadRows = Array.isArray(this.state.payload) ? this.state.payload : [this.state.payload]

    for (const payloadRow of payloadRows) {
      const row = cloneRow(payloadRow as Row)
      const uniqueKey = `${row.user_id}:${row.date}`

      if (this.store.uniqueInsertRaceKeys.has(uniqueKey)) {
        this.store.uniqueInsertRaceKeys.delete(uniqueKey)
        const raceInsertRow = this.store.getRaceInsertRow(uniqueKey)

        if (raceInsertRow) {
          this.store.getRows(this.state.table).push(cloneRow(raceInsertRow))
        }

        return {
          data: null,
          error: {
            code: '23505',
            message: 'duplicate key value violates unique constraint',
          },
        }
      }
    }

    const rows = this.store.getRows(this.state.table)
    const insertedRows = payloadRows.map((payloadRow) => cloneRow(payloadRow as Row))

    rows.push(...insertedRows)

    if (this.state.singleResult) {
      return { data: cloneRow(insertedRows[0]), error: null }
    }

    return { data: insertedRows.map(cloneRow), error: null }
  }

  private executeUpdate(): ExecuteResult {
    const rows = this.store.getRows(this.state.table)
    const matchingRows = rows.filter((row) => this.state.filters.every((filter) => matchesFilter(row, filter)))

    if (matchingRows.length === 0) {
      return {
        data: null,
        error: {
          code: 'PGRST116',
          message: 'JSON object requested, multiple (or no) rows returned',
        },
      }
    }

    const updatedRows = matchingRows.map((row) => {
      Object.assign(row, cloneRow(this.state.payload as Row))
      return cloneRow(row)
    })

    if (this.state.singleResult) {
      return { data: updatedRows[0], error: null }
    }

    return { data: updatedRows, error: null }
  }
}

export class MockSupabaseClient {
  private readonly rowsByTable: Record<TableName, Row[]>
  readonly uniqueInsertRaceKeys: Set<string>
  private readonly raceInsertRows: Record<string, Row>

  constructor(state: MockSupabaseState = {}) {
    this.rowsByTable = {
      work_logs: (state.tables?.work_logs || []).map(cloneRow),
      work_sessions: (state.tables?.work_sessions || []).map(cloneRow),
    }
    this.uniqueInsertRaceKeys = state.uniqueInsertRaceKeys || new Set<string>()
    this.raceInsertRows = state.raceInsertRows || {}
    const authUserId = state.authUserId ?? 'user-1'

    this.auth = {
      getUser: async () => ({
        data: {
          user: authUserId ? { id: authUserId } : null,
        },
        error: authUserId ? null : new Error('Unauthorized'),
      }),
    }
  }

  readonly auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: Error | null }>
  }

  from(table: TableName) {
    return new MockQueryBuilder(this, table)
  }

  getRows(table: TableName) {
    return this.rowsByTable[table]
  }

  getRaceInsertRow(uniqueKey: string) {
    return this.raceInsertRows[uniqueKey]
  }
}

export const createJsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })
