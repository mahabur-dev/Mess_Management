function normalizeReference(text: string): string {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance<T>(expected: T[], actual: T[]): number {
  let previous = Array.from({ length: actual.length + 1 }, (_, index) => index);

  for (let row = 1; row <= expected.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= actual.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] +
          (expected[row - 1] === actual[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }

  return previous[actual.length];
}

export type TranscriptionErrorRates = {
  wordErrorRate: number;
  characterErrorRate: number;
};

export function calculateTranscriptionErrorRates(
  expectedText: string,
  actualText: string,
): TranscriptionErrorRates {
  const expected = normalizeReference(expectedText);
  const actual = normalizeReference(actualText);
  const expectedWords = expected ? expected.split(' ') : [];
  const actualWords = actual ? actual.split(' ') : [];
  const expectedCharacters = Array.from(expected.replace(/\s/g, ''));
  const actualCharacters = Array.from(actual.replace(/\s/g, ''));

  return {
    wordErrorRate:
      editDistance(expectedWords, actualWords) / Math.max(1, expectedWords.length),
    characterErrorRate:
      editDistance(expectedCharacters, actualCharacters) /
      Math.max(1, expectedCharacters.length),
  };
}
