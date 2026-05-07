import { useState } from 'react';
import type { ProcessResult } from '../../types';
import { DefinitionCard } from './DefinitionCard';
import { SimplifiedParagraph } from './SimplifiedParagraph';
import { OriginalParagraph } from './OriginalParagraph';

interface Props {
  result: ProcessResult;
  originalParagraph: string;
  onReset: () => void;
}

export function ResultDisplay({ result, originalParagraph, onReset }: Props) {
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  return (
    <section className="result">
      <div className="result__header">
        <h2 className="result__heading">your simplified text</h2>
        <button 
          className={`btn btn--ghost btn--small result__compare-btn ${isComparing ? 'btn--active' : ''}`}
          onClick={() => setIsComparing(!isComparing)}
        >
          {isComparing ? '← hide original' : '↔ compare with original'}
        </button>
      </div>

      <div className={`result__content ${isComparing ? 'result__content--split' : ''}`}>
        {isComparing && (
          <div className="result__column result__column--original">
            <h3 className="result__subheading">original text</h3>
            <div className="result__text-box">
              <OriginalParagraph
                text={originalParagraph}
                mapping={result.words}
                activeWord={activeWord}
              />
            </div>
          </div>
        )}

        <div className="result__column result__column--simplified">
          <h3 className="result__subheading">simplified paragraph</h3>
          <div className="result__text-box result__text-box--gray">
            <SimplifiedParagraph
              text={result.simplified_paragraph}
              mapping={result.words}
              activeWord={activeWord}
            />
          </div>
        </div>
      </div>

      <div className="result__section">
        <h3 className="result__subheading">definitions</h3>
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

      <div className="result__footer">
        <button className="btn btn--primary" onClick={onReset}>
          start over
        </button>
      </div>
    </section>
  );
}
