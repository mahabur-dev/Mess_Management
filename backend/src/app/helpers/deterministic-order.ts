export type SortDirection = 'asc' | 'desc';
export type SortOrder = Record<string, SortDirection>;

export function buildDeterministicOrder(params: {
  requestedField?: string;
  requestedDirection?: SortDirection;
  aliases?: Record<string, string>;
  allowedFields: readonly string[];
  businessDateField: string;
  createdAtField?: string;
  idField?: string;
}): SortOrder[] {
  const {
    requestedField,
    aliases = {},
    allowedFields,
    businessDateField,
    createdAtField = 'created_at',
    idField = 'id',
  } = params;
  const direction = params.requestedDirection === 'asc' ? 'asc' : 'desc';
  const aliasedField = requestedField
    ? (aliases[requestedField] ?? requestedField)
    : businessDateField;
  const primaryField = allowedFields.includes(aliasedField)
    ? aliasedField
    : businessDateField;

  const order: SortOrder[] = [{ [primaryField]: direction }];
  const newestTieBreakers = [businessDateField, createdAtField, idField];

  for (const field of newestTieBreakers) {
    if (field === primaryField) continue;
    order.push({ [field]: 'desc' });
  }

  return order;
}
