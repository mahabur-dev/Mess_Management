export interface IOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginationResult {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface IMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const paginationHelper = (options: IOptions): IPaginationResult => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || 'created_at';
  const sortOrder = (options.sortOrder as 'asc' | 'desc') || 'desc';

  return { page, limit, skip, sortBy, sortOrder };
};

export const buildMeta = (
  total: number,
  page: number,
  limit: number,
): IMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

export default paginationHelper;
