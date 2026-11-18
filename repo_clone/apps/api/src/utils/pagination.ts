export interface PaginationParams {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function parsePaginationParams(query: any, defaultLimit = 12, maxLimit = 50): {
  page: number;
  limit: number;
  skip: number;
} {
  const parsedPage = parseInt(query?.page, 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const parsedLimit = parseInt(query?.limit, 10);
  let limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : defaultLimit;
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
