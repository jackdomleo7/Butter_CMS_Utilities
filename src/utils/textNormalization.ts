/**
 * Normalizes whitespace, HTML entities, and Unicode variations to improve search matching.
 * Converts fancy quotes, dashes, and common HTML entities to their simpler equivalents.
 */
export function normalizeWhitespace(str: string): string {
  return (
    str
      // Normalize quotes
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&#39;/gi, "'")
      .replace(/[\u2018\u2019]/g, "'") // Fancy single quotes (U+2018, U+2019) to regular apostrophe
      .replace(/[\u201C\u201D]/g, '"') // Fancy double quotes (U+201C, U+201D) to regular quotes

      // Normalize common HTML entities
      .replace(/&pound;/gi, '£')
      .replace(/&euro;/gi, '€')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')

      // Normalize dashes
      .replace(/&ndash;/gi, '-')
      .replace(/&mdash;/gi, '-')
      .replace(/[\u2013\u2014]/g, '-') // En-dash (U+2013) and em-dash (U+2014) to regular dash

      // Normalize whitespace (keep at end to collapse all whitespace)
      .replace(/&nbsp;/gi, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
  )
}

/**
 * Creates a context snippet around a match in text.
 * @param normalizedText - The normalized text to extract from
 * @param matchIndex - The starting index of the match
 * @param matchLength - The length of the match
 * @param contextSize - Number of characters to include before and after (default: 100)
 * @returns A snippet with ellipsis if truncated
 */
export function createContextSnippet(
  normalizedText: string,
  matchIndex: number,
  matchLength: number,
  contextSize = 100,
): string {
  const contextStart = Math.max(0, matchIndex - contextSize)
  const contextEnd = Math.min(normalizedText.length, matchIndex + matchLength + contextSize)

  let snippet = normalizedText.substring(contextStart, contextEnd)

  if (contextStart > 0) snippet = '...' + snippet
  if (contextEnd < normalizedText.length) snippet = snippet + '...'

  return snippet
}
