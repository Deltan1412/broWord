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

  if (mapping.length === 0) {
    return <p className="result__simplified">{text}</p>;
  }

  // Sort by length descending so longer phrases are matched first
  const sortedMapping = [...mapping].sort((a, b) => b.simplified.length - a.simplified.length);
  const simplifiedWords = sortedMapping.map((m) => escapeRegExp(m.simplified));
  
  const regex = new RegExp(`\\b(${simplifiedWords.join('|')})\\b`, 'gi');
  const parts = text.split(regex);

  const simpleSet = new Set(mapping.map((m) => m.simplified.toLowerCase()));

  return (
    <p className="result__simplified">
      {parts.map((part, i) => {
        if (!part) return null;
        
        const lowerPart = part.toLowerCase();
        const isMatch = simpleSet.has(lowerPart);
        const isActive = lowerPart === activeSimple;

        if (isMatch) {
          return (
            <mark
              key={i}
              className={`result__highlight ${isActive ? 'result__highlight--active' : ''}`}
            >
              {part}
            </mark>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
