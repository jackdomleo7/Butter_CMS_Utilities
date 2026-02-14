import { describe, it, expect } from 'vitest'
import { normalizeWhitespace, createContextSnippet } from './textNormalization'

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
