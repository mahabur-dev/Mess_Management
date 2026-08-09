export type NamedMember = { id: string; name: string };

export function normalizeCommandText(text: string) {
  const banglaDigits = '০১২৩৪৫৬৭৮৯';
  return text
    .replace(/[০-৯]/g, (digit) => String(banglaDigits.indexOf(digit)))
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveMemberName<T extends NamedMember>(
  name: string | null,
  members: T[],
): { member: T | null; ambiguous: boolean } {
  if (!name?.trim()) return { member: null, ambiguous: false };
  const needle = name.trim().toLocaleLowerCase();
  const exact = members.filter(
    (item) => item.name.trim().toLocaleLowerCase() === needle,
  );
  if (exact.length === 1) return { member: exact[0], ambiguous: false };
  const partial = members.filter((item) => {
    const candidate = item.name.trim().toLocaleLowerCase();
    return candidate.includes(needle) || needle.includes(candidate);
  });
  return partial.length === 1
    ? { member: partial[0], ambiguous: false }
    : { member: null, ambiguous: exact.length > 1 || partial.length > 1 };
}
