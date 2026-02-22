import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('accessibility css regressions', () => {
  const cssPath = resolve(process.cwd(), 'src/styles/accessibility.css');
  const css = readFileSync(cssPath, 'utf-8');

  it('removes global aria-label hover pseudo tooltip rule', () => {
    expect(css).not.toContain('[aria-label]:hover::after');
  });

  it('defines separate high contrast dark mode tokens', () => {
    expect(css).toContain('[data-high-contrast="true"]');
    expect(css).toContain('.dark[data-high-contrast="true"]');
  });

  it('enables stable scrollbar gutter', () => {
    expect(css).toContain('scrollbar-gutter: stable');
  });
});
