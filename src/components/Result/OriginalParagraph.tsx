import type { WordEntry } from '../../types';

interface Props {
  text: string;
  mapping: WordEntry[];
  activeWord: string | null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function OriginalParagraph({ text, mapping, activeWord }: Props) {
  const activeOriginal = activeWord ? activeWord.toLowerCase() : null;

  if (mapping.length === 0) {
    return <p className="result__original-text">{text}</p>;
  }

  // Sort by length descending so longer phrases are matched first
  const sortedMapping = [...mapping].sort((a, b) => b.word.length - a.word.length);
  const originalWords = sortedMapping.map((m) => escapeRegExp(m.word));
  
  const regex = new RegExp(`\\b(${originalWords.join('|')})\\b`, 'gi');
  const parts = text.split(regex);

  const wordSet = new Set(mapping.map((m) => m.word.toLowerCase()));

  return (
    <p className="result__original-text">
      {parts.map((part, i) => {
        if (!part) return null;
        
        const lowerPart = part.toLowerCase();
        const isMatch = wordSet.has(lowerPart);
        const isActive = lowerPart === activeOriginal;

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
