export type LocalSearchDocument = {
  title: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
};

const ignoredSearchCharacters = /[\p{P}\p{S}\s]+/gu;
const chineseCharacterPattern = /\p{Script=Han}/u;
const chineseWordSegmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("zh-CN", { granularity: "word" })
    : null;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(ignoredSearchCharacters, "");
}

export type SearchMatchRange = {
  start: number;
  end: number;
};

type SearchWordSegment = SearchMatchRange & {
  value: string;
};

function getSearchWordSegments(value: string): SearchWordSegment[] {
  if (!chineseWordSegmenter) return [];

  return [...chineseWordSegmenter.segment(value)]
    .filter((segment) => segment.isWordLike)
    .map((segment) => ({
      value: normalizeSearchText(segment.segment),
      start: segment.index,
      end: segment.index + segment.segment.length,
    }))
    .filter((segment) => segment.value.length > 0);
}

function findChinesePhraseRange(
  value: string,
  query: string,
): SearchMatchRange | null {
  const querySegments = getSearchWordSegments(query);
  const valueSegments = getSearchWordSegments(value);

  if (!querySegments.length || querySegments.length > valueSegments.length) {
    return null;
  }

  for (
    let startIndex = 0;
    startIndex <= valueSegments.length - querySegments.length;
    startIndex += 1
  ) {
    const matches = querySegments.every(
      (segment, queryIndex) =>
        valueSegments[startIndex + queryIndex].value === segment.value,
    );

    if (!matches) continue;

    return {
      start: valueSegments[startIndex].start,
      end: valueSegments[startIndex + querySegments.length - 1].end,
    };
  }

  return null;
}

export function findSearchMatchRange(
  value: string,
  query: string,
): SearchMatchRange | null {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return null;

  if (
    normalizedQuery.length > 1 &&
    chineseCharacterPattern.test(normalizedQuery) &&
    chineseWordSegmenter
  ) {
    return findChinesePhraseRange(value, query);
  }

  let normalizedValue = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;

  for (const character of value) {
    const normalizedCharacter = normalizeSearchText(character);

    for (let index = 0; index < normalizedCharacter.length; index += 1) {
      normalizedValue += normalizedCharacter[index];
      starts.push(offset);
      ends.push(offset + character.length);
    }

    offset += character.length;
  }

  const matchIndex = normalizedValue.indexOf(normalizedQuery);

  if (matchIndex === -1) return null;

  return {
    start: starts[matchIndex],
    end: ends[matchIndex + normalizedQuery.length - 1],
  };
}

export function hasContiguousSearchMatch(value: string, query: string): boolean {
  return findSearchMatchRange(value, query) !== null;
}

export function buildPagefindQuery(query: string): string {
  const normalizedQuery = normalizeSearchText(query);

  if (
    normalizedQuery.length > 1 &&
    chineseCharacterPattern.test(normalizedQuery)
  ) {
    return `"${query.replaceAll('"', "").trim()}"`;
  }

  return query;
}

function getMatchRank(document: LocalSearchDocument, query: string): number {
  const title = normalizeSearchText(document.title);

  if (title === query) return 0;
  if (title.startsWith(query)) return 1;
  if (title.includes(query)) return 2;
  if (document.tags.some((tag) => normalizeSearchText(tag) === query)) return 3;
  if (normalizeSearchText(document.category) === query) return 4;
  return 5;
}

export function findLocalSearchMatches(
  documents: LocalSearchDocument[],
  query: string,
  limit = 12,
): LocalSearchDocument[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return [];

  return documents
    .map((document, index) => ({ document, index }))
    .filter(({ document }) =>
      [
        document.title,
        document.description,
        document.category,
        ...document.tags,
      ].some((value) => hasContiguousSearchMatch(value, normalizedQuery)),
    )
    .sort(
      (a, b) =>
        getMatchRank(a.document, normalizedQuery) -
          getMatchRank(b.document, normalizedQuery) || a.index - b.index,
    )
    .slice(0, limit)
    .map(({ document }) => document);
}
