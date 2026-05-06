import { useMemo } from 'react';

const MAX_SELECTED = 30;

interface Props {
  paragraph: string;
  selected: Set<string>;
  onToggle: (word: string) => void;
  onProcess: () => void;
  onBack: () => void;
  disabled?: boolean;
}

interface Token {
  raw: string;
  cleaned: string;
  isWord: boolean;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /(\w+(?:'\w+)?)|(\s+)|([^\w\s])/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    if (match[1]) {
      tokens.push({ raw, cleaned: raw.toLowerCase(), isWord: true });
    } else {
      tokens.push({ raw, cleaned: '', isWord: false });
    }
  }
  return tokens;
}

export function WordSelector({
  paragraph,
  selected,
  onToggle,
  onProcess,
  onBack,
  disabled,
}: Props) {
  const tokens = useMemo(() => tokenize(paragraph), [paragraph]);
  const atLimit = selected.size >= MAX_SELECTED;

  return (
    <section className="word-selector">
      <p className="word-selector__hint">
        click words you don't know · click again to deselect
      </p>
      <div className="word-selector__paragraph">
        {tokens.map((tok, i) => {
          if (!tok.isWord) return <span key={i}>{tok.raw}</span>;
          const isSelected = selected.has(tok.cleaned);
          const blocked = !isSelected && atLimit;
          return (
            <span
              key={i}
              className={`word ${isSelected ? 'word--selected' : ''} ${blocked ? 'word--blocked' : ''}`}
              onClick={() => {
                if (disabled || blocked) return;
                onToggle(tok.cleaned);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (disabled || blocked) return;
                  onToggle(tok.cleaned);
                }
              }}
            >
              {tok.raw}
            </span>
          );
        })}
      </div>
      <div className="word-selector__footer">
        <span className="word-selector__count">
          {selected.size} / {MAX_SELECTED} selected
        </span>
        <div className="word-selector__actions">
          <button className="btn btn--ghost" onClick={onBack} disabled={disabled}>
            back
          </button>
          <button
            className="btn btn--primary"
            onClick={onProcess}
            disabled={disabled || selected.size === 0}
          >
            {disabled ? 'processing…' : 'process'}
          </button>
        </div>
      </div>
    </section>
  );
}
