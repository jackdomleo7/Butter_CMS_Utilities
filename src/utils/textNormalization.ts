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
 * Returns the singular or plural form based on count.
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

/**
 * Escapes HTML special characters to prevent XSS when inserting user-controlled
 * or CMS-sourced content into innerHTML contexts.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Creates a regex pattern that matches a character and all its normalized variants.
 * For example, '£' should match both '£' and '&pound;', and '-' matches en/em dashes.
 * Used to build variant-aware highlight patterns from normalized search terms.
 */
export function createVariantPattern(char: string): string {
  const variants: Record<string, string[]> = {
    "'": ["'", '&apos;', '&#39;', '\u2018', '\u2019'],
    '"': ['"', '&quot;', '\u201C', '\u201D'],
    '-': ['-', '&ndash;', '&mdash;', '\u2013', '\u2014'],
    '£': ['£', '&pound;'],
    '€': ['€', '&euro;'],
    '&': ['&', '&amp;'],
    '<': ['<', '&lt;'],
    '>': ['>', '&gt;'],
    ' ': [' ', '&nbsp;', '\u00A0'],
  }

  if (variants[char]) {
    const escapedVariants = variants[char].map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    return `(?:${escapedVariants.join('|')})`
  }

  return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Highlights all occurrences of a search term in text, accounting for HTML entity
 * and Unicode variants (e.g. `£` matches `&pound;`).
 * Returns an HTML string with matches wrapped in `<mark>` tags.
 * The text is HTML-escaped before highlighting to prevent XSS.
 */
export function highlightMatches(text: string, searchTerm: string): string {
  const escapedText = escapeHtml(text)
  const normalizedSearch = normalizeWhitespace(searchTerm.trim())
  const patternParts = Array.from(normalizedSearch).map(createVariantPattern)
  const regex = new RegExp(`(${patternParts.join('')})`, 'gi')
  return escapedText.replace(regex, '<mark>$1</mark>')
}

/**
 * Highlights all occurrences of a literal string pattern in text.
 * Returns an HTML string with matches wrapped in `<mark>` tags.
 * The text is HTML-escaped before highlighting to prevent XSS.
 */
export function highlightPattern(text: string, pattern: string): string {
  const escapedText = escapeHtml(text)
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedPattern})`, 'gi')
  return escapedText.replace(regex, '<mark>$1</mark>')
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
