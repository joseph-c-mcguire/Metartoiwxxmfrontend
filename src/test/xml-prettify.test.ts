import { describe, expect, it } from 'vitest';
import { prettifyXml } from '@/utils/xml';

describe('prettifyXml', () => {
  it('formats valid XML with indentation and line breaks', () => {
    const input = '<root><child>value</child><empty /></root>';

    const result = prettifyXml(input);

    expect(result).toContain('\n');
    expect(result).toContain('  <child>value</child>');
    expect(result).toContain('  <empty/>');
  });

  it('throws for invalid XML', () => {
    expect(() => prettifyXml('<root><child></root>')).toThrow('Invalid XML content');
  });

  it('throws for empty XML', () => {
    expect(() => prettifyXml('   ')).toThrow('XML content is empty');
  });
});
