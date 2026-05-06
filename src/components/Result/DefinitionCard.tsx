import type { WordEntry } from '../../types';

interface Props {
  entry: WordEntry;
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
}

export function DefinitionCard({ entry, active, onHover, onLeave }: Props) {
  return (
    <article
      className={`def-card ${active ? 'def-card--active' : ''}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      tabIndex={0}
    >
      <header className="def-card__header">
        <span className="def-card__word">{entry.word}</span>
        <span className="def-card__arrow" aria-hidden>→</span>
        <span className="def-card__simple">{entry.simplified}</span>
      </header>
      <p className="def-card__definition">{entry.definition}</p>
    </article>
  );
}
