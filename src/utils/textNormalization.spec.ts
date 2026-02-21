import { describe, it, expect } from 'vitest'
import {
  normalizeWhitespace,
  createContextSnippet,
  pluralize,
  escapeHtml,
  createVariantPattern,
  highlightMatches,
  highlightPattern,
} from './textNormalization'

describe('normalizeWhitespace', () => {
  describe('HTML entity normalization', () => {
    it('should normalize &nbsp; to regular space', () => {
      expect(normalizeWhitespace('Hello&nbsp;World')).toBe('Hello World')
      expect(normalizeWhitespace('Hello&NBSP;World')).toBe('Hello World')
    })

    it('should normalize Unicode non-breaking space to regular space', () => {
      expect(normalizeWhitespace('Hello\u00A0World')).toBe('Hello World')
    })

    it('should normalize &quot; to double quotes', () => {
      expect(normalizeWhitespace('&quot;Hello&quot;')).toBe('"Hello"')
      expect(normalizeWhitespace('&QUOT;Hello&QUOT;')).toBe('"Hello"')
    })

    it('should normalize &apos; and &#39; to single quotes', () => {
      expect(normalizeWhitespace('&apos;Hello&apos;')).toBe("'Hello'")
      expect(normalizeWhitespace('&#39;Hello&#39;')).toBe("'Hello'")
    })

    it('should normalize &pound; to £', () => {
      expect(normalizeWhitespace('&pound;100')).toBe('£100')
      expect(normalizeWhitespace('&POUND;100')).toBe('£100')
    })

    it('should normalize &euro; to €', () => {
      expect(normalizeWhitespace('&euro;50')).toBe('€50')
      expect(normalizeWhitespace('&EURO;50')).toBe('€50')
    })

    it('should normalize &amp; to &', () => {
      expect(normalizeWhitespace('Fish &amp; Chips')).toBe('Fish & Chips')
      expect(normalizeWhitespace('Fish &AMP; Chips')).toBe('Fish & Chips')
    })

    it('should normalize &lt; and &gt; to < and >', () => {
      expect(normalizeWhitespace('&lt;div&gt;')).toBe('<div>')
      expect(normalizeWhitespace('&LT;div&GT;')).toBe('<div>')
    })

    it('should normalize &ndash; and &mdash; to regular dash', () => {
      expect(normalizeWhitespace('2020&ndash;2021')).toBe('2020-2021')
      expect(normalizeWhitespace('Hello&mdash;World')).toBe('Hello-World')
    })
  })

  describe('Unicode character normalization', () => {
    it('should normalize fancy single quotes to regular apostrophe', () => {
      const input = '\u2018Hello\u2019'
      const result = normalizeWhitespace(input)
      expect(result).toBe("'Hello'")
      // Verify it's a regular apostrophe (U+0027), not fancy quotes
      expect(result.charCodeAt(0)).toBe(0x0027)
      expect(result.charCodeAt(result.length - 1)).toBe(0x0027)
    })

    it('should normalize fancy double quotes to regular quotes', () => {
      const input = '\u201CHello\u201D'
      const result = normalizeWhitespace(input)
      expect(result).toBe('"Hello"')
      // Verify it's a regular quote (U+0022), not fancy quotes
      expect(result.charCodeAt(0)).toBe(0x0022)
      expect(result.charCodeAt(result.length - 1)).toBe(0x0022)
    })

    it('should normalize en-dash and em-dash to regular dash', () => {
      expect(normalizeWhitespace('2020\u20132021')).toBe('2020-2021') // en-dash
      expect(normalizeWhitespace('Hello\u2014World')).toBe('Hello-World') // em-dash
    })
  })

  describe('Whitespace collapsing', () => {
    it('should collapse multiple spaces to single space', () => {
      expect(normalizeWhitespace('Hello    World')).toBe('Hello World')
    })

    it('should collapse multiple whitespace types to single space', () => {
      expect(normalizeWhitespace('Hello\n\t  World')).toBe('Hello World')
    })

    it('should handle mixed whitespace and HTML entities', () => {
      expect(normalizeWhitespace('Hello&nbsp;&nbsp;  World')).toBe('Hello World')
    })
  })

  describe('Combined normalizations', () => {
    it('should normalize complex mixed content', () => {
      const input = '&quot;Hello&nbsp;&nbsp;World&quot;&mdash;&pound;100'
      const expected = '"Hello World"-£100'
      expect(normalizeWhitespace(input)).toBe(expected)
    })

    it('should handle empty string', () => {
      expect(normalizeWhitespace('')).toBe('')
    })

    it('should handle string with no entities or special chars', () => {
      expect(normalizeWhitespace('Hello World')).toBe('Hello World')
    })
  })
})

describe('createContextSnippet', () => {
  it('should create snippet with context around match', () => {
    const text = 'The quick brown fox jumps over the lazy dog'
    const matchIndex = text.indexOf('fox')
    const result = createContextSnippet(text, matchIndex, 3, 10)
    expect(result).toBe('...ick brown fox jumps ove...')
  })

  it('should not add leading ellipsis when match is near start', () => {
    const text = 'The quick brown fox jumps over the lazy dog'
    const matchIndex = text.indexOf('quick')
    const result = createContextSnippet(text, matchIndex, 5, 10)
    expect(result).toBe('The quick brown fox...')
  })

  it('should not add trailing ellipsis when match is near end', () => {
    const text = 'The quick brown fox jumps over the lazy dog'
    const matchIndex = text.indexOf('lazy')
    const result = createContextSnippet(text, matchIndex, 4, 10)
    expect(result).toBe('... over the lazy dog')
  })

  it('should handle match at start of text', () => {
    const text = 'The quick brown fox'
    const matchIndex = 0
    const result = createContextSnippet(text, matchIndex, 3, 10)
    expect(result).toBe('The quick bro...')
  })

  it('should handle match at end of text', () => {
    const text = 'The quick brown fox'
    const matchIndex = text.indexOf('fox')
    const result = createContextSnippet(text, matchIndex, 3, 10)
    expect(result).toBe('...ick brown fox')
  })

  it('should include entire text if shorter than context size', () => {
    const text = 'Short text'
    const matchIndex = text.indexOf('text')
    const result = createContextSnippet(text, matchIndex, 4, 100)
    expect(result).toBe('Short text')
  })

  it('should use default context size of 100', () => {
    const text = 'a'.repeat(300)
    const matchIndex = 150
    const result = createContextSnippet(text, matchIndex, 1)
    // Should be: 100 chars before + 1 match + 100 chars after = 201 chars
    // Plus ellipsis on both ends = 207 chars
    expect(result).toHaveLength(207)
    expect(result.startsWith('...')).toBe(true)
    expect(result.endsWith('...')).toBe(true)
  })

  it('should handle custom context size', () => {
    const text = 'a'.repeat(100)
    const matchIndex = 50
    const result = createContextSnippet(text, matchIndex, 1, 20)
    // Should be: 20 chars before + 1 match + 20 chars after = 41 chars
    // Plus ellipsis on both ends = 47 chars
    expect(result).toHaveLength(47)
  })
})

describe('pluralize', () => {
  it('should return singular when count is 1', () => {
    expect(pluralize(1, 'match', 'matches')).toBe('match')
    expect(pluralize(1, 'item', 'items')).toBe('item')
    expect(pluralize(1, 'page', 'pages')).toBe('page')
  })

  it('should return plural when count is 0', () => {
    expect(pluralize(0, 'match', 'matches')).toBe('matches')
    expect(pluralize(0, 'item', 'items')).toBe('items')
  })

  it('should return plural when count is greater than 1', () => {
    expect(pluralize(2, 'match', 'matches')).toBe('matches')
    expect(pluralize(100, 'item', 'items')).toBe('items')
  })

  it('should return plural for negative numbers', () => {
    expect(pluralize(-1, 'item', 'items')).toBe('items')
  })
})

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('should escape less-than signs', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('should escape greater-than signs', () => {
    expect(escapeHtml('a > b > c')).toBe('a &gt; b &gt; c')
  })

  it('should escape double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
  })

  it('should escape multiple special characters in one string', () => {
    expect(escapeHtml('<a href="url">link & more</a>')).toBe(
      '&lt;a href=&quot;url&quot;&gt;link &amp; more&lt;/a&gt;',
    )
  })

  it('should return the original string if no special characters', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
    expect(escapeHtml('')).toBe('')
  })

  it('should handle strings with only special characters', () => {
    expect(escapeHtml('&<>"')).toBe('&amp;&lt;&gt;&quot;')
  })
})

describe('createVariantPattern', () => {
  it('should return a non-capturing group matching all apostrophe variants', () => {
    const pattern = createVariantPattern("'")
    const regex = new RegExp(pattern)
    expect(regex.test("'")).toBe(true)
    expect(regex.test('&apos;')).toBe(true)
    expect(regex.test('&#39;')).toBe(true)
    expect(regex.test('\u2018')).toBe(true)
    expect(regex.test('\u2019')).toBe(true)
  })

  it('should return a non-capturing group matching all dash variants', () => {
    const pattern = createVariantPattern('-')
    const regex = new RegExp(pattern)
    expect(regex.test('-')).toBe(true)
    expect(regex.test('&ndash;')).toBe(true)
    expect(regex.test('&mdash;')).toBe(true)
    expect(regex.test('\u2013')).toBe(true)
    expect(regex.test('\u2014')).toBe(true)
  })

  it('should match £ and its entity variant', () => {
    const pattern = createVariantPattern('£')
    const regex = new RegExp(pattern)
    expect(regex.test('£')).toBe(true)
    expect(regex.test('&pound;')).toBe(true)
  })

  it('should escape and return the raw character for unknown chars', () => {
    expect(createVariantPattern('a')).toBe('a')
    expect(createVariantPattern('z')).toBe('z')
  })

  it('should escape regex special characters for unknown chars', () => {
    const pattern = createVariantPattern('.')
    // Should be escaped so it only matches a literal dot
    const regex = new RegExp(`^${pattern}$`)
    expect(regex.test('.')).toBe(true)
    expect(regex.test('a')).toBe(false)
  })
})

describe('highlightMatches', () => {
  it('should wrap matched text in <mark> tags', () => {
    expect(highlightMatches('Hello World', 'world')).toBe('Hello <mark>World</mark>')
  })

  it('should HTML-escape the source text before highlighting', () => {
    expect(highlightMatches('<b>Hello</b>', 'Hello')).toBe('&lt;b&gt;<mark>Hello</mark>&lt;/b&gt;')
  })

  it('should match fancy Unicode quotes when user searches with a straight apostrophe', () => {
    // Source has fancy right single quote (U+2019), user searched with straight apostrophe.
    // escapeHtml does not alter Unicode quotes, so the variant pattern can still match them.
    // The full search term pattern matches from the start, wrapping the entire match.
    const result = highlightMatches('it\u2019s great', "it's great")
    expect(result).toBe('<mark>it\u2019s great</mark>')
  })

  it('should match case-insensitively', () => {
    expect(highlightMatches('Hello World', 'HELLO')).toBe('<mark>Hello</mark> World')
  })

  it('should highlight multiple occurrences', () => {
    expect(highlightMatches('foo foo foo', 'foo')).toBe(
      '<mark>foo</mark> <mark>foo</mark> <mark>foo</mark>',
    )
  })

  it('should return escaped text unchanged when no match', () => {
    expect(highlightMatches('Hello World', 'xyz')).toBe('Hello World')
  })
})

describe('highlightPattern', () => {
  it('should wrap matched text in <mark> tags', () => {
    expect(highlightPattern('Hello World', 'World')).toBe('Hello <mark>World</mark>')
  })

  it('should HTML-escape the source text before highlighting', () => {
    expect(highlightPattern('<script>alert(1)</script>', 'script')).toBe(
      '&lt;<mark>script</mark>&gt;alert(1)&lt;/<mark>script</mark>&gt;',
    )
  })

  it('should match case-insensitively', () => {
    expect(highlightPattern('Hello World', 'hello')).toBe('<mark>Hello</mark> World')
  })

  it('should highlight multiple occurrences', () => {
    expect(highlightPattern('foo foo foo', 'foo')).toBe(
      '<mark>foo</mark> <mark>foo</mark> <mark>foo</mark>',
    )
  })

  it('should treat the pattern as a literal string, not a regex', () => {
    // '.' should match only a literal dot, not any character
    expect(highlightPattern('a.b a-b', '.')).toBe('a<mark>.</mark>b a-b')
  })

  it('should return escaped text unchanged when no match', () => {
    expect(highlightPattern('Hello World', 'xyz')).toBe('Hello World')
  })
})
