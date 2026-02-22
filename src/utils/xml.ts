export function prettifyXml(xml: string): string {
  const source = xml.trim();
  if (!source) {
    throw new Error('XML content is empty');
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(source, 'application/xml');
  const parserError = parsed.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XML content');
  }

  const serializer = new XMLSerializer();
  const serialized = serializer.serializeToString(parsed);
  const normalized = serialized.replace(/(>)(<)(\/*)/g, '$1\n$2$3');
  const lines = normalized.split('\n');

  let indentLevel = 0;
  const formatted = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (/^<\//.test(line)) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }

      const padded = `${'  '.repeat(indentLevel)}${line}`;

      if (
        /^<[^!?/][^>]*[^/]?>$/.test(line) &&
        !/<\/[^>]+>$/.test(line)
      ) {
        indentLevel += 1;
      }

      return padded;
    })
    .join('\n');

  return formatted;
}