import { useState } from 'react';
import type { ProcessResult } from '../../types';
import { DefinitionCard } from './DefinitionCard';
import { SimplifiedParagraph } from './SimplifiedParagraph';

interface Props {
  result: ProcessResult;
  originalParagraph: string;
  onReset: () => void;
}

export function ResultDisplay({ result, originalParagraph, onReset }: Props) {
  const [activeWord, setActiveWord] = useState<string | null>(null);

  return (
    <section className="result">
      <h2 className="result__heading">your simplified text</h2>

      <div className="result__section">
        <h3 className="result__subheading">words</h3>
        <div className="result__cards">
          {result.words.map((entry) => (
            <DefinitionCard
              key={entry.word}
              entry={entry}
              active={activeWord === entry.word}
              onHover={() => setActiveWord(entry.word)}
              onLeave={() => setActiveWord(null)}
            />
          ))}
        </div>
      </div>

      <div className="result__section">
        <h3 className="result__subheading">simplified paragraph</h3>
        <SimplifiedParagraph
          text={result.simplified_paragraph}
          mapping={result.words}
          activeWord={activeWord}
        />
      </div>

      <div className="result__section">
        <h3 className="result__subheading">original</h3>
        <p className="result__original">{originalParagraph}</p>
      </div>

      <div className="result__footer">
        <button className="btn btn--primary" onClick={onReset}>
          start over
        </button>
      </div>
    </section>
  );
}
