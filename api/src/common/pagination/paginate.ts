export interface PaginationQuery {
  page: number;
  pageSize: number;
}

export interface PaginationBounds {
  skip: number;
  take: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export async function paginate<T>(
  query: PaginationQuery,
  findMany: (bounds: PaginationBounds) => Promise<T[]>,
  count: () => Promise<number>,
): Promise<PaginatedResult<T>> {
  const [data, total] = await Promise.all([
    findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    count(),
  ]);
  return { data, total };
}
