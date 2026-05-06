import type { WordEntry } from '../../types';

interface Props {
  text: string;
  mapping: WordEntry[];
  activeWord: string | null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function SimplifiedParagraph({ text, mapping, activeWord }: Props) {
  const activeSimple =
    activeWord != null
      ? mapping.find((m) => m.word === activeWord)?.simplified.toLowerCase()
      : null;

  if (!activeSimple) {
    return <p className="result__simplified">{text}</p>;
  }

  const regex = new RegExp(`(${escapeRegExp(activeSimple)})`, 'gi');
  const parts = text.split(regex);

  return (
    <p className="result__simplified">
      {parts.map((part, i) =>
        part.toLowerCase() === activeSimple ? (
          <mark key={i} className="result__highlight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}
