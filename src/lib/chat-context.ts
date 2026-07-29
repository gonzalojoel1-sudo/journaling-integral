export interface SimilarEntry {
  id: string;
  content: string;
  similarity: number;
  date: string;
}

export const MAX_ENTRY_LENGTH = 1500;
export const MAX_CONTEXT_LENGTH = 6000;

export function sanitizeContextContent(raw: string): string {
  return raw
    .replace(/<\|.*?\|>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, MAX_ENTRY_LENGTH);
}

export function formatContextForPrompt(entries: SimilarEntry[]): string {
  if (entries.length === 0) return '';

  const blocks = entries.map((e) => {
    const sanitized = sanitizeContextContent(e.content);
    return `<entry id="${e.id}" date="${e.date}">\n${sanitized}\n</entry>`;
  });

  const joined = blocks.join('\n\n');
  if (joined.length <= MAX_CONTEXT_LENGTH) return joined;
  return joined.slice(0, MAX_CONTEXT_LENGTH) + '\n<context_truncated/>';
}
